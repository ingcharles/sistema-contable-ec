import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/cartera/documentos
 * Lista documentos pendientes (CxC o CxP) con aging
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const tipo = url.searchParams.get('tipo'); // 'CXC' o 'CXP'

        if (!tipo || !['CXC', 'CXP'].includes(tipo)) {
            return NextResponse.json(
                { error: 'Parámetro tipo requerido (CXC o CXP)' },
                { status: 400 }
            );
        }

        const result = await db.query(
            {
                text: `
                    SELECT 
                        d.id, d.tipo_documento, d.nro_comprobante, d.tercero_id, d.tercero_nombre,
                        d.fecha_emision, d.fecha_vencimiento, d.monto_total, d.saldo_pendiente,
                        d.moneda, d.created_at,
                        CASE 
                            WHEN d.fecha_vencimiento < CURRENT_DATE 
                            THEN CURRENT_DATE - d.fecha_vencimiento 
                            ELSE 0 
                        END as dias_vencidos
                    FROM cartera_documentos d
                    WHERE d.empresa_id = $1 
                    AND d.tipo_cartera = $2
                    AND d.saldo_pendiente > 0
                    ORDER BY d.fecha_vencimiento ASC
                `,
                values: [context.empresaId, tipo]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar documentos pendientes:', error);
        return NextResponse.json(
            { error: 'Error al consultar documentos', details: error.message },
            { status: 500 }
        );
    }
}
