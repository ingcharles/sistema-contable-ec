import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';
import { SignatureService } from '@/modules/facturacion/domain/services/SignatureService';
import { SriWebService } from '@/modules/facturacion/domain/services/SriWebService';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';

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
        const params = (await db.query({ text: 'SELECT * FROM configuracion.parametros WHERE empresa_id = $1', values: [context.empresaId] }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! })).rows[0];

        const result = await db.transaction(async (client) => {
            const punto = (await client.query('SELECT pe.*, s.codigo as estab FROM configuracion.puntos_emision pe INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id WHERE pe.id = $1', [puntoEmisionId])).rows[0];
            const secuencialResult = await client.query("SELECT secuencial_actual FROM configuracion.puntos_emision_secuenciales WHERE punto_emision_id = $1 AND tipo_comprobante = '03' FOR UPDATE", [puntoEmisionId]);
            let nextSeqInt = secuencialResult.rows.length > 0 ? secuencialResult.rows[0].secuencial_actual : 1;
            await client.query("INSERT INTO configuracion.puntos_emision_secuenciales(punto_emision_id, tipo_comprobante, secuencial_actual) VALUES($1, '03', 2) ON CONFLICT (punto_emision_id, tipo_comprobante) DO UPDATE SET secuencial_actual = EXCLUDED.secuencial_actual + 1", [puntoEmisionId]);
            const secuencialFormateado = nextSeqInt.toString().padStart(9, '0');

            const totalSinImpuestos = detalles.reduce((acc: number, d: any) => acc + (d.baseImponible || d.total), 0);
            const totalIVA = detalles.reduce((acc: number, d: any) => acc + (d.valorIVA || 0), 0);
            const importeTotal = totalSinImpuestos + totalIVA;

            const dataSri = SriStandardizer.standardizeLiquidacion({
                ambiente: configSrv.ambiente_sri,
                razonSocial: empresaDoc.razon_social,
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
                obligadoContabilidad: empresaDoc.es_obligado_contabilidad ? 'SI' : 'NO',
                totalSinImpuestos,
                importeTotal,
                detalles,
                pagos
            });

            const accessKey = XmlGenerator.generateAccessKey(dataSri);
            dataSri.infoTributaria.claveAcceso = accessKey;
            const signedXml = await SignatureService.signXml(XmlGenerator.generateLiquidacionXml(dataSri), {
                p12Base64: configSrv.cert_p12_certificado.toString('base64'),
                passwordP12: configSrv.cert_clave_certificate
            });

            const recepcion = await SriWebService.enviarComprobante(signedXml, configSrv.url_recepcion);
            let estado = recepcion.estado, numAuth = null, fechaAuth = null;
            if (estado === 'RECIBIDA') {
                const auth = await SriWebService.autorizarComprobante(accessKey, configSrv.url_autorizacion);
                estado = auth.estado; numAuth = auth.numeroAutorizacion; fechaAuth = auth.fechaAutorizacion;
            }

            // Registro Local de Compra
            const terceroRes = await client.query('SELECT id FROM directorio.terceros WHERE identificacion = $1 AND empresa_id = $2', [proveedor.identificacion, context.empresaId]);
            let proveedorId = terceroRes.rows[0]?.id || crypto.randomUUID();
            if (terceroRes.rowCount === 0) {
                await client.query('INSERT INTO directorio.terceros (id, empresa_id, usuario_id, tipo_identificacion, identificacion, razon_social, tipo_tercero) VALUES ($1,$2,$3,$4,$5,$6,$7)',
                    [proveedorId, context.empresaId, context.usuarioId, proveedor.tipoIdentificacion, proveedor.identificacion, proveedor.nombre, 'PROVEEDOR']);
            }

            const compraId = crypto.randomUUID();
            await client.query(`INSERT INTO compras.compras (id, empresa_id, usuario_id, proveedor_id, tipo_comprobante, secuencial, autorizacion, fecha_emision, fecha_registro, subtotal_iva, subtotal_0, monto_iva, total, estado_retencion, clave_acceso) VALUES ($1,$2,$3,$4,'03',$5,$6,$7,CURRENT_DATE,$8,$9,$10,$11,$12,$13)`,
                [compraId, context.empresaId, context.usuarioId, proveedorId, secuencialFormateado, numAuth || accessKey, fechaEmision, totalIVA > 0 ? totalSinImpuestos : 0, totalIVA === 0 ? totalSinImpuestos : 0, totalIVA, importeTotal, estado, accessKey]);

            // Asiento
            const asientoId = crypto.randomUUID();
            await client.query(`INSERT INTO contabilidad.asientos(id, empresa_id, usuario_id, numero, fecha, glosa, tipo) VALUES($1,$2,$3,'LIQ-' || $4, $5, 'LIQUIDACIÓN DE COMPRA ' || $6, 'DIARIO')`,
                [asientoId, context.empresaId, context.usuarioId, secuencialFormateado, fechaEmision, proveedor.nombre]);
            await client.query(`INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber) VALUES($1,$2,$3,0)`, [asientoId, '5.1.01.01', totalSinImpuestos]);
            if (totalIVA > 0) await client.query(`INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber) VALUES($1,$2,$3,0)`, [asientoId, params?.cuenta_iva_compras || '1.1.05.01', totalIVA]);
            await client.query(`INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber) VALUES($1,$2,0,$3)`, [asientoId, params?.cuenta_cxp_proveedores || '2.1.01.01', importeTotal]);

            return { secuencial: secuencialFormateado, accessKey, estado };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
