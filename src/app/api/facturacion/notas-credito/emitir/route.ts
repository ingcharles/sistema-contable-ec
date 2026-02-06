import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';
import { SignatureService } from '@/modules/facturacion/domain/services/SignatureService';
import { SriWebService } from '@/modules/facturacion/domain/services/SriWebService';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';

export const runtime = 'nodejs';

/**
 * POST /api/facturacion/notas-credito/emitir
 * Proceso Unificado para Notas de Crédito: SRI + Base de Datos + Inventario + Contabilidad
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            puntoEmisionId,
            fechaEmision,
            clienteId,
            motivo,
            codDocModificado,
            numDocModificado,
            fechaEmisionDocSustento,
            detalles = []
        } = body;

        // 1. Validaciones y Preparación
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
            return NextResponse.json({ error: 'Configuración SRI no encontrada' }, { status: 400 });
        }
        const configSrv = configResult.rows[0];

        const empresaResult = await db.query(
            { text: 'SELECT razon_social, ruc, direccion, es_obligado_contabilidad, nombre_comercial FROM seguridad.empresas WHERE id = $1', values: [context.empresaId] },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );
        const empresaDoc = empresaResult.rows[0];

        const clienteResult = await db.query(
            { text: 'SELECT * FROM directorio.terceros WHERE id = $1 AND empresa_id = $2', values: [clienteId, context.empresaId] },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );
        const cliente = clienteResult.rows[0];

        const paramsResult = await db.query(
            { text: 'SELECT * FROM configuracion.parametros WHERE empresa_id = $1', values: [context.empresaId] },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );
        const params = paramsResult.rows[0] || {};

        // Iniciar Transacción
        const result = await db.transaction(async (client) => {
            // 2. Punto de Emisión y Secuencial
            const pResult = await client.query(`
                SELECT pe.*, s.codigo as codigo_establecimiento
                FROM configuracion.puntos_emision pe
                INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
                WHERE pe.id = $1 AND s.empresa_id = $2
            `, [puntoEmisionId, context.empresaId]);
            const punto = pResult.rows[0];

            const seqResult = await client.query(`
                SELECT secuencial_actual FROM configuracion.puntos_emision_secuenciales
                WHERE punto_emision_id = $1 AND tipo_comprobante = '04'
                FOR UPDATE
            `, [puntoEmisionId]);

            let nextSeqInt = 1;
            if (seqResult.rows.length > 0) {
                nextSeqInt = seqResult.rows[0].secuencial_actual;
                await client.query(`UPDATE configuracion.puntos_emision_secuenciales SET secuencial_actual = secuencial_actual + 1 WHERE punto_emision_id = $1 AND tipo_comprobante = '04'`, [puntoEmisionId]);
            } else {
                await client.query(`INSERT INTO configuracion.puntos_emision_secuenciales(punto_emision_id, tipo_comprobante, secuencial_actual) VALUES($1, '04', 2)`, [puntoEmisionId]);
            }
            const secuencialFormateado = nextSeqInt.toString().padStart(9, '0');

            // 3. Estandarización y SRI
            const subtotalSinImpuestos = detalles.reduce((acc: number, d: any) => acc + Number(d.baseImponible), 0);
            const totalDescuento = detalles.reduce((acc: number, d: any) => acc + Number(d.descuento || 0), 0);
            const totalIva = detalles.reduce((acc: number, d: any) => acc + Number(d.valorIVA), 0);
            const valorModificacion = subtotalSinImpuestos + totalIva;

            const dataSri = SriStandardizer.standardizeNotaCredito({
                razonSocial: empresaDoc.razon_social,
                nombreComercial: empresaDoc.nombre_comercial,
                ruc: empresaDoc.ruc,
                estab: punto.codigo_establecimiento,
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
                totalSinImpuestos: subtotalSinImpuestos,
                valorModificacion,
                motivo,
                detalles,
                ambienteSri: configSrv.ambiente_sri,
                obligadoContabilidad: empresaDoc.es_obligado_contabilidad
            });

            const accessKey = XmlGenerator.generateAccessKey(dataSri);
            dataSri.infoTributaria.claveAcceso = accessKey;
            const rawXml = XmlGenerator.generateNotaCreditoXml(dataSri);
            const signedXml = await SignatureService.signXml(rawXml, {
                p12Base64: configSrv.cert_p12_certificado.toString('base64'),
                passwordP12: configSrv.cert_clave_certificado
            });

            const recepcionResult = await SriWebService.enviarComprobante(signedXml, configSrv.url_recepcion);
            let estadoSri = recepcionResult.estado;
            let numAutorizacion = null, fechaAutorizacion = null, mensajesSri = recepcionResult.mensajes || [];

            if (estadoSri === 'RECIBIDA') {
                const autorizacionResult = await SriWebService.autorizarComprobante(accessKey, configSrv.url_autorizacion);
                estadoSri = autorizacionResult.estado;
                numAutorizacion = autorizacionResult.numeroAutorizacion;
                fechaAutorizacion = autorizacionResult.fechaAutorizacion;
                if (autorizacionResult.mensajes) mensajesSri = autorizacionResult.mensajes;
            }

            // 4. Persistencia y Contabilidad
            const compResult = await client.query(`
                INSERT INTO facturacion.comprobantes_electronicos
                (empresa_id, usuario_id, tipo_comprobante, punto_emision_id, secuencial, fecha_emision,
                cliente_id, cliente_nombre, cliente_identificacion, subtotal, total_descuento, iva, total,
                estado, clave_acceso, numero_autorizacion, fecha_autorizacion, ambiente_sri, xml_firmado, mensajes_sri)
                VALUES ($1, $2, '04', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                RETURNING id
            `, [
                context.empresaId, context.usuarioId, puntoEmisionId, secuencialFormateado, fechaEmision,
                clienteId, cliente.razon_social, cliente.identificacion, subtotalSinImpuestos, totalDescuento, totalIva, valorModificacion,
                estadoSri, accessKey, numAutorizacion, fechaAutorizacion, parseInt(configSrv.ambiente_sri), signedXml, { mensajes: mensajesSri }
            ]);
            const comprobanteId = compResult.rows[0].id;

            // Asiento Contable
            const asientoResult = await client.query(`
                INSERT INTO contabilidad.asientos(empresa_id, usuario_id, numero, fecha, glosa, tipo, estado)
                VALUES($1, $2, 'NC-' || $3, $4, 'NOTA CRÉDITO S/FACTURA ' || $5 || ' - ' || $6, 'EGRESO', 'MAYORIZADO')
                RETURNING id
            `, [context.empresaId, context.usuarioId, secuencialFormateado, fechaEmision, numDocModificado, cliente.razon_social]);
            const asientoId = asientoResult.rows[0].id;

            // CXC (Haber - Disminuye deuda)
            await client.query(`INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto) VALUES($1, $2, 0, $3, 'DEVOLUCIÓN EN VENTAS')`,
                [asientoId, params.cuenta_cxc_clientes || '1.1.02.01', valorModificacion]);

            // Devolución y IVA (Debe)
            await client.query(`INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto) VALUES($1, $2, $3, 0, 'DEVOLUCIÓN VENTAS')`,
                [asientoId, params.cuenta_devolucion_ventas || '4.1.01.02', subtotalSinImpuestos]);

            if (totalIva > 0) {
                await client.query(`INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto) VALUES($1, $2, $3, 0, 'IVA EN VENTAS (NC)')`,
                    [asientoId, params.cuenta_iva_por_pagar || '2.1.03.01', totalIva]);
            }

            return { comprobanteId, secuencial: secuencialFormateado, accessKey, estadoSri };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({ success: true, ...result });

    } catch (error: any) {
        console.error('Error en emisión de NC:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
