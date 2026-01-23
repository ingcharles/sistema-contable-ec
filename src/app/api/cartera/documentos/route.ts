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
        const terceroId = url.searchParams.get('terceroId');

        if (!tipo || !['CXC', 'CXP'].includes(tipo)) {
            return NextResponse.json(
                { error: 'Parámetro tipo requerido (CXC o CXP)' },
                { status: 400 }
            );
        }

        // Construir query dinámica
        let query = `
            SELECT 
                d.id, d.tipo as tipo_cartera, d.nro_comprobante, d.tercero_id, t.razon_social as tercero_nombre, t.identificacion as tercero_ruc, t.email as tercero_email, t.direccion as tercero_direccion, t.telefono as tercero_telefono,
                d.fecha_emision, d.fecha_vencimiento, d.monto_total, d.saldo_pendiente,
                d.created_at,
                CASE 
                    WHEN d.fecha_vencimiento < CURRENT_DATE 
                    THEN CURRENT_DATE - d.fecha_vencimiento 
                    ELSE 0 
                END as dias_vencidos
            FROM cartera.documentos_pendientes d
            LEFT JOIN directorio.terceros t ON t.id = d.tercero_id
            WHERE d.empresa_id = $1 
            AND d.tipo = $2
            AND d.saldo_pendiente > 0
        `;

        const values = [context.empresaId, tipo];

        if (terceroId) {
            query += ` AND d.tercero_id = $3`;
            values.push(terceroId);
        }

        query += ` ORDER BY d.fecha_vencimiento ASC`;

        const result = await db.query(
            {
                text: query,
                values: values
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
