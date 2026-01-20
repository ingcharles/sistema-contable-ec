import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/compras/ordenes
 * Lista órdenes de compra
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const result = await db.query(
            {
                text: `
                    SELECT 
                        o.id, o.secuencial, o.fecha_emision as "fechaEmision",
                        o.fecha_entrega as "fechaEntrega", o.observacion,
                        o.subtotal, o.iva, o.total, o.estado,
                        t.razon_social as "proveedorNombre", t.identificacion as "proveedorRuc"
                    FROM compras_ordenes o
                    INNER JOIN terceros t ON t.identificacion = o.proveedor_id
                    WHERE o.empresa_id = $1
                    ORDER BY o.fecha_emision DESC
                `,
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar órdenes:', error);
        return NextResponse.json(
            { error: 'Error al consultar órdenes', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/compras/ordenes
 * Registra una nueva orden de compra
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            proveedorId, secuencial, fechaEmision, fechaEntrega,
            observacion, subtotal, iva, total, detalles
        } = body;

        const result = await db.transaction(async (client) => {
            const ordenId = crypto.randomUUID();

            // 1. Insertar cabecera de la orden
            await client.query(`
                INSERT INTO compras_ordenes (
                    id, empresa_id, usuario_id, proveedor_id, secuencial,
                    fecha_emision, fecha_entrega, observacion,
                    subtotal, iva, total, estado, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDIENTE', NOW()
                )
            `, [
                ordenId, context.empresaId, context.usuarioId, proveedorId,
                secuencial, fechaEmision, fechaEntrega, observacion,
                subtotal, iva, total
            ]);

            // 2. Insertar detalles (si existen)
            if (detalles && Array.isArray(detalles)) {
                for (const d of detalles) {
                    await client.query(`
                        INSERT INTO compras_ordenes_detalles (
                            id, orden_id, producto_nombre, cantidad, precio_unitario, subtotal, graba_iva
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    `, [
                        crypto.randomUUID(), ordenId, d.producto, d.cantidad,
                        d.precioUnitario, d.subtotal, d.grabaIva
                    ]);
                }
            }

            return { id: ordenId };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            id: result.id,
            mensaje: 'Orden de compra registrada exitosamente'
        });
    } catch (error: any) {
        console.error('Error al registrar orden de compra:', error);
        return NextResponse.json(
            { error: 'Error al registrar la orden', details: error.message },
            { status: 500 }
        );
    }
}
