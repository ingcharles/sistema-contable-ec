import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';
import { SignatureService } from '@/modules/facturacion/domain/services/SignatureService';
import { SriWebService } from '@/modules/facturacion/domain/services/SriWebService';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';

export const runtime = 'nodejs';

/**
 * POST /api/facturacion/notas-debito/emitir
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const body = await req.json();
        const { puntoEmisionId, fechaEmision, clienteId, motivo, codDocModificado, numDocModificado, fechaEmisionDocSustento, detalles = [] } = body;

        const configResult = await db.query({
            text: 'SELECT sc.*, sa.url_recepcion, sa.url_autorizacion, sa.valor as ambiente_sri FROM configuracion.sri_certificados sc INNER JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id WHERE sc.empresa_id = $1 AND sc.activo = TRUE LIMIT 1',
            values: [context.empresaId]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
        const configSrv = configResult.rows[0];

        const empresaResult = await db.query({ text: 'SELECT * FROM seguridad.empresas WHERE id = $1', values: [context.empresaId] }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
        const empresaDoc = empresaResult.rows[0];

        const clienteResult = await db.query({ text: 'SELECT * FROM directorio.terceros WHERE id = $1 AND empresa_id = $2', values: [clienteId, context.empresaId] }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
        const cliente = clienteResult.rows[0];

        const paramsResult = await db.query({ text: 'SELECT * FROM configuracion.parametros WHERE empresa_id = $1', values: [context.empresaId] }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
        const params = paramsResult.rows[0];

        const result = await db.transaction(async (client) => {
            const pResult = await client.query('SELECT pe.*, s.codigo as estab FROM configuracion.puntos_emision pe INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id WHERE pe.id = $1', [puntoEmisionId]);
            const punto = pResult.rows[0];

            const seqResult = await client.query("SELECT secuencial_actual FROM configuracion.puntos_emision_secuenciales WHERE punto_emision_id = $1 AND tipo_comprobante = '05' FOR UPDATE", [puntoEmisionId]);
            let nextSeqInt = seqResult.rows.length > 0 ? seqResult.rows[0].secuencial_actual : 1;
            await client.query("INSERT INTO configuracion.puntos_emision_secuenciales(punto_emision_id, tipo_comprobante, secuencial_actual) VALUES($1, '05', 2) ON CONFLICT (punto_emision_id, tipo_comprobante) DO UPDATE SET secuencial_actual = EXCLUDED.secuencial_actual + 1", [puntoEmisionId]);
            const secuencialFormateado = nextSeqInt.toString().padStart(9, '0');

            const subtotal = detalles.reduce((acc: number, d: any) => acc + Number(d.baseImponible), 0);
            const totalIva = detalles.reduce((acc: number, d: any) => acc + Number(d.valorIVA), 0);
            const valorTotal = subtotal + totalIva;

            const dataSri = SriStandardizer.standardizeNotaDebito({
                razonSocial: empresaDoc.razon_social,
                ruc: empresaDoc.ruc,
                estab: punto.estab,
                ptoEmi: punto.codigo,
                secuencial: secuencialFormateado,
                dirMatriz: empresaDoc.direccion,
                fechaEmision,
                tipoIdentificacionComprador: cliente.tipo_identificacion === 'CEDULA' ? '05' : '04',
                razonSocialComprador: cliente.razon_social,
                identificacionComprador: cliente.identificacion,
                codDocModificado,
                numDocModificado,
                fechaEmisionDocSustento,
                totalSinImpuestos: subtotal,
                valorTotal,
                motivo,
                detalles,
                ambienteSri: configSrv.ambiente_sri
            });

            const accessKey = XmlGenerator.generateAccessKey(dataSri);
            dataSri.infoTributaria.claveAcceso = accessKey;
            const signedXml = await SignatureService.signXml(XmlGenerator.generateNotaDebitoXml(dataSri), {
                p12Base64: configSrv.cert_p12_certificado.toString('base64'),
                passwordP12: configSrv.cert_clave_certificado
            });

            const recepcion = await SriWebService.enviarComprobante(signedXml, configSrv.url_recepcion);
            let estado = recepcion.estado, numAuth = null, fechaAuth = null;
            if (estado === 'RECIBIDA') {
                const auth = await SriWebService.autorizarComprobante(accessKey, configSrv.url_autorizacion);
                estado = auth.estado; numAuth = auth.numeroAutorizacion; fechaAuth = auth.fechaAutorizacion;
            }

            await client.query(`INSERT INTO facturacion.comprobantes_electronicos (empresa_id, usuario_id, tipo_comprobante, punto_emision_id, secuencial, fecha_emision, cliente_id, cliente_nombre, cliente_identificacion, subtotal, iva, total, estado, clave_acceso, numero_autorizacion, fecha_autorizacion, ambiente_sri, xml_firmado) VALUES ($1,$2,'05',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
                [context.empresaId, context.usuarioId, puntoEmisionId, secuencialFormateado, fechaEmision, clienteId, cliente.razon_social, cliente.identificacion, subtotal, totalIva, valorTotal, estado, accessKey, numAuth, fechaAuth, parseInt(configSrv.ambiente_sri), signedXml]);

            const asiento = await client.query(`INSERT INTO contabilidad.asientos(empresa_id, usuario_id, numero, fecha, glosa, tipo, estado) VALUES($1, $2, 'ND-' || $3, $4, 'NOTA DÉBITO S/FACTURA ' || $5, 'INGRESO', 'MAYORIZADO') RETURNING id`, [context.empresaId, context.usuarioId, secuencialFormateado, fechaEmision, numDocModificado]);
            const aId = asiento.rows[0].id;

            await client.query(`INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto) VALUES($1, $2, $3, 0, 'CUENTAS POR COBRAR (ND)')`, [aId, params.cuenta_cxc_clientes || '1.1.02.01', valorTotal]);
            await client.query(`INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto) VALUES($1, $2, 0, $3, 'VENTA POR NOTA DÉBITO')`, [aId, params.cuenta_ventas || '4.1.01.01', subtotal]);
            if (totalIva > 0) await client.query(`INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto) VALUES($1, $2, 0, $3, 'IVA EN VENTAS (ND)')`, [aId, params.cuenta_iva_por_pagar || '2.1.03.01', totalIva]);

            return { secuencial: secuencialFormateado, accessKey, estado };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
