import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

/**
 * POST /api/inventario/transferencias
 * Registra una transferencia entre bodegas
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const body = await req.json();
        const { bodegaOrigenId, bodegaDestinoId, items, referencia, observacion } = body;

        if (!bodegaOrigenId || !bodegaDestinoId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Datos incompletos para la transferencia' }, { status: 400 });
        }

        await db.transaction(async (client) => {
            for (const item of items) {
                // 1. OBTENER STOCK ACTUAL PARA VALIDACIÓN (ORIGEN)
                const stockResult = await client.query(`
                    SELECT stock_actual, costo_promedio 
                    FROM inventario.productos 
                    WHERE id = $1 AND empresa_id = $2
                `, [item.productoId, context.empresaId]);

                if (stockResult.rows.length === 0) throw new Error(`Producto ${item.productoId} no encontrado`);

                const stockActual = parseFloat(stockResult.rows[0].stock_actual);
                const costoPromedio = parseFloat(stockResult.rows[0].costo_promedio);

                if (stockActual < item.cantidad) {
                    throw new Error(`Stock insuficiente para el producto ${item.nombre}. Disponible: ${stockActual}`);
                }

                // 2. SALIDA DE BODEGA ORIGEN
                await client.query(`
                    INSERT INTO inventario.kardex_movimientos (
                        empresa_id, usuario_id, producto_id, bodega_id, tipo, 
                        cantidad, costo_unitario, stock_anterior, stock_resultante,
                        referencia, observaciones, fecha
                    ) VALUES ($1, $2, $3, $4, 'TRANSFERENCIA_SALIDA', $5, $6, $7, $8, $9, $10, NOW())
                `, [
                    context.empresaId, context.usuarioId, item.productoId, bodegaOrigenId,
                    item.cantidad, costoPromedio, stockActual, stockActual - item.cantidad,
                    referencia || 'TRANSFERENCIA', `Salida por transferencia a bodega destino: ${bodegaDestinoId}. ${observacion || ''}`
                ]);

                // 3. ENTRADA A BODEGA DESTINO
                await client.query(`
                    INSERT INTO inventario.kardex_movimientos (
                        empresa_id, usuario_id, producto_id, bodega_id, tipo, 
                        cantidad, costo_unitario, stock_anterior, stock_resultante,
                        referencia, observaciones, fecha
                    ) VALUES ($1, $2, $3, $4, 'TRANSFERENCIA_ENTRADA', $5, $6, $7, $8, $9, $10, NOW())
                `, [
                    context.empresaId, context.usuarioId, item.productoId, bodegaDestinoId,
                    item.cantidad, costoPromedio, stockActual - item.cantidad, stockActual,
                    referencia || 'TRANSFERENCIA', `Entrada por transferencia desde bodega origen: ${bodegaOrigenId}. ${observacion || ''}`
                ]);
            }
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({ success: true, message: 'Transferencia realizada con éxito' });

    } catch (error: any) {
        console.error('Error en transferencia:', error);
        return NextResponse.json({ error: error.message || 'Error al procesar transferencia' }, { status: 500 });
    }
}

/**
 * GET /api/inventario/transferencias
 * Lista el historial de transferencias (simplificado recorriendo el kardex agrupado por referencia)
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const result = await db.query({
            text: `
                SELECT 
                    fecha,
                    referencia,
                    observaciones as observacion,
                    bodega_id as "bodegaOrigenId",
                    (SELECT nombre FROM inventario.bodegas b WHERE b.id = k.bodega_id) as "bodegaOrigen",
                    (
                        SELECT nombre 
                        FROM inventario.bodegas b 
                        WHERE b.id = (SELECT (regexp_matches(k.observaciones, 'destino: ([a-z0-9-]+)'))[1]::uuid)
                    ) as "bodegaDestino",
                    COUNT(*) as "cantidadItems"
                FROM inventario.kardex_movimientos k
                WHERE empresa_id = $1 AND tipo = 'TRANSFERENCIA_SALIDA'
                GROUP BY fecha, referencia, observaciones, bodega_id
                ORDER BY fecha DESC
            `,
            values: [context.empresaId]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json(result.rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
