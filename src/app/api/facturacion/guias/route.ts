import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { ServicioSeguimientoUso, TipoComprobanteEnum } from '@/modules/shared/domain/services/ServicioSeguimientoUso';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';

/**
 * GET /api/facturacion/guias
 * Lista guías de remisión
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const estado = url.searchParams.get('estado');
        const desde = url.searchParams.get('desde');
        const hasta = url.searchParams.get('hasta');

        let whereConditions = ['empresa_id = $1', "tipo_comprobante = '06'"];
        let values: any[] = [context.empresaId];
        let paramIndex = 2;

        if (estado) {
            whereConditions.push(`estado = $${paramIndex}`);
            values.push(estado);
            paramIndex++;
        }

        if (desde) {
            whereConditions.push(`fecha_emision >= $${paramIndex}`);
            values.push(desde);
            paramIndex++;
        }

        if (hasta) {
            whereConditions.push(`fecha_emision <= $${paramIndex}`);
            values.push(hasta);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        const result = await db.query(
            {
                text: `
                    SELECT 
                        id, secuencial, clave_acceso, numero_autorizacion,
                        fecha_emision, fecha_autorizacion, cliente_id, cliente_nombre,
                        cliente_identificacion, direccion_partida, direccion_destino,
                        transportista_nombre, placa_vehiculo, estado, created_at
                    FROM facturacion.comprobantes_electronicos
                    WHERE ${whereClause}
                    ORDER BY fecha_emision DESC, secuencial DESC
                    LIMIT 100
                `,
                values
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar guías:', error);
        return NextResponse.json(
            { error: 'Error al consultar guías de remisión', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/facturacion/guias
 * Crea una nueva guía de remisión
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            clienteId,
            clienteNombre,
            clienteIdentificacion,
            fechaEmision,
            direccionPartida,
            direccionDestino,
            transportistaNombre,
            transportistaIdentificacion,
            placaVehiculo,
            puntoEmisionId,
            detalles
        } = body;

        // Validaciones
        if (!clienteId || !fechaEmision || !direccionPartida || !direccionDestino) {
            return NextResponse.json(
                { error: 'Campos requeridos: clienteId, fechaEmision, direccionPartida, direccionDestino' },
                { status: 400 }
            );
        }

        // ===== VALIDACIÓN DE CUOTA DE GUÍAS =====
        if (context.usuarioId) {
            const verificacionCuota = await ServicioSeguimientoUso.verificarCuota(
                context.usuarioId,
                TipoComprobanteEnum.GUIA_REMISION
            );

            if (!verificacionCuota.permitido) {
                return NextResponse.json({
                    error: 'Cuota de guías excedida',
                    mensaje: verificacionCuota.mensaje,
                    detalles: {
                        tipo: TipoComprobanteEnum.GUIA_REMISION,
                        usado: verificacionCuota.actual,
                        limite: verificacionCuota.limite
                    }
                }, { status: 403 });
            }
        }

        // 0. Obtener Datos de la Empresa y Punto de Emisión
        const empresaResult = await db.query(
            {
                text: `
                    SELECT e.ruc, e.razon_social, e.ambiente_sri, e.direccion,
                           s.codigo as estab_code, pe.codigo as pto_emi_code, pes.secuencial_actual
                    FROM seguridad.empresas e
                    LEFT JOIN configuracion.sucursales s ON e.id = s.empresa_id AND s.es_matriz = true
                    LEFT JOIN configuracion.puntos_emision pe ON (pe.id = $2 OR (s.id = pe.sucursal_id AND pe.activo = true))
                    LEFT JOIN configuracion.puntos_emision_secuenciales pes ON pe.id = pes.punto_emision_id AND pes.tipo_comprobante = '06'
                    WHERE e.id = $1
                    ORDER BY pe.id = $2 DESC, pe.created_at ASC
                    LIMIT 1
                `,
                values: [context.empresaId, puntoEmisionId || null]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (empresaResult.rows.length === 0) {
            return NextResponse.json({ error: 'Configuración de empresa o punto de emisión no encontrada' }, { status: 404 });
        }

        const empData = empresaResult.rows[0];
        const nextSecuencialVal = empData.secuencial_actual || 1;
        const secuencial = nextSecuencialVal.toString().padStart(9, '0');
        const estab = empData.estab_code || '001';
        const ptoEmi = empData.pto_emi_code || '001';

        // 1. Generar clave de acceso SRI
        const accessKeyData = {
            infoTributaria: {
                ruc: empData.ruc,
                codDoc: '06',
                ambiente: empData.ambiente_sri || '1',
                estab,
                ptoEmi,
                secuencial,
                tipoEmision: '1'
            },
            infoGuiaRemision: {
                fechaEmision // Requerido por XmlGenerator.generateAccessKey con el fix realizado
            }
        };
        const claveAcceso = XmlGenerator.generateAccessKey(accessKeyData);

        const id = crypto.randomUUID();

        await db.transaction(async (client) => {
            // A. Insertar cabecera
            await client.query(
                {
                    text: `
                        INSERT INTO facturacion.comprobantes_electronicos (
                            id, empresa_id, tipo_comprobante, secuencial, clave_acceso,
                            fecha_emision, cliente_id, cliente_nombre, cliente_identificacion,
                            direccion_partida, direccion_destino, transportista_nombre,
                            transportista_identificacion, placa_vehiculo, estado,
                            created_at, updated_at, created_by, subtotal, total
                        ) VALUES (
                            $1, $2, '06', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                            'BORRADOR', NOW(), NOW(), $14, 0, 0
                        )
                    `,
                    values: [
                        id, context.empresaId, nextSecuencialVal, claveAcceso, fechaEmision,
                        clienteId, clienteNombre, clienteIdentificacion, direccionPartida, direccionDestino,
                        transportistaNombre || '', transportistaIdentificacion || '', placaVehiculo || '',
                        context.usuarioId
                    ]
                }
            );

            // B. Guardar detalles
            if (detalles && detalles.length > 0) {
                for (const d of detalles) {
                    await client.query(`
                        INSERT INTO facturacion.comprobantes_detalles (
                            comprobante_id, codigo_principal, descripcion, cantidad, precio_unitario, total
                        ) VALUES ($1, $2, $3, $4, 0, 0)
                    `, [id, d.codigoInterno || d.codigoPrincipal || 'S/N', d.descripcion, d.cantidad]);
                }
            }

            // C. Actualizar secuencial
            await client.query(`
                INSERT INTO configuracion.puntos_emision_secuenciales (punto_emision_id, tipo_comprobante, secuencial_actual)
                VALUES (
                    (SELECT id FROM configuracion.puntos_emision pe 
                     JOIN configuracion.sucursales s ON pe.sucursal_id = s.id 
                     WHERE s.empresa_id = $1 AND s.es_matriz = true AND pe.codigo = $2 LIMIT 1),
                    '06', $3 + 1
                )
                ON CONFLICT (punto_emision_id, tipo_comprobante) 
                DO UPDATE SET secuencial_actual = EXCLUDED.secuencial_actual
            `, [context.empresaId, ptoEmi, nextSecuencialVal]);

        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });


        // Incrementar contador de uso
        if (context.usuarioId) {
            await ServicioSeguimientoUso.incrementarUso(context.usuarioId, TipoComprobanteEnum.GUIA_REMISION);
        }

        return NextResponse.json({
            success: true,
            id,
            secuencial,
            claveAcceso,
            message: 'Guía de remisión creada exitosamente'
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error al crear guía de remisión:', error);
        return NextResponse.json(
            { error: 'Error al crear guía de remisión', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/facturacion/guias
 * Actualiza el estado y datos de autorización de una guía
 */
export async function PUT(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, estado, numeroAutorizacion, fechaAutorizacion, claveAcceso } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
        }

        const updates: string[] = [];
        const values: any[] = [id, context.empresaId];
        let paramIndex = 3;

        if (estado) {
            updates.push(`estado = $${paramIndex}`);
            values.push(estado);
            paramIndex++;
        }

        if (numeroAutorizacion) {
            updates.push(`numero_autorizacion = $${paramIndex}`);
            values.push(numeroAutorizacion);
            paramIndex++;
        }

        if (fechaAutorizacion) {
            updates.push(`fecha_autorizacion = $${paramIndex}`);
            values.push(fechaAutorizacion);
            paramIndex++;
        }

        // Si cambia la clave de acceso (por regeneración en emisión)
        if (claveAcceso) {
            updates.push(`clave_acceso = $${paramIndex}`);
            values.push(claveAcceso);
            paramIndex++;
        }

        updates.push(`updated_at = NOW()`);
        updates.push(`updated_by = $${paramIndex}`);
        values.push(context.usuarioId);

        const query = `
            UPDATE facturacion.comprobantes_electronicos
            SET ${updates.join(', ')}
            WHERE id = $1 AND empresa_id = $2
            RETURNING id
        `;

        const result = await db.query(
            { text: query, values },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Guía no encontrada' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Guía actualizada exitosamente'
        });

    } catch (error: any) {
        console.error('Error al actualizar guía:', error);
        return NextResponse.json(
            { error: 'Error al actualizar guía', details: error.message },
            { status: 500 }
        );
    }
}
