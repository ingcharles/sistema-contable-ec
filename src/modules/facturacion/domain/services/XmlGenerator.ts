/**
 * Servicio para la generación de XML de comprobantes electrónicos (SRI Ecuador)
 * Cumple con la Ficha Técnica v2.3.2
 */

export class XmlGenerator {
    /**
     * Genera el XML completo para una Factura (01)
     */
    static generateFacturaXml(data: any): string {
        const accessKey = data.infoTributaria.claveAcceso || this.generateAccessKey(data);

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<factura id="comprobante" version="1.1.0">\n';

        xml += this.generateInfoTributaria(data.infoTributaria, accessKey);

        // Info Factura
        xml += '  <infoFactura>\n';
        xml += `    <fechaEmision>${data.infoFactura.fechaEmision}</fechaEmision>\n`;
        xml += `    <dirEstablecimiento>${this.escapeXml(data.infoFactura.dirEstablecimiento)}</dirEstablecimiento>\n`;
        if (data.infoFactura.contribuyenteEspecial) {
            xml += `    <contribuyenteEspecial>${data.infoFactura.contribuyenteEspecial}</contribuyenteEspecial>\n`;
        }
        xml += `    <obligadoContabilidad>${data.infoFactura.obligadoContabilidad}</obligadoContabilidad>\n`;
        xml += `    <tipoIdentificacionAdquirente>${data.infoFactura.tipoIdentificacionAdquirente}</tipoIdentificacionAdquirente>\n`;
        xml += `    <razonSocialAdquirente>${this.escapeXml(data.infoFactura.razonSocialAdquirente)}</razonSocialAdquirente>\n`;
        xml += `    <identificacionAdquirente>${data.infoFactura.identificacionAdquirente}</identificacionAdquirente>\n`;
        if (data.infoFactura.direccionAdquirente) {
            xml += `    <direccionAdquirente>${this.escapeXml(data.infoFactura.direccionAdquirente)}</direccionAdquirente>\n`;
        }
        xml += `    <totalSinImpuestos>${data.infoFactura.totalSinImpuestos.toFixed(2)}</totalSinImpuestos>\n`;
        xml += `    <totalDescuento>${data.infoFactura.totalDescuento.toFixed(2)}</totalDescuento>\n`;

        // Total con Impuestos
        xml += '    <totalConImpuestos>\n';
        data.infoFactura.totalConImpuestos.forEach((imp: any) => {
            xml += '      <totalImpuesto>\n';
            xml += `        <codigo>${imp.codigo}</codigo>\n`;
            xml += `        <codigoPorcentaje>${imp.codigoPorcentaje}</codigoPorcentaje>\n`;
            xml += `        <baseImponible>${imp.baseImponible.toFixed(2)}</baseImponible>\n`;
            xml += `        <valor>${imp.valor.toFixed(2)}</valor>\n`;
            xml += '      </totalImpuesto>\n';
        });
        xml += '    </totalConImpuestos>\n';

        xml += `    <propina>${data.infoFactura.propina.toFixed(2)}</propina>\n`;
        xml += `    <importeTotal>${data.infoFactura.importeTotal.toFixed(2)}</importeTotal>\n`;
        xml += `    <moneda>${data.infoFactura.moneda}</moneda>\n`;

        // Pagos
        xml += '    <pagos>\n';
        data.infoFactura.pagos.forEach((pago: any) => {
            xml += '      <pago>\n';
            xml += `        <formaPago>${pago.formaPago}</formaPago>\n`;
            xml += `        <total>${pago.total.toFixed(2)}</total>\n`;
            if (pago.plazo) {
                xml += `        <plazo>${pago.plazo}</plazo>\n`;
                xml += `        <unidadTiempo>${pago.unidadTiempo || 'dias'}</unidadTiempo>\n`;
            }
            xml += '      </pago>\n';
        });
        xml += '    </pagos>\n';
        xml += '  </infoFactura>\n';

        // Detalles
        xml += '  <detalles>\n';
        data.detalles.forEach((det: any) => {
            xml += '    <detalle>\n';
            xml += `      <codigoPrincipal>${this.escapeXml(det.codigoPrincipal)}</codigoPrincipal>\n`;
            if (det.codigoAuxiliar) {
                xml += `      <codigoAuxiliar>${this.escapeXml(det.codigoAuxiliar)}</codigoAuxiliar>\n`;
            }
            xml += `      <descripcion>${this.escapeXml(det.descripcion)}</descripcion>\n`;
            xml += `      <cantidad>${det.cantidad.toFixed(2)}</cantidad>\n`;
            xml += `      <precioUnitario>${det.precioUnitario.toFixed(6)}</precioUnitario>\n`;
            xml += `      <descuento>${det.descuento.toFixed(2)}</descuento>\n`;
            xml += `      <precioTotalSinImpuesto>${det.precioTotalSinImpuesto.toFixed(2)}</precioTotalSinImpuesto>\n`;

            xml += '      <impuestos>\n';
            det.impuestos.forEach((imp: any) => {
                xml += '        <impuesto>\n';
                xml += `          <codigo>${imp.codigo}</codigo>\n`;
                xml += `          <codigoPorcentaje>${imp.codigoPorcentaje}</codigoPorcentaje>\n`;
                xml += `          <tarifa>${imp.tarifa}</tarifa>\n`;
                xml += `          <baseImponible>${imp.baseImponible.toFixed(2)}</baseImponible>\n`;
                xml += `          <valor>${imp.valor.toFixed(2)}</valor>\n`;
                xml += '        </impuesto>\n';
            });
            xml += '      </impuestos>\n';
            xml += '    </detalle>\n';
        });
        xml += '  </detalles>\n';

        xml += '</factura>';
        return xml;
    }

    /**
     * Genera el XML completo para una Liquidación de Compra (03)
     */
    static generateLiquidacionXml(data: any): string {
        const accessKey = data.infoTributaria.claveAcceso || this.generateAccessKey(data);

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<liquidacionCompra id="comprobante" version="1.1.0">\n';

        xml += this.generateInfoTributaria(data.infoTributaria, accessKey);

        // Info Liquidación Compra
        xml += '  <infoLiquidacionCompra>\n';
        xml += `    <fechaEmision>${data.infoLiquidacionCompra.fechaEmision}</fechaEmision>\n`;
        xml += `    <dirEstablecimiento>${this.escapeXml(data.infoLiquidacionCompra.dirEstablecimiento)}</dirEstablecimiento>\n`;
        if (data.infoLiquidacionCompra.contribuyenteEspecial) {
            xml += `    <contribuyenteEspecial>${data.infoLiquidacionCompra.contribuyenteEspecial}</contribuyenteEspecial>\n`;
        }
        xml += `    <obligadoContabilidad>${data.infoLiquidacionCompra.obligadoContabilidad}</obligadoContabilidad>\n`;
        xml += `    <tipoIdentificacionProveedor>${data.infoLiquidacionCompra.tipoIdentificacionProveedor}</tipoIdentificacionProveedor>\n`;
        xml += `    <razonSocialProveedor>${this.escapeXml(data.infoLiquidacionCompra.razonSocialProveedor)}</razonSocialProveedor>\n`;
        xml += `    <identificacionProveedor>${data.infoLiquidacionCompra.identificacionProveedor}</identificacionProveedor>\n`;
        if (data.infoLiquidacionCompra.direccionProveedor) {
            xml += `    <direccionProveedor>${this.escapeXml(data.infoLiquidacionCompra.direccionProveedor)}</direccionProveedor>\n`;
        }
        xml += `    <totalSinImpuestos>${data.infoLiquidacionCompra.totalSinImpuestos.toFixed(2)}</totalSinImpuestos>\n`;
        xml += `    <totalDescuento>${data.infoLiquidacionCompra.totalDescuento.toFixed(2)}</totalDescuento>\n`;

        // Total con Impuestos
        xml += '    <totalConImpuestos>\n';
        data.infoLiquidacionCompra.totalConImpuestos.forEach((imp: any) => {
            xml += '      <totalImpuesto>\n';
            xml += `        <codigo>${imp.codigo}</codigo>\n`;
            xml += `        <codigoPorcentaje>${imp.codigoPorcentaje}</codigoPorcentaje>\n`;
            xml += `        <baseImponible>${imp.baseImponible.toFixed(2)}</baseImponible>\n`;
            xml += `        <valor>${imp.valor.toFixed(2)}</valor>\n`;
            xml += '      </totalImpuesto>\n';
        });
        xml += '    </totalConImpuestos>\n';

        xml += `    <importeTotal>${data.infoLiquidacionCompra.importeTotal.toFixed(2)}</importeTotal>\n`;
        xml += `    <moneda>${data.infoLiquidacionCompra.moneda}</moneda>\n`;

        // Pagos
        xml += '    <pagos>\n';
        data.infoLiquidacionCompra.pagos.forEach((pago: any) => {
            xml += '      <pago>\n';
            xml += `        <formaPago>${pago.formaPago}</formaPago>\n`;
            xml += `        <total>${pago.total.toFixed(2)}</total>\n`;
            if (pago.plazo) {
                xml += `        <plazo>${pago.plazo}</plazo>\n`;
                xml += `        <unidadTiempo>${pago.unidadTiempo || 'dias'}</unidadTiempo>\n`;
            }
            xml += '      </pago>\n';
        });
        xml += '    </pagos>\n';
        xml += '  </infoLiquidacionCompra>\n';

        // Detalles
        xml += '  <detalles>\n';
        data.detalles.forEach((det: any) => {
            xml += '    <detalle>\n';
            xml += `      <codigoPrincipal>${this.escapeXml(det.codigoPrincipal)}</codigoPrincipal>\n`;
            xml += `      <descripcion>${this.escapeXml(det.descripcion)}</descripcion>\n`;
            xml += `      <cantidad>${det.cantidad.toFixed(2)}</cantidad>\n`;
            xml += `      <precioUnitario>${det.precioUnitario.toFixed(6)}</precioUnitario>\n`;
            xml += `      <descuento>${det.descuento.toFixed(2)}</descuento>\n`;
            xml += `      <precioTotalSinImpuesto>${det.precioTotalSinImpuesto.toFixed(2)}</precioTotalSinImpuesto>\n`;

            xml += '      <impuestos>\n';
            det.impuestos.forEach((imp: any) => {
                xml += '        <impuesto>\n';
                xml += `          <codigo>${imp.codigo}</codigo>\n`;
                xml += `          <codigoPorcentaje>${imp.codigoPorcentaje}</codigoPorcentaje>\n`;
                xml += `          <tarifa>${imp.tarifa}</tarifa>\n`;
                xml += `          <baseImponible>${imp.baseImponible.toFixed(2)}</baseImponible>\n`;
                xml += `          <valor>${imp.valor.toFixed(2)}</valor>\n`;
                xml += '        </impuesto>\n';
            });
            xml += '      </impuestos>\n';
            xml += '    </detalle>\n';
        });
        xml += '  </detalles>\n';

        xml += '</liquidacionCompra>';
        return xml;
    }

    /**
     * Genera el XML completo para una Nota de Crédito (04)
     */
    static generateNotaCreditoXml(data: any): string {
        const accessKey = data.infoTributaria.claveAcceso || this.generateAccessKey(data);

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<notaCredito id="comprobante" version="1.1.0">\n';

        xml += this.generateInfoTributaria(data.infoTributaria, accessKey);

        // Info Nota Crédito
        xml += '  <infoNotaCredito>\n';
        xml += `    <fechaEmision>${data.infoNotaCredito.fechaEmision}</fechaEmision>\n`;
        xml += `    <dirEstablecimiento>${this.escapeXml(data.infoNotaCredito.dirEstablecimiento)}</dirEstablecimiento>\n`;
        xml += `    <tipoIdentificacionAdquirente>${data.infoNotaCredito.tipoIdentificacionAdquirente}</tipoIdentificacionAdquirente>\n`;
        xml += `    <razonSocialAdquirente>${this.escapeXml(data.infoNotaCredito.razonSocialAdquirente)}</razonSocialAdquirente>\n`;
        xml += `    <identificacionAdquirente>${data.infoNotaCredito.identificacionAdquirente}</identificacionAdquirente>\n`;
        if (data.infoNotaCredito.contribuyenteEspecial) {
            xml += `    <contribuyenteEspecial>${data.infoNotaCredito.contribuyenteEspecial}</contribuyenteEspecial>\n`;
        }
        xml += `    <obligadoContabilidad>${data.infoNotaCredito.obligadoContabilidad}</obligadoContabilidad>\n`;
        xml += `    <codDocModificado>${data.infoNotaCredito.codDocModificado}</codDocModificado>\n`;
        xml += `    <numDocModificado>${data.infoNotaCredito.numDocModificado}</numDocModificado>\n`;
        xml += `    <fechaEmisionDocSustento>${data.infoNotaCredito.fechaEmisionDocSustento}</fechaEmisionDocSustento>\n`;
        xml += `    <totalSinImpuestos>${data.infoNotaCredito.totalSinImpuestos.toFixed(2)}</totalSinImpuestos>\n`;
        xml += `    <valorModificacion>${data.infoNotaCredito.valorModificacion.toFixed(2)}</valorModificacion>\n`;
        xml += `    <moneda>${data.infoNotaCredito.moneda}</moneda>\n`;

        // Total con Impuestos
        xml += '    <totalConImpuestos>\n';
        data.infoNotaCredito.totalConImpuestos.forEach((imp: any) => {
            xml += '      <totalImpuesto>\n';
            xml += `        <codigo>${imp.codigo}</codigo>\n`;
            xml += `        <codigoPorcentaje>${imp.codigoPorcentaje}</codigoPorcentaje>\n`;
            xml += `        <baseImponible>${imp.baseImponible.toFixed(2)}</baseImponible>\n`;
            xml += `        <valor>${imp.valor.toFixed(2)}</valor>\n`;
            xml += '      </totalImpuesto>\n';
        });
        xml += '    </totalConImpuestos>\n';

        xml += `    <motivo>${this.escapeXml(data.infoNotaCredito.motivo)}</motivo>\n`;
        xml += '  </infoNotaCredito>\n';

        // Detalles
        xml += '  <detalles>\n';
        data.detalles.forEach((det: any) => {
            xml += '    <detalle>\n';
            xml += `      <codigoInterno>${this.escapeXml(det.codigoInterno)}</codigoInterno>\n`;
            xml += `      <descripcion>${this.escapeXml(det.descripcion)}</descripcion>\n`;
            xml += `      <cantidad>${det.cantidad.toFixed(2)}</cantidad>\n`;
            xml += `      <precioUnitario>${det.precioUnitario.toFixed(6)}</precioUnitario>\n`;
            xml += `      <descuento>${det.descuento.toFixed(2)}</descuento>\n`;
            xml += `      <precioTotalSinImpuesto>${det.precioTotalSinImpuesto.toFixed(2)}</precioTotalSinImpuesto>\n`;

            xml += '      <impuestos>\n';
            det.impuestos.forEach((imp: any) => {
                xml += '        <impuesto>\n';
                xml += `          <codigo>${imp.codigo}</codigo>\n`;
                xml += `          <codigoPorcentaje>${imp.codigoPorcentaje}</codigoPorcentaje>\n`;
                xml += `          <tarifa>${imp.tarifa}</tarifa>\n`;
                xml += `          <baseImponible>${imp.baseImponible.toFixed(2)}</baseImponible>\n`;
                xml += `          <valor>${imp.valor.toFixed(2)}</valor>\n`;
                xml += '        </impuesto>\n';
            });
            xml += '      </impuestos>\n';
            xml += '    </detalle>\n';
        });
        xml += '  </detalles>\n';

        xml += '</notaCredito>';
        return xml;
    }

    /**
     * Genera el XML completo para una Nota de Débito (05)
     */
    static generateNotaDebitoXml(data: any): string {
        const accessKey = data.infoTributaria.claveAcceso || this.generateAccessKey(data);

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<notaDebito id="comprobante" version="1.0.0">\n';

        xml += this.generateInfoTributaria(data.infoTributaria, accessKey);

        // Info Nota Débito
        xml += '  <infoNotaDebito>\n';
        xml += `    <fechaEmision>${data.infoNotaDebito.fechaEmision}</fechaEmision>\n`;
        xml += `    <dirEstablecimiento>${this.escapeXml(data.infoNotaDebito.dirEstablecimiento)}</dirEstablecimiento>\n`;
        xml += `    <tipoIdentificacionAdquirente>${data.infoNotaDebito.tipoIdentificacionAdquirente}</tipoIdentificacionAdquirente>\n`;
        xml += `    <razonSocialAdquirente>${this.escapeXml(data.infoNotaDebito.razonSocialAdquirente)}</razonSocialAdquirente>\n`;
        xml += `    <identificacionAdquirente>${data.infoNotaDebito.identificacionAdquirente}</identificacionAdquirente>\n`;
        if (data.infoNotaDebito.contribuyenteEspecial) {
            xml += `    <contribuyenteEspecial>${data.infoNotaDebito.contribuyenteEspecial}</contribuyenteEspecial>\n`;
        }
        xml += `    <obligadoContabilidad>${data.infoNotaDebito.obligadoContabilidad}</obligadoContabilidad>\n`;
        xml += `    <codDocModificado>${data.infoNotaDebito.codDocModificado}</codDocModificado>\n`;
        xml += `    <numDocModificado>${data.infoNotaDebito.numDocModificado}</numDocModificado>\n`;
        xml += `    <fechaEmisionDocSustento>${data.infoNotaDebito.fechaEmisionDocSustento}</fechaEmisionDocSustento>\n`;
        xml += `    <totalSinImpuestos>${data.infoNotaDebito.totalSinImpuestos.toFixed(2)}</totalSinImpuestos>\n`;

        // Impuestos
        xml += '    <impuestos>\n';
        data.infoNotaDebito.impuestos.forEach((imp: any) => {
            xml += '      <impuesto>\n';
            xml += `        <codigo>${imp.codigo}</codigo>\n`;
            xml += `        <codigoPorcentaje>${imp.codigoPorcentaje}</codigoPorcentaje>\n`;
            xml += `        <tarifa>${imp.tarifa}</tarifa>\n`;
            xml += `        <baseImponible>${imp.baseImponible.toFixed(2)}</baseImponible>\n`;
            xml += `        <valor>${imp.valor.toFixed(2)}</valor>\n`;
            xml += '      </impuesto>\n';
        });
        xml += '    </impuestos>\n';

        xml += `    <valorTotal>${data.infoNotaDebito.valorTotal.toFixed(2)}</valorTotal>\n`;

        // Pagos
        xml += '    <pagos>\n';
        data.infoNotaDebito.pagos.forEach((pago: any) => {
            xml += '      <pago>\n';
            xml += `        <formaPago>${pago.formaPago}</formaPago>\n`;
            xml += `        <total>${pago.total.toFixed(2)}</total>\n`;
            xml += '      </pago>\n';
        });
        xml += '    </pagos>\n';
        xml += '  </infoNotaDebito>\n';

        // Motivos
        xml += '  <motivos>\n';
        data.motivos.forEach((mot: any) => {
            xml += '    <motivo>\n';
            xml += `      <razon>${this.escapeXml(mot.razon)}</razon>\n`;
            xml += `      <valor>${mot.valor.toFixed(2)}</valor>\n`;
            xml += '    </motivo>\n';
        });
        xml += '  </motivos>\n';

        xml += '</notaDebito>';
        return xml;
    }

    /**
     * Genera el XML completo para un Comprobante de Retención (07)
     */
    static generateRetencionXml(data: any): string {
        const accessKey = data.infoTributaria.claveAcceso || this.generateAccessKey(data);

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<comprobanteRetencion id="comprobante" version="1.0.0">\n';

        xml += this.generateInfoTributaria(data.infoTributaria, accessKey);

        // Info Comp Retencion
        xml += '  <infoCompRetencion>\n';
        xml += `    <fechaEmision>${data.infoCompRetencion.fechaEmision}</fechaEmision>\n`;
        xml += `    <dirEstablecimiento>${this.escapeXml(data.infoCompRetencion.dirEstablecimiento)}</dirEstablecimiento>\n`;
        if (data.infoCompRetencion.contribuyenteEspecial) {
            xml += `    <contribuyenteEspecial>${data.infoCompRetencion.contribuyenteEspecial}</contribuyenteEspecial>\n`;
        }
        xml += `    <obligadoContabilidad>${data.infoCompRetencion.obligadoContabilidad}</obligadoContabilidad>\n`;
        xml += `    <tipoIdentificacionSujetoRetenido>${data.infoCompRetencion.tipoIdentificacionSujetoRetenido}</tipoIdentificacionSujetoRetenido>\n`;
        xml += `    <razonSocialSujetoRetenido>${this.escapeXml(data.infoCompRetencion.razonSocialSujetoRetenido)}</razonSocialSujetoRetenido>\n`;
        xml += `    <identificacionSujetoRetenido>${data.infoCompRetencion.identificacionSujetoRetenido}</identificacionSujetoRetenido>\n`;
        xml += `    <periodoFiscal>${data.infoCompRetencion.periodoFiscal}</periodoFiscal>\n`;
        xml += '  </infoCompRetencion>\n';

        // Impuestos
        xml += '  <impuestos>\n';
        data.impuestos.forEach((imp: any) => {
            xml += '    <impuesto>\n';
            xml += `      <codigo>${imp.codigo}</codigo>\n`;
            xml += `      <codigoRetencion>${imp.codigoRetencion}</codigoRetencion>\n`;
            xml += `      <baseImponible>${imp.baseImponible.toFixed(2)}</baseImponible>\n`;
            xml += `      <porcentajeRetener>${imp.porcentajeRetener}</porcentajeRetener>\n`;
            xml += `      <valorRetenido>${imp.valorRetenido.toFixed(2)}</valorRetenido>\n`;
            xml += `      <codDocSustento>${imp.codDocSustento}</codDocSustento>\n`;
            xml += `      <numDocSustento>${imp.numDocSustento}</numDocSustento>\n`;
            xml += `      <fechaEmisionDocSustento>${imp.fechaEmisionDocSustento}</fechaEmisionDocSustento>\n`;
            xml += '    </impuesto>\n';
        });
        xml += '  </impuestos>\n';

        xml += '</comprobanteRetencion>';
        return xml;
    }

    /**
     * Genera el XML completo para una Guía de Remisión (06)
     */
    static generateGuiaXml(data: any): string {
        const accessKey = data.infoTributaria.claveAcceso || this.generateAccessKey(data);

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<guiaRemision id="comprobante" version="1.1.0">\n';

        xml += this.generateInfoTributaria(data.infoTributaria, accessKey);

        // Info Guía Remisión
        xml += '  <infoGuiaRemision>\n';
        xml += `    <dirEstablecimiento>${this.escapeXml(data.infoGuiaRemision.dirEstablecimiento)}</dirEstablecimiento>\n`;
        xml += `    <dirPartida>${this.escapeXml(data.infoGuiaRemision.dirPartida)}</dirPartida>\n`;
        xml += `    <razonSocialTransportista>${this.escapeXml(data.infoGuiaRemision.razonSocialTransportista)}</razonSocialTransportista>\n`;
        xml += `    <tipoIdentificacionTransportista>${data.infoGuiaRemision.tipoIdentificacionTransportista}</tipoIdentificacionTransportista>\n`;
        xml += `    <rucTransportista>${data.infoGuiaRemision.rucTransportista}</rucTransportista>\n`;
        if (data.infoGuiaRemision.contribuyenteEspecial) {
            xml += `    <contribuyenteEspecial>${data.infoGuiaRemision.contribuyenteEspecial}</contribuyenteEspecial>\n`;
        }
        xml += `    <obligadoContabilidad>${data.infoGuiaRemision.obligadoContabilidad}</obligadoContabilidad>\n`;
        xml += `    <fechaIniTraslado>${data.infoGuiaRemision.fechaIniTraslado}</fechaIniTraslado>\n`;
        xml += `    <fechaFinTraslado>${data.infoGuiaRemision.fechaFinTraslado}</fechaFinTraslado>\n`;
        xml += `    <placa>${this.escapeXml(data.infoGuiaRemision.placa)}</placa>\n`;
        xml += '  </infoGuiaRemision>\n';

        // Destinatarios
        xml += '  <destinatarios>\n';
        data.destinatarios.forEach((dest: any) => {
            xml += '    <destinatario>\n';
            xml += `      <identificacionDestinatario>${dest.identificacionDestinatario}</identificacionDestinatario>\n`;
            xml += `      <razonSocialDestinatario>${this.escapeXml(dest.razonSocialDestinatario)}</razonSocialDestinatario>\n`;
            xml += `      <dirDestinatario>${this.escapeXml(dest.dirDestinatario)}</dirDestinatario>\n`;
            xml += `      <motivoTraslado>${this.escapeXml(dest.motivoTraslado)}</motivoTraslado>\n`;
            if (dest.docAduaneroUnico) xml += `      <docAduaneroUnico>${dest.docAduaneroUnico}</docAduaneroUnico>\n`;
            if (dest.codEstabDestino) xml += `      <codEstabDestino>${dest.codEstabDestino}</codEstabDestino>\n`;
            if (dest.ruta) xml += `      <ruta>${this.escapeXml(dest.ruta)}</ruta>\n`;
            if (dest.codDocSustento) xml += `      <codDocSustento>${dest.codDocSustento}</codDocSustento>\n`;
            if (dest.numDocSustento) xml += `      <numDocSustento>${dest.numDocSustento}</numDocSustento>\n`;
            if (dest.numAutDocSustento) xml += `      <numAutDocSustento>${dest.numAutDocSustento}</numAutDocSustento>\n`;
            if (dest.fechaEmisionDocSustento) xml += `      <fechaEmisionDocSustento>${dest.fechaEmisionDocSustento}</fechaEmisionDocSustento>\n`;

            xml += '      <detalles>\n';
            dest.detalles.forEach((det: any) => {
                xml += '        <detalle>\n';
                xml += `          <codigoInterno>${this.escapeXml(det.codigoInterno)}</codigoInterno>\n`;
                if (det.codigoAdicional) xml += `          <codigoAdicional>${this.escapeXml(det.codigoAdicional)}</codigoAdicional>\n`;
                xml += `          <descripcion>${this.escapeXml(det.descripcion)}</descripcion>\n`;
                xml += `          <cantidad>${det.cantidad.toFixed(2)}</cantidad>\n`;
                xml += '        </detalle>\n';
            });
            xml += '      </detalles>\n';
            xml += '    </destinatario>\n';
        });
        xml += '  </destinatarios>\n';

        xml += '</guiaRemision>';
        return xml;
    }

    /**
     * Genera la sección de Info Tributaria compartida por todos los documentos
     */
    private static generateInfoTributaria(info: any, accessKey: string): string {
        let xml = '  <infoTributaria>\n';
        xml += `    <ambiente>${info.ambiente}</ambiente>\n`;
        xml += `    <tipoEmision>${info.tipoEmision}</tipoEmision>\n`;
        xml += `    <razonSocial>${this.escapeXml(info.razonSocial)}</razonSocial>\n`;
        xml += `    <nombreComercial>${this.escapeXml(info.nombreComercial || info.razonSocial)}</nombreComercial>\n`;
        xml += `    <ruc>${info.ruc}</ruc>\n`;
        xml += `    <claveAcceso>${accessKey}</claveAcceso>\n`;
        xml += `    <codDoc>${info.codDoc}</codDoc>\n`;
        xml += `    <estab>${info.estab}</estab>\n`;
        xml += `    <ptoEmi>${info.ptoEmi}</ptoEmi>\n`;
        xml += `    <secuencial>${info.secuencial}</secuencial>\n`;
        xml += `    <dirMatriz>${this.escapeXml(info.dirMatriz)}</dirMatriz>\n`;
        if (info.regimenMicroempresas) {
            xml += '    <regimenMicroempresas>CONTRIBUYENTE RÉGIMEN MICROEMPRESAS</regimenMicroempresas>\n';
        }
        if (info.agenteRetencion) {
            xml += `    <agenteRetencion>${info.agenteRetencion}</agenteRetencion>\n`;
        }
        xml += '  </infoTributaria>\n';
        return xml;
    }

    /**
     * Genera la Clave de Acceso del SRI (49 dígitos)
     */
    static generateAccessKey(data: any): string {
        const info = data.infoTributaria;
        // La fecha depende de la sección de info del documento específico
        const infoDoc = data.infoFactura || data.infoLiquidacionCompra || data.infoCompRetencion || data.infoNotaCredito || data.infoGuiaRemision;
        const fechaEmision = infoDoc.fechaEmision || infoDoc.fechaIniTraslado;
        const date = fechaEmision.replace(/\//g, '').replace(/-/g, '');

        const ruc = info.ruc;
        const codDoc = info.codDoc;
        const ambiente = info.ambiente;
        const serie = info.estab + info.ptoEmi;
        const secuencial = info.secuencial;
        const codigoNumerico = '12345678'; // Sugerido random en producción
        const tipoEmision = info.tipoEmision;

        let key = `${date}${codDoc}${ruc}${ambiente}${serie}${secuencial}${codigoNumerico}${tipoEmision}`;

        const dv = this.calculateModulo11(key);
        return `${key}${dv}`;
    }

    private static calculateModulo11(key: string): number {
        let sum = 0;
        let factor = 2;

        for (let i = key.length - 1; i >= 0; i--) {
            sum += parseInt(key.charAt(i), 10) * factor;
            factor = factor === 7 ? 2 : factor + 1;
        }

        const verifier = 11 - (sum % 11);
        if (verifier === 11) return 0;
        if (verifier === 10) return 1;
        return verifier;
    }

    private static escapeXml(unsafe: string): string {
        if (!unsafe) return '';
        return unsafe.replace(/[<>&"']/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '"': return '&quot;';
                case "'": return '&apos;';
                default: return c;
            }
        });
    }
}

