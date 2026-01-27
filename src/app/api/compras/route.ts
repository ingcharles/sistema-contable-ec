import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/compras
 * Lista facturas de compra o órdenes de compra
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'facturas' or 'ordenes'

    try {
        if (type === 'ordenes') {
            const result = await db.query({
                text: `
                    SELECT 
                        o.id, o.secuencial, o.fecha_emision as "fecha", o.total, o.estado,
                        t.razon_social as "proveedorNombre", t.identificacion as "proveedorRuc"
                    FROM compras.ordenes o
                    INNER JOIN directorio.terceros t ON t.id = o.proveedor_id
                    WHERE o.empresa_id = $1
                    ORDER BY o.fecha_emision DESC
                `,
                values: [context.empresaId]
            }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
            return NextResponse.json(result.rows);
        } else {
            const result = await db.query({
                text: `
                    SELECT 
                        c.id, c.secuencial, c.autorizacion, c.fecha_emision as "fechaEmision",
                        c.fecha_registro as "fechaRegistro", c.tipo_comprobante as "tipoComprobante",
                        c.sustento, c.descripcion, c.subtotal_iva as "subtotalIva", 
                        c.subtotal_0 as "subtotal0", c.monto_iva as "montoIva", c.total,
                        c.tiene_retencion as "tieneRetencion", c.estado_retencion as "estadoRetencion",
                        c.nro_retencion as "nroRetencion",
                        t.razon_social as "proveedorNombre", t.identificacion as "proveedorRuc"
                    FROM compras.compras c
                    INNER JOIN directorio.terceros t ON t.id = c.proveedor_id
                    WHERE c.empresa_id = $1
                    ORDER BY c.fecha_registro DESC
                `,
                values: [context.empresaId]
            }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
            return NextResponse.json(result.rows);
        }
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
 * Registra una factura de compra o una orden de compra
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { type } = body;

        if (type === 'orden') {
            const { proveedorId, secuencial, fecha, total } = body;
            console.log(`Registrando orden de compra para proveedorId: ${proveedorId}, secuencial: ${secuencial}`);
            console.log('Datos de la orden:', context.empresaId!);
            // Resolver proveedorId (RUC) a UUID
            const tercero = await db.query({
                text: 'SELECT id FROM directorio.terceros WHERE id = $1 AND empresa_id = $2',
                values: [proveedorId, context.empresaId]
            }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
            const tId = tercero.rows[0]?.id;

            if (!tId) {
                return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
            }

            const newId = crypto.randomUUID();
            await db.query({
                text: `
                    INSERT INTO compras.ordenes (
                        id, empresa_id, usuario_id, proveedor_id, secuencial, fecha_emision, total
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `,
                values: [newId, context.empresaId, context.usuarioId, tId, secuencial, fecha, total]
            }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
            return NextResponse.json({ success: true, id: newId });
        } else {
            const {
                proveedorId, tipoComprobante, secuencial, autorizacion,
                fechaEmision, fechaRegistro, sustento, descripcion,
                subtotalIva, subtotal0, montoIva, total,
                ordenCompraId, tieneRetencion = false,
                nroRetencion = null, estadoRetencion = 'PENDIENTE',
                detalles = [] // Array de items comprados
            } = body;

            const result = await db.transaction(async (client) => {
                // 0. Resolver proveedorId (RUC) a UUID
                const tercero = await client.query('SELECT id FROM directorio.terceros WHERE identificacion = $1 AND empresa_id = $2', [proveedorId, context.empresaId]);
                const tId = tercero.rows[0]?.id;

                if (!tId) {
                    throw new Error('Proveedor no encontrado');
                }

                // 1. Insertar la compra
                const compraId = crypto.randomUUID();
                await client.query(`
                    INSERT INTO compras.compras (
                        id, empresa_id, usuario_id, proveedor_id, tipo_comprobante, 
                        secuencial, autorizacion, fecha_emision, fecha_registro,
                        sustento, descripcion, subtotal_iva, subtotal_0, 
                        monto_iva, total, orden_compra_id, tiene_retencion,
                        estado_retencion, nro_retencion, created_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
                        $18, $19, NOW()
                    )
                `, [
                    compraId, context.empresaId, context.usuarioId, tId,
                    tipoComprobante, secuencial, autorizacion, fechaEmision, fechaRegistro,
                    sustento, descripcion, subtotalIva, subtotal0, montoIva, total,
                    ordenCompraId, tieneRetencion, estadoRetencion, nroRetencion
                ]);

                // 2. Procesar detalles de la compra y actualizar inventario
                if (detalles && detalles.length > 0) {
                    // Obtener bodega predeterminada
                    const bodegaResult = await client.query(`
                        SELECT id FROM inventario.bodegas 
                        WHERE empresa_id = $1 
                        ORDER BY created_at ASC 
                        LIMIT 1
                    `, [context.empresaId]);

                    const bodegaId = bodegaResult.rows.length > 0 ? bodegaResult.rows[0].id : null;

                    for (const detalle of detalles) {
                        const { productoId, descripcion: desc, cantidad, precioUnitario, subtotal: subDet, porcentajeIva = 0, valorIva = 0, total: totDet } = detalle;

                        // Insertar detalle de compra
                        await client.query(`
                            INSERT INTO compras.compras_detalle (
                                id, compra_id, producto_id, descripcion, cantidad,
                                precio_unitario, subtotal, porcentaje_iva, valor_iva, total, created_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                        `, [crypto.randomUUID(), compraId, productoId || null, desc, cantidad, precioUnitario, subDet, porcentajeIva, valorIva, totDet]);

                        // Si es un producto inventariable, actualizar stock y registrar en kardex
                        if (productoId && bodegaId) {
                            // Obtener stock actual del producto
                            const prodResult = await client.query(`
                                SELECT stock_actual, costo_promedio 
                                FROM inventario.productos 
                                WHERE id = $1 AND empresa_id = $2
                            `, [productoId, context.empresaId]);

                            if (prodResult.rows.length > 0) {
                                const stockActual = parseFloat(prodResult.rows[0].stock_actual);
                                const costoActual = parseFloat(prodResult.rows[0].costo_promedio);
                                const nuevoStock = stockActual + cantidad;

                                // Calcular nuevo costo promedio ponderado
                                const costoTotalAnterior = stockActual * costoActual;
                                const costoTotalNuevo = cantidad * precioUnitario;
                                const nuevoCostoPromedio = (costoTotalAnterior + costoTotalNuevo) / nuevoStock;

                                // Actualizar stock y costo promedio del producto
                                await client.query(`
                                    UPDATE inventario.productos 
                                    SET stock_actual = $1, 
                                        costo_promedio = $2,
                                        updated_at = NOW()
                                    WHERE id = $3 AND empresa_id = $4
                                `, [nuevoStock, nuevoCostoPromedio, productoId, context.empresaId]);

                                // Registrar movimiento en kardex
                                await client.query(`
                                    INSERT INTO inventario.kardex_movimientos 
                                        (empresa_id, usuario_id, producto_id, bodega_id, tipo, cantidad, 
                                         costo_unitario, stock_anterior, stock_resultante, referencia, observaciones, 
                                         fecha, created_at)
                                    VALUES 
                                        ($1, $2, $3, $4, 'ENTRADA', $5, $6, $7, $8, $9, $10, $11, NOW())
                                `, [
                                    context.empresaId,
                                    context.usuarioId,
                                    productoId,
                                    bodegaId,
                                    cantidad,
                                    precioUnitario,
                                    stockActual,
                                    nuevoStock,
                                    `COMPRA-${secuencial}`,
                                    `Compra a proveedor - Factura ${secuencial}`,
                                    fechaEmision
                                ]);
                            }
                        }
                    }
                }

                // 3. Si viene de una OC, marcarla como FACTURADA
                if (ordenCompraId) {
                    await client.query(`
                        UPDATE compras.ordenes 
                        SET estado = 'FACTURADA', updated_at = NOW()
                        WHERE id = $1 AND empresa_id = $2
                    `, [ordenCompraId, context.empresaId]);
                }

                // 4. Registrar en cartera como pendiente de pago
                await client.query(`
                    INSERT INTO cartera.documentos_pendientes (
                        id, empresa_id, tipo, tercero_id, nro_comprobante,
                        fecha_emision, fecha_vencimiento, monto_total, saldo_pendiente,
                        created_at
                    ) VALUES (
                        $1, $2, 'CXP', $3, $4, $5, $6, $7, $8, NOW()
                    )
                `, [
                    crypto.randomUUID(), context.empresaId, tId, secuencial,
                    fechaEmision, fechaEmision, total, total
                ]);

                return { id: compraId };
            }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

            return NextResponse.json({
                success: true,
                id: result.id,
                mensaje: 'Compra registrada exitosamente. El inventario ha sido actualizado.'
            });
        }
    } catch (error: any) {
        console.error('Error al registrar compra:', error);
        return NextResponse.json(
            { error: 'Error al registrar la compra', details: error.message },
            { status: 500 }
        );
    }
}
