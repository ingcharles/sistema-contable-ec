import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

// GET /api/cartera - Obtener documentos pendientes o anticipos
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const tipo = searchParams.get('tipo'); // 'CXC' o 'CXP'
        const action = searchParams.get('action'); // 'documentos' o 'anticipos'
        const terceroId = searchParams.get('terceroId');

        if (!tipo) {
            return NextResponse.json({ error: 'tipo requerido' }, { status: 400 });
        }

        if (action === 'anticipos') {
            // Obtener anticipos disponibles
            let text = `
        SELECT a.id, a.empresa_id as "empresaId", a.tipo, a.tercero_id as "terceroId",
               t.razon_social as "terceroNombre", a.fecha, a.referencia,
               a.monto_original as "montoOriginal", a.monto_usado as "montoUsado",
               a.saldo_disponible as "saldoDisponible", a.estado,
               a.created_at as "createdAt", a.updated_at as "updatedAt"
        FROM cartera.anticipos a
        LEFT JOIN directorio.terceros t ON a.tercero_id = t.id
        WHERE a.empresa_id = $1 AND a.tipo = $2 AND a.saldo_disponible > 0
      `;
            const values: any[] = [context.empresaId, tipo];

            if (terceroId) {
                text += ` AND a.tercero_id = $3`;
                values.push(terceroId);
            }

            text += ` ORDER BY a.fecha DESC`;

            const result = await db.query(
                { text, values },
                { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
            );
            return NextResponse.json(result.rows);
        } else {
            // Obtener documentos pendientes (por defecto)
            const result = await db.query(
                {
                    text: `SELECT d.id, d.empresa_id as "empresaId", d.tipo, d.tercero_id as "terceroId",
                  t.razon_social as "terceroNombre", d.nro_comprobante as "nroComprobante",
                  d.fecha_emision as "fechaEmision", d.fecha_vencimiento as "fechaVencimiento",
                  d.dias_credito as "diasCredito", d.monto_total as "montoTotal",
                  d.total_pagado as "totalPagado", d.saldo_pendiente as "saldoPendiente",
                  CASE
                    WHEN d.fecha_vencimiento < CURRENT_DATE THEN 
                      EXTRACT(DAY FROM CURRENT_DATE - d.fecha_vencimiento)::INTEGER
                    ELSE 
                      -EXTRACT(DAY FROM d.fecha_vencimiento - CURRENT_DATE)::INTEGER
                  END as "diasVencidos",
                  d.created_at as "createdAt", d.updated_at as "updatedAt"
                FROM cartera.documentos_pendientes d
                LEFT JOIN directorio.terceros t ON d.tercero_id = t.id
                WHERE d.empresa_id = $1 AND d.tipo = $2 AND d.saldo_pendiente > 0
                ORDER BY d.fecha_vencimiento ASC`,
                    values: [context.empresaId, tipo]
                },
                { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
            );

            return NextResponse.json(result.rows);
        }
    } catch (error: any) {
        console.error('Error en GET /api/cartera:', error);
        return NextResponse.json(
            { error: 'Error al obtener datos de cartera', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/cartera - Guardar pago o anticipo
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { action } = body;

        if (action === 'pago') {
            // Registrar pago
            const { transaccion } = body;
            if (!transaccion) {
                return NextResponse.json({ error: 'Datos de transacción requeridos' }, { status: 400 });
            }

            await db.transaction(async (client) => {
                // Insertar transacción
                await client.query(
                    `INSERT INTO cartera.transacciones 
           (empresa_id, usuario_id, documento_id, tipo_cartera, forma_pago, valor_efectivo,
            valor_retencion, valor_cruce, anticipo_id, referencia, fecha)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                        context.empresaId,
                        context.usuarioId!,
                        transaccion.documentoId,
                        transaccion.tipoCartera,
                        transaccion.formaPago,
                        transaccion.valorEfectivo || 0,
                        transaccion.valorRetencion || 0,
                        transaccion.valorCruce || 0,
                        transaccion.anticipoId || null,
                        transaccion.referencia || '',
                        transaccion.fecha || new Date().toISOString().split('T')[0]
                    ]
                );

                // Actualizar saldo del documento
                if (transaccion.documentoId) {
                    const totalPago = (transaccion.valorEfectivo || 0) + (transaccion.valorRetencion || 0) + (transaccion.valorCruce || 0);
                    await client.query(
                        `UPDATE cartera.documentos_pendientes 
               SET total_pagado = total_pagado + $1,
                   saldo_pendiente = saldo_pendiente - $1,
                   updated_at = NOW()
               WHERE id = $2 AND empresa_id = $3`,
                        [totalPago, transaccion.documentoId, context.empresaId]
                    );
                }

                // Actualizar anticipo si se usó
                if (transaccion.formaPago === 'CRUCE_ANTICIPO' && transaccion.anticipoId) {
                    await client.query(
                        `UPDATE cartera.anticipos
             SET monto_usado = monto_usado + $1,
                 saldo_disponible = saldo_disponible - $1,
                 estado = CASE 
                   WHEN (saldo_disponible - $1) <= 0.01 THEN 'AGOTADO'
                   ELSE 'DISPONIBLE'
                 END,
                 updated_at = NOW()
             WHERE id = $2 AND empresa_id = $3`,
                        [transaccion.valorCruce, transaccion.anticipoId, context.empresaId]
                    );
                }
            }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

            return NextResponse.json({ success: true, message: 'Pago registrado correctamente' });
        } else if (action === 'anticipo') {
            // Registrar anticipo
            const { anticipo } = body;
            if (!anticipo) {
                return NextResponse.json({ error: 'Datos de anticipo requeridos' }, { status: 400 });
            }

            await db.query(
                {
                    text: `INSERT INTO cartera.anticipos 
                (empresa_id, tipo, tercero_id, fecha, referencia, monto_original, 
                 monto_usado, saldo_disponible, estado)
                VALUES ($1, $2, $3, $4, $5, $6, 0, $6, 'DISPONIBLE')`,
                    values: [
                        context.empresaId,
                        anticipo.tipo,
                        anticipo.terceroId,
                        anticipo.fecha || new Date().toISOString().split('T')[0],
                        anticipo.referencia,
                        anticipo.montoOriginal
                    ]
                },
                { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
            );

            return NextResponse.json({ success: true, message: 'Anticipo registrado correctamente' });
        } else {
            return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Error en POST /api/cartera:', error);
        return NextResponse.json(
            { error: 'Error al procesar operación de cartera', details: error.message },
            { status: 500 }
        );
    }
}
