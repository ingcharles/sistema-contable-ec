import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';
import { SignatureService } from '@/modules/facturacion/domain/services/SignatureService';
import { SriWebService } from '@/modules/facturacion/domain/services/SriWebService';
import { XsdValidator } from '@/modules/facturacion/domain/services/XsdValidator';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';
import { ServicioSeguimientoUso, TipoComprobanteEnum } from '@/modules/shared/domain/services/ServicioSeguimientoUso';

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

        // 1.1 Verificar Cuota
        const verificacionCuota = await ServicioSeguimientoUso.verificarCuota(
            context.usuarioId!,
            TipoComprobanteEnum.FACTURA
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

        const paramsResult = await db.query(
            { text: 'SELECT * FROM configuracion.parametros WHERE empresa_id = $1', values: [context.empresaId] },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );
        const params = paramsResult.rows[0] || {};

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

        ivaCatalogResult.rows.forEach(row => {
            ivaRatesMap[row.codigo] = Number(row.valor_numerico);
            idToCodeMap[row.id] = row.codigo;
        });

        const defaultIvaCode = idToCodeMap[params.iva_catalogo_item_id] || '4'; // Fallback to '4' (15%)

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
            ambienteSri: configSrv.ambiente_sri
        });

        // 3. Inicio de Transacción de Base de Datos
        const result = await db.transaction(async (client) => {
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
            const seqResult = await client.query(`
                SELECT secuencial_actual FROM configuracion.puntos_emision_secuenciales
                WHERE punto_emision_id = $1 AND tipo_comprobante = '01'
                FOR UPDATE
            `, [puntoActivo.punto_emision_id]);

            let nextSeqInt = 1;
            if (seqResult.rows.length > 0) {
                nextSeqInt = seqResult.rows[0].secuencial_actual;
                await client.query(`
                    UPDATE configuracion.puntos_emision_secuenciales
                    SET secuencial_actual = secuencial_actual + 1, updated_at = NOW()
                    WHERE punto_emision_id = $1 AND tipo_comprobante = '01'
                `, [puntoActivo.punto_emision_id]);
            } else {
                await client.query(`
                    INSERT INTO configuracion.puntos_emision_secuenciales(punto_emision_id, tipo_comprobante, secuencial_actual, created_by)
                    VALUES($1, '01', 2, $2)
                `, [puntoActivo.punto_emision_id, context.usuarioId]);
            }

            const secuencialFormateado = nextSeqInt.toString().padStart(9, '0');
            dataSri.infoTributaria.secuencial = secuencialFormateado;
            dataSri.infoTributaria.estab = puntoActivo.codigo_establecimiento;
            dataSri.infoTributaria.ptoEmi = puntoActivo.codigo_punto;

            // 3.2 Validar Stock y Cargar Datos Contables
            const detallesConDatos = [];
            let subtotal = 0;
            let totalIva = 0;
            let totalDescuento = 0;

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
                        throw new Error(`Stock insuficiente para ${d.descripcion}.`);
                    }
                    // Priorizar datos de la UI sobre los de inventario (evita que descripcion null en prod pise la de la UI)
                    detallesConDatos.push({ ...prod, ...d });
                } else {
                    detallesConDatos.push({ ...d, graba_iva: d.codigoIVA === '2' });
                }

                subtotal += Number(d.baseImponible);
                totalIva += Number(d.valorIVA);
                totalDescuento += Number(d.descuento || 0);
            }
            const importeTotal = subtotal + totalIva;

            // 3.3 SRI: Generación, Firma y Envío (DENTRO DEL BLOQUE PERO ANTES DE COMMIT LOCAL)
            // Generar Clave de Acceso con el secuencial real
            const accessKey = XmlGenerator.generateAccessKey(dataSri);
            dataSri.infoTributaria.claveAcceso = accessKey;

            const rawXml = XmlGenerator.generateFacturaXml(dataSri);
            await XsdValidator.validate(rawXml, '01');

            const signedXml = await SignatureService.signXml(rawXml, {
                p12Base64: configSrv.cert_p12_certificado.toString('base64'),
                passwordP12: configSrv.cert_clave_certificado
            });
            await XsdValidator.validate(signedXml, '01');

            // Envío Recepción (Síncrono)
            const recepcionResult = await SriWebService.enviarComprobante(signedXml, configSrv.url_recepcion);

            let estadoSri = 'ERROR';
            let numAutorizacion = null;
            let fechaAutorizacion = null;
            let mensajesSri = [];

            if (recepcionResult.estado === 'RECIBIDA') {
                // Consultar Autorización (Síncrono/Espera corta)
                const autorizacionResult = await SriWebService.autorizarComprobante(accessKey, configSrv.url_autorizacion);
                estadoSri = autorizacionResult.estado; // AUTORIZADO, NO AUTORIZADO, etc.
                numAutorizacion = autorizacionResult.numeroAutorizacion;
                fechaAutorizacion = autorizacionResult.fechaAutorizacion;
                mensajesSri = autorizacionResult.mensajes || [];
            } else {
                estadoSri = recepcionResult.estado;
                mensajesSri = recepcionResult.mensajes || [];
            }

            // 3.4 Persistencia Local (Factura, Detalles, Kardex, Cartera, Asiento)

            const compResult = await client.query(`
                INSERT INTO facturacion.comprobantes_electronicos
                (empresa_id, usuario_id, tipo_comprobante, punto_emision_id, secuencial, fecha_emision,
                cliente_id, cliente_nombre, cliente_identificacion, subtotal, total_descuento, iva, total,
                estado, clave_acceso, numero_autorizacion, fecha_autorizacion, ambiente_sri, xml_firmado, mensajes_sri)
                VALUES ($1, $2, '01', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                RETURNING id
            `, [
                context.empresaId, context.usuarioId, puntoActivo.punto_emision_id, secuencialFormateado, fechaEmision,
                clienteId, clienteNombre, clienteIdentificacion, subtotal, totalDescuento, totalIva, importeTotal,
                estadoSri, accessKey, numAutorizacion, fechaAutorizacion, parseInt(configSrv.ambiente_sri), signedXml, { mensajes: mensajesSri, pagos }
            ]);
            const comprobanteId = compResult.rows[0].id;

            // Detalles y Kardex
            for (const d of detallesConDatos) {
                await client.query(`
                    INSERT INTO facturacion.comprobantes_detalles
                    (comprobante_id, codigo_principal, descripcion, cantidad, precio_unitario, descuento, total, codigo_iva)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8)
                `, [comprobanteId, d.codigoPrincipal, d.descripcion, d.cantidad, d.precioUnitario, d.descuento || 0, d.total, d.codigoIVA || '2']);

                if (d.id) { // Es un producto de inventario
                    const stockAnterior = Number(d.stock_actual || 0);
                    const cantidadSalida = Number(d.cantidad || 0);
                    const stockResultante = stockAnterior - cantidadSalida;

                    await client.query(`
                        INSERT INTO inventario.kardex_movimientos
                        (empresa_id, usuario_id, producto_id, bodega_id, tipo, cantidad, costo_unitario,
                        stock_anterior, stock_resultante, referencia, fecha)
                        VALUES($1, $2, $3, (SELECT id FROM inventario.bodegas WHERE empresa_id = $1 LIMIT 1),
                        'SALIDA', $4, $5, $6, $7, $8, $9)
                    `, [
                        context.empresaId, context.usuarioId, d.id, cantidadSalida,
                        d.costo_promedio, stockAnterior, stockResultante,
                        secuencialFormateado, fechaEmision
                    ]);

                    await client.query(`
                        UPDATE inventario.productos SET stock_actual = stock_actual - $1, updated_at = NOW()
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
            `, [context.empresaId, context.usuarioId, secuencialFormateado, clienteId, clienteNombre, fechaEmision, fechaVencimiento, importeTotal, importeTotal]);

            // Contabilidad (Asiento)
            const asientoResult = await client.query(`
                INSERT INTO contabilidad.asientos(empresa_id, usuario_id, numero, fecha, glosa, tipo, estado)
                VALUES($1, $2, 'VTA-' || $3, $4, 'VENTA SEGÚN FACTURA ' || $3 || ' - ' || $5, 'INGRESO', 'MAYORIZADO')
                RETURNING id
            `, [context.empresaId, context.usuarioId, secuencialFormateado, fechaEmision, clienteNombre]);
            const asientoId = asientoResult.rows[0].id;

            // Linea DB: CXC
            await client.query(`
                INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto)
                VALUES($1, $2, $3, 0, 'CUENTAS POR COBRAR CLIENTES')
            `, [asientoId, params.cuenta_cxc_clientes || '1.1.02.01', importeTotal]);

            // Lineas CR: Ventas e IVA
            for (const d of detallesConDatos) {
                const valorSinIva = d.total - d.valorIVA;
                await client.query(`
                    INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto)
                    VALUES($1, $2, 0, $3, 'VENTA DE ' || $4)
                `, [asientoId, d.cuenta_venta || params.cuenta_ventas || '4.1.01.01', valorSinIva, d.descripcion]);

                if (d.graba_iva) {
                    await client.query(`
                        INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto)
                        VALUES($1, $2, 0, $3, 'IVA EN VENTAS')
                    `, [asientoId, params.cuenta_iva_por_pagar || '2.1.03.01', d.valorIVA]);
                }

                // Costo de Venta e Inventario
                if (d.id && d.cuenta_inventario && d.cuenta_costo_venta) {
                    const costoTotal = d.cantidad * d.costo_promedio;
                    await client.query(`
                        INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto)
                        VALUES($1, $2, $3, 0, 'COSTO DE VENTA - ' || $4)
                    `, [asientoId, d.cuenta_costo_venta, costoTotal, d.descripcion]);

                    await client.query(`
                        INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto)
                        VALUES($1, $2, 0, $3, 'SALIDA DE INVENTARIO - ' || $4)
                    `, [asientoId, d.cuenta_inventario, costoTotal, d.descripcion]);
                }
            }

            return {
                comprobanteId,
                secuencial: secuencialFormateado,
                claveAcceso: accessKey,
                numeroAutorizacion: numAutorizacion,
                estadoSri: estadoSri,
                mensajesSri
            };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        // 4. Incrementar uso de cuota
        await ServicioSeguimientoUso.incrementarUso(context.usuarioId!, TipoComprobanteEnum.FACTURA);

        return NextResponse.json({
            success: true,
            id: result.comprobanteId,
            secuencial: result.secuencial,
            claveAcceso: result.claveAcceso,
            numeroAutorizacion: result.numeroAutorizacion,
            estado: result.estadoSri,
            mensajes: result.mensajesSri
        });

    } catch (error: any) {
        console.error('Error en proceso de venta unificado:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Error interno al procesar la venta'
        }, { status: 500 });
    }
}
