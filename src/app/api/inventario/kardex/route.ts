import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * POST /api/inventario/kardex
 * Registra un movimiento de inventario (entrada/salida)
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { productoId, bodegaId, tipo, cantidad, costoUnitario, referencia, observaciones } = body;

        // Validaciones
        if (!productoId || !bodegaId || !tipo || !cantidad) {
            return NextResponse.json(
                { error: 'Campos requeridos: productoId, bodegaId, tipo, cantidad' },
                { status: 400 }
            );
        }

        if (!['ENTRADA', 'SALIDA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO'].includes(tipo)) {
            return NextResponse.json(
                { error: 'Tipo de movimiento inválido' },
                { status: 400 }
            );
        }

        // Usar transacción para actualizar stock y registrar kardex
        const result = await db.transaction(async (client) => {
            // Obtener stock actual
            const stockResult = await client.query(`
                SELECT stock_actual, costo_promedio 
                FROM inventario.productos 
                WHERE id = $1 AND empresa_id = $2
            `, [productoId, context.empresaId]);

            if (stockResult.rows.length === 0) {
                throw new Error('Producto no encontrado');
            }

            const stockActual = parseFloat(stockResult.rows[0].stock_actual);
            const costoActual = parseFloat(stockResult.rows[0].costo_promedio);

            // Calcular nuevo stock según tipo de movimiento
            let nuevoStock = stockActual;
            let esEntrada = false;

            switch (tipo) {
                case 'ENTRADA':
                case 'AJUSTE_POSITIVO':
                    nuevoStock = stockActual + cantidad;
                    esEntrada = true;
                    break;
                case 'SALIDA':
                case 'AJUSTE_NEGATIVO':
                    nuevoStock = stockActual - cantidad;
                    if (nuevoStock < 0) {
                        throw new Error('Stock insuficiente para realizar la salida');
                    }
                    break;
            }

            // Calcular nuevo costo promedio (solo en entradas con costo)
            let nuevoCosto = costoActual;
            if (esEntrada && costoUnitario && costoUnitario > 0) {
                const costoTotalAnterior = stockActual * costoActual;
                const costoTotalNuevo = cantidad * costoUnitario;
                nuevoCosto = (costoTotalAnterior + costoTotalNuevo) / nuevoStock;
            }

            // Actualizar stock del producto
            await client.query(`
                UPDATE inventario.productos 
                SET stock_actual = $1, 
                    costo_promedio = $2,
                    updated_at = NOW()
                WHERE id = $3 AND empresa_id = $4
            `, [nuevoStock, nuevoCosto, productoId, context.empresaId]);

            // Registrar movimiento en kardex
            const kardexResult = await client.query(`
                INSERT INTO inventario.kardex_movimientos 
                    (empresa_id, usuario_id, producto_id, bodega_id, tipo, cantidad, 
                     costo_unitario, stock_anterior, stock_resultante, referencia, observaciones, 
                     fecha, created_at)
                VALUES 
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
                RETURNING id, stock_resultante
            `, [
                context.empresaId,
                context.usuarioId,
                productoId,
                bodegaId,
                tipo,
                cantidad,
                costoUnitario || nuevoCosto,
                stockActual,
                nuevoStock,
                referencia,
                observaciones
            ]);

            return {
                movimientoId: kardexResult.rows[0].id,
                stockResultante: kardexResult.rows[0].stock_resultante
            };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            id: result.movimientoId,
            stockResultante: result.stockResultante,
            mensaje: `Movimiento de ${tipo} registrado exitosamente`
        });
    } catch (error: any) {
        console.error('Error al registrar movimiento kardex:', error);
        return NextResponse.json(
            { error: error.message || 'Error al registrar movimiento', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET /api/inventario/kardex
 * Consulta movimientos de kardex con filtros
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const productoId = url.searchParams.get('productoId');
        const bodegaId = url.searchParams.get('bodegaId');
        const desde = url.searchParams.get('desde');
        const hasta = url.searchParams.get('hasta');

        let whereConditions = ['k.empresa_id = $1'];
        let values: any[] = [context.empresaId];
        let paramIndex = 2;

        if (productoId) {
            whereConditions.push(`k.producto_id = $${paramIndex}`);
            values.push(productoId);
            paramIndex++;
        }

        if (bodegaId) {
            whereConditions.push(`k.bodega_id = $${paramIndex}`);
            values.push(bodegaId);
            paramIndex++;
        }

        if (desde) {
            whereConditions.push(`k.fecha >= $${paramIndex}`);
            values.push(desde);
            paramIndex++;
        }

        if (hasta) {
            whereConditions.push(`k.fecha <= $${paramIndex}`);
            values.push(hasta);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        const result = await db.query(
            {
                text: `
                    SELECT 
                        k.id, k.fecha, k.tipo, k.cantidad, k.costo_unitario,
                        k.stock_anterior, k.stock_resultante, k.referencia, k.observaciones,
                        k.created_at,
                        p.nombre as producto_nombre,
                        b.nombre as bodega_nombre
                    FROM inventario.kardex_movimientos k
                    INNER JOIN inventario.productos p ON p.id = k.producto_id
                    INNER JOIN inventario.bodegas b ON b.id = k.bodega_id
                    WHERE ${whereClause}
                    ORDER BY k.fecha DESC, k.created_at DESC
                    LIMIT 100
                `,
                values
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al consultar kardex:', error);
        return NextResponse.json(
            { error: 'Error al consultar movimientos', details: error.message },
            { status: 500 }
        );
    }
}
