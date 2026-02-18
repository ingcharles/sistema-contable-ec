import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { ServicioSeguimientoUso } from '@/modules/shared/domain/services/ServicioSeguimientoUso';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';
import { SignatureService } from '@/modules/facturacion/domain/services/SignatureService';
import { SriWebService } from '@/modules/facturacion/domain/services/SriWebService';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';
import { ParametrosContablesValidator } from '@/modules/contabilidad/application/services/ParametrosContablesValidator';
import { ParametrosRepository } from '@/modules/configuracion/infrastructure/ParametrosRepository';

export const runtime = 'nodejs';

/**
 * POST /api/facturacion/notas-debito/emitir
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const body = await req.json();
        const { puntoEmisionId, fechaEmision, clienteId, motivo, codDocModificado, numDocModificado, fechaEmisionDocSustento, tipoEmision, detalles = [] } = body;

        const configResult = await db.query({
            text: 'SELECT sc.*, sa.url_recepcion, sa.url_autorizacion, sa.valor as ambiente_sri FROM configuracion.sri_certificados sc INNER JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id WHERE sc.empresa_id = $1 AND sc.activo = TRUE LIMIT 1',
            values: [context.empresaId]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
        const configSrv = configResult.rows[0];

        const empresaResult = await db.query({ text: 'SELECT * FROM seguridad.empresas WHERE id = $1', values: [context.empresaId] }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
        const empresaDoc = empresaResult.rows[0];

        const clienteResult = await db.query({ text: 'SELECT * FROM directorio.terceros WHERE id = $1 AND empresa_id = $2', values: [clienteId, context.empresaId] }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
        const cliente = clienteResult.rows[0];

        const params = await ParametrosRepository.obtenerParametros(context.empresaId!, context.usuarioId!);
        const paramsRow = params; // Compatibility alias

        // 1.3 Validar Parámetros y Cierre (Usa validarVentas ya que requiere las mismas cuentas)
        const validacionParams = ParametrosContablesValidator.validarVentas(params);
        if (!validacionParams.valido) {
            return NextResponse.json({ error: validacionParams.error }, { status: 400 });
        }

        const validacionCierre = ParametrosContablesValidator.validarFechaCierre(params, fechaEmision);
        if (!validacionCierre.valido) {
            return NextResponse.json({ error: validacionCierre.error }, { status: 400 });
        }

        // --- 1.4 Obtener tasas de IVA y default del catálogo (Similar a Factura) ---
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

        const detallesEnriquecidos = detalles.map((d: any) => ({
            ...d,
            codigoIVA: d.codigoIVA || defaultIvaCode,
            tarifa: d.tarifa ?? ivaRatesMap[d.codigoIVA || defaultIvaCode] ?? 15
        }));

        // --- STEP 1: PREPARE AND PERSIST (PENDING STATE) ---
        const persistentData = await db.transaction(async (client) => {
            const pResult = await client.query('SELECT pe.*, s.codigo as estab FROM configuracion.puntos_emision pe INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id WHERE pe.id = $1', [puntoEmisionId]);
            const punto = pResult.rows[0];

            // Bloquear secuencial para lectura (SIN incrementar todavía - se incrementa solo si SRI recibe exitosamente)
            const tipoComprobante = await ServicioSeguimientoUso.obtenerConfigComprobante('05');
            const tipoComprobanteId = tipoComprobante.id;
            const seqResult = await client.query("SELECT secuencial_actual FROM configuracion.puntos_emision_secuenciales WHERE punto_emision_id = $1 AND tipo_comprobante_id = $2 FOR UPDATE", [puntoEmisionId, tipoComprobanteId]);
            let nextSeqInt = 1;

            if (seqResult.rows.length > 0) {
                nextSeqInt = seqResult.rows[0].secuencial_actual;
            } else {
                // Crear registro inicial si no existe (sin incrementar aún)
                await client.query("INSERT INTO configuracion.puntos_emision_secuenciales(punto_emision_id, tipo_comprobante_id, secuencial_actual, created_by) VALUES($1, $2, 1, $3)", [puntoEmisionId, tipoComprobanteId, context.usuarioId]);
            }

            const secuencialFormateado = nextSeqInt.toString().padStart(9, '0');

            const subtotal = detalles.reduce((acc: number, d: any) => acc + Number(d.baseImponible), 0);
            const totalDescuento = detalles.reduce((acc: number, d: any) => acc + Number(d.descuento || 0), 0);
            const totalIva = detalles.reduce((acc: number, d: any) => acc + Number(d.valorIVA), 0);
            const valorTotal = subtotal + totalIva;

            // Determinar código y tarifa de IVA dominante para la cabecera
            const detalleRef = detallesEnriquecidos[0] || {};
            const codigoIVA = detalleRef.codigoIVA || defaultIvaCode;
            const tarifa = detalleRef.tarifa ?? 15;

            // Construir pagos (Obligatorio para ND)
            const pagosFinal = (body.pagos && body.pagos.length > 0) ? body.pagos : [{
                formaPago: '20', // OTROS CON UTILIZACION DEL SISTEMA FINANCIERO
                total: valorTotal,
                plazo: 0,
                unidadTiempo: 'DIAS'
            }];

            const dataSri = SriStandardizer.standardizeNotaDebito({
                razonSocial: empresaDoc.razon_social,
                nombreComercial: empresaDoc.nombre_comercial,
                ruc: empresaDoc.ruc,
                estab: punto.estab,
                ptoEmi: punto.codigo,
                secuencial: secuencialFormateado,
                dirMatriz: empresaDoc.direccion,
                fechaEmision,
                obligadoContabilidad: empresaDoc.es_obligado_contabilidad,
                tipoIdentificacionComprador: cliente.tipo_identificacion,
                razonSocialComprador: cliente.razon_social,
                identificacionComprador: cliente.identificacion,
                codDoc: tipoComprobante.codigo,
                codDocModificado,
                numDocModificado,
                fechaEmisionDocSustento,
                totalSinImpuestos: subtotal,
                valorTotal,
                motivo,
                detalles: detallesEnriquecidos,
                ambienteSri: configSrv.ambiente_sri,
                tipoEmisionSri: tipoEmision || params.sriTipoEmision || '1',
                codigoIVA,
                tarifa,
                valorIVA: totalIva,
                pagos: pagosFinal,
                // Construir motivos a partir de los detalles
                motivos: detallesEnriquecidos.map((d: any) => ({
                    razon: d.razonModificacion || d.descripcion || motivo,
                    valor: d.valorModificacion || (d.baseImponible + d.valorIVA)
                }))
            });

            const accessKey = XmlGenerator.generateAccessKey(dataSri);
            dataSri.infoTributaria.claveAcceso = accessKey;

            const rawXml = XmlGenerator.generateNotaDebitoXml(dataSri);
            // Validar XSD si existiera para ND (pendiente implementation)

            const signedXml = await SignatureService.signXml(rawXml, {
                p12Base64: configSrv.cert_p12_certificado.toString('base64'),
                passwordP12: configSrv.cert_clave_certificado
            });

            // 3.4 Persistencia INICIAL (Pendiente)
            const insertResult = await client.query(`
                INSERT INTO facturacion.comprobantes_electronicos 
                (empresa_id, usuario_id, tipo_comprobante_id, punto_emision_id, secuencial, fecha_emision, 
                cliente_id, cliente_nombre, cliente_identificacion, subtotal, total_descuento, iva, total, 
                estado, clave_acceso, ambiente_sri, xml_firmado, mensajes_sri) 
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'PENDIENTE', $14, $15, $16, $17)
                RETURNING id
            `, [context.empresaId, context.usuarioId, tipoComprobanteId, puntoEmisionId, secuencialFormateado, fechaEmision,
                clienteId, cliente.razon_social, cliente.identificacion, subtotal, totalDescuento, totalIva, valorTotal,
                accessKey, parseInt(configSrv.ambiente_sri), signedXml, {
                mensajes: [],
                codDocModificado,
                numDocModificado,
                fechaEmisionDocSustento,
                motivo,
                pagos: pagosFinal
            }]);

            const comprobanteId = insertResult.rows[0].id;

            // Guardar detalles
            for (const d of detallesEnriquecidos) {
                await client.query(`
                    INSERT INTO facturacion.comprobantes_detalles(
                        comprobante_id, 
                        codigo_principal,
                        descripcion, 
                        cantidad,
                        precio_unitario,
                        descuento,
                        total, 
                        valor_iva, 
                        codigo_iva,
                        tarifa
                    )
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `, [
                    comprobanteId,
                    d.codigoPrincipal || 'ND',
                    d.descripcion || d.razonModificacion,
                    d.cantidad || 1,
                    d.precioUnitario || d.valorModificacion,
                    d.descuento || 0,
                    d.valorModificacion, // Total line
                    d.valorIVA,
                    d.codigoIVA,
                    d.tarifa
                ]);
            }

            return {
                comprobanteId,
                secuencial: secuencialFormateado,
                claveAcceso: accessKey,
                signedXml,
                punto,
                detallesEnriquecidos,
                subtotal,
                valorTotal,
                totalIva,
                tipoComprobanteId
            };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        // --- STEP 2: SRI INTERACTION ---
        let estadoSri = 'ERROR';
        let numAutorizacion = null;
        let fechaAutorizacion = null;
        let mensajesSri: any[] = [];
        let fueRecibida = false; // Flag para incrementar secuencial según regla SRI

        try {
            const recepcionResult = await SriWebService.enviarComprobante(persistentData.signedXml, configSrv.url_recepcion);

            // 🔄 RECOVERY FLOW: Detectar "CLAVE ACCESO REGISTRADA"
            const claveAccesoRegistrada = recepcionResult.mensajes?.some((m: any) =>
                m.identificador === '43' || m.mensaje?.toUpperCase().includes('CLAVE ACCESO REGISTRADA')
            );

            if (recepcionResult.estado === 'RECIBIDA') {
                fueRecibida = true;
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
                // 🔄 CLAVE YA REGISTRADA: Consultar directamente autorización
                console.log(`🔄 Recovery Flow ND: Clave ${persistentData.claveAcceso} ya registrada en SRI`);
                fueRecibida = true;

                try {
                    const autorizacionResult = await SriWebService.autorizarComprobante(persistentData.claveAcceso, configSrv.url_autorizacion);
                    estadoSri = autorizacionResult.estado;

                    numAutorizacion = autorizacionResult.numeroAutorizacion;
                    fechaAutorizacion = autorizacionResult.fechaAutorizacion;
                    mensajesSri = autorizacionResult.mensajes || [];
                    mensajesSri.push({ tipo: 'INFO', mensaje: 'Recuperado automáticamente - Clave ya registrada en SRI' });
                } catch (authError: any) {
                    console.error('Error en autorización SRI (recovery):', authError);
                    estadoSri = 'ERROR';
                    mensajesSri = [{ tipo: 'ERROR', mensaje: authError.message || 'Error al consultar autorización en recovery' }];
                }
            } else {
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
                `, [estadoSri, numAutorizacion, fechaAutorizacion, { mensajes: mensajesSri }, persistentData.comprobanteId]);

                // INCREMENTAR SECUENCIAL solo si fue RECIBIDA por el SRI (según regla: incrementar únicamente cuando estado RECIBIDA)
                if (fueRecibida) {
                    const tipoComprobante = await ServicioSeguimientoUso.obtenerConfigComprobante('05');
                    const tipoComprobanteId = tipoComprobante.id;
                    await client.query(`
                        UPDATE configuracion.puntos_emision_secuenciales
                        SET secuencial_actual = secuencial_actual + 1, updated_at = NOW()
                        WHERE punto_emision_id = $1 AND tipo_comprobante_id = $2
                    `, [puntoEmisionId, tipoComprobanteId]);
                }

                if (estadoSri === 'AUTORIZADO') {
                    // Generar Asiento Contable
                    const asientoNo = `ND-${persistentData.punto.estab}-${persistentData.punto.codigo}-${persistentData.secuencial}`;
                    const glosaND = `NOTA DE DÉBITO ${asientoNo} REF FACT ${numDocModificado} - ${cliente.razon_social}`;
                    const asientoResult = await client.query(`
                        INSERT INTO contabilidad.asientos(empresa_id, usuario_id, numero, fecha, glosa, tipo, estado)
                        VALUES($1, $2, $3, $4, $5, 'INGRESO', 'MAYORIZADO')
                        RETURNING id
                    `, [context.empresaId, context.usuarioId, asientoNo, fechaEmision, glosaND]);
                    const asientoId = asientoResult.rows[0].id;

                    // Debe: CXC Clientes
                    await client.query(`
                        INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto, glosa)
                        VALUES($1, $2, $3, 0, 'CXC NOTA DE DÉBITO', $4) 
                    `, [asientoId, paramsRow.cuenta_cxc_clientes || '1.1.02.01', persistentData.valorTotal, glosaND]);

                    // Haber: Ingresos/Otros Ingresos
                    const conceptoIngreso = `INGRESO POR ND: ${motivo}`;
                    await client.query(`
                        INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto, glosa)
                        VALUES($1, $2, 0, $3, $4, $5) 
                    `, [asientoId, paramsRow.cuenta_ventas || '4.1.01.01', persistentData.subtotal, conceptoIngreso, glosaND]);

                    if (persistentData.totalIva > 0) {
                        await client.query(`
                            INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto, glosa)
                            VALUES($1, $2, 0, $3, 'IVA EN VENTAS (ND)', $4) 
                        `, [asientoId, paramsRow.cuenta_iva_por_pagar, persistentData.totalIva, glosaND]);
                    }

                    // Actualizar carteras
                    const fechaVencimiento = new Date(fechaEmision);
                    fechaVencimiento.setDate(fechaVencimiento.getDate() + (cliente.dias_credito || 0));
                    await client.query(`
                        INSERT INTO cartera.cartera_documentos
                        (empresa_id, usuario_id, tipo_cartera, tipo_documento, nro_comprobante,
                         tercero_id, tercero_nombre, fecha_emision, fecha_vencimiento, monto_total, saldo_pendiente)
                        VALUES($1, $2, 'CXC', 'NOTA_DEBITO', $3, $4, $5, $6, $7, $8, $9)
                    `, [context.empresaId, context.usuarioId, persistentData.secuencial, clienteId, cliente.razon_social, fechaEmision, fechaVencimiento, persistentData.valorTotal, persistentData.valorTotal]);
                }
            }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
        } catch (txError: any) {
            // Si falla la Transaction 2, el comprobante ya está en el SRI
            // Marcamos el comprobante como ERROR_INTERNO para revisión manual
            console.error('Error en Transaction 2 (efectos secundarios ND):', txError);

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

        return NextResponse.json({
            success: true,
            id: persistentData.comprobanteId,
            secuencial: persistentData.secuencial,
            claveAcceso: persistentData.claveAcceso,
            numeroAutorizacion: numAutorizacion,
            estado: estadoSri,
            mensajes: mensajesSri
        });

    } catch (error: any) {
        console.error('Error en emisión Nota de Débito:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
