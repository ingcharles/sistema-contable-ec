import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { SRI_URLS, SriEnvironment } from '@/shared/sri-constants';
import { CertificateParser } from '@/modules/facturacion/domain/services/CertificateParser';

/**
 * GET /api/configuracion/sri
 * Obtiene la configuración activa del SRI para una empresa y ambiente
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const ambiente = url.searchParams.get('ambiente') || SriEnvironment.PRUEBAS;

        if (![SriEnvironment.PRUEBAS, SriEnvironment.PRODUCCION].includes(ambiente as SriEnvironment)) {
            return NextResponse.json(
                { error: 'Ambiente debe ser PRUEBAS o PRODUCCION' },
                { status: 400 }
            );
        }

        const result = await db.query(
            {
                text: `
                    SELECT 
                        sc.id, sc.empresa_id,
                        sa.codigo as ambiente_codigo,
                        sa.nombre as ambiente_nombre,
                        sa.url_recepcion, sa.url_autorizacion,
                        sc.cert_p12_certificado, sc.cert_clave_certificado,
                        sc.cert_fecha_emision, sc.cert_fecha_expiracion,
                        sc.cert_sujeto, sc.cert_emisor, sc.cert_numero_serie,
                        sc.activo, sc.created_at, sc.updated_at
                    FROM configuracion.sri_certificados sc
                    INNER JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id
                    WHERE sc.empresa_id = $1 AND sa.codigo = $2 AND sc.activo = TRUE
                    LIMIT 1
                `,
                values: [context.empresaId, ambiente]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: `No se encontró configuración SRI activa para ambiente ${ambiente}` },
                { status: 404 }
            );
        }

        // Convert BYTEA to base64 for transport
        const config = result.rows[0];
        if (config.cert_p12_certificado) {
            config.p12_base64 = config.cert_p12_certificado.toString('base64');
            delete config.cert_p12_certificado; // Don't send raw BYTEA
        }

        return NextResponse.json(config);
    } catch (error: any) {
        console.error('Error al obtener configuración SRI:', error);
        return NextResponse.json(
            { error: 'Error al consultar configuración SRI', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/configuracion/sri
 * Guarda o actualiza la configuración del SRI
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { ambiente, p12Base64, claveCertificado } = body;

        if (!ambiente || ![SriEnvironment.PRUEBAS, SriEnvironment.PRODUCCION].includes(ambiente)) {
            return NextResponse.json(
                { error: 'Ambiente requerido: PRUEBAS o PRODUCCION' },
                { status: 400 }
            );
        }

        // Convert base64 to Buffer for BYTEA storage
        let p12Buffer = null;
        let certificateMetadata = null;
        
        if (p12Base64) {
            p12Buffer = Buffer.from(p12Base64, 'base64');
            
            // Parsear certificado y extraer metadatos
            try {
                if (!claveCertificado) {
                    return NextResponse.json(
                        { error: 'Contraseña del certificado requerida' },
                        { status: 400 }
                    );
                }
                
                certificateMetadata = CertificateParser.parseCertificateMetadata(
                    p12Buffer,
                    claveCertificado
                );
                
                // Validar que el certificado esté vigente
                if (!CertificateParser.isCertificateValid(certificateMetadata.certFechaExpiracion)) {
                    const daysExpired = Math.abs(
                        CertificateParser.getDaysUntilExpiration(certificateMetadata.certFechaExpiracion)
                    );
                    return NextResponse.json(
                        { 
                            error: `El certificado digital expiró hace ${daysExpired} días. Por favor, suba un certificado vigente.`,
                            fechaExpiracion: certificateMetadata.certFechaExpiracion
                        },
                        { status: 400 }
                    );
                }
                
                // Advertir si el certificado está próximo a vencer (menos de 30 días)
                const daysRemaining = CertificateParser.getDaysUntilExpiration(
                    certificateMetadata.certFechaExpiracion
                );
                if (daysRemaining > 0 && daysRemaining <= 30) {
                    console.warn(
                        `Advertencia: Certificado digital expira en ${daysRemaining} días para empresa ${context.empresaId}`
                    );
                }
                
            } catch (error: any) {
                console.error('Error al parsear certificado P12:', error);
                return NextResponse.json(
                    { 
                        error: error.message || 'Error al validar el certificado digital',
                        details: 'Verifique que el archivo P12 y la contraseña sean correctos'
                    },
                    { status: 400 }
                );
            }
        }

        const result = await db.transaction(async (client) => {
            // Obtener el ID del ambiente
            const ambienteResult = await client.query(`
                SELECT id FROM configuracion.sri_ambiente
                WHERE codigo = $1 AND activo = TRUE
                LIMIT 1
            `, [ambiente]);

            if (ambienteResult.rows.length === 0) {
                throw new Error(`Ambiente ${ambiente} no encontrado en catálogo`);
            }

            const ambienteId = ambienteResult.rows[0].id;

            // Deactivate existing configs for this empresa+ambiente
            await client.query(`
                UPDATE configuracion.sri_certificados
                SET activo = FALSE, updated_at = NOW()
                WHERE empresa_id = $1 AND sri_ambiente_id = $2
            `, [context.empresaId, ambienteId]);

            // Insert new active config
            const insertResult = await client.query(`
                INSERT INTO configuracion.sri_certificados (
                    empresa_id, sri_ambiente_id, cert_p12_certificado, cert_clave_certificado,
                    cert_fecha_emision, cert_fecha_expiracion, cert_sujeto, 
                    cert_emisor, cert_numero_serie,
                    activo, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, $10)
                RETURNING id, cert_fecha_expiracion
            `, [
                context.empresaId,
                ambienteId,
                p12Buffer,
                claveCertificado,
                certificateMetadata?.certFechaEmision || null,
                certificateMetadata?.certFechaExpiracion || null,
                certificateMetadata?.certSujeto || null,
                certificateMetadata?.certEmisor || null,
                certificateMetadata?.certNumeroSerie || null,
                context.usuarioId
            ]);

            return { 
                id: insertResult.rows[0].id,
                certFechaExpiracion: insertResult.rows[0].cert_fecha_expiracion
            };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        // Calcular días hasta expiración para la respuesta
        let diasRestantes = null;
        let advertencia = null;
        if (result.certFechaExpiracion) {
            diasRestantes = CertificateParser.getDaysUntilExpiration(
                new Date(result.certFechaExpiracion)
            );
            
            if (diasRestantes <= 30) {
                advertencia = `El certificado expira en ${diasRestantes} días. Considere renovarlo pronto.`;
            }
        }

        return NextResponse.json({
            success: true,
            id: result.id,
            certFechaExpiracion: result.certFechaExpiracion,
            diasRestantes,
            advertencia,
            mensaje: `Configuración SRI ${ambiente} guardada exitosamente`
        });
    } catch (error: any) {
        console.error('Error al guardar configuración SRI:', error);
        return NextResponse.json(
            { error: 'Error al guardar configuración SRI', details: error.message },
            { status: 500 }
        );
    }
}
