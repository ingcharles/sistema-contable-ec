import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

/**
 * GET /api/compras/notas-credito
 * Lista notas de crédito de proveedores
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const result = await db.query({
            text: `
                SELECT 
                    nc.*,
                    t.razon_social as proveedor_nombre,
                    t.identificacion as proveedor_ruc,
                    c.secuencial as factura_numero
                FROM compras.notas_credito nc
                JOIN directorio.terceros t ON nc.proveedor_id = t.id
                LEFT JOIN compras.comprobantes c ON nc.factura_id = c.id
                WHERE nc.empresa_id = $1
                ORDER BY nc.fecha_emision DESC
            `,
            values: [context.empresaId]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json(result.rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/compras/notas-credito
 * Registra una nota de crédito de proveedor
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const body = await req.json();
        const {
            proveedor_id, factura_id, secuencial, fecha_emision,
            motivo, subtotal, iva, total, items
        } = body;

        const result = await db.transaction(async (client) => {
            // 1. Insertar Cabecera de Nota de Crédito
            const ncResult = await client.query(`
                INSERT INTO compras.notas_credito (
                    empresa_id, proveedor_id, factura_id, secuencial, 
                    fecha_emision, motivo, subtotal, iva, total, estado
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'REGISTRADO')
                RETURNING id
            `, [
                context.empresaId, proveedor_id, factura_id, secuencial,
                fecha_emision, motivo, subtotal, iva, total
            ]);
            const ncId = ncResult.rows[0].id;

            // 2. Insertar Detalles y Ajustar Kardex (si aplica)
            for (const item of items) {
                await client.query(`
                    INSERT INTO compras.notas_credito_detalles (
                        nota_credito_id, producto_id, cantidad, precio_unitario, total
                    ) VALUES ($1, $2, $3, $4, $5)
                `, [ncId, item.producto_id, item.cantidad, item.precio_unitario, item.total]);

                // Si hay ajuste de stock (devolución)
                if (item.producto_id && item.cantidad > 0) {
                    await client.query(`
                        INSERT INTO inventario.kardex_movimientos (
                            empresa_id, producto_id, tipo_movimiento, cantidad,
                            costo_unitario, referencia_tipo, referencia_id, glosa
                        ) VALUES ($1, $2, 'SALIDA', $3, $4, 'NC_COMPRA', $5, $6)
                    `, [
                        context.empresaId, item.producto_id, item.cantidad,
                        item.precio_unitario, ncId, `NC Compra ${secuencial}`
                    ]);
                }
            }


            // 3. Integración Contable: Asiento de Reversión (Manual)
            // Se invierte la naturaleza con respecto a una compra:
            // - Proveedores (CXP): Se debita (Disminuye deuda)
            // - Inventario/Gasto: Se acredita (Salida)
            // - IVA Compras: Se acredita (Disminución crédito tributario)

            const glosaAsiento = `Nota de Crédito Compra: ${motivo} - Sec: ${secuencial}`;

            // Insertar Cabecera Asiento
            const asientoResult = await client.query(`
                INSERT INTO contabilidad.asientos (
                    empresa_id, usuario_id, numero, fecha, glosa, tipo, estado, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, 'DIARIO', 'MAYORIZADO', NOW(), NOW())
                RETURNING id
            `, [context.empresaId, context.usuarioId, `NC-${secuencial}`, fecha_emision, glosaAsiento]);
            const asientoId = asientoResult.rows[0].id;

            // TODO: Parametrizar cuentas. Usando cuentas por defecto del Plan General.
            const cuentaCxp = '2.1.01.01'; // Proveedores Locales
            const cuentaInventario = '1.1.03.01'; // Inventario Mercadería
            const cuentaIva = '1.1.04.02'; // IVA Compras

            // Detalle 1: Proveedores (Debe) -> Disminuye Deuda
            await client.query(`
                INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto, glosa)
                VALUES ($1, $2, $3, 0, $4, $5)
            `, [asientoId, cuentaCxp, total, `NC Prov: ${secuencial}`, glosaAsiento]);

            // Detalle 2: Inventario (Haber) -> Salida/Devolución
            if (subtotal > 0) {
                await client.query(`
                    INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto, glosa)
                    VALUES ($1, $2, 0, $3, $4, $5)
                `, [asientoId, cuentaInventario, subtotal, `Devolución Mercadería`, glosaAsiento]);
            }

            // Detalle 3: IVA (Haber) -> Ajuste Crédito Tributario
            if (iva > 0) {
                await client.query(`
                    INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto, glosa)
                    VALUES ($1, $2, 0, $3, $4, $5)
                `, [asientoId, cuentaIva, iva, `Ajuste IVA Compras`, glosaAsiento]);
            }

            // 4. Integración Cartera (CXP): Registrar Movimiento
            // Si hay factura asociada, se reduce su saldo. Si no, queda como anticipo/favor.
            // Por simplicidad en este módulo, registramos un movimiento de tipo "NOTA_CREDITO"
            // que reduce el saldo global del proveedor en la vista de cartera.

            await client.query(`
                INSERT INTO cartera.transacciones (
                    empresa_id, tercero_id, tipo, fecha, monto, comprobante_referencia, concepto, created_at
                ) VALUES ($1, $2, 'NOTA_CREDITO', $3, $4, $5, $6, NOW())
            `, [context.empresaId, proveedor_id, fecha_emision, total, secuencial, motivo]);

            // Si hay factura asociada, actualizar su saldo pendiente (opcional, si se trackea saldo por factura)
            if (factura_id) {
                await client.query(`
                    UPDATE cartera.documentos_pendientes
                    SET saldo_pendiente = saldo_pendiente - $1, updated_at = NOW()
                    WHERE empresa_id = $2 AND tercero_id = $3 AND nro_comprobante = (
                        SELECT secuencial FROM compras.compras WHERE id = $4
                    )
               `, [total, context.empresaId, proveedor_id, factura_id]);
            }

            return { id: ncId, asientoId };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error al registrar NC compra:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
