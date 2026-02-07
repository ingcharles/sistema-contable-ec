import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';
import { SignatureService } from '@/modules/facturacion/domain/services/SignatureService';
import { SriWebService } from '@/modules/facturacion/domain/services/SriWebService';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';
import { ParametrosContablesValidator } from '@/modules/contabilidad/application/services/ParametrosContablesValidator';
import { ParametrosRepository } from '@/modules/configuracion/infrastructure/ParametrosRepository';

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

        const params = await ParametrosRepository.obtenerParametros(context.empresaId!, context.usuarioId!);
        const paramsRow = params; // Compatibility alias

        // 1.3 Validar Parámetros y Cierre
        const validacionParams = ParametrosContablesValidator.validarNotaCredito(params);
        if (!validacionParams.valido) {
            return NextResponse.json({ error: validacionParams.error }, { status: 400 });
        }

        const validacionCierre = ParametrosContablesValidator.validarFechaCierre(params, fechaEmision);
        if (!validacionCierre.valido) {
            return NextResponse.json({ error: validacionCierre.error }, { status: 400 });
        }

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
        const defaultIvaId = paramsRow.iva_catalogo_item_id || codeToIdMap['4'];

        // Enriquecer detalles con códigos de IVA
        const detallesEnriquecidos = detalles.map((d: any) => ({
            ...d,
            codigoIVA: d.codigoIVA || defaultIvaCode,
            tarifa: d.tarifa ?? ivaRatesMap[d.codigoIVA || defaultIvaCode] ?? 15
        }));

        // --- STEP 1: PREPARE AND PERSIST (PENDING STATE) ---
        const persistentData = await db.transaction(async (client) => {
            const pResult = await client.query(`
                SELECT pe.*, s.codigo as codigo_establecimiento
                FROM configuracion.puntos_emision pe
                INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
                WHERE pe.id = $1 AND s.empresa_id = $2
            `, [puntoEmisionId, context.empresaId]);
            const punto = pResult.rows[0];

            // Bloquear secuencial para lectura (SIN incrementar todavía - se incrementa solo si SRI recibe exitosamente)
            const seqResult = await client.query(`
                SELECT secuencial_actual FROM configuracion.puntos_emision_secuenciales
                WHERE punto_emision_id = $1 AND tipo_comprobante = '04'
                FOR UPDATE
            `, [puntoEmisionId]);

            let nextSeqInt = 1;
            if (seqResult.rows.length > 0) {
                nextSeqInt = seqResult.rows[0].secuencial_actual;
            } else {
                // Crear registro inicial si no existe (sin incrementar aún)
                await client.query(`INSERT INTO configuracion.puntos_emision_secuenciales(punto_emision_id, tipo_comprobante, secuencial_actual, created_by) VALUES($1, '04', 1, $2)`, [puntoEmisionId, context.usuarioId]);
            }
            const secuencialFormateado = nextSeqInt.toString().padStart(9, '0');

            const subtotalSinImpuestos = detallesEnriquecidos.reduce((acc: number, d: any) => acc + Number(d.baseImponible), 0);
            const totalDescuento = detallesEnriquecidos.reduce((acc: number, d: any) => acc + Number(d.descuento || 0), 0);
            const totalIva = detallesEnriquecidos.reduce((acc: number, d: any) => acc + Number(d.valorIVA), 0);
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
                detalles: detallesEnriquecidos,
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

            // Persistencia Inicial (Pendiente)
            const insertResult = await client.query(`
                INSERT INTO facturacion.comprobantes_electronicos
                (empresa_id, usuario_id, tipo_comprobante, punto_emision_id, secuencial, fecha_emision,
                cliente_id, cliente_nombre, cliente_identificacion, subtotal, total_descuento, iva, total,
                estado, clave_acceso, ambiente_sri, xml_firmado, mensajes_sri)
                VALUES ($1, $2, '04', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDIENTE', $13, $14, $15, $16)
                RETURNING id
            `, [
                context.empresaId, context.usuarioId, puntoEmisionId, secuencialFormateado, fechaEmision,
                clienteId, cliente.razon_social, cliente.identificacion, subtotalSinImpuestos, totalDescuento, totalIva, valorModificacion,
                accessKey, parseInt(configSrv.ambiente_sri), signedXml, { mensajes: [] }
            ]);
            const comprobanteId = insertResult.rows[0].id;

            // Guardar detalles de la nota de crédito
            for (const d of detallesEnriquecidos) {
                const ivaId = codeToIdMap[d.codigoIVA] || defaultIvaId;
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
                        iva_catalogo_item_id
                    )
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    comprobanteId,
                    d.codigoPrincipal || 'NC',
                    d.descripcion || motivo,
                    d.cantidad || 1,
                    d.precioUnitario || d.valorModificacion || d.baseImponible,
                    d.descuento || 0,
                    d.baseImponible,
                    d.valorIVA || 0,
                    ivaId
                ]);
            }

            return {
                comprobanteId,
                secuencial: secuencialFormateado,
                claveAcceso: accessKey,
                signedXml,
                punto,
                subtotalSinImpuestos,
                valorModificacion,
                totalIva,
                detalles: detallesEnriquecidos
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

            if (recepcionResult.estado === 'RECIBIDA') {
                fueRecibida = true; // ✅ Comprobante RECIBIDO por SRI - secuencial debe incrementarse
                try {
                    const autorizacionResult = await SriWebService.autorizarComprobante(persistentData.claveAcceso, configSrv.url_autorizacion);
                    estadoSri = autorizacionResult.estado;
                    numAutorizacion = autorizacionResult.numeroAutorizacion;
                    fechaAutorizacion = autorizacionResult.fechaAutorizacion;
                    mensajesSri = autorizacionResult.mensajes || [];
                } catch (authError: any) {
                    console.error('Error en autorización SRI:', authError);
                    estadoSri = 'ERROR_AUTORIZACION';
                    mensajesSri = [{ tipo: 'ERROR', mensaje: authError.message || 'Error al consultar autorización' }];
                }
            } else {
                // Comprobante RECHAZADO en recepción (no fue RECIBIDA)
                estadoSri = recepcionResult.estado;
                mensajesSri = recepcionResult.mensajes || [{ tipo: 'ERROR', mensaje: 'Comprobante rechazado en recepción' }];
            }
        } catch (sriError: any) {
            console.error('Error comunicación SRI:', sriError);
            estadoSri = 'ERROR_TECNICO';
            mensajesSri = [{ tipo: 'ERROR', mensaje: sriError.message || 'Error de comunicación con SRI' }];
        }

        // --- STEP 3: FINALIZE STATE ---
        await db.transaction(async (client) => {
            // Actualizar estado del comprobante
            await client.query(`
                UPDATE facturacion.comprobantes_electronicos
                SET estado = $1, numero_autorizacion = $2, fecha_autorizacion = $3, mensajes_sri = $4, updated_at = NOW()
                WHERE id = $5
            `, [estadoSri, numAutorizacion, fechaAutorizacion, { mensajes: mensajesSri }, persistentData.comprobanteId]);

            // INCREMENTAR SECUENCIAL solo si fue RECIBIDA por el SRI (según regla: incrementar únicamente cuando estado RECIBIDA)
            if (fueRecibida) {
                await client.query(`
                    UPDATE configuracion.puntos_emision_secuenciales
                    SET secuencial_actual = secuencial_actual + 1, updated_at = NOW()
                    WHERE punto_emision_id = $1 AND tipo_comprobante = '04'
                `, [puntoEmisionId]);
            }

            if (estadoSri === 'AUTORIZADO') {
                // Asiento Contable
                const asientoNo = `NC-${persistentData.punto.codigo_establecimiento}-${persistentData.punto.codigo}-${persistentData.secuencial}`;
                const asientoResult = await client.query(`
                    INSERT INTO contabilidad.asientos(empresa_id, usuario_id, numero, fecha, glosa, tipo, estado)
                    VALUES($1, $2, $3, $4, 'NOTA CRÉDITO S/FACTURA ' || $5 || ' - ' || $6, 'EGRESO', 'MAYORIZADO')
                    RETURNING id
                `, [context.empresaId, context.usuarioId, asientoNo, fechaEmision, numDocModificado || '', cliente.razon_social]);
                const asientoId = asientoResult.rows[0].id;

                // CXC (Haber - Disminuye deuda)
                await client.query(`INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto) VALUES($1, $2, 0, $3, 'DEVOLUCIÓN DEUDA POR NOTA CRÉDITO')`,
                    [asientoId, paramsRow.cuenta_cxc_clientes || '1.1.02.01', persistentData.valorModificacion]);

                // Devolución en Ventas (Debe)
                await client.query(`INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto) VALUES($1, $2, $3, 0, 'DEVOLUCIÓN EN VENTAS')`,
                    [asientoId, paramsRow.cuenta_devolucion_ventas || '4.1.01.02', persistentData.subtotalSinImpuestos]);

                if (persistentData.totalIva > 0) {
                    await client.query(`INSERT INTO contabilidad.asientos_detalles(asiento_id, cuenta_codigo, debe, haber, concepto) VALUES($1, $2, $3, 0, 'IVA EN VENTAS (NC)')`,
                        [asientoId, paramsRow.cuenta_iva_por_pagar || '2.1.03.01', persistentData.totalIva]);
                }

                // TODO: Reingreso de Inventario si aplica?
                // Las NC pueden implicar retorno de mercadería.
                // Por ahora no lo gestiona el body explícitamente como retorno de items, sino como valores.
                // Si se quisiera retorno, se necesitaría lógica de kardex "ENTRADA".
            }
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

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
        console.error('Error en emisión de NC:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
