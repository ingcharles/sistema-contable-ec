import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';
import { EstadoConciliacion } from '@/modules/bancos/domain/types';

// GET /api/bancos/conciliaciones?cuentaId=xxx
export async function GET(request: NextRequest) {
    const context = validateContext(request);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const cuentaId = searchParams.get('cuentaId');
        const id = searchParams.get('id');

        // 1. Obtener una conciliación específica por ID
        if (id) {
            const result = await db.querySimple<any>({
                text: `
                    SELECT 
                        id, 
                        empresa_id as "empresaId",
                        cuenta_id as "cuentaId",
                        fecha_corte as "fechaCorte",
                        saldo_libro as "saldoLibro",
                        saldo_extracto as "saldoExtracto",
                        cheques_no_cobrados as "chequesNoCobrados",
                        depositos_en_transito as "depositosEnTransito",
                        diferencia,
                        estado,
                        observaciones,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        created_by as "createdBy"
                    FROM bancos.bancos_conciliaciones 
                    WHERE id = $1 AND empresa_id = $2
                `,
                values: [id, context.empresaId]
            });

            if (result.rowCount === 0) {
                return NextResponse.json(
                    { error: 'Conciliación no encontrada' },
                    { status: 404 }
                );
            }

            const conciliacion = result.rows[0];

            // Obtener movimientos asociados
            const movsResult = await db.querySimple<any>({
                text: `
                    SELECT 
                        id,
                        empresa_id as "empresaId",
                        cuenta_id as "cuentaId",
                        fecha,
                        tipo,
                        referencia,
                        beneficiario,
                        concepto,
                        monto,
                        es_egreso as "esEgreso",
                        conciliado,
                        conciliacion_id as "conciliacionId",
                        created_at as "createdAt"
                    FROM bancos.bancos_movimientos
                    WHERE conciliacion_id = $1
                `,
                values: [id]
            });

            return NextResponse.json({ ...conciliacion, movimientos: movsResult.rows });
        }

        // 2. Obtener todas las conciliaciones de una cuenta
        if (cuentaId) {
            const result = await db.querySimple<any>({
                text: `
                    SELECT 
                        id, 
                        empresa_id as "empresaId",
                        cuenta_id as "cuentaId",
                        fecha_corte as "fechaCorte",
                        saldo_libro as "saldoLibro",
                        saldo_extracto as "saldoExtracto",
                        cheques_no_cobrados as "chequesNoCobrados",
                        depositos_en_transito as "depositosEnTransito",
                        diferencia,
                        estado,
                        observaciones,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        created_by as "createdBy"
                    FROM bancos.bancos_conciliaciones 
                    WHERE cuenta_id = $1 AND empresa_id = $2
                    ORDER BY fecha_corte DESC
                `,
                values: [cuentaId, context.empresaId]
            });

            return NextResponse.json(result.rows);
        }

        return NextResponse.json(
            { error: 'Parámetro cuentaId o id requerido' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error al obtener conciliaciones:', error);
        return NextResponse.json(
            { error: 'Error al obtener conciliaciones' },
            { status: 500 }
        );
    }
}

// POST /api/bancos/conciliaciones
export async function POST(request: NextRequest) {
    const context = validateContext(request);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            cuentaId,
            fechaCorte,
            saldoLibro,
            saldoExtracto,
            chequesNoCobrados,
            depositosEnTransito,
            diferencia,
            estado,
            observaciones,
            movimientosIds
        } = body;

        // Validaciones básicas
        if (!cuentaId || !fechaCorte) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos' },
                { status: 400 }
            );
        }

        const id = crypto.randomUUID();
        const now = new Date();
        const estadoFinal = estado || EstadoConciliacion.BORRADOR;
        const usuarioId = context.usuarioId;
        const empresaId = context.empresaId;

        // Transacción
        await db.transaction(async (client) => {
            // 1. Insertar Conciliación
            await client.query(`
                INSERT INTO bancos.bancos_conciliaciones (
                    id, empresa_id, cuenta_id, fecha_corte, 
                    saldo_libro, saldo_extracto, cheques_no_cobrados, depositos_en_transito, 
                    diferencia, estado, observaciones, created_at, updated_at, created_by
                ) VALUES (
                    $1, $2, $3, $4, 
                    $5, $6, $7, $8, 
                    $9, $10, $11, $12, $13, $14
                )
            `, [
                id, empresaId, cuentaId, fechaCorte,
                saldoLibro, saldoExtracto, chequesNoCobrados, depositosEnTransito,
                diferencia, estadoFinal, observaciones, now, now, usuarioId
            ]);

            // 2. Actualizar movimientos (si hay)
            if (movimientosIds && movimientosIds.length > 0) {
                // Generar placeholders para IN clause: $15, $16, ...
                // O mejor, ejecutar un update con ANY($1) pasando el array directamente que pg soporta
                await client.query(`
                    UPDATE bancos.bancos_movimientos 
                    SET conciliado = true, conciliacion_id = $1
                    WHERE id = ANY($2::text[])
                `, [id, movimientosIds]);
            }

            return { id };
        }, { empresaId: empresaId!, usuarioId: usuarioId! });

        const nuevaConciliacion = {
            id,
            empresaId,
            cuentaId,
            fechaCorte,
            saldoLibro,
            saldoExtracto,
            chequesNoCobrados,
            depositosEnTransito,
            diferencia,
            estado: estadoFinal,
            observaciones,
            createdAt: now,
            updatedAt: now,
            createdBy: usuarioId
        };

        return NextResponse.json(nuevaConciliacion, { status: 201 });

    } catch (error) {
        console.error('Error al crear conciliación:', error);
        return NextResponse.json(
            { error: 'Error al crear conciliación: ' + (error as Error).message },
            { status: 500 }
        );
    }
}

// PUT /api/bancos/conciliaciones
export async function PUT(request: NextRequest) {
    const context = validateContext(request);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            id,
            fechaCorte,
            saldoLibro,
            saldoExtracto,
            chequesNoCobrados,
            depositosEnTransito,
            diferencia,
            estado,
            observaciones,
            movimientosIds
        } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'ID de conciliación requerido' },
                { status: 400 }
            );
        }

        const updatedAt = new Date();
        const usuarioId = context.usuarioId;
        const empId = context.empresaId;

        await db.transaction(async (client) => {
            // 1. Actualizar conciliación
            // Usamos COALESCE para solo actualizar si se pasa valor
            await client.query(`
                UPDATE bancos.bancos_conciliaciones
                SET 
                    fecha_corte = COALESCE($2, fecha_corte),
                    saldo_libro = COALESCE($3, saldo_libro),
                    saldo_extracto = COALESCE($4, saldo_extracto),
                    cheques_no_cobrados = COALESCE($5, cheques_no_cobrados),
                    depositos_en_transito = COALESCE($6, depositos_en_transito),
                    diferencia = COALESCE($7, diferencia),
                    estado = COALESCE($8, estado),
                    observaciones = COALESCE($9, observaciones),
                    updated_at = $10
                WHERE id = $1
            `, [
                id, fechaCorte, saldoLibro, saldoExtracto,
                chequesNoCobrados, depositosEnTransito, diferencia,
                estado, observaciones, updatedAt
            ]);

            // 2. Gestionar movimientos
            if (movimientosIds) {
                // A. Desvincular anteriores
                await client.query(`
                    UPDATE bancos.bancos_movimientos
                    SET conciliado = false, conciliacion_id = NULL
                    WHERE conciliacion_id = $1
                `, [id]);

                // B. Vincular nuevos
                if (movimientosIds.length > 0) {
                    await client.query(`
                        UPDATE bancos.bancos_movimientos 
                        SET conciliado = true, conciliacion_id = $1
                        WHERE id = ANY($2::text[])
                    `, [id, movimientosIds]);
                }
            }
        }, { empresaId: empId!, usuarioId: usuarioId! });

        // Retornar actualizado
        const result = await db.querySimple<any>({
            text: `SELECT 
                id, 
                empresa_id as "empresaId",
                cuenta_id as "cuentaId",
                fecha_corte as "fechaCorte",
                saldo_libro as "saldoLibro",
                saldo_extracto as "saldoExtracto",
                cheques_no_cobrados as "chequesNoCobrados",
                depositos_en_transito as "depositosEnTransito",
                diferencia,
                estado,
                observaciones,
                created_at as "createdAt",
                updated_at as "updatedAt",
                created_by as "createdBy"
            FROM bancos.bancos_conciliaciones 
            WHERE id = $1`,
            values: [id]
        });

        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error('Error al actualizar conciliación:', error);
        return NextResponse.json(
            { error: 'Error al actualizar conciliación' },
            { status: 500 }
        );
    }
}

// DELETE /api/bancos/conciliaciones?id=xxx
export async function DELETE(request: NextRequest) {
    const context = validateContext(request);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'ID de conciliación requerido' },
                { status: 400 }
            );
        }

        const empresaId = context.empresaId;
        const usuarioId = context.usuarioId;

        await db.transaction(async (client) => {
            // 1. Desmarcar movimientos
            await client.query(`
                UPDATE bancos.bancos_movimientos
                SET conciliado = false, conciliacion_id = NULL
                WHERE conciliacion_id = $1
            `, [id]);

            // 2. Eliminar
            await client.query('DELETE FROM bancos.bancos_conciliaciones WHERE id = $1', [id]);
        }, { empresaId: empresaId!, usuarioId: usuarioId! });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar conciliación:', error);
        return NextResponse.json(
            { error: 'Error al eliminar conciliación' },
            { status: 500 }
        );
    }
}
