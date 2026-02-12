import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

// GET /api/caja-chica - Obtener información de caja chica y sus vales
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action'); // 'info' o 'vales'

        if (action === 'info') {
            // Obtener información de la caja chica
            const result = await db.query(
                {
                    text: `SELECT id, empresa_id as "empresaId", nombre, responsable, 
                  monto_asignado as "montoAsignado", saldo_actual as "saldoActual",
                  ultima_reposicion as "ultimaReposicion"
                FROM caja_chica.cajas
                WHERE empresa_id = $1 AND activa = true
                LIMIT 1`,
                    values: [context.empresaId]
                },
                { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
            );

            if (result.rows.length === 0) {
                return NextResponse.json({ error: 'Caja chica no encontrada' }, { status: 404 });
            }

            return NextResponse.json(result.rows[0]);
        } else {
            // Obtener vales de caja chica
            const result = await db.query(
                {
                    text: `SELECT v.id, v.empresa_id as "empresaId", v.caja_id as "cajaId",
                  v.numero, v.fecha, v.beneficiario, v.concepto, v.monto,
                  v.tipo, v.estado, v.usuario_id as "usuarioId",
                  v.created_at as "createdAt", v.updated_at as "updatedAt",
                  u.nombre as "createdBy"
                FROM caja_chica.movimientos v
                LEFT JOIN seguridad.usuarios u ON v.usuario_id = u.id
                WHERE v.empresa_id = $1
                ORDER BY v.fecha DESC, v.numero DESC`,
                    values: [context.empresaId]
                },
                { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
            );

            return NextResponse.json(result.rows);
        }
    } catch (error: any) {
        console.error('Error en GET /api/caja-chica:', error);
        return NextResponse.json(
            { error: 'Error al obtener datos de caja chica', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/caja-chica - Crear/Actualizar vale o anular
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { action } = body;

        if (action === 'anular') {
            // Anular vale
            const { valeId } = body;
            if (!valeId) {
                return NextResponse.json({ error: 'valeId requerido' }, { status: 400 });
            }

            await db.query(
                {
                    text: `UPDATE caja_chica.movimientos
                SET estado = 'ANULADO', updated_at = NOW()
                WHERE id = $1 AND empresa_id = $2`,
                    values: [valeId, context.empresaId]
                },
                { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
            );

            return NextResponse.json({ success: true, message: 'Vale anulado correctamente' });
        } else if (action === 'liquidar') {
            // Liquidar vales
            const { valeIds } = body;
            if (!Array.isArray(valeIds) || valeIds.length === 0) {
                return NextResponse.json({ error: 'valeIds requerido' }, { status: 400 });
            }

            const placeholders = valeIds.map((_, i) => `$${i + 2}`).join(', ');
            await db.query(
                {
                    text: `UPDATE caja_chica.movimientos
                SET estado = 'LIQUIDADO', updated_at = NOW()
                WHERE empresa_id = $1 AND id IN (${placeholders})`,
                    values: [context.empresaId, ...valeIds]
                },
                { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
            );

            return NextResponse.json({ success: true, message: 'Vales liquidados correctamente' });
        } else {
            // Crear o actualizar vale
            const { vale } = body;
            if (!vale) {
                return NextResponse.json({ error: 'Datos de vale requeridos' }, { status: 400 });
            }

            // Obtener la caja chica activa
            const cajaResult = await db.query(
                {
                    text: `SELECT id FROM caja_chica.cajas
                WHERE empresa_id = $1 AND activa = true
                LIMIT 1`,
                    values: [context.empresaId]
                },
                { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
            );

            if (cajaResult.rows.length === 0) {
                return NextResponse.json({ error: 'No hay caja chica activa' }, { status: 400 });
            }

            const cajaId = cajaResult.rows[0].id;

            if (vale.id) {
                // Actualizar vale existente
                await db.query(
                    {
                        text: `UPDATE caja_chica.movimientos
                  SET fecha = $1, beneficiario = $2, concepto = $3, monto = $4,
                      tipo = $5, estado = $6, updated_at = NOW()
                  WHERE id = $7 AND empresa_id = $8`,
                        values: [
                            vale.fecha,
                            vale.beneficiario,
                            vale.concepto,
                            vale.monto,
                            vale.tipo,
                            vale.estado || 'PENDIENTE',
                            vale.id,
                            context.empresaId
                        ]
                    },
                    { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
                );
            } else {
                // Usar transacción para el vale y el asiento
                await db.transaction(async (client) => {
                    // Generar número de vale (manteniendo la lógica de búsqueda)
                    const numeroResult = await client.query(
                        {
                            text: `SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 5) AS INTEGER)), 0) + 1 as siguiente
                  FROM caja_chica.movimientos
                  WHERE empresa_id = $1 AND numero LIKE 'VAL-%'`,
                            values: [context.empresaId]
                        }
                    );
                    const siguiente = numeroResult.rows[0].siguiente;
                    const numero = `VAL-${String(siguiente).padStart(3, '0')}`;

                    // Insertar nuevo vale
                    await client.query(
                        {
                            text: `INSERT INTO caja_chica.movimientos 
                  (caja_id, empresa_id, usuario_id, numero, fecha, beneficiario, concepto, monto, tipo, estado)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                  RETURNING id`,
                            values: [
                                cajaId,
                                context.empresaId,
                                context.usuarioId!,
                                numero,
                                vale.fecha,
                                vale.beneficiario,
                                vale.concepto,
                                vale.monto,
                                vale.tipo,
                                vale.estado || 'PENDIENTE'
                            ]
                        }
                    );


                    // --- GENERACIÓN DE ASIENTO CONTABLE ---
                    const paramsResult = await client.query('SELECT cuenta_caja_chica, cuenta_gastos_varios FROM configuracion.parametros WHERE empresa_id = $1', [context.empresaId]);
                    const params = paramsResult.rows[0] || {};

                    const glosa = `Vale Caja Chica: ${vale.concepto} (${numero})`;
                    const asientoResult = await client.query(`
                    INSERT INTO contabilidad.asientos (empresa_id, usuario_id, numero, fecha, glosa, tipo, estado)
                    VALUES ($1, $2, $3, $4, $5, 'DIARIO', 'MAYORIZADO')
                    RETURNING id
                `, [
                        context.empresaId, context.usuarioId,
                        numero, vale.fecha, glosa
                    ]);
                    const asientoId = asientoResult.rows[0].id;

                    const ctaCajaChica = params.cuenta_caja_chica;
                    const ctaGasto = params.cuenta_gastos_varios;

                    if (vale.tipo === 'EGRESO') {
                        await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto, glosa) VALUES ($1, $2, $3, 0, $4, $5)`, [asientoId, ctaGasto, vale.monto, vale.concepto, glosa]);
                        await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto, glosa) VALUES ($1, $2, 0, $3, $4, $5)`, [asientoId, ctaCajaChica, vale.monto, vale.concepto, glosa]);
                    } else {
                        await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto, glosa) VALUES ($1, $2, $3, 0, $4, $5)`, [asientoId, ctaCajaChica, vale.monto, vale.concepto, glosa]);
                        await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto, glosa) VALUES ($1, $2, 0, $3, $4, $5)`, [asientoId, ctaGasto, vale.monto, vale.concepto, glosa]);
                    }
                }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

            }

            return NextResponse.json({ success: true, message: 'Vale guardado correctamente' });
        }
    } catch (error: any) {
        console.error('Error en POST /api/caja-chica:', error);
        return NextResponse.json(
            { error: 'Error al procesar operación de caja chica', details: error.message },
            { status: 500 }
        );
    }
}
