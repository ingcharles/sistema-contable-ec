import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { extractPaginationParams, buildPaginatedResponse } from '@/shared/utils/pagination';
import { ServicioSeguimientoUso, TipoComprobanteEnum, TipoComprobanteSri } from '@/modules/shared/domain/services/ServicioSeguimientoUso';

/**
 * GET /api/facturacion/comprobantes
 * Lista comprobantes electrónicos con filtros
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const pagination = extractPaginationParams(url);
        const tipoComprobante = url.searchParams.get('tipo'); // FACTURA, NOTA_CREDITO, GUIA_REMISION, etc.
        const estado = url.searchParams.get('estado'); // BORRADOR, AUTORIZADO, ANULADO
        const desde = url.searchParams.get('desde');
        const hasta = url.searchParams.get('hasta');

        let whereConditions = ['c.empresa_id = $1'];
        let values: any[] = [context.empresaId];
        let paramIndex = 2;

        if (tipoComprobante) {
            whereConditions.push(`c.tipo_comprobante = $${paramIndex}`);
            values.push(tipoComprobante);
            paramIndex++;
        }

        if (estado) {
            whereConditions.push(`c.estado = $${paramIndex}`);
            values.push(estado);
            paramIndex++;
        }

        if (desde) {
            whereConditions.push(`c.fecha_emision >= $${paramIndex}`);
            values.push(desde);
            paramIndex++;
        }

        if (hasta) {
            whereConditions.push(`c.fecha_emision <= $${paramIndex}`);
            values.push(hasta);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // Contar total
        const countResult = await db.query<{ count: string }>(
            {
                text: `SELECT COUNT(*) FROM facturacion.comprobantes_electronicos c WHERE ${whereClause}`,
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
                        c.id,
                        c.tipo_comprobante AS "tipoComprobante",
                        ci.valor AS "tipoComprobanteNombre",
                        c.secuencial,
                        c.clave_acceso AS "claveAcceso",
                        c.numero_autorizacion AS "numeroAutorizacion",
                        c.fecha_emision AS "fechaEmision",
                        c.fecha_autorizacion AS "fechaAutorizacion",
                        c.cliente_id AS "clienteId",
                        c.cliente_nombre AS "terceroNombre",
                        c.cliente_identificacion AS "terceroRuc",
                        c.subtotal AS "totalSinImpuestos",
                        c.iva AS "totalIVA",
                        c.total_descuento AS "totalDescuento",
                        c.total AS "importeTotal",
                        c.estado,
                        c.ambiente_sri AS "ambienteSri",
                        c.tipo_emision_sri AS "tipoEmisionSri",
                        c.xml_firmado AS "xmlFirmado",
                        c.created_at AS "createdAt",
                        c.updated_at AS "updatedAt",
                        COALESCE((
                            SELECT json_agg(d)
                            FROM (
                                SELECT 
                                    codigo_principal as "codigoPrincipal",
                                    descripcion,
                                    cantidad,
                                    precio_unitario as "precioUnitario",
                                    descuento,
                                    total as "baseImponible",
                                    codigo_iva as "codigoIVA",
                                    total
                                FROM facturacion.comprobantes_detalles
                                WHERE comprobante_id = c.id
                                ORDER BY id
                            ) d
                        ), '[]'::json) AS detalles,
                        (
                            COALESCE(c.mensajes_sri->'pagos', '[]'::jsonb)
                        ) AS pagos
                    FROM facturacion.comprobantes_electronicos c
                    LEFT JOIN configuracion.catalogos_items ci ON ci.catalogo_codigo = 'SRI_TIPO_COMPROBANTE' AND ci.codigo = c.tipo_comprobante::text
                    WHERE ${whereClause}
                    ORDER BY c.fecha_emision DESC, c.secuencial DESC
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
        console.error('Error al listar comprobantes:', error);
        return NextResponse.json(
            { error: 'Error al consultar comprobantes', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/facturacion/comprobantes
 * Crea un comprobante electrónico (Factura, Nota de Crédito, etc.)
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            tipoComprobante,
            fechaEmision,
            clienteId,
            clienteNombre,
            clienteIdentificacion,
            subtotal,
            iva,
            total,
            detalles,
            totalDescuento = 0,
            // Metadatos SRI opcionales (si ya fue procesado)
            secuencial: secuencialManual,
            claveAcceso,
            numeroAutorizacion,
            estado = 'BORRADOR',
            ambienteSri = '1',
            tipoEmisionSri = '1',
        } = body;

        // ===== VALIDACIÓN DE CUOTA DE DOCUMENTOS =====
        // Verificar si el usuario puede emitir este tipo de documento
        const tipoDocMap: Record<string, TipoComprobanteSri> = {
            'FACTURA': TipoComprobanteEnum.FACTURA,
            'NOTA_CREDITO': TipoComprobanteEnum.NOTA_CREDITO,
            'NOTA_DEBITO': TipoComprobanteEnum.NOTA_DEBITO,
            'GUIA_REMISION': TipoComprobanteEnum.GUIA_REMISION
        };

        const tipoDocParaCuota = tipoDocMap[tipoComprobante];
        if (tipoDocParaCuota && context.usuarioId) {
            const verificacionCuota = await ServicioSeguimientoUso.verificarCuota(
                context.usuarioId,
                tipoDocParaCuota
            );

            if (!verificacionCuota.permitido) {
                return NextResponse.json({
                    error: 'Cuota de documentos excedida',
                    mensaje: verificacionCuota.mensaje,
                    detalles: {
                        tipo: tipoDocParaCuota,
                        usado: verificacionCuota.actual,
                        limite: verificacionCuota.limite
                    }
                }, { status: 403 });
            }
        }

        if (!tipoComprobante || !fechaEmision || !clienteId || !total || !detalles) {
            return NextResponse.json(
                { error: 'Campos requeridos: tipoComprobante, fechaEmision, clienteId, total, detalles' },
                { status: 400 }
            );
        }

        // 1. Obtener información del Tercero (Cliente) y validar límite de crédito
        const terceroResult = await db.query(
            {
                text: 'SELECT limite_credito, dias_credito FROM directorio.terceros WHERE id = $1 AND empresa_id = $2',
                values: [clienteId, context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (terceroResult.rows.length === 0) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
        }

        const cliente = terceroResult.rows[0];

        // Validar límite de crédito si es Factura
        if (tipoComprobante === 'FACTURA') {
            const deudaActualResult = await db.query(
                {
                    text: 'SELECT SUM(saldo_pendiente) as total_deuda FROM cartera.cartera_documentos WHERE tercero_id = $1 AND tipo_cartera = $2 AND empresa_id = $3',
                    values: [clienteId, 'CXC', context.empresaId]
                },
                { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
            );

            const totalDeuda = parseFloat(deudaActualResult.rows[0].total_deuda || '0');
            const limiteCredito = parseFloat(cliente.limite_credito || '0');

            if (limiteCredito > 0 && (totalDeuda + total) > limiteCredito) {
                return NextResponse.json({
                    error: 'Excede límite de crédito',
                    details: `Límite: $${limiteCredito}, Deuda actual: $${totalDeuda}, Nueva factura: $${total} `
                }, { status: 400 });
            }
        }

        const result = await db.transaction(async (client) => {
            // 1. Obtener punto de emisión activo
            const puntoActivoResult = await client.query(`
        SELECT * FROM configuracion.fn_obtener_punto_activo_usuario($1, $2)
            `, [context.usuarioId, context.empresaId]);

            if (puntoActivoResult.rows.length === 0) {
                throw new Error('No tienes un punto de emisión activo asignado. Por favor contacta al administrador.');
            }

            const puntoActivo = puntoActivoResult.rows[0];
            let secuencial = secuencialManual;

            // Si no viene secuencial, generar el siguiente
            if (!secuencial) {
                // Obtener siguiente secuencial del punto de emisión
                // Primero intentar obtener de la tabla de secuenciales
                const secuencialConfigResult = await client.query(`
                    SELECT secuencial_actual 
                    FROM configuracion.puntos_emision_secuenciales
                    WHERE punto_emision_id = $1 AND tipo_comprobante = $2
                    FOR UPDATE
            `, [puntoActivo.punto_emision_id, tipoComprobante]);

                let nextSecuencialInt = 1;

                if (secuencialConfigResult.rows.length > 0) {
                    nextSecuencialInt = secuencialConfigResult.rows[0].secuencial_actual;
                } else {
                    // Si no existe registro, crearlo (empezar en 1)
                    await client.query(`
                        INSERT INTO configuracion.puntos_emision_secuenciales
            (punto_emision_id, tipo_comprobante, secuencial_actual, created_by)
        VALUES($1, $2, 1, $3)
            `, [puntoActivo.punto_emision_id, tipoComprobante, context.usuarioId]);
                }

                // Actualizar el secuencial para el siguiente uso (+1)
                await client.query(`
                    INSERT INTO configuracion.puntos_emision_secuenciales(punto_emision_id, tipo_comprobante, secuencial_actual, created_by)
        VALUES($1, $2, $3 + 1, $4)
                    ON CONFLICT(punto_emision_id, tipo_comprobante)
                    DO UPDATE SET secuencial_actual = configuracion.puntos_emision_secuenciales.secuencial_actual + 1, updated_at = NOW()
            `, [puntoActivo.punto_emision_id, tipoComprobante, nextSecuencialInt, context.usuarioId]);

                // Formatear secuencial (9 dígitos)
                secuencial = nextSecuencialInt.toString().padStart(9, '0');
            }

            // --- 0. VALIDACIÓN DE STOCK Y OBTENCIÓN DE DATOS CONTABLES ---
            const detallesConDatos = [];
            for (const d of detalles) {
                const prodResult = await client.query(`
                    SELECT p.*, c.cuenta_inventario, c.cuenta_costo_venta, c.cuenta_venta
                    FROM inventario.productos p
                    LEFT JOIN inventario.categorias_producto c ON p.categoria_id = c.id
                    WHERE p.empresa_id = $1 AND p.codigo_principal = $2
            `, [context.empresaId, d.codigoPrincipal]);

                if (prodResult.rows.length > 0) {
                    const prod = prodResult.rows[0];
                    if (prod.stock_actual < d.cantidad) {
                        throw new Error(`Stock insuficiente para producto ${d.descripcion}.Disponible: ${prod.stock_actual} `);
                    }
                    detallesConDatos.push({ ...d, ...prod });
                } else {
                    detallesConDatos.push({ ...d, graba_iva: true }); // Default para items manuales
                }
            }

            // --- 1. REGISTRO DE CABECERA FACTURA ---
            const comprobanteResult = await client.query(`
                INSERT INTO facturacion.comprobantes_electronicos
            (empresa_id, usuario_id, tipo_comprobante, punto_emision_id, secuencial, fecha_emision,
                cliente_id, cliente_nombre, cliente_identificacion,
                subtotal, total_descuento, iva, total, estado, clave_acceso, numero_autorizacion,
                ambiente_sri, tipo_emision_sri, created_at, updated_at)
        VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
                RETURNING id
            `, [
                context.empresaId, context.usuarioId, tipoComprobante, puntoActivo.punto_emision_id, secuencial, fechaEmision,
                clienteId, clienteNombre, clienteIdentificacion, subtotal, totalDescuento, iva, total,
                estado, claveAcceso, numeroAutorizacion, ambienteSri, tipoEmisionSri
            ]);

            const comprobanteId = comprobanteResult.rows[0].id;

            // --- 2. REGISTRO DE DETALLES Y KARDEX ---
            for (const detalle of detallesConDatos) {
                // Insertar detalle factura
                await client.query(`
                    INSERT INTO facturacion.comprobantes_detalles
            (comprobante_id, codigo_principal, descripcion, cantidad, precio_unitario, descuento, total, codigo_iva)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8)
            `, [comprobanteId, detalle.codigoPrincipal, detalle.descripcion, detalle.cantidad, detalle.precioUnitario, detalle.descuento || 0, detalle.total, detalle.codigoIVA || '2']);

                // Movimiento Kardex y Actualización Stock (Solo si es un producto real)
                if (detalle.id) {
                    await client.query(`
                        INSERT INTO inventario.kardex_movimientos
            (empresa_id, usuario_id, producto_id, bodega_id, tipo, cantidad, costo_unitario,
                stock_anterior, stock_resultante, referencia, fecha)
        VALUES($1, $2, $3, (SELECT id FROM inventario.bodegas WHERE empresa_id = $1 LIMIT 1),
            'SALIDA', $4, $5, $6, $6 - $4, $7, $8)
        `, [context.empresaId, context.usuarioId, detalle.id, detalle.cantidad, detalle.costo_promedio, detalle.stock_actual, secuencial, fechaEmision]);

                    await client.query(`
                        UPDATE inventario.productos SET stock_actual = stock_actual - $1, updated_at = NOW()
                        WHERE id = $2
            `, [detalle.cantidad, detalle.id]);
                }
            }

            // --- 3. REGISTRO EN CARTERA ---
            if (tipoComprobante === 'FACTURA') {
                const fechaVencimiento = new Date(fechaEmision);
                fechaVencimiento.setDate(fechaVencimiento.getDate() + (cliente.dias_credito || 0));

                await client.query(`
                    INSERT INTO cartera.cartera_documentos
            (empresa_id, usuario_id, tipo_cartera, tipo_documento, nro_comprobante,
                tercero_id, tercero_nombre, fecha_emision, fecha_vencimiento,
                monto_total, saldo_pendiente)
        VALUES($1, $2, 'CXC', 'FACTURA', $3, $4, $5, $6, $7, $8, $9)
            `, [context.empresaId, context.usuarioId, secuencial, clienteId, clienteNombre, fechaEmision, fechaVencimiento, total, total]);
            }

            // --- 4. ASIENTO CONTABLE AUTOMÁTICO ---
            const asientoResult = await client.query(`
                INSERT INTO contabilidad.asientos(empresa_id, usuario_id, numero, fecha, glosa, tipo, estado)
        VALUES($1, $2, 'VTA-' || $3, $4, 'VENTA SEGUN FACTURA NRO ' || $3, 'INGRESO', 'MAYORIZADO')
                RETURNING id
            `, [context.empresaId, context.usuarioId, secuencial, fechaEmision]);
            const asientoId = asientoResult.rows[0].id;

            // Linea AR (Cuentas por Cobrar)
            await client.query(`
                INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto)
        VALUES($1, $2, $3, 0, 'REGISTRO DE VENTA CXC')
            `, [asientoId, cliente.cuenta_contable_cxc || '1.1.02.01', total]);

            // Detalle de Ventas, IVA e Inventario/Costo
            for (const d of detallesConDatos) {
                // Linea Venta (Ingreso)
                await client.query(`
                    INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto)
        VALUES($1, $2, 0, $3, 'VENTA PRODUCTO ' || $4)
            `, [asientoId, d.cuenta_venta || '4.1.01.01', d.total - (d.graba_iva ? d.total * 0.12 : 0), d.descripcion]);

                // Linea IVA (Si aplica)
                if (d.graba_iva) {
                    await client.query(`
                        INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto)
        VALUES($1, '2.1.03.01', 0, $2, 'IVA EN VENTAS')
            `, [asientoId, d.total * 0.12]);
                }

                // Linea Costo de Venta e Inventario (Solo si es producto con costo)
                if (d.id && d.cuenta_inventario && d.cuenta_costo_venta) {
                    const costoTotal = d.cantidad * d.costo_promedio;
                    await client.query(`
                        INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto)
        VALUES($1, $2, $3, 0, 'COSTO DE VENTA - ' || $4)
            `, [asientoId, d.cuenta_costo_venta, costoTotal, d.descripcion]);

                    await client.query(`
                        INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto)
        VALUES($1, $2, 0, $3, 'BAJA DE INVENTARIO - ' || $4)
            `, [asientoId, d.cuenta_inventario, costoTotal, d.descripcion]);
                }
            }

            return { comprobanteId, secuencial };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        // Incrementar contador de uso DESPUÉS de creación exitosa
        if (tipoDocParaCuota && context.usuarioId) {
            await ServicioSeguimientoUso.incrementarUso(context.usuarioId, tipoDocParaCuota);
        }

        return NextResponse.json({
            success: true,
            id: result.comprobanteId,
            secuencial: result.secuencial,
            mensaje: 'Comprobante, Cartera, Inventario y Asiento Contable generados exitosamente'
        });
    } catch (error: any) {
        console.error('Error al registrar comprobante:', error);
        return NextResponse.json(
            { error: error.message || 'Error al registrar comprobante', details: error.message },
            { status: 500 }
        );
    }
}

