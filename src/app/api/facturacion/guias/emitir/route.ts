import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';
import { SignatureService } from '@/modules/facturacion/domain/services/SignatureService';
import { SriWebService } from '@/modules/facturacion/domain/services/SriWebService';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';

export const runtime = 'nodejs';

/**
 * POST /api/facturacion/guias/emitir
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const body = await req.json();
        const { puntoEmisionId, fechaEmision, transportistaId, destinatarios = [] } = body;

        const configResult = await db.query({
            text: 'SELECT sc.*, sa.url_recepcion, sa.url_autorizacion, sa.valor as ambiente_sri FROM configuracion.sri_certificados sc INNER JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id WHERE sc.empresa_id = $1 AND sc.activo = TRUE LIMIT 1',
            values: [context.empresaId]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
        const configSrv = configResult.rows[0];

        const empresaDoc = (await db.query({ text: 'SELECT * FROM seguridad.empresas WHERE id = $1', values: [context.empresaId] }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! })).rows[0];
        const transportista = (await db.query({ text: 'SELECT * FROM facturacion.transportistas WHERE id = $1', values: [transportistaId] }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! })).rows[0];

        const result = await db.transaction(async (client) => {
            const punto = (await client.query('SELECT pe.*, s.codigo as estab FROM configuracion.puntos_emision pe INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id WHERE pe.id = $1', [puntoEmisionId])).rows[0];

            const seqResult = await client.query("SELECT secuencial_actual FROM configuracion.puntos_emision_secuenciales WHERE punto_emision_id = $1 AND tipo_comprobante = '06' FOR UPDATE", [puntoEmisionId]);
            let nextSeqInt = seqResult.rows.length > 0 ? seqResult.rows[0].secuencial_actual : 1;
            await client.query("INSERT INTO configuracion.puntos_emision_secuenciales(punto_emision_id, tipo_comprobante, secuencial_actual) VALUES($1, '06', 2) ON CONFLICT (punto_emision_id, tipo_comprobante) DO UPDATE SET secuencial_actual = EXCLUDED.secuencial_actual + 1", [puntoEmisionId]);
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
                tipoIdentificacionTransportista: transportista.tipo_identificacion === 'RUC' ? '04' : (transportista.tipo_identificacion === 'CEDULA' ? '05' : '06'),
                rucTransportista: transportista.identificacion,
                obligadoContabilidad: empresaDoc.es_obligado_contabilidad,
                fechaIniTraslado: body.fechaIniTransporte || fechaEmision,
                fechaFinTraslado: body.fechaFinTransporte || fechaEmision,
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
                ambienteSri: configSrv.ambiente_sri
            });

            const accessKey = XmlGenerator.generateAccessKey(dataSri);
            dataSri.infoTributaria.claveAcceso = accessKey;
            const signedXml = await SignatureService.signXml(XmlGenerator.generateGuiaXml(dataSri), {
                p12Base64: configSrv.cert_p12_certificado.toString('base64'),
                passwordP12: configSrv.cert_clave_certificado
            });

            const recepcion = await SriWebService.enviarComprobante(signedXml, configSrv.url_recepcion);
            let estado = recepcion.estado, numAuth = null, fechaAuth = null;
            if (estado === 'RECIBIDA') {
                const auth = await SriWebService.autorizarComprobante(accessKey, configSrv.url_autorizacion);
                estado = auth.estado; numAuth = auth.numeroAutorizacion; fechaAuth = auth.fechaAutorizacion;
            }

            // Registrar en base de datos local
            await client.query(`INSERT INTO facturacion.guias_remision (empresa_id, usuario_id, punto_emision_id, transportista_id, secuencial, fecha_emision, estado, clave_acceso, numero_autorizacion, fecha_autorizacion, xml_firmado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
                [context.empresaId, context.usuarioId, puntoEmisionId, transportistaId, secuencialFormateado, fechaEmision, estado, accessKey, numAuth, fechaAuth, signedXml]);

            return { secuencial: secuencialFormateado, accessKey, estado };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
