import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { SriEnvironment } from '@/shared/sri-constants';
import type { CertificadoApiResponse, EstadoCertificado } from '@/shared/types/certificado.types';

/**
 * GET /api/configuracion/sri/metadata
 * Obtiene los metadatos del certificado digital mediante query directo
 * Incluye estado de vigencia y días restantes hasta expiración
 * 
 * @arquitectura Query inline para mayor control y facilitar debugging
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

        // Query completo inline para obtener metadatos del certificado
        const result = await db.query(
            {
                text: `
                    WITH cert_data AS (
                        SELECT 
                            sc.id AS certificado_id,
                            sa.codigo as ambiente,
                            sc.cert_fecha_emision,
                            sc.cert_fecha_expiracion,
                            sc.cert_sujeto,
                            sc.cert_emisor,
                            sc.cert_numero_serie,
                            CASE 
                                WHEN sc.cert_fecha_expiracion IS NULL THEN FALSE
                                WHEN sc.cert_fecha_expiracion >= CURRENT_DATE THEN TRUE
                                ELSE FALSE
                            END AS es_vigente,
                            CASE 
                                WHEN sc.cert_fecha_expiracion IS NULL THEN NULL
                                ELSE (sc.cert_fecha_expiracion - CURRENT_DATE)
                            END AS dias_restantes,
                            CASE 
                                WHEN sc.cert_p12_certificado IS NOT NULL THEN TRUE
                                ELSE FALSE
                            END AS tiene_certificado
                        FROM configuracion.sri_certificados sc
                        INNER JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id
                        WHERE sc.empresa_id = $1 
                          AND sa.codigo = $2
                          AND sc.activo = TRUE
                        LIMIT 1
                    )
                    SELECT * FROM cert_data
                `,
                values: [context.empresaId, ambiente]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { 
                    error: `No se encontró certificado digital para ambiente ${ambiente}`,
                    tieneCertificado: false
                },
                { status: 404 }
            );
        }

        const row = result.rows[0];

        // Lógica de negocio: determinar estado del certificado basado en días restantes
        let estado: EstadoCertificado = 'SIN_CERTIFICADO';
        let advertencia: string | null = null;

        if (row.tiene_certificado && row.cert_fecha_expiracion) {
            if (row.es_vigente) {
                if (row.dias_restantes !== null) {
                    if (row.dias_restantes <= 7) {
                        estado = 'PROXIMO_A_VENCER';
                        advertencia = `⚠️ CRÍTICO: El certificado expira en ${row.dias_restantes} días. Renuévelo URGENTEMENTE.`;
                    } else if (row.dias_restantes <= 30) {
                        estado = 'PROXIMO_A_VENCER';
                        advertencia = `El certificado expira en ${row.dias_restantes} días. Considere renovarlo pronto.`;
                    } else {
                        estado = 'VIGENTE';
                    }
                } else {
                    estado = 'VIGENTE';
                }
            } else {
                estado = 'EXPIRADO';
                const diasExpirado = Math.abs(row.dias_restantes || 0);
                advertencia = `🚫 El certificado expiró hace ${diasExpirado} días. Debe renovarlo INMEDIATAMENTE.`;
            }
        }

        const response: CertificadoApiResponse = {
            certificadoId: row.certificado_id,
            ambiente: row.ambiente,
            fechaEmision: row.cert_fecha_emision,
            fechaExpiracion: row.cert_fecha_expiracion,
            sujeto: row.cert_sujeto,
            emisor: row.cert_emisor,
            numeroSerie: row.cert_numero_serie,
            esVigente: row.es_vigente,
            diasRestantes: row.dias_restantes,
            tieneCertificado: row.tiene_certificado,
            estado,
            advertencia
        };

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('Error al obtener metadatos del certificado:', error);
        return NextResponse.json(
            { error: 'Error al consultar metadatos del certificado', details: error.message },
            { status: 500 }
        );
    }
}
