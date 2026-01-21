import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

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
        const ambiente = url.searchParams.get('ambiente') || 'PRUEBAS';

        if (!['PRUEBAS', 'PRODUCCION'].includes(ambiente)) {
            return NextResponse.json(
                { error: 'Ambiente debe ser PRUEBAS o PRODUCCION' },
                { status: 400 }
            );
        }

        const result = await db.query(
            {
                text: `
                    SELECT 
                        id, empresa_id, ambiente,
                        p12_certificado, clave_certificado,
                        url_recepcion, url_autorizacion,
                        activo, created_at, updated_at
                    FROM configuracion.sri_certificados
                    WHERE empresa_id = $1 AND ambiente = $2 AND activo = TRUE
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
        if (config.p12_certificado) {
            config.p12_base64 = config.p12_certificado.toString('base64');
            delete config.p12_certificado; // Don't send raw BYTEA
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
        const { ambiente, p12Base64, claveCertificado, urlRecepcion, urlAutorizacion } = body;

        if (!ambiente || !['PRUEBAS', 'PRODUCCION'].includes(ambiente)) {
            return NextResponse.json(
                { error: 'Ambiente requerido: PRUEBAS o PRODUCCION' },
                { status: 400 }
            );
        }

        // Convert base64 to Buffer for BYTEA storage
        let p12Buffer = null;
        if (p12Base64) {
            p12Buffer = Buffer.from(p12Base64, 'base64');
        }

        const result = await db.transaction(async (client) => {
            // Deactivate existing configs for this empresa+ambiente
            await client.query(`
                UPDATE configuracion.sri_certificados
                SET activo = FALSE, updated_at = NOW()
                WHERE empresa_id = $1 AND ambiente = $2
            `, [context.empresaId, ambiente]);

            // Insert new active config
            const insertResult = await client.query(`
                INSERT INTO configuracion.sri_certificados (
                    empresa_id, ambiente, p12_certificado, clave_certificado,
                    url_recepcion, url_autorizacion, activo, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)
                RETURNING id
            `, [
                context.empresaId,
                ambiente,
                p12Buffer,
                claveCertificado,
                urlRecepcion || (ambiente === 'PRUEBAS'
                    ? 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl'
                    : 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl'),
                urlAutorizacion || (ambiente === 'PRUEBAS'
                    ? 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
                    : 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'),
                context.usuarioId
            ]);

            return { id: insertResult.rows[0].id };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            id: result.id,
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
