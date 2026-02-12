import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { ServicioSeguimientoUso } from '@/modules/shared/domain/services/ServicioSeguimientoUso';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';
import { SignatureService } from '@/modules/facturacion/domain/services/SignatureService';
import { SriWebService } from '@/modules/facturacion/domain/services/SriWebService';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';
import { ParametrosRepository } from '@/modules/configuracion/infrastructure/ParametrosRepository';

export const runtime = 'nodejs';

/**
 * POST /api/compras/liquidaciones/emitir
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const body = await req.json();
        const { puntoEmisionId, fechaEmision, proveedor, detalles = [], pagos = [] } = body;

        const configResult = await db.query({
            text: 'SELECT sc.*, sa.url_recepcion, sa.url_autorizacion, sa.valor as ambiente_sri FROM configuracion.sri_certificados sc INNER JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id WHERE sc.empresa_id = $1 AND sc.activo = TRUE LIMIT 1',
            values: [context.empresaId]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
        const configSrv = configResult.rows[0];

        const empresaDoc = (await db.query({ text: 'SELECT * FROM seguridad.empresas WHERE id = $1', values: [context.empresaId] }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! })).rows[0];
        const params = await ParametrosRepository.obtenerParametros(context.empresaId!, context.usuarioId!);

        // --- STEP 1: PREPARE AND PERSIST (PENDING STATE) ---
        const persistentData = await db.transaction(async (client) => {
            const punto = (await client.query('SELECT pe.*, s.codigo as estab FROM configuracion.puntos_emision pe INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id WHERE pe.id = $1', [puntoEmisionId])).rows[0];
            const tipoComprobanteId = await ServicioSeguimientoUso.obtenerIdPorCodigo('03');
            const secuencialResult = await client.query("SELECT secuencial_actual FROM configuracion.puntos_emision_secuenciales WHERE punto_emision_id = $1 AND tipo_comprobante_id = $2 FOR UPDATE", [puntoEmisionId, tipoComprobanteId]);
            let nextSeqInt = secuencialResult.rows.length > 0 ? secuencialResult.rows[0].secuencial_actual : 1;
            await client.query("INSERT INTO configuracion.puntos_emision_secuenciales(punto_emision_id, tipo_comprobante_id, secuencial_actual) VALUES($1, $2, 2) ON CONFLICT (punto_emision_id, tipo_comprobante_id) DO UPDATE SET secuencial_actual = EXCLUDED.secuencial_actual + 1", [puntoEmisionId, tipoComprobanteId]);
            const secuencialFormateado = nextSeqInt.toString().padStart(9, '0');

            const totalSinImpuestos = detalles.reduce((acc: number, d: any) => acc + (d.baseImponible || d.total), 0);
            const totalIVA = detalles.reduce((acc: number, d: any) => acc + (d.valorIVA || 0), 0);
            const importeTotal = totalSinImpuestos + totalIVA;

            // Pagos por defecto
            const pagosFinal = (pagos && pagos.length > 0) ? pagos : [{
                formaPago: '01', // SIN UTILIZACION DEL SISTEMA FINANCIERO (comun en liquidaciones a personas naturales)
                total: importeTotal,
                plazo: 0,
                unidadTiempo: 'DIAS'
            }];

            const dataSri = SriStandardizer.standardizeLiquidacion({
                ambienteSri: configSrv.ambiente_sri,
                tipoEmisionSri: params?.sriTipoEmision || '1',
                razonSocial: empresaDoc.razon_social,
                nombreComercial: empresaDoc.nombre_comercial,
                ruc: empresaDoc.ruc,
                estab: punto.estab,
                ptoEmi: punto.codigo,
                secuencial: secuencialFormateado,
                dirMatriz: empresaDoc.direccion,
                fechaEmision,
                tipoIdentificacionProveedor: proveedor.tipoIdentificacion,
                razonSocialProveedor: proveedor.nombre,
                identificacionProveedor: proveedor.identificacion,
                direccionProveedor: proveedor.direccion,
                obligadoContabilidad: empresaDoc.es_obligado_contabilidad,
                totalSinImpuestos,
                importeTotal,
                detalles,
                pagos: pagosFinal
            });

            const accessKey = XmlGenerator.generateAccessKey(dataSri);
            dataSri.infoTributaria.claveAcceso = accessKey;

            const rawXml = XmlGenerator.generateLiquidacionXml(dataSri);
            const signedXml = await SignatureService.signXml(rawXml, {
                p12Base64: configSrv.cert_p12_certificado.toString('base64'),
                passwordP12: configSrv.cert_clave_certificado
            });

            // Registro Local de Proveedor si no existe
            const terceroRes = await client.query('SELECT id FROM directorio.terceros WHERE identificacion = $1 AND empresa_id = $2', [proveedor.identificacion, context.empresaId]);
            let proveedorId = terceroRes.rows[0]?.id;

            if (!proveedorId) {
                proveedorId = crypto.randomUUID();
                await client.query(`
                    INSERT INTO directorio.terceros (id, empresa_id, usuario_id, tipo_identificacion, identificacion, razon_social, tipo_tercero) 
                    VALUES ($1,$2,$3,$4,$5,$6,'PROVEEDOR')
                `, [proveedorId, context.empresaId, context.usuarioId, proveedor.tipoIdentificacion, proveedor.identificacion, proveedor.nombre]);
            }

            // 2. Persistencia INICIAL de cabecera
            const compraId = crypto.randomUUID();
            await client.query(`
                INSERT INTO compras.compras 
                (id, empresa_id, usuario_id, proveedor_id, tipo_comprobante_id, secuencial, 
                autorizacion, fecha_emision, fecha_registro, 
                subtotal_iva, subtotal_0, monto_iva, total, 
                estado_retencion, clave_acceso, mensajes_sri, fecha_autorizacion, xml_firmado) 
                VALUES ($1,$2,$3,$4,$5,$6, NULL, $7, CURRENT_DATE, $8, $9, $10, $11, 'PENDIENTE', $12, $13, NULL, $14)
            `, [compraId, context.empresaId, context.usuarioId, proveedorId, tipoComprobanteId, secuencialFormateado,
                fechaEmision,
                totalIVA > 0 ? totalSinImpuestos : 0,
                totalIVA === 0 ? totalSinImpuestos : 0,
                totalIVA, importeTotal,
                accessKey, { mensajes: [], pagos: pagosFinal }, signedXml
            ]);

            // 3. Persistencia de Detalles
            for (const d of detalles) {
                await client.query(`
                    INSERT INTO compras.compras_detalle (
                        id, compra_id, descripcion, cantidad, precio_unitario, total, porcentaje_iva, valor_iva, codigo_iva
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    crypto.randomUUID(), compraId, d.descripcion, d.cantidad,
                    d.precioUnitario || d.precio_unitario, d.total,
                    d.tarifa || d.porcentaje_iva || 0,
                    d.valorIVA || d.valor_iva || 0,
                    d.codigoIVA || d.codigo_iva || '0'
                ]);
            }

            return {
                compraId,
                secuencial: secuencialFormateado,
                claveAcceso: accessKey,
                signedXml,
                punto,
                totalSinImpuestos,
                totalIVA,
                importeTotal,
                providerId: proveedorId,
                proveedorName: proveedor.nombre,
                tipoComprobanteId
            };

        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        // --- STEP 2: SRI INTERACTION ---
        let estadoSri = 'ERROR';
        let numAutorizacion = null;
        let fechaAutorizacion = null;
        let mensajesSri: any[] = [];

        try {
            const recepcionResult = await SriWebService.enviarComprobante(persistentData.signedXml, configSrv.url_recepcion);

            // 🔄 RECOVERY FLOW: Detectar "CLAVE ACCESO REGISTRADA"
            const claveAccesoRegistrada = recepcionResult.mensajes?.some((m: any) =>
                m.identificador === '43' || m.mensaje?.toUpperCase().includes('CLAVE ACCESO REGISTRADA')
            );

            if (recepcionResult.estado === 'RECIBIDA') {
                try {
                    // Agregar espera de 3 segundos antes de consultar autorización
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    const autorizacionResult = await SriWebService.autorizarComprobante(persistentData.claveAcceso, configSrv.url_autorizacion);
                    estadoSri = autorizacionResult.estado;

                    numAutorizacion = autorizacionResult.numeroAutorizacion;
                    fechaAutorizacion = autorizacionResult.fechaAutorizacion;
                    mensajesSri = autorizacionResult.mensajes || [];
                } catch (authError) {
                    console.error('Error en autorización SRI:', authError);
                    estadoSri = 'ERROR';
                    mensajesSri = [{ tipo: 'ERROR', mensaje: 'Error al consultar autorización' }];
                }
            } else if (claveAccesoRegistrada) {
                // 🔄 CLAVE YA REGISTRADA: Consultar directamente autorización
                console.log(`🔄 Recovery Flow LIQ: Clave ${persistentData.claveAcceso} ya registrada en SRI`);

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
                mensajesSri = recepcionResult.mensajes || [];
            }
        } catch (sriError: any) {
            console.error('Error comunicación SRI:', sriError);
            estadoSri = 'ERROR';
            mensajesSri = [{ tipo: 'ERROR', mensaje: sriError.message || 'Error de comunicación' }];
        }

        // --- STEP 3: FINALIZE STATE & EFFECT (DB TRANSACTION) ---
        // Consolidar TODOS los efectos en una sola transacción atómica
        // Si falla, la liquidación se marca como ERROR_INTERNO para revisión manual
        try {
            await db.transaction(async (client) => {
                // Bloquear el registro para evitar condiciones de carrera
                const compraCheck = await client.query(`
                    SELECT id, estado_retencion FROM compras.compras 
                    WHERE id = $1 FOR UPDATE
                `, [persistentData.compraId]);

                if (compraCheck.rows.length === 0) {
                    throw new Error('Liquidación no encontrada - posible inconsistencia en la base de datos');
                }

                await client.query(`
                    UPDATE compras.compras
                    SET estado_retencion = $1, autorizacion = $2, fecha_autorizacion = $3, mensajes_sri = $4, updated_at = NOW()
                    WHERE id = $5
                `, [estadoSri, numAutorizacion, fechaAutorizacion, { mensajes: mensajesSri }, persistentData.compraId]);

                if (estadoSri === 'AUTORIZADO') {
                    // Asiento Contable
                    const asientoId = crypto.randomUUID();
                    const glosaAsiento = 'LIQUIDACIÓN DE COMPRA ' + persistentData.proveedorName + ' - ' + persistentData.secuencial;

                    await client.query(`
                        INSERT INTO contabilidad.asientos(id, empresa_id, usuario_id, numero, fecha, glosa, tipo, estado) 
                        VALUES($1,$2,$3,$4,$5,$6, 'EGRESO', 'MAYORIZADO')
                    `, [asientoId, context.empresaId, context.usuarioId, `LIQ-${persistentData.punto.estab}-${persistentData.punto.codigo}-${persistentData.secuencial}`, fechaEmision, glosaAsiento]);
                    await client.query(`INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto, glosa) VALUES($1,$2,$3,0, 'COMPRA ALIMENTOS/SERVICIOS', $4)`,
                        [asientoId, '5.1.01.01', persistentData.totalSinImpuestos, glosaAsiento]);

                    if (persistentData.totalIVA > 0) {
                        await client.query(`INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto, glosa) VALUES($1,$2,$3,0, 'IVA EN COMPRAS', $4)`,
                            [asientoId, params.cuenta_iva_compras || '1.1.05.01', persistentData.totalIVA, glosaAsiento]);
                    }

                    // Haber: CXP Proveedores
                    await client.query(`INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto, glosa) VALUES($1,$2,0,$3, 'CUENTAS POR PAGAR PROVEEDORES', $4)`,
                        [asientoId, params.cuenta_cxp_proveedores, persistentData.importeTotal, glosaAsiento]);
                }
            }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
        } catch (txError: any) {
            // Si falla la Transaction 2, el comprobante ya está en el SRI
            // Marcamos la liquidación como ERROR_INTERNO para revisión manual
            console.error('Error en Transaction 2 (efectos secundarios LIQ):', txError);

            try {
                await db.query({
                    text: `UPDATE compras.compras 
                           SET estado_retencion = 'ERROR', 
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
                        persistentData.compraId
                    ]
                }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
            } catch (compensationError) {
                console.error('Error en compensación:', compensationError);
            }

            // Retornar error con información útil para el usuario
            return NextResponse.json({
                success: false,
                id: persistentData.compraId,
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
            id: persistentData.compraId,
            secuencial: persistentData.secuencial,
            claveAcceso: persistentData.claveAcceso,
            numeroAutorizacion: numAutorizacion,
            estado: estadoSri,
            mensajes: mensajesSri,
            aviso: estadoSri !== 'AUTORIZADO' ? 'El comprobante fue guardado pero no autorizado por el SRI. Revise los mensajes.' : undefined
        });

    } catch (error: any) {
        console.error("Error en liquidacion:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
