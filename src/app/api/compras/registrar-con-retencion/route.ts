import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { ServicioSeguimientoUso } from '@/modules/shared/domain/services/ServicioSeguimientoUso';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';
import { SignatureService } from '@/modules/facturacion/domain/services/SignatureService';
import { SriWebService } from '@/modules/facturacion/domain/services/SriWebService';
import { XsdValidator } from '@/modules/facturacion/domain/services/XsdValidator';
import { SecurityAuditService } from '@/shared/services/SecurityAuditService';
import { ParametrosContablesValidator } from '@/modules/contabilidad/application/services/ParametrosContablesValidator';
import { ParametrosRepository } from '@/modules/configuracion/infrastructure/ParametrosRepository';

export const runtime = 'nodejs';


/**
 * POST /api/compras/registrar-con-retencion
 * 
 * Endpoint consolidado que maneja TODA la transacción de compra en un solo bloque atómico:
 * 1. Registra la compra en BD (compras.compras + detalles)
 * 2. Actualiza inventario y kardex
 * 3. Registra asiento contable
 * 4. Si aplica retención: emite al SRI y registra el comprobante
 * 5. Actualiza con datos del SRI (clave acceso, autorización, estado)
 * 
 * IMPORTANTE: El flujo continúa INDEPENDIENTEMENTE del resultado del SRI.
 * Si el SRI falla, se guarda el comprobante con estado ERROR y se registra el mensaje.
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            // Datos de la compra
            proveedorId,
            tipoComprobante,
            secuencial,
            autorizacion,
            fechaEmision,
            fechaRegistro,
            sustento,
            descripcion,
            subtotalIva,
            subtotal0,
            montoIva,
            total,
            ordenCompraId,
            detalles = [],

            // Datos del asiento contable
            centroCostoId,
            numeroAsiento,
            glosaAsiento,
            parametros,

            // Datos de retención electrónica
            aplicaRetencion = false,
            datosRetencion = null, // Si aplica retención, aquí vienen los datos completos para el SRI
            puntoEmisionId = null // ID del punto de emisión para validación de permisos
        } = body;

        // Validaciones básicas
        if (!proveedorId || !secuencial || !fechaEmision) {
            return NextResponse.json(
                { error: 'Campos requeridos: proveedorId, secuencial, fechaEmision' },
                { status: 400 }
            );
        }

        // --- VALIDACIÓN DE PARÁMETROS CONTABLES Y CIERRE DE PERIODO ---
        // Fetch current params from DB just to be sure we have the closing date
        const currentParams = await ParametrosRepository.obtenerParametros(context.empresaId!, context.usuarioId!);

        // Validar cuentas contables (usando los que vienen del body o los de la BD si faltan)
        const validacionParams = ParametrosContablesValidator.validarCompras(parametros || currentParams);
        if (!validacionParams.valido) {
            return NextResponse.json({ error: validacionParams.error }, { status: 400 });
        }

        // Validar Cierre de Periodo
        const validacionCierre = ParametrosContablesValidator.validarFechaCierre(currentParams, fechaEmision);
        if (!validacionCierre.valido) {
            return NextResponse.json({ error: validacionCierre.error }, { status: 400 });
        }

        // Iniciar transacción atómica
        console.log('🔵 [COMPRA] Iniciando transacción para proveedor:', proveedorId, 'secuencial:', secuencial);
        const result = await db.transaction(async (client) => {
            console.log('🔵 [COMPRA] PASO 1: Validando proveedor...');
            // === PASO 1: VALIDAR PROVEEDOR ===
            const tercero = await client.query(
                'SELECT id, razon_social AS "razonSocial", identificacion FROM directorio.terceros WHERE id = $1 AND empresa_id = $2',
                [proveedorId, context.empresaId]
            );

            if (tercero.rows.length === 0) {
                console.error('❌ [COMPRA] Proveedor no encontrado:', proveedorId);
                throw new Error('Proveedor no encontrado');
            }

            const proveedor = tercero.rows[0];
            console.log('✅ [COMPRA] Proveedor encontrado:', proveedor.razonSocial);

            const tipoComprobanteConfig = await ServicioSeguimientoUso.obtenerConfigComprobante(tipoComprobante || '01');
            const tipoComprobanteId = tipoComprobanteConfig.id;

            console.log('🔵 [COMPRA] PASO 2: Verificando duplicados...');
            // === PASO 2: VALIDAR COMPRA DUPLICADA ===
            const existeCompra = await client.query(
                `SELECT id FROM compras.compras 
                 WHERE empresa_id = $1 AND proveedor_id = $2 AND tipo_comprobante_id = $3 AND secuencial = $4 LIMIT 1`,
                [context.empresaId, proveedorId, tipoComprobanteId, secuencial]
            );

            if (existeCompra.rows.length > 0) {
                console.error('❌ [COMPRA] Compra duplicada detectada');
                throw new Error(`Ya existe una compra registrada con el número de comprobante "${secuencial}" para este proveedor.`);
            }
            console.log('✅ [COMPRA] No hay duplicados');

            console.log('🔵 [COMPRA] PASO 3: Registrando compra en BD...');
            // === PASO 3: REGISTRAR COMPRA ===
            const compraResult = await client.query(`
                INSERT INTO compras.compras (
                    empresa_id, usuario_id, proveedor_id, tipo_comprobante_id, 
                    secuencial, autorizacion, fecha_emision, fecha_registro,
                    sustento, descripcion, subtotal_iva, subtotal_0, 
                    monto_iva, total, orden_compra_id, tiene_retencion,
                    estado_retencion, nro_retencion, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
                    $17, $18, NOW()
                )
                RETURNING id
            `, [
                context.empresaId, context.usuarioId, proveedorId,
                tipoComprobanteId, secuencial, autorizacion, fechaEmision, fechaRegistro,
                sustento, descripcion, subtotalIva, subtotal0, montoIva, total,
                ordenCompraId, aplicaRetencion,
                aplicaRetencion ? 'PENDIENTE' : 'N/A',
                null // nro_retencion se actualizará después
            ]);

            const compraId = compraResult.rows[0].id;
            console.log('✅ [COMPRA] Compra registrada con ID:', compraId);

            console.log('🔵 [COMPRA] PASO 4: Procesando detalles e inventario...');
            // === PASO 4: REGISTRAR DETALLES Y ACTUALIZAR INVENTARIO ===
            if (detalles && detalles.length > 0) {
                const bodegaResult = await client.query(
                    'SELECT id FROM inventario.bodegas WHERE empresa_id = $1 ORDER BY created_at ASC LIMIT 1',
                    [context.empresaId]
                );
                const bodega = bodegaResult.rows[0];
                const bodegaId = bodega?.id || null;

                for (const detalle of detalles) {
                    const { productoId, descripcion: desc, cantidad, precioUnitario, subtotal: subDet, porcentajeIva = 0, valorIva = 0, total: totDet } = detalle;

                    // Insertar detalle de compra
                    await client.query(`
                        INSERT INTO compras.compras_detalle (
                            compra_id, producto_id, descripcion, cantidad,
                            precio_unitario, subtotal, porcentaje_iva, valor_iva, total, created_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                    `, [compraId, productoId || null, desc, cantidad, precioUnitario, subDet, porcentajeIva, valorIva, totDet]);

                    // Si es un producto inventariable, actualizar stock y kardex
                    if (productoId && bodegaId) {
                        const prodResult = await client.query(
                            'SELECT stock_actual AS "stockActual", costo_promedio AS "costoPromedio" FROM inventario.productos WHERE id = $1 AND empresa_id = $2',
                            [productoId, context.empresaId]
                        );

                        if (prodResult.rows.length > 0) {
                            const prod = prodResult.rows[0];
                            const stockActual = parseFloat(prod.stockActual);
                            const costoActual = parseFloat(prod.costoPromedio);
                            const nuevoStock = stockActual + cantidad;

                            // Calcular nuevo costo promedio ponderado
                            const costoTotalAnterior = stockActual * costoActual;
                            const costoTotalNuevo = cantidad * precioUnitario;
                            const nuevoCostoPromedio = nuevoStock > 0 ? (costoTotalAnterior + costoTotalNuevo) / nuevoStock : precioUnitario;

                            // Actualizar stock y costo promedio
                            await client.query(
                                'UPDATE inventario.productos SET stock_actual = $1, costo_promedio = $2, updated_at = NOW() WHERE id = $3 AND empresa_id = $4',
                                [nuevoStock, nuevoCostoPromedio, productoId, context.empresaId]
                            );

                            // Registrar movimiento en kardex
                            await client.query(`
                                INSERT INTO inventario.kardex_movimientos 
                                    (empresa_id, usuario_id, producto_id, bodega_id, tipo, cantidad, 
                                     costo_unitario, stock_anterior, stock_resultante, referencia, observaciones, 
                                     fecha, created_at)
                                VALUES 
                                    ($1, $2, $3, $4, 'ENTRADA', $5, $6, $7, $8, $9, $10, $11, NOW())
                            `, [
                                context.empresaId, context.usuarioId, productoId, bodegaId,
                                cantidad, precioUnitario, stockActual, nuevoStock,
                                `COMPRA-${secuencial}`, `Compra a proveedor - Factura ${secuencial}`, fechaEmision
                            ]);
                        }
                    }
                }
            }

            console.log('✅ [COMPRA] Detalles e inventario procesados');

            console.log('🔵 [COMPRA] PASO 5: Actualizando orden de compra...');
            // === PASO 5: MARCAR ORDEN DE COMPRA COMO FACTURADA ===
            if (ordenCompraId) {
                await client.query(
                    'UPDATE compras.ordenes SET estado = $1, updated_at = NOW() WHERE id = $2 AND empresa_id = $3',
                    ['FACTURADA', ordenCompraId, context.empresaId]
                );
            }
            console.log('✅ [COMPRA] Orden actualizada (si aplicaba)');

            console.log('🔵 [COMPRA] PASO 6: Creando asiento contable...');
            // === PASO 6: REGISTRAR ASIENTO CONTABLE ===
            // El centro de costo se asigna a la cabecera del asiento (no a los detalles)
            const asientoResult = await client.query(`
                INSERT INTO contabilidad.asientos (
                    empresa_id, usuario_id, numero, fecha, glosa, tipo, estado, centro_costo_id, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, 'EGRESO', 'MAYORIZADO', $6, NOW(), NOW())
                RETURNING id
            `, [context.empresaId, context.usuarioId, numeroAsiento, fechaEmision, glosaAsiento, centroCostoId || null]);

            const asientoId = asientoResult.rows[0].id;

            // Calcular retenciones para el asiento
            let valorRetRenta = 0;
            let valorRetIva = 0;

            if (aplicaRetencion && datosRetencion?.impuestos) {
                for (const imp of datosRetencion.impuestos) {
                    if (imp.codigo === '1') { // RENTA
                        valorRetRenta += imp.valorRetenido || 0;
                    } else if (imp.codigo === '2') { // IVA
                        valorRetIva += imp.valorRetenido || 0;
                    }
                }
            }

            const totalPagar = total - valorRetRenta - valorRetIva;

            // Insertar detalles del asiento
            const detallesAsiento = [
                {
                    cuentaCodigo: parametros?.cuentaInventario || parametros?.cuentaCompras || '1.1.03.01',
                    debe: subtotalIva + subtotal0,
                    haber: 0,
                    concepto: 'Registro de compra'
                },
                {
                    cuentaCodigo: parametros?.cuentaIvaCompras || '1.1.04.02',
                    debe: montoIva,
                    haber: 0,
                    concepto: 'IVA en compras'
                },
                {
                    cuentaCodigo: parametros?.cuentaCxpProveedores,
                    debe: 0,
                    haber: totalPagar,
                    concepto: 'Cuentas por pagar proveedores'
                }
            ];

            if (valorRetRenta > 0) {
                detallesAsiento.push({
                    cuentaCodigo: parametros?.cuentaRetRentaPorPagar,
                    debe: 0,
                    haber: valorRetRenta,
                    concepto: 'Retención Renta por pagar'
                });
            }

            if (valorRetIva > 0) {
                detallesAsiento.push({
                    cuentaCodigo: parametros?.cuentaRetIvaPorPagar,
                    debe: 0,
                    haber: valorRetIva,
                    concepto: 'Retención IVA por pagar'
                });
            }

            for (const detalle of detallesAsiento.filter(d => d.debe > 0 || d.haber > 0)) {
                await client.query(`
                    INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto, glosa)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [asientoId, detalle.cuentaCodigo, detalle.debe, detalle.haber, detalle.concepto, glosaAsiento]);
            }
            console.log('✅ [COMPRA] Asiento contable creado con ID:', asientoId);

            console.log('🔵 [COMPRA] PASO 7: Registrando en cartera CXP...');
            // === PASO 7: REGISTRAR EN CARTERA ===
            await client.query(`
                INSERT INTO cartera.documentos_pendientes (
                    empresa_id, tipo, tercero_id, nro_comprobante,
                    fecha_emision, fecha_vencimiento, monto_total, saldo_pendiente, created_at
                ) VALUES ($1, 'CXP', $2, $3, $4, $5, $6, $7, NOW())
            `, [context.empresaId, proveedorId, secuencial, fechaEmision, fechaEmision, totalPagar, totalPagar]);
            console.log('✅ [COMPRA] Documento CXP registrado');

            console.log('🔵 [COMPRA] PASO 8: Emisión retención SRI...', aplicaRetencion ? 'SÍ APLICA' : 'NO APLICA');
            // === PASO 8: EMISIÓN DE RETENCIÓN ELECTRÓNICA (SI APLICA) ===
            let respuestaSri: any = {
                success: false,
                estado: 'N/A',
                claveAcceso: null,
                numeroAutorizacion: null,
                fechaAutorizacion: null,
                error: null,
                mensajesSri: []
            };

            let nroRetencionGenerado = null;

            if (aplicaRetencion && datosRetencion) {
                try {
                    console.log('🔵 [SRI] Obteniendo configuración SRI...');
                    // Obtener configuración SRI
                    const ambiente = datosRetencion.ambiente || 'PRUEBAS';
                    const configResult = await client.query(`
                        SELECT 
                            sc.cert_p12_certificado AS "certP12Certificado", 
                            sc.cert_clave_certificado AS "certClaveCertificado",
                            sa.url_recepcion AS "urlRecepcion", 
                            sa.url_autorizacion AS "urlAutorizacion",
                            sa.valor AS "ambienteSri"
                        FROM configuracion.sri_certificados sc
                        INNER JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id
                        WHERE sc.empresa_id = $1 AND sa.codigo = $2 AND sc.activo = TRUE
                        LIMIT 1
                    `, [context.empresaId, ambiente]);

                    if (configResult.rows.length > 0) {
                        const config = configResult.rows[0];
                        const p12Base64 = config.certP12Certificado?.toString('base64');

                        // Asegurar que el ambiente en los datos sea el código numérico del SRI (1 o 2)
                        if (datosRetencion.infoTributaria) {
                            datosRetencion.infoTributaria.ambiente = config.ambienteSri;
                        }

                        // VALIDACIÓN DE SEGURIDAD: Verificar que el usuario tenga permiso para usar este punto de emisión
                        if (puntoEmisionId) {
                            console.log('🔒 [SEGURIDAD] Validando permisos de punto de emisión...');
                            const permisoResult = await client.query(`
                                SELECT id FROM configuracion.usuarios_puntos_emision 
                                WHERE usuario_id = $1 
                                  AND empresa_id = $2 
                                  AND punto_emision_id = $3 
                                  AND activo = TRUE
                            `, [context.usuarioId, context.empresaId, puntoEmisionId]);

                            if (permisoResult.rows.length === 0) {
                                console.error('❌ [SEGURIDAD] Usuario no tiene permiso para usar este punto de emisión');

                                // 🚨 REGISTRAR INTENTO NO AUTORIZADO EN AUDITORÍA
                                await SecurityAuditService.registrarIntentoNoAutorizado({
                                    empresaId: context.empresaId!,
                                    usuarioId: context.usuarioId!,
                                    puntoEmisionId: puntoEmisionId,
                                    accion: 'EMITIR_RETENCION',
                                    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
                                    userAgent: req.headers.get('user-agent') || undefined,
                                    detalles: {
                                        proveedorId,
                                        secuencial,
                                        total,
                                        fechaEmision
                                    }
                                });

                                throw new Error('No tiene permisos para usar este punto de emisión');
                            }
                            console.log('✅ [SEGURIDAD] Permiso validado correctamente');
                        }

                        // Generar clave de acceso y XML
                        const accessKey = XmlGenerator.generateAccessKey(datosRetencion);
                        datosRetencion.infoTributaria.claveAcceso = accessKey;

                        const codDoc = datosRetencion.infoTributaria.codDoc;
                        let rawXml = XmlGenerator.generateRetencionXml(datosRetencion);

                        // Validar XML contra XSD
                        try {
                            await XsdValidator.validate(rawXml, codDoc);
                        } catch (validationError: any) {
                            throw new Error(`Validación XSD falló: ${validationError.message}`);
                        }

                        // Firmar XML
                        const signedXml = await SignatureService.signXml(rawXml, {
                            p12Base64: p12Base64,
                            passwordP12: config.certClaveCertificado
                        });

                        // Validar XML firmado
                        await XsdValidator.validate(signedXml, codDoc);

                        // Enviar al SRI
                        const recepcionResult = await SriWebService.enviarComprobante(signedXml, config.urlRecepcion);

                        if (recepcionResult.estado === 'RECIBIDA') {
                            const autorizacionResult = await SriWebService.autorizarComprobante(accessKey, config.urlAutorizacion);

                            respuestaSri = {
                                success: true,
                                estado: autorizacionResult.estado,
                                claveAcceso: accessKey,
                                numeroAutorizacion: autorizacionResult.numeroAutorizacion,
                                fechaAutorizacion: autorizacionResult.fechaAutorizacion,
                                error: null,
                                mensajesSri: []
                            };

                            nroRetencionGenerado = `${datosRetencion.estab}-${datosRetencion.ptoEmi}-${datosRetencion.secuencial}`;
                        } else {
                            respuestaSri = {
                                success: false,
                                estado: recepcionResult.estado || 'ERROR',
                                claveAcceso: accessKey,
                                numeroAutorizacion: null,
                                fechaAutorizacion: null,
                                error: 'SRI rechazó el comprobante en recepción',
                                mensajesSri: recepcionResult.mensajes || []
                            };
                        }

                        // Extraer secuencial numérico de la retención
                        console.log('🔵 [SRI] datosRetencion completo:', JSON.stringify(datosRetencion, null, 2));


                        // El secuencial está dentro de infoTributaria
                        const secuencialStr = datosRetencion.infoTributaria?.secuencial;
                        const secuencialRetencion = secuencialStr ? parseInt(secuencialStr) : null;



                        console.log('🔵 [SRI] Secuencial retención:', secuencialStr, '→', secuencialRetencion);

                        if (!secuencialRetencion) {
                            throw new Error('No se pudo obtener el secuencial de la retención.');
                        }

                        const retencionConfig = await ServicioSeguimientoUso.obtenerConfigComprobante('07');
                        const retencionId = retencionConfig.id;

                        // Insertar comprobante SIN xml_firmado inicialmente
                        const comprobanteResult = await client.query(`
                            INSERT INTO facturacion.comprobantes_electronicos (
                                empresa_id, usuario_id, tipo_comprobante_id, secuencial,
                                fecha_emision, cliente_id, cliente_nombre, cliente_identificacion,
                                subtotal, iva, total, estado, clave_acceso, numero_autorizacion,
                                fecha_autorizacion, ambiente_sri, tipo_emision_sri, mensajes_sri, created_at, updated_at
                            ) VALUES (
                                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
                            )
                            RETURNING id
                        `, [
                            context.empresaId,
                            context.usuarioId,
                            retencionId,
                            secuencialRetencion,
                            fechaEmision,
                            proveedorId,
                            proveedor.razonSocial,
                            proveedor.identificacion,
                            0, // subtotal (retenciones no tienen subtotal/iva separado)
                            0, // iva
                            valorRetRenta + valorRetIva, // total retenido
                            respuestaSri.estado,
                            respuestaSri.claveAcceso,
                            respuestaSri.numeroAutorizacion,
                            respuestaSri.fechaAutorizacion,
                            ambiente === 'PRODUCCION' ? 2 : 1, // 1=Pruebas, 2=Producción
                            1, // tipo emisión normal (integer)
                            JSON.stringify(respuestaSri.mensajesSri || []) // Guardar mensajes del SRI
                        ]);

                        const comprobanteId = comprobanteResult.rows[0].id;

                        // NUEVO: Guardar detalle de impuestos de retención para re-emisión
                        if (datosRetencion.impuestos && datosRetencion.impuestos.length > 0) {
                            for (const imp of datosRetencion.impuestos) {
                                await client.query(`
                                    INSERT INTO facturacion.retenciones_impuestos (
                                        comprobante_id, codigo, codigo_retencion, base_imponible,
                                        porcentaje_retener, valor_retenido, cod_doc_sustento, num_doc_sustento,
                                        fecha_emision_doc_sustento, cod_sustento, num_aut_doc_sustento,
                                        total_sin_impuestos_doc_sustento, base_imponible_iva_doc_sustento,
                                        importe_total_doc_sustento, pago_loc_ext, forma_pago, iva_doc_sustento
                                    ) VALUES (
                                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
                                    )
                                `, [
                                    comprobanteId, imp.codigo, imp.codigoRetencion, imp.baseImponible,
                                    imp.porcentajeRetener, imp.valorRetenido, imp.codDocSustento, imp.numDocSustento,
                                    imp.fechaEmisionDocSustento, imp.codSustento || '01', imp.numAutDocSustento,
                                    imp.totalSinImpuestosDocSustento || 0, imp.baseImponibleIvaDocSustento || 0,
                                    imp.importeTotalDocSustento || 0, imp.pagoLocExt || '01', imp.formaPago || '20',
                                    imp.ivaDocSustento || 0
                                ]);
                            }
                        }

                        // Actualizar xml_firmado después de recibir respuesta del SRI (autorizado o no)
                        // El XML firmado y las observaciones se guardan siempre que haya respuesta del SRI
                        console.log(`📝 [SRI] Estado: ${respuestaSri.estado} - Guardando XML firmado y observaciones`);
                        await client.query(`
                            UPDATE facturacion.comprobantes_electronicos 
                            SET xml_firmado = $1, updated_at = NOW()
                            WHERE id = $2
                        `, [signedXml, comprobanteId]);

                    } else {
                        respuestaSri.error = `Configuración SRI no encontrada para ambiente ${ambiente}`;
                    }

                } catch (error: any) {
                    console.error('❌ [SRI] Error al emitir retención electrónica:', error);
                    console.error('❌ [SRI] Error message:', error.message);
                    console.error('❌ [SRI] Error code:', error.code);
                    console.error('❌ [SRI] Error stack:', error.stack);
                    respuestaSri = {
                        success: false,
                        estado: 'ERROR',
                        claveAcceso: null,
                        numeroAutorizacion: null,
                        fechaAutorizacion: null,
                        error: error.message || 'Error desconocido al emitir retención',
                        mensajesSri: []
                    };
                }
            }


            console.log('🔵 [COMPRA] PASO 9: Actualizando compra con datos de retención...');
            // === PASO 9: ACTUALIZAR COMPRA CON DATOS DE RETENCIÓN ===
            if (aplicaRetencion) {
                //const estadoMapeado = mapSriEstadoToEnum(respuestaSri.estado);
                await client.query(`
                    UPDATE compras.compras 
                    SET estado_retencion = $1, nro_retencion = $2, updated_at = NOW()
                    WHERE id = $3
                `, [respuestaSri.estado, nroRetencionGenerado, compraId]);
            }


            console.log('✅ [COMPRA] Transacción completada exitosamente. CompraId:', compraId, 'AsientoId:', asientoId);
            return {
                compraId,
                asientoId,
                respuestaSri,
                nroRetencion: nroRetencionGenerado
            };

        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        console.log('🎉 [COMPRA] Transacción DB confirmada. Preparando respuesta...');
        // Respuesta exitosa
        return NextResponse.json({
            success: true,
            id: result.compraId,
            asientoId: result.asientoId,
            nroRetencion: result.nroRetencion,
            retencionSri: result.respuestaSri,
            mensaje: aplicaRetencion
                ? (result.respuestaSri.success
                    ? 'Compra registrada y retención emitida exitosamente'
                    : `Compra registrada. Advertencia en retención: ${result.respuestaSri.error}`)
                : 'Compra registrada exitosamente'
        });

    } catch (error: any) {
        console.error('❌❌❌ [COMPRA] Error en registrar-con-retencion:', error);
        console.error('❌ [COMPRA] Error stack:', error.stack);
        console.error('❌ [COMPRA] Error code:', error.code);
        console.error('❌ [COMPRA] Error detail:', error.detail);

        // Detectar error de compra duplicada
        if (error.message?.includes('Ya existe una compra')) {
            return NextResponse.json(
                { error: 'Compra duplicada', details: error.message },
                { status: 409 }
            );
        }
        console.log("error", error)
        if (error.message?.includes('documentos_pendientes_empresa_id_nro_comprobante_key') ||
            error.code === '23505') {
            return NextResponse.json(
                {
                    error: 'Documento pendiente duplicado con número de comprobante',
                    details: `Ya existe un documento pendiente con el número de comprobante ingresado para esta empresa. Verifique que el número de factura sea correcto.`
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Error al registrar la compra', details: error.message },
            { status: 500 }
        );
    }
}
