import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { extractPaginationParams, buildPaginatedResponse } from '@/shared/utils/pagination';

/**
 * GET /api/bancos/movimientos
 * Lista movimientos bancarios con filtros
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const pagination = extractPaginationParams(url);
        const cuentaId = url.searchParams.get('cuenta');
        const desde = url.searchParams.get('desde');
        const hasta = url.searchParams.get('hasta');
        const conciliado = url.searchParams.get('conciliado');

        let whereConditions = ['m.empresa_id = $1'];
        let values: any[] = [context.empresaId];
        let paramIndex = 2;

        if (cuentaId) {
            whereConditions.push(`m.cuenta_id = $${paramIndex}`);
            values.push(cuentaId);
            paramIndex++;
        }

        if (desde) {
            whereConditions.push(`m.fecha >= $${paramIndex}`);
            values.push(desde);
            paramIndex++;
        }

        if (hasta) {
            whereConditions.push(`m.fecha <= $${paramIndex}`);
            values.push(hasta);
            paramIndex++;
        }

        if (conciliado !== null && conciliado !== undefined) {
            whereConditions.push(`m.conciliado = $${paramIndex}`);
            values.push(conciliado === 'true');
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // Contar total
        const countResult = await db.query<{ count: string }>(
            {
                text: `SELECT COUNT(*) FROM bancos.bancos_movimientos m WHERE ${whereClause}`,
                values
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const totalItems = parseInt(countResult.rows[0].count);

        // Obtener datos paginados
        const dataResult = await db.query(
            {
                text: `
                    SELECT 
                        m.id, m.fecha, m.tipo, m.referencia, m.beneficiario, m.concepto,
                        m.monto, m.conciliado, m.es_egreso, m.created_at,
                        c.nombre as cuenta_nombre, c.numero_cuenta
                    FROM bancos.bancos_movimientos m
                    INNER JOIN bancos.bancos_cuentas c ON c.id = m.cuenta_id
                    WHERE ${whereClause}
                    ORDER BY m.fecha DESC, m.created_at DESC
                    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
                `,
                values: [...values, pagination.limit, pagination.offset]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const response = buildPaginatedResponse(
            dataResult.rows,
            totalItems,
            pagination
        );

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('Error al listar movimientos:', error);
        return NextResponse.json(
            { error: 'Error al consultar movimientos', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/bancos/movimientos
 * Registra un movimiento bancario y actualiza saldo
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { cuentaId, fecha, tipo, referencia, beneficiario, concepto, monto, esEgreso } = body;

        if (!cuentaId || !fecha || !tipo || !monto) {
            return NextResponse.json(
                { error: 'Campos requeridos: cuentaId, fecha, tipo, monto' },
                { status: 400 }
            );
        }

        // Usar transacción para actualizar saldo y registrar movimiento
        const result = await db.transaction(async (client) => {
            // Obtener saldo actual
            const cuentaResult = await client.query(`
                SELECT saldo_actual 
                FROM bancos.bancos_cuentas 
                WHERE id = $1 AND empresa_id = $2
            `, [cuentaId, context.empresaId]);

            if (cuentaResult.rows.length === 0) {
                throw new Error('Cuenta bancaria no encontrada');
            }

            const saldoActual = parseFloat(cuentaResult.rows[0].saldo_actual);

            // Calcular nuevo saldo
            const nuevoSaldo = esEgreso
                ? saldoActual - monto
                : saldoActual + monto;

            // Validar saldo suficiente en egresos
            if (esEgreso && nuevoSaldo < 0) {
                throw new Error('Saldo insuficiente en la cuenta bancaria');
            }

            // Actualizar saldo de la cuenta
            await client.query(`
                UPDATE bancos.bancos_cuentas 
                SET saldo_actual = $1, updated_at = NOW()
                WHERE id = $2 AND empresa_id = $3
            `, [nuevoSaldo, cuentaId, context.empresaId]);

            // Registrar movimiento
            const movimientoResult = await client.query(`
                INSERT INTO bancos.bancos_movimientos 
                    (empresa_id, usuario_id, cuenta_id, fecha, tipo, referencia, beneficiario,
                     concepto, monto, es_egreso, conciliado, created_at)
                VALUES 
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, NOW())
                RETURNING id
            `, [
                context.empresaId,
                context.usuarioId,
                cuentaId,
                fecha,
                tipo,
                referencia,
                beneficiario,
                concepto,
                monto,
                esEgreso
            ]);

            return {
                movimientoId: movimientoResult.rows[0].id,
                saldoResultante: nuevoSaldo
            };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            id: result.movimientoId,
            saldoResultante: result.saldoResultante,
            mensaje: 'Transacción bancaria registrada exitosamente'
        });
    } catch (error: any) {
        console.error('Error al registrar movimiento bancario:', error);
        return NextResponse.json(
            { error: error.message || 'Error al registrar transacción', details: error.message },
            { status: 500 }
        );
    }
}
