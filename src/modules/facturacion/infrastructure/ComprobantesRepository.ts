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
                    c.id, c.empresa_id, c.usuario_id, ci.codigo as tipo_comprobante, c.tipo_comprobante_id, c.secuencial, 
                    c.fecha_emision, c.cliente_id, c.cliente_nombre, c.cliente_identificacion,
                    c.subtotal, c.iva, c.total, c.total_descuento, c.estado, c.clave_acceso,
                    c.ambiente_sri, c.tipo_emision_sri, c.mensajes_sri,
                    c.numero_autorizacion, c.fecha_autorizacion, c.xml_firmado,
                    pe.codigo as pto_emi, s.codigo as estab,
                    c.punto_emision_id,
                    c.direccion_partida, c.direccion_destino, c.placa_vehiculo,
                    c.transportista_nombre, c.transportista_identificacion
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
                    c.id, c.empresa_id, c.usuario_id, ci.codigo as tipo_comprobante, c.tipo_comprobante_id, c.secuencial, 
                    c.fecha_emision, c.proveedor_id as cliente_id, t.razon_social as cliente_nombre, 
                    t.identificacion as cliente_identificacion,
                    (c.subtotal_iva + c.subtotal_0) as subtotal, c.monto_iva as iva, c.total, 
                    0 as total_descuento, c.estado_retencion as estado, c.clave_acceso,
                    1 as ambiente_sri, '1' as tipo_emision_sri, c.mensajes_sri,
                    c.autorizacion as numero_autorizacion, c.fecha_autorizacion, c.xml_firmado,
                    pe.codigo as pto_emi, s.codigo as estab,
                    pe.id as punto_emision_id
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
            return (await dbClient.query({
                text: `SELECT * FROM compras.compras_detalle WHERE compra_id = $1`,
                values: [id]
            }, ctx)).rows;
        }

        // Resto (01, 04, 05)
        return (await dbClient.query({
            text: `SELECT * FROM facturacion.comprobantes_detalles WHERE comprobante_id = $1`,
            values: [id]
        }, ctx)).rows;
    }

    /**
     * Obtiene los impuestos de una retención
     */
    static async obtenerRetencionImpuestos(id: string, context: { empresaId: string, usuarioId: string }, client?: any) {
        const dbClient = client || db;
        const ctx = { empresaId: context.empresaId, usuarioId: context.usuarioId };
        return (await dbClient.query({
            text: `SELECT * FROM facturacion.retenciones_impuestos WHERE comprobante_id = $1`,
            values: [id]
        }, ctx)).rows;
    }

    /**
     * Obtiene los destinatarios y detalles de una guía
     */
    static async obtenerGuiaEstructura(id: string, context: { empresaId: string, usuarioId: string }, client?: any) {
        const dbClient = client || db;
        const ctx = { empresaId: context.empresaId, usuarioId: context.usuarioId };

        const destResult = await dbClient.query({
            text: `SELECT * FROM facturacion.guias_destinatarios WHERE comprobante_id = $1`,
            values: [id]
        }, ctx);

        const destinatarios = [];
        for (const dest of destResult.rows) {
            const detResult = await dbClient.query({
                text: `SELECT * FROM facturacion.guias_destinatarios_detalles WHERE destinatario_id = $1`,
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
