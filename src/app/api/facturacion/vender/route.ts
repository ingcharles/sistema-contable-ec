import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';
import { SignatureService } from '@/modules/facturacion/domain/services/SignatureService';
import { SriWebService } from '@/modules/facturacion/domain/services/SriWebService';
import { XsdValidator } from '@/modules/facturacion/domain/services/XsdValidator';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';
import { ServicioSeguimientoUso } from '@/modules/shared/domain/services/ServicioSeguimientoUso';
import { ParametrosContablesValidator } from '@/modules/contabilidad/application/services/ParametrosContablesValidator';
import { ParametrosRepository } from '@/modules/configuracion/infrastructure/ParametrosRepository';

export const runtime = 'nodejs';

/**
 * POST /api/facturacion/vender
 * Proceso Unificado de Venta: SRI + Base de Datos + Inventario + Contabilidad
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            //ambiente = 'PRUEBAS',
            puntoEmisionId,
            // Datos de la factura (FacturaViewModel)
            fechaEmision,
            clienteId,
            clienteNombre,
            clienteIdentificacion,
            detalles,
            pagos = []
        } = body;

        // 1. Validaciones Previas (Fuera de la transacción para no bloquear)
        const tipoComprobanteId = await ServicioSeguimientoUso.obtenerIdPorCodigo('01');

        // 1.1 Verificar Cuota
        const verificacionCuota = await ServicioSeguimientoUso.verificarCuota(
            context.usuarioId!,
            tipoComprobanteId
        );
        if (!verificacionCuota.permitido) {
            return NextResponse.json({
                error: 'Cuota de documentos excedida',
                mensaje: verificacionCuota.mensaje
            }, { status: 403 });
        }

        // 1.2 Obtener configuración SRI (Certificado y URLs)
        const configResult = await db.query(
            {
                text: `
                    SELECT 
                        sc.cert_p12_certificado, sc.cert_clave_certificado,
                        sa.url_recepcion, sa.url_autorizacion, sa.codigo as ambiente_codigo,
                        sa.valor as ambiente_sri
                    FROM configuracion.sri_certificados sc
                    INNER JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id
                    WHERE sc.empresa_id = $1 AND sc.activo = TRUE
                    LIMIT 1
                `,
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (configResult.rows.length === 0) {
            return NextResponse.json({
                error: `Configuración SRI no encontrada para ambiente.`
            }, { status: 400 });
        }
        const configSrv = configResult.rows[0];

        // 1.3 Obtener datos del Cliente y Parámetros
        const clienteResult = await db.query(
            {
                text: 'SELECT * FROM directorio.terceros WHERE id = $1 AND empresa_id = $2',
                values: [clienteId, context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );
        if (clienteResult.rows.length === 0) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
        }
        const cliente = clienteResult.rows[0];

        const params = await ParametrosRepository.obtenerParametros(context.empresaId!, context.usuarioId!);
        const paramsRow = params; // Compatibility alias

        // 1.4 Validar Parámetros Contables y Cierre de Periodo
        const validacionParams = ParametrosContablesValidator.validarVentas(params);
        if (!validacionParams.valido) {
            return NextResponse.json({ error: validacionParams.error }, { status: 400 });
        }

        const validacionCierre = ParametrosContablesValidator.validarFechaCierre(params, fechaEmision);
        if (!validacionCierre.valido) {
            return NextResponse.json({ error: validacionCierre.error }, { status: 400 });
        }

        // 2. Proceso de Emisión SRI (Preparación XML)
        // Pero espera, necesitamos la razón social de la empresa. Vamos a obtenerla.
        const empresaResult = await db.query(
            { text: 'SELECT razon_social, ruc, direccion, es_obligado_contabilidad, nombre_comercial FROM seguridad.empresas WHERE id = $1', values: [context.empresaId] },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );
        const empresaDoc = empresaResult.rows[0];

        // --- 1.4 Obtener tasas de IVA y default del catálogo ---
        const ivaCatalogResult = await db.query(
            { text: "SELECT id, codigo, valor_numerico FROM configuracion.catalogos_items WHERE catalogo_codigo = 'SRI_TIPO_IMPUESTO_IVA'", values: [] },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );
        const ivaRatesMap: Record<string, number> = {};
        const idToCodeMap: Record<string, string> = {};
        const codeToIdMap: Record<string, string> = {};

        ivaCatalogResult.rows.forEach(row => {
            ivaRatesMap[row.codigo] = Number(row.valor_numerico);
            idToCodeMap[row.id] = row.codigo;
            codeToIdMap[row.codigo] = row.id;
        });

        const defaultIvaCode = idToCodeMap[paramsRow.iva_catalogo_item_id] || '4'; // Fallback to '4' (15%)

        // Re-estandarizar con datos reales de la empresa
        const detallesEnriquecidos = detalles.map((d: any) => ({
            ...d,
            codigoIVA: d.codigoIVA || defaultIvaCode,
            tarifa: d.tarifa ?? ivaRatesMap[d.codigoIVA || defaultIvaCode] ?? 15
        }));

        const dataSri = SriStandardizer.standardizeFactura({
            ...body,
            detalles: detallesEnriquecidos,
            razonSocial: empresaDoc.razon_social,
            nombreComercial: empresaDoc.nombre_comercial,
            ruc: empresaDoc.ruc,
            dirMatriz: empresaDoc.direccion,
            obligadoContabilidad: empresaDoc.es_obligado_contabilidad ? 'SI' : 'NO',
            ambienteSri: configSrv.ambiente_sri,
            tipoEmisionSri: params.sriTipoEmision
        });

        // --- STEP 1: PREPARE AND PERSIST (PENDING STATE) ---
        // Generamos el comprobante y lo guardamos con estado PENDIENTE.
        // Esto asegura que la Clave de Acceso y el Secuencial queden registrados antes de llamar al SRI.

        const persistentData = await db.transaction(async (client) => {
            // 3.1 Obtener Punto de Emisión y Secuencial
            let puntoActivo;
            if (puntoEmisionId) {
                const pResult = await client.query(`
                    SELECT 
                        pe.id as punto_emision_id,
                        s.codigo as codigo_establecimiento,
                        pe.codigo as codigo_punto,
                        pe.nombre as nombre_punto
                    FROM configuracion.puntos_emision pe
                    INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
                    INNER JOIN configuracion.usuarios_puntos_emision upe ON upe.punto_emision_id = pe.id
                    WHERE pe.id = $1 AND upe.usuario_id = $2 AND s.empresa_id = $3 AND upe.activo = true
                `, [puntoEmisionId, context.usuarioId, context.empresaId]);

                if (pResult.rows.length === 0) {
                    throw new Error('El punto de emisión seleccionado no es válido o no está asignado a su usuario.');
                }
                puntoActivo = pResult.rows[0];
            } else {
                const puntoActivoResult = await client.query(`
                    SELECT * FROM configuracion.fn_obtener_punto_activo_usuario($1, $2)
                `, [context.usuarioId, context.empresaId]);

                if (puntoActivoResult.rows.length === 0) {
                    throw new Error('No se encontró un punto de emisión activo para su usuario.');
                }
                puntoActivo = puntoActivoResult.rows[0];
            }

            // Bloquear secuenciales para este punto y tipo
            // Bloquear secuencial para lectura (SIN incrementar todavía - se incrementa solo si SRI recibe exitosamente)
            const seqResult = await client.query(`
                SELECT secuencial_actual FROM configuracion.puntos_emision_secuenciales
                WHERE punto_emision_id = $1 AND tipo_comprobante_id = $2
                FOR UPDATE
            `, [puntoActivo.punto_emision_id, tipoComprobanteId]);

            let nextSeqInt = 1;
            if (seqResult.rows.length > 0) {
                nextSeqInt = seqResult.rows[0].secuencial_actual;
            } else {
                // Crear registro inicial si no existe (sin incrementar aún)
                await client.query(`
                    INSERT INTO configuracion.puntos_emision_secuenciales(punto_emision_id, tipo_comprobante_id, secuencial_actual, created_by)
                    VALUES($1, $2, 1, $3)
                `, [puntoActivo.punto_emision_id, tipoComprobanteId, context.usuarioId]);
            }

            const secuencialFormateado = nextSeqInt.toString().padStart(9, '0');
            dataSri.infoTributaria.secuencial = secuencialFormateado;
            dataSri.infoTributaria.estab = puntoActivo.codigo_establecimiento;
            dataSri.infoTributaria.ptoEmi = puntoActivo.codigo_punto;

            // 3.2 Validar Stock y Calcular Totales
            const detallesConDatos = [];
            let subtotal = 0;
            let totalIva = 0;
            let totalDescuento = 0;

            for (const d of detallesEnriquecidos) {
                const prodResult = await client.query(`
                    SELECT p.*, c.cuenta_inventario, c.cuenta_costo_venta, c.cuenta_venta
                    FROM inventario.productos p
                    LEFT JOIN inventario.categorias_producto c ON p.categoria_id = c.id
                    WHERE p.empresa_id = $1 AND p.codigo_principal = $2
                `, [context.empresaId, d.codigoPrincipal]);

                if (prodResult.rows.length > 0) {
                    const prod = prodResult.rows[0];
                    if (prod.stock_actual < d.cantidad) {
                        throw new Error(`Stock insuficiente para ${d.descripcion}.`);
                    }
                    detallesConDatos.push({ ...prod, ...d });
                } else {
                    detallesConDatos.push({ ...d, graba_iva: d.codigoIVA !== '0' });
                }

                subtotal += Number(d.baseImponible);
                totalIva += Number(d.valorIVA);
                totalDescuento += Number(d.descuento || 0);
            }
            const importeTotal = subtotal + totalIva;

            // 3.3 Generar y Firmar
            const accessKey = XmlGenerator.generateAccessKey(dataSri);
            dataSri.infoTributaria.claveAcceso = accessKey;
            const rawXml = XmlGenerator.generateFacturaXml(dataSri);
            await XsdValidator.validate(rawXml, '01');
            const signedXml = await SignatureService.signXml(rawXml, {
                p12Base64: configSrv.cert_p12_certificado.toString('base64'),
                passwordP12: configSrv.cert_clave_certificado
            });

            // 3.4 Persistencia INICIAL (Pendiente)
            const compResult = await client.query(`
                INSERT INTO facturacion.comprobantes_electronicos
                (empresa_id, usuario_id, tipo_comprobante, punto_emision_id, secuencial, fecha_emision,
                cliente_id, cliente_nombre, cliente_identificacion, subtotal, total_descuento, iva, total,
                estado, clave_acceso, ambiente_sri, xml_firmado, mensajes_sri)
                VALUES ($1, $2, '01', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDIENTE', $13, $14, $15, $16)
                RETURNING id
            `, [
                context.empresaId, context.usuarioId, puntoActivo.punto_emision_id, secuencialFormateado, fechaEmision,
                clienteId, clienteNombre, clienteIdentificacion, subtotal, totalDescuento, totalIva, importeTotal,
                accessKey, parseInt(configSrv.ambiente_sri), signedXml, { mensajes: [], pagos }
            ]);
            const comprobanteId = compResult.rows[0].id;

            // Guardar detalles iniciales
            for (const d of detallesConDatos) {
                await client.query(`
                    INSERT INTO facturacion.comprobantes_detalles
                    (comprobante_id, codigo_principal, descripcion, cantidad, precio_unitario, descuento, total, valor_iva, codigo_iva, tarifa)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `, [comprobanteId, d.codigoPrincipal, d.descripcion, d.cantidad, d.precioUnitario, d.descuento || 0, d.total, d.valorIVA || 0, d.codigoIVA, d.tarifa]);
            }

            return {
                comprobanteId,
                secuencial: secuencialFormateado,
                claveAcceso: accessKey,
                signedXml,
                detallesConDatos,
                importeTotal,
                puntoActivo
            };

        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        // --- STEP 2: SRI INTERACTION (OUTSIDE DB TRANSACTION) ---
        let estadoSri = 'ERROR';
        let numAutorizacion = null;
        let fechaAutorizacion = null;
        let mensajesSri: any[] = [];
        let fueRecibida = false; // Flag para incrementar secuencial según regla SRI

        try {
            const recepcionResult = await SriWebService.enviarComprobante(persistentData.signedXml, configSrv.url_recepcion);

            // 🔄 RECOVERY FLOW: Detectar "CLAVE ACCESO REGISTRADA"
            // Esto ocurre cuando hubo un timeout previo - el SRI ya tiene el comprobante pero nosotros no recibimos la respuesta
            const claveAccesoRegistrada = recepcionResult.mensajes?.some((m: any) =>
                m.identificador === '43' || m.mensaje?.toUpperCase().includes('CLAVE ACCESO REGISTRADA')
            );

            if (recepcionResult.estado === 'RECIBIDA') {
                fueRecibida = true; // ✅ Comprobante RECIBIDO por SRI - secuencial debe incrementarse
                try {
                    // Agregar espera de 3 segundos antes de consultar autorización
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    const autorizacionResult = await SriWebService.autorizarComprobante(persistentData.claveAcceso, configSrv.url_autorizacion);
                    estadoSri = autorizacionResult.estado;
                    numAutorizacion = autorizacionResult.numeroAutorizacion;
                    fechaAutorizacion = autorizacionResult.fechaAutorizacion;
                    mensajesSri = autorizacionResult.mensajes || [];


                } catch (authError: any) {
                    console.error('Error en autorización SRI:', authError);
                    estadoSri = 'ERROR';
                    mensajesSri = [{ tipo: 'ERROR', mensaje: authError.message || 'Error al consultar autorización' }];
                }
            } else if (claveAccesoRegistrada) {
                // 🔄 CLAVE YA REGISTRADA: El SRI ya tiene este comprobante (probablemente por timeout previo)
                // NO reenviar a recepción, consultar directamente autorización
                console.log(`🔄 Recovery Flow: Clave ${persistentData.claveAcceso} ya registrada en SRI, consultando autorización...`);
                fueRecibida = true; // El SRI ya la tiene, considerar como recibida para efectos de secuencial

                try {
                    const autorizacionResult = await SriWebService.autorizarComprobante(persistentData.claveAcceso, configSrv.url_autorizacion);
                    estadoSri = autorizacionResult.estado;
                    numAutorizacion = autorizacionResult.numeroAutorizacion;
                    fechaAutorizacion = autorizacionResult.fechaAutorizacion;
                    mensajesSri = autorizacionResult.mensajes || [];

                    // Agregar nota de recovery al historial
                    mensajesSri.push({
                        tipo: 'INFO',
                        mensaje: 'Recuperado automáticamente - Clave de acceso ya registrada en SRI',
                        informacionAdicional: 'El comprobante fue enviado previamente y recuperado del SRI'
                    });
                } catch (authError: any) {
                    console.error('Error en autorización SRI (recovery flow):', authError);
                    estadoSri = 'ERROR';
                    mensajesSri = [{ tipo: 'ERROR', mensaje: authError.message || 'Error al consultar autorización en recovery' }];
                }


                estadoSri = recepcionResult.estado;
                mensajesSri = recepcionResult.mensajes || [{ tipo: 'ERROR', mensaje: 'Comprobante rechazado en recepción' }];
            }
        } catch (sriError: any) {
            console.error('Error comunicación SRI:', sriError);
            estadoSri = 'ERROR_TECNICO';
            mensajesSri = [{ tipo: 'ERROR', mensaje: sriError.message || 'Error de comunicación con SRI' }];
        }

        // --- STEP 3: FINALIZE STATE & EFFECT (DB TRANSACTION) ---
        // Consolidar TODOS los efectos en una sola transacción atómica
        // Si falla, el comprobante se marca como ERROR_INTERNO para revisión manual
        try {
            await db.transaction(async (client) => {
                // Bloquear el comprobante para evitar condiciones de carrera
                const comprobanteCheck = await client.query(`
                    SELECT id, estado FROM facturacion.comprobantes_electronicos 
                    WHERE id = $1 FOR UPDATE
                `, [persistentData.comprobanteId]);

                if (comprobanteCheck.rows.length === 0) {
                    throw new Error('Comprobante no encontrado - posible inconsistencia en la base de datos');
                }

                // Actualizar estado del comprobante
                await client.query(`
                    UPDATE facturacion.comprobantes_electronicos
                    SET estado = $1, numero_autorizacion = $2, fecha_autorizacion = $3, mensajes_sri = $4, updated_at = NOW()
                    WHERE id = $5
                `, [estadoSri, numAutorizacion, fechaAutorizacion, { mensajes: mensajesSri, pagos }, persistentData.comprobanteId]);

                // INCREMENTAR SECUENCIAL solo si fue RECIBIDA por el SRI (según regla: incrementar únicamente cuando estado RECIBIDA)
                if (fueRecibida) {
                    await client.query(`
                        UPDATE configuracion.puntos_emision_secuenciales
                        SET secuencial_actual = secuencial_actual + 1, updated_at = NOW()
                        WHERE punto_emision_id = $1 AND tipo_comprobante_id = $2
                    `, [persistentData.puntoActivo.punto_emision_id, tipoComprobanteId]);
                }

                // Si fue AUTORIZADO, ejecutar efectos secundarios (Kardex, Cartera, Asiento)
                if (estadoSri === 'AUTORIZADO') {
                    // Kardex Movimientos
                    for (const d of persistentData.detallesConDatos) {
                        if (d.id) {
                            const cantidadSalida = Number(d.cantidad || 0);

                            await client.query(`
                                INSERT INTO inventario.kardex_movimientos
                                (empresa_id, usuario_id, producto_id, bodega_id, tipo, cantidad, costo_unitario,
                                stock_anterior, stock_resultante, referencia, fecha)
                                VALUES($1, $2, $3, (SELECT id FROM inventario.bodegas WHERE empresa_id = $1 LIMIT 1),
                                'SALIDA', $4, $5, (SELECT stock_actual FROM inventario.productos WHERE id = $3), 
                                (SELECT stock_actual FROM inventario.productos WHERE id = $3) - $4, $6, $7)
                            `, [
                                context.empresaId, context.usuarioId, d.id, cantidadSalida,
                                d.costo_promedio, persistentData.secuencial, fechaEmision
                            ]);

                            await client.query(`
                                UPDATE inventario.productos
                                SET stock_actual = stock_actual - $1,
                                    updated_at = NOW()
                                WHERE id = $2
                            `, [d.cantidad, d.id]);
                        }
                    }

                    // Cartera
                    const fechaVencimiento = new Date(fechaEmision);
                    fechaVencimiento.setDate(fechaVencimiento.getDate() + (cliente.dias_credito || 0));
                    await client.query(`
                        INSERT INTO cartera.cartera_documentos
                        (empresa_id, usuario_id, tipo_cartera, tipo_documento, nro_comprobante,
                         tercero_id, tercero_nombre, fecha_emision, fecha_vencimiento, monto_total, saldo_pendiente)
                        VALUES($1, $2, 'CXC', 'FACTURA', $3, $4, $5, $6, $7, $8, $9)
                    `, [context.empresaId, context.usuarioId, persistentData.secuencial, clienteId, clienteNombre, fechaEmision, fechaVencimiento, persistentData.importeTotal, persistentData.importeTotal]);

                    // Asiento Contable
                    const asientoNo = `FAC-${persistentData.puntoActivo.codigo_establecimiento}-${persistentData.puntoActivo.codigo_punto}-${persistentData.secuencial}`;
                    const glosaFactura = `VENTA SEGÚN FACTURA ${persistentData.secuencial} - ${clienteNombre}`;
                    const asientoResult = await client.query(`
                        INSERT INTO contabilidad.asientos(empresa_id, usuario_id, numero, fecha, glosa, tipo, estado)
                        VALUES($1, $2, $3, $4, $5, 'INGRESO', 'MAYORIZADO')
                        RETURNING id
                    `, [context.empresaId, context.usuarioId, asientoNo, fechaEmision, glosaFactura]);
                    const asientoId = asientoResult.rows[0].id;

                    // Asiento Detalles
                    await client.query(`
                        INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto, glosa)
                        VALUES($1, $2, $3, 0, 'CUENTAS POR COBRAR CLIENTES', $4)
                    `, [asientoId, paramsRow.cuenta_cxc_clientes, persistentData.importeTotal, glosaFactura]);

                    for (const d of persistentData.detallesConDatos) {
                        const valorSinIva = d.total - d.valorIVA;
                        await client.query(`
                            INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto, glosa)
                            VALUES($1, $2, 0, $3, 'VENTA DE ' || $4, $5)
                        `, [asientoId, d.cuenta_venta || paramsRow.cuenta_ventas, valorSinIva, d.descripcion, glosaFactura]);

                        if (d.graba_iva) {
                            await client.query(`
                                INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto, glosa)
                                VALUES($1, $2, 0, $3, 'IVA EN VENTAS', $4)
                            `, [asientoId, paramsRow.cuenta_iva_por_pagar, d.valorIVA, glosaFactura]);
                        }

                        if (d.id && d.cuenta_inventario && d.cuenta_costo_venta) {
                            const costoTotal = d.cantidad * d.costo_promedio;
                            const glosaCosto = `COSTO VENTA FACTURA ${persistentData.secuencial} - ${d.descripcion}`;
                            await client.query(`
                                INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto, glosa)
                                VALUES($1, $2, $3, 0, 'COSTO DE VENTA - ' || $4, $5)
                            `, [asientoId, d.cuenta_costo_venta, costoTotal, d.descripcion, glosaCosto]);

                            await client.query(`
                                INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto, glosa)
                                VALUES($1, $2, 0, $3, 'SALIDA DE INVENTARIO - ' || $4, $5)
                            `, [asientoId, d.cuenta_inventario, costoTotal, d.descripcion, glosaCosto]);
                        }
                    }
                }
            }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
        } catch (txError: any) {
            // Si falla la Transaction 2, el comprobante ya está en el SRI
            // Marcamos el comprobante como ERROR_INTERNO para revisión manual
            console.error('Error en Transaction 2 (efectos secundarios):', txError);

            try {
                await db.query({
                    text: `UPDATE facturacion.comprobantes_electronicos 
                           SET estado = 'ERROR', 
                               mensajes_sri = $1,
                               updated_at = NOW()
                           WHERE id = $2`,
                    values: [
                        {
                            mensajes: mensajesSri,
                            error_interno: txError.message,
                            estado_sri_original: estadoSri,
                            requiere_revision: true
                        },
                        persistentData.comprobanteId
                    ]
                }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
            } catch (compensationError) {
                console.error('Error en compensación:', compensationError);
            }

            // Retornar error con información útil para el usuario
            return NextResponse.json({
                success: false,
                id: persistentData.comprobanteId,
                secuencial: persistentData.secuencial,
                claveAcceso: persistentData.claveAcceso,
                estado: 'ERROR_INTERNO',
                estadoSriOriginal: estadoSri,
                error: `Comprobante ${estadoSri} en SRI pero ocurrió un error al guardar efectos secundarios: ${txError.message}`,
                requiereRevision: true
            }, { status: 500 });
        }

        // 4. Incrementar uso de cuota
        await ServicioSeguimientoUso.incrementarUso(context.usuarioId!, tipoComprobanteId);

        return NextResponse.json({
            success: true,
            id: persistentData.comprobanteId,
            secuencial: persistentData.secuencial,
            claveAcceso: persistentData.claveAcceso,
            numeroAutorizacion: numAutorizacion,
            estado: estadoSri,
            mensajes: mensajesSri,
            aviso: estadoSri !== 'AUTORIZADO' ? 'El comprobante fue guardado pero no autorizado por el SRI. Revise los mensajes.' : undefined
        });

    } catch (error: any) {
        console.error('Error en proceso de venta unificado:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Error interno al procesar la venta'
        }, { status: 500 });
    }
}
