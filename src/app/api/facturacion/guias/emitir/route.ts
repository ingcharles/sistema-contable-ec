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
 * POST /api/facturacion/guias/emitir
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const body = await req.json();
        const { puntoEmisionId, fechaEmision, transportistaId, destinatarios = [], clienteId } = body;

        const configResult = await db.query({
            text: 'SELECT sc.*, sa.url_recepcion, sa.url_autorizacion, sa.valor as ambiente_sri FROM configuracion.sri_certificados sc INNER JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id WHERE sc.empresa_id = $1 AND sc.activo = TRUE LIMIT 1',
            values: [context.empresaId]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
        const configSrv = configResult.rows[0];

        const empresaDoc = (await db.query({ text: 'SELECT * FROM seguridad.empresas WHERE id = $1', values: [context.empresaId] }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! })).rows[0];
        const transportista = (await db.query({ text: 'SELECT * FROM facturacion.transportistas WHERE id = $1', values: [transportistaId] }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! })).rows[0];
        const params = await ParametrosRepository.obtenerParametros(context.empresaId!, context.usuarioId!);

        // Buscar Cliente (Prioridad: ID enviado -> Destinatario 1 -> Consumidor Final)
        let cliente: any = null;
        if (clienteId) {
            const cRes = await db.query({ text: "SELECT * FROM directorio.terceros WHERE id = $1", values: [clienteId] }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
            cliente = cRes.rows[0];
        } else if (destinatarios.length > 0) {
            // Intentar buscar por identificación del primer destinatario
            const ident = destinatarios[0].identificacion;
            const cRes = await db.query({ text: "SELECT * FROM directorio.terceros WHERE identificacion = $1 AND empresa_id = $2", values: [ident, context.empresaId] }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
            cliente = cRes.rows[0];
        }

        if (!cliente) {
            // Fallback a Consumidor Final
            const cRes = await db.query({ text: "SELECT * FROM directorio.terceros WHERE identificacion = '9999999999999' AND empresa_id = $1", values: [context.empresaId] }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
            cliente = cRes.rows[0];
        }

        if (!cliente) return NextResponse.json({ error: 'No se pudo identificar el cliente para la guía' }, { status: 400 });

        const result = await db.transaction(async (clientDb) => {
            const punto = (await clientDb.query('SELECT pe.*, s.codigo as estab FROM configuracion.puntos_emision pe INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id WHERE pe.id = $1', [puntoEmisionId])).rows[0];

            // 1. Obtener secuencial (bloqueo)
            const tipoComprobanteId = await ServicioSeguimientoUso.obtenerIdPorCodigo('06');
            const seqResult = await clientDb.query("SELECT secuencial_actual FROM configuracion.puntos_emision_secuenciales WHERE punto_emision_id = $1 AND tipo_comprobante_id = $2 FOR UPDATE", [puntoEmisionId, tipoComprobanteId]);
            let nextSeqInt = seqResult.rows.length > 0 ? seqResult.rows[0].secuencial_actual : 1;

            // Incrementamos luego de éxito en recepción, pero por ahora seguimos el patrón optimista o corregido
            // NOTA: En el patrón 2-phase commit ideal, se incrementa SOLO si SRI recibe. 
            // Aquí incrementamos para reservar el número.
            await clientDb.query("INSERT INTO configuracion.puntos_emision_secuenciales(punto_emision_id, tipo_comprobante_id, secuencial_actual) VALUES($1, $2, 2) ON CONFLICT (punto_emision_id, tipo_comprobante_id) DO UPDATE SET secuencial_actual = EXCLUDED.secuencial_actual + 1", [puntoEmisionId, tipoComprobanteId]);
            const secuencialFormateado = nextSeqInt.toString().padStart(9, '0');

            const dataSri = SriStandardizer.standardizeGuia({
                razonSocial: empresaDoc.razon_social,
                nombreComercial: empresaDoc.nombre_comercial,
                ruc: empresaDoc.ruc,
                estab: punto.estab,
                ptoEmi: punto.codigo,
                secuencial: secuencialFormateado,
                dirMatriz: empresaDoc.direccion,
                dirEstablecimiento: empresaDoc.direccion,
                dirPartida: body.dirPartida || empresaDoc.direccion,
                razonSocialTransportista: transportista.razon_social || transportista.nombre,
                tipoIdentificacionTransportista: transportista.identificacion.length === 13 ? '04' : '05', // RUC=04, CEDULA=05 (Simplificado)
                rucTransportista: transportista.identificacion,
                obligadoContabilidad: empresaDoc.es_obligado_contabilidad,
                fechaEmision: fechaEmision,
                fechaIniTransporte: body.fechaInicio || fechaEmision,
                fechaFinTransporte: body.fechaFin || fechaEmision,
                placa: transportista.placa || 'T-000',
                destinatarios: destinatarios.map((d: any) => ({
                    identificacionDestinatario: d.identificacion,
                    razonSocialDestinatario: d.nombre,
                    dirDestinatario: d.direccion,
                    motivoTraslado: d.motivo || 'VENTA',
                    codDocSustento: d.codDocSustento || '01',
                    numDocSustento: d.numDocSustento,
                    fechaEmisionDocSustento: d.fechaEmisionDocSustento,
                    detalles: d.detalles.map((det: any) => ({
                        codigoInterno: det.codigoPrincipal,
                        descripcion: det.descripcion,
                        cantidad: det.cantidad
                    }))
                })),
                ambienteSri: configSrv.ambiente_sri,
                tipoEmisionSri: params?.sriTipoEmision || '1'
            });

            const accessKey = XmlGenerator.generateAccessKey(dataSri);
            dataSri.infoTributaria.claveAcceso = accessKey;

            const rawXml = XmlGenerator.generateGuiaXml(dataSri);
            const signedXml = await SignatureService.signXml(rawXml, {
                p12Base64: configSrv.cert_p12_certificado.toString('base64'),
                passwordP12: configSrv.cert_clave_certificado
            });

            // 2. Insertar en BD (Estado PENDIENTE)
            const insertRes = await clientDb.query(`
                INSERT INTO facturacion.comprobantes_electronicos (
                    empresa_id, usuario_id, tipo_comprobante_id, punto_emision_id, secuencial, fecha_emision,
                    cliente_id, cliente_nombre, cliente_identificacion, 
                    subtotal, total_descuento, iva, total,
                    estado, clave_acceso, ambiente_sri, xml_firmado, mensajes_sri,
                    direccion_partida, direccion_destino, transportista_nombre, placa_vehiculo
                ) VALUES ($1,$2,$3,$4,$5,$6, $7,$8,$9, 0,0,0,0, 'PENDIENTE', $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING id
            `, [
                context.empresaId, context.usuarioId, tipoComprobanteId, puntoEmisionId, secuencialFormateado, fechaEmision,
                cliente.id, cliente.razon_social, cliente.identificacion,
                accessKey, parseInt(configSrv.ambiente_sri), signedXml, { mensajes: [] },
                body.dirPartida || empresaDoc.direccion, destinatarios[0]?.direccion || '', transportista.razon_social, transportista.placa
            ]);
            const comprobanteId = insertRes.rows[0].id;

            // 3. Insertar Destinatarios y Detalles
            for (const dest of destinatarios) {
                const destRes = await clientDb.query(`
                    INSERT INTO facturacion.guias_destinatarios (
                        comprobante_id, identificacion, razon_social, direccion, 
                        motivo_traslado, cod_doc_sustento, num_doc_sustento, fecha_doc_sustento
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
                `, [
                    comprobanteId, dest.identificacion, dest.nombre, dest.direccion,
                    dest.motivo, dest.codDocSustento || '01', dest.numDocSustento, dest.fechaEmisionDocSustento
                ]);
                const destinId = destRes.rows[0].id;

                for (const det of dest.detalles) {
                    await clientDb.query(`
                        INSERT INTO facturacion.guias_destinatarios_detalles (
                            destinatario_id, codigo_interno, descripcion, cantidad
                        ) VALUES ($1, $2, $3, $4)
                    `, [destinId, det.codigoPrincipal, det.descripcion, det.cantidad]);
                }
            }

            // 4. Enviar a SRI
            let estado = 'ERROR';
            let numAuth = null;
            let fechaAuth = null;
            let mensajes: any[] = [];

            try {
                const recepcion = await SriWebService.enviarComprobante(signedXml, configSrv.url_recepcion);
                estado = recepcion.estado;
                mensajes = recepcion.mensajes || [];

                const claveAccesoRegistrada = mensajes.some((m: any) =>
                    m.identificador === '43' || m.mensaje?.toUpperCase().includes('CLAVE ACCESO REGISTRADA')
                );

                if (estado === 'RECIBIDA' || claveAccesoRegistrada) {
                    try {
                        // Agregar espera de 3 segundos antes de consultar autorización
                        await new Promise(resolve => setTimeout(resolve, 3000));

                        const auth = await SriWebService.autorizarComprobante(accessKey, configSrv.url_autorizacion);
                        estado = auth.estado;

                        if (estado === 'EN PROCESAMIENTO' || estado === 'EN PROCESO') {
                            estado = 'EN_PROCESAMIENTO';
                        }

                        numAuth = auth.numeroAutorizacion;
                        fechaAuth = auth.fechaAutorizacion;
                        mensajes = auth.mensajes || [];

                        if (claveAccesoRegistrada) {
                            mensajes.push({ tipo: 'INFO', mensaje: 'Recuperado automáticamente - Clave ya registrada' });
                        }
                    } catch (authError: any) {
                        console.error('Error en autorización SRI:', authError);
                        estado = 'ERROR'; // O mantener RECIBIDA si se prefiere
                        mensajes.push({ tipo: 'ERROR', mensaje: authError.message || 'Error al autorizar' });
                    }
                } else {
                    // Estado DEVUELTA, RECHAZADA, etc
                    // Verificar si es mensaje de "EN PROCESAMIENTO" (Code 70)
                    const enProcesamiento = mensajes.some((m: any) =>
                        m.identificador === '70' || m.mensaje?.toUpperCase().includes('PROCESAMIENTO')
                    );

                    if (enProcesamiento) {
                        estado = 'EN_PROCESAMIENTO';
                    } else if (estado === 'DEVUELTA') {
                        // Mantener estado DEVUELTA
                    } else {
                        // Otros estados de error
                    }
                }
            } catch (sriError: any) {
                console.error('Error comunicación SRI:', sriError);
                estado = 'ERROR';
                mensajes.push({ tipo: 'ERROR', mensaje: sriError.message || 'Error de comunicación SRI' });
            }

            // 5. Actualizar Estado
            await clientDb.query(`
                UPDATE facturacion.comprobantes_electronicos
                SET estado = $1, numero_autorizacion = $2, fecha_autorizacion = $3, mensajes_sri = $4
                WHERE id = $5
            `, [
                estado,
                numAuth,
                fechaAuth,
                JSON.stringify({ mensajes }),
                comprobanteId
            ]);

            return { secuencial: secuencialFormateado, accessKey, estado };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        console.error('Error emitir guia:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
