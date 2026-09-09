import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

/**
 * GET /api/facturacion/proformas
 * Lista proformas de la empresa
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const result = await db.query({
            text: `
                SELECT 
                    p.*,
                    t.razon_social as cliente_nombre,
                    t.identificacion as cliente_identificacion,
                    (
                        SELECT json_agg(pd.*)
                        FROM facturacion.proformas_detalle pd
                        WHERE pd.proforma_id = p.id
                    ) as detalles
                FROM facturacion.proformas p
                JOIN directorio.terceros t ON p.cliente_id = t.id
                WHERE p.empresa_id = $1
                ORDER BY p.fecha DESC, p.numero DESC
            `,
            values: [context.empresaId]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json(result.rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/facturacion/proformas
 * Crea una nueva proforma
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const body = await req.json();
        const { cliente_id, fecha, validez_dias, observaciones, items, subtotal_iva, subtotal_0, monto_iva, total } = body;

        const result = await db.transaction(async (client) => {
            // 1. OBTENER SECUENCIAL
            const seqResult = await client.query(`
                SELECT COALESCE(MAX(CAST(numero AS INTEGER)), 0) + 1 as next_val
                FROM facturacion.proformas
                WHERE empresa_id = $1
            `, [context.empresaId]);
            const numero = seqResult.rows[0].next_val.toString().padStart(6, '0');

            // 2. INSERTAR CABECERA
            const proformaResult = await client.query(`
                INSERT INTO facturacion.proformas (
                    empresa_id, usuario_id, cliente_id, numero, fecha, validez_dias,
                    subtotal_iva, subtotal_0, monto_iva, total, observaciones
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id
            `, [
                context.empresaId, context.usuarioId, cliente_id, numero,
                fecha, validez_dias, subtotal_iva, subtotal_0, monto_iva, total, observaciones
            ]);
            const proformaId = proformaResult.rows[0].id;

            // 3. INSERTAR DETALLES
            for (const item of items) {
                await client.query(`
                    INSERT INTO facturacion.proformas_detalle (
                        proforma_id, producto_id, descripcion, cantidad, 
                        precio_unitario, subtotal, porcentaje_iva, valor_iva, total
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    proformaId, item.producto_id, item.descripcion, item.cantidad,
                    item.precio_unitario, item.subtotal, item.porcentaje_iva, item.valor_iva, item.total
                ]);
            }

            return { id: proformaId, numero };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error al guardar proforma:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
