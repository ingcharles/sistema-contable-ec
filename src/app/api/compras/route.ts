import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/compras
 * Lista facturas de compra
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
                        c.id, c.secuencial, c.autorizacion, c.fecha_emision as "fechaEmision",
                        c.fecha_registro as "fechaRegistro", c.tipo_comprobante as "tipoComprobante",
                        c.sustento, c.descripcion, c.subtotal_15 as "subtotal15", 
                        c.subtotal_0 as "subtotal0", c.monto_iva as "montoIva", c.total,
                        c.tiene_retencion as "tieneRetencion", c.estado_retencion as "estadoRetencion",
                        c.nro_retencion as "nroRetencion",
                        t.razon_social as "proveedorNombre", t.identificacion as "proveedorRuc"
                    FROM compras c
                    INNER JOIN terceros t ON t.identificacion = c.proveedor_id
                    WHERE c.empresa_id = $1
                    ORDER BY c.fecha_registro DESC
                `,
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar compras:', error);
        return NextResponse.json(
            { error: 'Error al consultar compras', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/compras
 * Registra una factura de compra
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            proveedorId, tipoComprobante, secuencial, autorizacion,
            fechaEmision, fechaRegistro, sustento, descripcion,
            subtotal15, subtotal0, montoIva, total,
            ordenCompraId, tieneRetencion = false
        } = body;

        const result = await db.transaction(async (client) => {
            // 1. Insertar la compra
            const compraId = crypto.randomUUID();
            await client.query(`
                INSERT INTO compras (
                    id, empresa_id, usuario_id, proveedor_id, tipo_comprobante, 
                    secuencial, autorizacion, fecha_emision, fecha_registro,
                    sustento, descripcion, subtotal_15, subtotal_0, 
                    monto_iva, total, orden_compra_id, tiene_retencion,
                    estado_retencion, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
                    'PENDIENTE', NOW()
                )
            `, [
                compraId, context.empresaId, context.usuarioId, proveedorId,
                tipoComprobante, secuencial, autorizacion, fechaEmision, fechaRegistro,
                sustento, descripcion, subtotal15, subtotal0, montoIva, total,
                ordenCompraId, tieneRetencion
            ]);

            // 2. Si viene de una OC, marcarla como FACTURADA
            if (ordenCompraId) {
                await client.query(`
                    UPDATE compras_ordenes 
                    SET estado = 'FACTURADA', updated_at = NOW()
                    WHERE id = $1 AND empresa_id = $2
                `, [ordenCompraId, context.empresaId]);
            }

            // 3. Registrar en cartera como pendiente de pago
            await client.query(`
                INSERT INTO cartera_documentos (
                    id, empresa_id, tipo, tercero_id, nro_comprobante,
                    fecha_emision, fecha_vencimiento, monto_total, saldo_pendiente,
                    created_at
                ) VALUES (
                    $1, $2, 'CXP', $3, $4, $5, $6, $7, $8, NOW()
                )
            `, [
                crypto.randomUUID(), context.empresaId, proveedorId, secuencial,
                fechaEmision, fechaEmision, total, total
            ]);

            return { id: compraId };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            id: result.id,
            mensaje: 'Compra registrada exitosamente'
        });
    } catch (error: any) {
        console.error('Error al registrar compra:', error);
        return NextResponse.json(
            { error: 'Error al registrar la compra', details: error.message },
            { status: 500 }
        );
    }
}
