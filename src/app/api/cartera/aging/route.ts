import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/cartera/aging?tipo=CXC
 * Genera reporte de antigüedad de saldos agrupado por rangos
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const tipo = searchParams.get('tipo'); // 'CXC' o 'CXP'

        if (!tipo || !['CXC', 'CXP'].includes(tipo)) {
            return NextResponse.json(
                { error: 'Parámetro tipo requerido (CXC o CXP)' },
                { status: 400 }
            );
        }

        // Query con agrupación por rangos de vencimiento
        const result = await db.query(
            {
                text: `
                    SELECT 
                        t.id as tercero_id,
                        t.razon_social as tercero_nombre,
                        t.identificacion as tercero_ruc,
                        -- Corriente (0-30 días)
                        SUM(CASE 
                            WHEN d.fecha_vencimiento >= CURRENT_DATE 
                            OR (CURRENT_DATE - d.fecha_vencimiento) <= 30 
                            THEN d.saldo_pendiente 
                            ELSE 0 
                        END) as corriente,
                        -- Vencido 31-60 días
                        SUM(CASE 
                            WHEN (CURRENT_DATE - d.fecha_vencimiento) BETWEEN 31 AND 60 
                            THEN d.saldo_pendiente 
                            ELSE 0 
                        END) as vencido_30,
                        -- Vencido 61-90 días
                        SUM(CASE 
                            WHEN (CURRENT_DATE - d.fecha_vencimiento) BETWEEN 61 AND 90 
                            THEN d.saldo_pendiente 
                            ELSE 0 
                        END) as vencido_60,
                        -- Vencido 90+ días
                        SUM(CASE 
                            WHEN (CURRENT_DATE - d.fecha_vencimiento) > 90 
                            THEN d.saldo_pendiente 
                            ELSE 0 
                        END) as vencido_90,
                        -- Total
                        SUM(d.saldo_pendiente) as total
                    FROM cartera.documentos_pendientes d
                    JOIN directorio.terceros t ON t.id = d.tercero_id
                    WHERE d.empresa_id = $1 
                    AND d.tipo = $2
                    AND d.saldo_pendiente > 0
                    GROUP BY t.id, t.razon_social, t.identificacion
                    HAVING SUM(d.saldo_pendiente) > 0
                    ORDER BY SUM(d.saldo_pendiente) DESC
                `,
                values: [context.empresaId, tipo]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        // Calcular totales generales
        const totales = result.rows.reduce((acc, row) => ({
            corriente: acc.corriente + Number(row.corriente || 0),
            vencido_30: acc.vencido_30 + Number(row.vencido_30 || 0),
            vencido_60: acc.vencido_60 + Number(row.vencido_60 || 0),
            vencido_90: acc.vencido_90 + Number(row.vencido_90 || 0),
            total: acc.total + Number(row.total || 0)
        }), { corriente: 0, vencido_30: 0, vencido_60: 0, vencido_90: 0, total: 0 });

        return NextResponse.json({
            tipo,
            detalles: result.rows,
            totales,
            generadoEn: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Error al generar aging:', error);
        return NextResponse.json(
            { error: 'Error al generar reporte de aging', details: error.message },
            { status: 500 }
        );
    }
}
