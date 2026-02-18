import { db } from '@/shared/infrastructure/database/postgresql';

export class ComprobantesRepository {
    /**
     * Obtiene la cabecera básica de un comprobante electrónico (de facturación o compras)
     */
    static async obtenerCabeceraComprobante(id: string, context: { empresaId: string, usuarioId: string }, client?: any) {
        const dbClient = client || db;
        const ctx = { empresaId: context.empresaId, usuarioId: context.usuarioId };

        // Intentar en facturacion
        const compFact = await dbClient.query({
            text: `
                SELECT 
                    c.id, c.empresa_id AS "empresaId", c.usuario_id AS "usuarioId", 
                    ci.codigo AS "tipoComprobante", c.tipo_comprobante_id AS "tipoComprobanteId", c.secuencial, 
                    c.fecha_emision AS "fechaEmision", c.cliente_id AS "clienteId", 
                    c.cliente_nombre AS "clienteNombre", c.cliente_identificacion AS "clienteIdentificacion",
                    c.subtotal, c.iva, c.total, c.total_descuento AS "totalDescuento", c.estado, 
                    c.clave_acceso AS "claveAcceso",
                    c.ambiente_sri AS "ambienteSri", c.tipo_emision_sri AS "tipoEmisionSri", 
                    c.mensajes_sri AS "mensajesSri",
                    c.numero_autorizacion AS "numeroAutorizacion", 
                    c.fecha_autorizacion AS "fechaAutorizacion", c.xml_firmado AS "xmlFirmado",
                    pe.codigo AS "ptoEmi", s.codigo AS "estab",
                    c.punto_emision_id AS "puntoEmisionId",
                    c.direccion_partida AS "direccionPartida", c.direccion_destino AS "direccionDestino", 
                    c.placa_vehiculo AS "placaVehiculo",
                    c.transportista_nombre AS "transportistaNombre", 
                    c.transportista_identificacion AS "transportistaIdentificacion"
                FROM facturacion.comprobantes_electronicos c
                LEFT JOIN configuracion.catalogos_items ci ON c.tipo_comprobante_id = ci.id
                LEFT JOIN configuracion.puntos_emision pe ON c.punto_emision_id = pe.id
                LEFT JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
                WHERE c.id = $1 AND c.empresa_id = $2
            `,
            values: [id, context.empresaId]
        }, ctx);

        if (compFact.rows.length > 0) return compFact.rows[0];

        // Intentar en compras (Liquidaciones 03)
        const compCompra = await dbClient.query({
            text: `
                SELECT 
                    c.id, c.empresa_id AS "empresaId", c.usuario_id AS "usuarioId", 
                    ci.codigo AS "tipoComprobante", c.tipo_comprobante_id AS "tipoComprobanteId", c.secuencial, 
                    c.fecha_emision AS "fechaEmision", c.proveedor_id AS "clienteId", 
                    t.razon_social AS "clienteNombre", t.identificacion AS "clienteIdentificacion",
                    (c.subtotal_iva + c.subtotal_0) AS "subtotal", c.monto_iva AS "iva", c.total, 
                    0 AS "totalDescuento", c.estado_retencion AS "estado", c.clave_acceso AS "claveAcceso",
                    1 AS "ambienteSri", '1' AS "tipoEmisionSri", c.mensajes_sri AS "mensajesSri",
                    c.autorizacion AS "numeroAutorizacion", 
                    c.fecha_autorizacion AS "fechaAutorizacion", c.xml_firmado AS "xmlFirmado",
                    pe.codigo AS "ptoEmi", s.codigo AS "estab",
                    pe.id AS "puntoEmisionId"
                FROM compras.compras c
                LEFT JOIN configuracion.catalogos_items ci ON c.tipo_comprobante_id = ci.id
                LEFT JOIN directorio.terceros t ON c.proveedor_id = t.id
                LEFT JOIN configuracion.puntos_emision pe ON pe.id = (
                    SELECT id FROM configuracion.puntos_emision 
                    WHERE sucursal_id = (SELECT sucursal_id FROM configuracion.usuarios_puntos_emision WHERE usuario_id = c.usuario_id AND activo = true LIMIT 1)
                    LIMIT 1
                )
                LEFT JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
                WHERE c.id = $1 AND c.empresa_id = $2
            `,
            values: [id, context.empresaId]
        }, ctx);

        return compCompra.rows[0] || null;
    }

    /**
     * Obtiene los detalles de un comprobante (válido para Facturas, Liquidaciones de Compra, NC, ND)
     */
    static async obtenerDetalles(id: string, tipoComprobante: string, context: { empresaId: string, usuarioId: string }, client?: any) {
        const dbClient = client || db;
        const ctx = { empresaId: context.empresaId, usuarioId: context.usuarioId };

        if (tipoComprobante === '03') { // Liquidación de Compra
            const result = await dbClient.query({
                text: `
                    SELECT 
                        id, compra_id AS "compraId", producto_id AS "productoId", 
                        descripcion, cantidad, precio_unitario AS "precioUnitario", 
                        subtotal, porcentaje_iva AS "porcentajeIva", valor_iva AS "valorIva", 
                        total, codigo_iva AS "codigoIva"
                    FROM compras.compras_detalle 
                    WHERE compra_id = $1
                `,
                values: [id]
            }, ctx);
            return result.rows;
        }

        // Resto (01, 04, 05)
        const result = await dbClient.query({
            text: `
                SELECT 
                    id, comprobante_id AS "comprobanteId", codigo_principal AS "codigoPrincipal", 
                    codigo_auxiliar AS "codigoAuxiliar", descripcion, cantidad, 
                    precio_unitario AS "precioUnitario", descuento, total, 
                    codigo_iva AS "codigoIva", base_imponible AS "baseImponible", 
                    tarifa, valor_iva AS "valorIva"
                FROM facturacion.comprobantes_detalles 
                WHERE comprobante_id = $1
            `,
            values: [id]
        }, ctx);
        return result.rows;
    }

    /**
     * Obtiene los impuestos de una retención
     */
    static async obtenerRetencionImpuestos(id: string, context: { empresaId: string, usuarioId: string }, client?: any) {
        const dbClient = client || db;
        const ctx = { empresaId: context.empresaId, usuarioId: context.usuarioId };
        const result = await dbClient.query({
            text: `
                SELECT 
                    id, comprobante_id AS "comprobanteId", codigo, 
                    codigo_retencion AS "codigoRetencion", base_imponible AS "baseImponible", 
                    porcentaje_retener AS "porcentajeRetener", valor_retenido AS "valorRetenido", 
                    cod_doc_sustento AS "codDocSustento", num_doc_sustento AS "numDocSustento", 
                    fecha_emision_doc_sustento AS "fechaEmisionDocSustento", 
                    cod_sustento AS "codSustento", num_aut_doc_sustento AS "numAutDocSustento", 
                    total_sin_impuestos_doc_sustento AS "totalSinImpuestosDocSustento", 
                    base_imponible_iva_doc_sustento AS "baseImponibleIvaDocSustento", 
                    importe_total_doc_sustento AS "importeTotalDocSustento", 
                    pago_loc_ext AS "pagoLocExt", forma_pago AS "formaPago", 
                    iva_doc_sustento AS "ivaDocSustento"
                FROM facturacion.retenciones_impuestos 
                WHERE comprobante_id = $1
            `,
            values: [id]
        }, ctx);
        return result.rows;
    }

    /**
     * Obtiene los destinatarios y detalles de una guía
     */
    static async obtenerGuiaEstructura(id: string, context: { empresaId: string, usuarioId: string }, client?: any) {
        const dbClient = client || db;
        const ctx = { empresaId: context.empresaId, usuarioId: context.usuarioId };

        const destResult = await dbClient.query({
            text: `
                SELECT 
                    id, comprobante_id AS "comprobanteId", 
                    identificacion_destinatario AS "identificacionDestinatario", 
                    razon_social_destinatario AS "razonSocialDestinatario", 
                    dir_destinatario AS "dirDestinatario", motivo_traslado AS "motivoTraslado", 
                    doc_aduanero_unico AS "docAduaneroUnico", cod_estab_destino AS "codEstabDestino", 
                    ruta, cod_doc_sustento AS "codDocSustento", num_doc_sustento AS "numDocSustento", 
                    num_aut_doc_sustento AS "numAutDocSustento", 
                    fecha_emision_doc_sustento AS "fechaEmisionDocSustento"
                FROM facturacion.guias_destinatarios 
                WHERE comprobante_id = $1
            `,
            values: [id]
        }, ctx);

        const destinatarios = [];
        for (const dest of destResult.rows) {
            const detResult = await dbClient.query({
                text: `
                    SELECT 
                        id, destinatario_id AS "destinatarioId", 
                        codigo_interno AS "codigoInterno", codigo_adicional AS "codigoAdicional", 
                        descripcion, cantidad
                    FROM facturacion.guias_destinatarios_detalles 
                    WHERE destinatario_id = $1
                `,
                values: [dest.id]
            }, ctx);
            destinatarios.push({
                ...dest,
                detalles: detResult.rows
            });
        }
        return destinatarios;
    }
}
