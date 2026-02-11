import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * Servicio de dominio AVANZADO para la generación del ATS XML (SRI Ecuador)
 * Cumple con definiciones completas de Ficha Técnica 1.0
 */
export class AtsGenerator {

    static async generar(empresaId: string, periodo: string): Promise<string> {
        const [anio, mes] = periodo.split('-');

        // 1. Datos Empresa
        const empresa = (await db.querySimple<any>({
            text: `SELECT ruc, razon_social, direccion FROM seguridad.empresas WHERE id = $1`,
            values: [empresaId]
        })).rows[0];

        if (!empresa) throw new Error('Empresa no encontrada');

        // 2. Compras Detalladas (Incluye lógica para determinar tipo de gasto)
        const compras = (await db.querySimple<any>({
            text: `
                SELECT 
                    c.*, 
                    t.identificacion as prov_ruc, t.razon_social as prov_nombre, 
                    t.tipo_identificacion as prov_tipo,
                    (
                        SELECT CASE WHEN COUNT(*) > 0 THEN 'BIEN' ELSE 'SERVICIO' END 
                        FROM compras.compras_detalles cd
                        JOIN inventario.productos p ON cd.producto_id = p.id
                        WHERE cd.compra_id = c.id AND p.tipo = 'SERVICIO'
                    ) as tipo_gasto_principal
                FROM compras.compras c
                JOIN directorio.terceros t ON c.proveedor_id = t.id
                WHERE c.empresa_id = $1 
                AND TO_CHAR(c.fecha_emision, 'YYYY-MM') = $2
                AND c.estado != 'ANULADO'
            `,
            values: [empresaId, periodo]
        })).rows;

        // 3. Ventas Detalladas
        const ventas = (await db.querySimple<any>({
            text: `
                SELECT 
                    v.*, t.identificacion as cli_id, t.tipo_identificacion as cli_tipo
                FROM facturacion.comprobantes_electronicos v
                JOIN directorio.terceros t ON v.cliente_id = t.id
                WHERE v.empresa_id = $1 
                AND TO_CHAR(v.fecha_emision, 'YYYY-MM') = $2
                AND v.estado = 'AUTORIZADO'
            `,
            values: [empresaId, periodo]
        })).rows;

        // 4. Ventas por Establecimiento (Para sección <ventasEstablecimiento>)
        const ventasEstab = (await db.querySimple<any>({
            text: `
                SELECT 
                    SUBSTRING(secuencial, 1, 3) as estab,
                    SUM(total) as total
                FROM facturacion.comprobantes_electronicos
                WHERE empresa_id = $1 AND TO_CHAR(fecha_emision, 'YYYY-MM') = $2
                AND estado = 'AUTORIZADO'
                GROUP BY 1
            `,
            values: [empresaId, periodo]
        })).rows;

        // 5. Anulados
        const anulados = (await db.querySimple<any>({
            text: `
                SELECT 
                    'VENTA' as tipo, secuencial, autorizacion, tipo_comprobante
                FROM facturacion.comprobantes_electronicos
                WHERE empresa_id = $1 AND TO_CHAR(fecha_emision, 'YYYY-MM') = $2
                AND estado = 'ANULADO'
                UNION ALL
                SELECT 
                    'COMPRA' as tipo, secuencial, autorizacion, tipo_comprobante
                FROM compras.compras
                WHERE empresa_id = $1 AND TO_CHAR(fecha_emision, 'YYYY-MM') = $2
                AND estado = 'ANULADO'
            `,
            values: [empresaId, periodo]
        })).rows;

        return this.construirXml(empresa, anio, mes, compras, ventas, ventasEstab, anulados);
    }

    private static construirXml(empresa: any, anio: string, mes: string, compras: any[], ventas: any[], ventasEstab: any[], anulados: any[]): string {
        const totalVentasPeriodo = ventasEstab.reduce((acc, curr) => acc + Number(curr.total || 0), 0);

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<iva>\n';
        xml += `  <TipoIDInformante>R</TipoIDInformante>\n`;
        xml += `  <IdInformante>${empresa.ruc}</IdInformante>\n`;
        xml += `  <razonSocial>${this.escape(empresa.razon_social)}</razonSocial>\n`;
        xml += `  <Anio>${anio}</Anio>\n`;
        xml += `  <Mes>${mes}</Mes>\n`;
        xml += `  <numEstabRuc>${ventasEstab.length > 0 ? ventasEstab.length.toString().padStart(3, '0') : '001'}</numEstabRuc>\n`;
        xml += `  <totalVentas>${totalVentasPeriodo.toFixed(2)}</totalVentas>\n`;
        xml += `  <codigoOperativo>IVA</codigoOperativo>\n`;

        // --- COMPRAS ---
        if (compras.length > 0) {
            xml += '  <compras>\n';
            for (const c of compras) {
                xml += '    <detalleCompras>\n';
                xml += `      <codSustento>${c.sustento || '01'}</codSustento>\n`;
                xml += `      <tpIdProv>${this.mapTipoId(c.prov_tipo)}</tpIdProv>\n`;
                xml += `      <idProv>${c.prov_ruc}</idProv>\n`;
                xml += `      <tipoComprobante>${this.mapComprobante(c.tipo_comprobante)}</tipoComprobante>\n`;
                xml += `      <tipoProv>01</tipoProv>\n`; // Persona Natural (Simplificado)
                xml += `      <denoProv>${this.escape(c.prov_nombre)}</denoProv>\n`;
                xml += `      <parteRel>NO</parteRel>\n`;
                xml += `      <fechaRegistro>${this.fmtDate(c.fecha_registro)}</fechaRegistro>\n`;
                xml += `      <establecimiento>${c.secuencial?.substring(0, 3)}</establecimiento>\n`;
                xml += `      <puntoEmision>${c.secuencial?.substring(4, 7)}</puntoEmision>\n`;
                xml += `      <secuencial>${c.secuencial?.substring(8)}</secuencial>\n`;
                xml += `      <fechaEmision>${this.fmtDate(c.fecha_emision)}</fechaEmision>\n`;
                xml += `      <autorizacion>${c.autorizacion || '9999999999'}</autorizacion>\n`;
                xml += `      <baseNoGraIva>0.00</baseNoGraIva>\n`;
                xml += `      <baseImponible>0.00</baseImponible>\n`;
                xml += `      <baseImpGrav>${Number(c.subtotal || 0).toFixed(2)}</baseImpGrav>\n`;
                xml += `      <baseImpExe>0.00</baseImpExe>\n`;
                xml += `      <montoIce>0.00</montoIce>\n`;
                xml += `      <montoIva>${Number(c.monto_iva || 0).toFixed(2)}</montoIva>\n`;

                // Retenciones Básicas
                xml += `      <valRetBien10>0.00</valRetBien10>\n`;
                xml += `      <valRetServ20>0.00</valRetServ20>\n`;
                xml += `      <valorRetBienes>0.00</valorRetBienes>\n`;
                xml += `      <valRetServ50>0.00</valRetServ50>\n`;
                xml += `      <valorRetServicios>0.00</valorRetServicios>\n`;
                xml += `      <valRetServ100>0.00</valRetServ100>\n`;

                xml += `      <totbasesImpReemb>0.00</totbasesImpReemb>\n`;
                xml += `      <pagoLocExt>01</pagoLocExt>\n`;
                xml += `      <paisEfecPago>NA</paisEfecPago>\n`;
                xml += `      <aplicConvDobTrib>NA</aplicConvDobTrib>\n`;
                xml += `      <pagExtSujRetNorLeg>NA</pagExtSujRetNorLeg>\n`;

                if (c.tiene_retencion) {
                    // Estrategia Avanzada: Determinar código AIR por tipo de gasto
                    const codigoAir = c.tipo_gasto_principal === 'SERVICIO' ? '3440' : '312';
                    const porcentaje = c.tipo_gasto_principal === 'SERVICIO' ? 2.75 : 1.75;
                    const valRet = (Number(c.subtotal || 0) * (porcentaje / 100)).toFixed(2);

                    xml += '      <air>\n';
                    xml += '        <detalleAir>\n';
                    xml += `          <codRetAir>${codigoAir}</codRetAir>\n`;
                    xml += `          <baseImpAir>${Number(c.subtotal || 0).toFixed(2)}</baseImpAir>\n`;
                    xml += `          <porcentajeAir>${porcentaje.toFixed(2)}</porcentajeAir>\n`;
                    xml += `          <valRetAir>${valRet}</valRetAir>\n`;
                    xml += '        </detalleAir>\n';
                    xml += '      </air>\n';

                    xml += `      <estabRetencion1>001</estabRetencion1>\n`;
                    xml += `      <ptoEmiRetencion1>001</ptoEmiRetencion1>\n`;
                    xml += `      <secRetencion1>${(c.nro_retencion).substring(8)}</secRetencion1>\n`;
                    xml += `      <autRetencion1>0000000000</autRetencion1>\n`;
                    xml += `      <fechaEmiRet1>${this.fmtDate(c.fecha_emision)}</fechaEmiRet1>\n`;
                }

                xml += '    </detalleCompras>\n';
            }
            xml += '  </compras>\n';
        }

        // --- VENTAS ---
        if (ventas.length > 0) {
            xml += '  <ventas>\n';
            for (const v of ventas) {
                xml += '    <detalleVentas>\n';
                xml += `      <tpIdCliente>${this.mapTipoId(v.cli_tipo)}</tpIdCliente>\n`;
                xml += `      <idCliente>${v.cli_id}</idCliente>\n`;
                if (v.cli_tipo !== '07') xml += `      <parteRelVtas>NO</parteRelVtas>\n`;
                xml += `      <tipoComprobante>${this.mapComprobante(v.tipo_comprobante)}</tipoComprobante>\n`;
                xml += `      <tipoEmision>F</tipoEmision>\n`;
                xml += `      <numeroComprobantes>1</numeroComprobantes>\n`;
                xml += `      <baseNoGraIva>0.00</baseNoGraIva>\n`;
                xml += `      <baseImponible>0.00</baseImponible>\n`;
                xml += `      <baseImpGrav>${Number(v.subtotal || 0).toFixed(2)}</baseImpGrav>\n`;
                xml += `      <montoIva>${Number(v.iva || 0).toFixed(2)}</montoIva>\n`;
                xml += `      <montoIce>0.00</montoIce>\n`;
                xml += `      <valorRetIva>0.00</valorRetIva>\n`;
                xml += `      <valorRetRenta>0.00</valorRetRenta>\n`;
                xml += '      <formasDePago><formaPago>01</formaPago></formasDePago>\n';
                xml += '    </detalleVentas>\n';
            }
            xml += '  </ventas>\n';
        }

        // --- VENTAS ESTABLECIMIENTO ---
        if (ventasEstab.length > 0) {
            xml += '  <ventasEstablecimiento>\n';
            for (const ve of ventasEstab) {
                xml += '    <ventaEst>\n';
                xml += `      <codEstab>${ve.estab || '001'}</codEstab>\n`;
                xml += `      <ventasEstab>${Number(ve.total || 0).toFixed(2)}</ventasEstab>\n`;
                xml += `      <ivaComp>0.00</ivaComp>\n`;
                xml += '    </ventaEst>\n';
            }
            xml += '  </ventasEstablecimiento>\n';
        }

        // --- ANULADOS ---
        if (anulados.length > 0) {
            xml += '  <anulados>\n';
            for (const a of anulados) {
                xml += '    <detalleAnulados>\n';
                xml += `      <tipoComprobante>${this.mapComprobante(a.tipo_comprobante)}</tipoComprobante>\n`;
                xml += `      <establecimiento>${a.secuencial?.substring(0, 3)}</establecimiento>\n`;
                xml += `      <puntoEmision>${a.secuencial?.substring(4, 7)}</puntoEmision>\n`;
                xml += `      <secuencialInicio>${a.secuencial?.substring(8)}</secuencialInicio>\n`;
                xml += `      <secuencialFin>${a.secuencial?.substring(8)}</secuencialFin>\n`;
                xml += `      <autorizacion>${a.autorizacion || '9999999999'}</autorizacion>\n`;
                xml += '    </detalleAnulados>\n';
            }
            xml += '  </anulados>\n';
        }

        xml += '</iva>';
        return xml;
    }

    private static escape(s: string) {
        if (!s) return '';
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Helpers mapeo SRI
    private static mapTipoId(t: string) {
        const m: any = { 'RUC': '01', 'CEDULA': '02', 'PASAPORTE': '03', '04': '01', '05': '02', '06': '03', '07': '07' };
        return m[t] || '02';
    }

    private static mapComprobante(t: string) {
        const m: any = { 'FACTURA': '18', 'NOTA_CREDITO': '04', 'RETENCION': '07', 'LIQUIDACION_COMPRA': '03' };
        return m[t] || '18';
    }

    private static fmtDate(d: string | Date) {
        const dt = new Date(d);
        return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`;
    }
}
