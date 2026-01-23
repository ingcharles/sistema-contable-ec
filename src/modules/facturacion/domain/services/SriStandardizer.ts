import { FacturaViewModel, DetalleFactura } from '../FacturaViewModel';
import { CODIGO_IMPUESTO } from '../../domain/catalogos';

export class SriStandardizer {
    /**
     * Genera el JSON estandarizado para una Factura (Doc 01)
     */
    static standardizeFactura(data: FacturaViewModel, generalIva: number = 15) {
        return {
            infoTributaria: {
                ambiente: data.ambiente,
                tipoEmision: data.tipoEmision,
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial || '',
                ruc: data.ruc,
                claveAcceso: data.claveAcceso || '', // Se genera en el backend usualmente
                codDoc: '01',
                estab: data.estab.padStart(3, '0'),
                ptoEmi: data.ptoEmi.padStart(3, '0'),
                secuencial: data.secuencial.padStart(9, '0'),
                dirMatriz: data.dirMatriz
            },
            infoFactura: {
                fechaEmision: this.formatDate(data.fechaEmision),
                dirEstablecimiento: data.dirEstablecimiento || data.dirMatriz,
                contribuyenteEspecial: data.contribuyenteEspecial,
                obligadoContabilidad: data.obligadoContabilidad,
                tipoIdentificacionAdquirente: data.tipoIdentificacionAdquirente,
                razonSocialAdquirente: data.razonSocialAdquirente,
                identificacionAdquirente: data.identificacionAdquirente,
                direccionAdquirente: data.direccionAdquirente || '',
                totalSinImpuestos: Number(data.totalSinImpuestos.toFixed(2)),
                totalDescuento: Number(data.totalDescuento.toFixed(2)),
                totalConImpuestos: this.summarizeTaxes(data.detalles),
                propina: 0.00,
                importeTotal: Number(data.importeTotal.toFixed(2)),
                moneda: 'DOLAR',
                pagos: data.pagos.map(p => ({
                    formaPago: p.formaPago,
                    total: Number(p.total.toFixed(2)),
                    plazo: p.plazo || 0,
                    unidadTiempo: p.unidadTiempo || 'dias'
                }))
            },
            detalles: data.detalles.map(d => ({
                codigoPrincipal: d.codigoPrincipal,
                codigoAuxiliar: d.codigoAuxiliar || '',
                descripcion: d.descripcion,
                cantidad: Number(d.cantidad.toFixed(2)),
                precioUnitario: Number(d.precioUnitario.toFixed(6)),
                descuento: Number(d.descuento.toFixed(2)),
                precioTotalSinImpuesto: Number(d.baseImponible.toFixed(2)),
                impuestos: [
                    {
                        codigo: CODIGO_IMPUESTO.IVA,
                        codigoPorcentaje: d.codigoIVA,
                        tarifa: this.getTarifaValue(d.codigoIVA, generalIva),
                        baseImponible: Number(d.baseImponible.toFixed(2)),
                        valor: Number(d.valorIVA.toFixed(2))
                    }
                ]
            }))
        };
    }

    /**
     * Genera el JSON estandarizado para una Liquidación de Compra (Doc 03)
     */
    static standardizeLiquidacion(data: any, generalIva: number = 15) {
        return {
            infoTributaria: {
                ambiente: data.ambiente,
                tipoEmision: data.tipoEmision,
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial || '',
                ruc: data.ruc,
                codDoc: '03',
                estab: data.estab.padStart(3, '0'),
                ptoEmi: data.ptoEmi.padStart(3, '0'),
                secuencial: data.secuencial.padStart(9, '0'),
                dirMatriz: data.dirMatriz
            },
            infoLiquidacionCompra: {
                fechaEmision: this.formatDate(data.fechaEmision),
                dirEstablecimiento: data.dirEstablecimiento || data.dirMatriz,
                obligadoContabilidad: data.obligadoContabilidad,
                tipoIdentificacionProveedor: data.tipoIdentificacionProveedor,
                razonSocialProveedor: data.razonSocialProveedor,
                identificacionProveedor: data.identificacionProveedor,
                direccionProveedor: data.direccionProveedor || '',
                totalSinImpuestos: Number(data.totalSinImpuestos.toFixed(2)),
                totalDescuento: Number(data.totalDescuento.toFixed(2)),
                totalConImpuestos: this.summarizeTaxes(data.detalles),
                importeTotal: Number(data.importeTotal.toFixed(2)),
                moneda: 'DOLAR',
                pagos: data.pagos.map((p: any) => ({
                    formaPago: p.formaPago,
                    total: Number(p.total.toFixed(2)),
                    plazo: p.plazo || 0,
                    unidadTiempo: p.unidadTiempo || 'dias'
                }))
            },
            detalles: data.detalles.map((d: any) => ({
                codigoPrincipal: d.codigoPrincipal,
                descripcion: d.descripcion,
                cantidad: Number(d.cantidad.toFixed(2)),
                precioUnitario: Number(d.precioUnitario.toFixed(6)),
                descuento: Number(d.descuento.toFixed(2)),
                precioTotalSinImpuesto: Number(d.baseImponible.toFixed(2)),
                impuestos: [
                    {
                        codigo: CODIGO_IMPUESTO.IVA,
                        codigoPorcentaje: d.codigoIVA,
                        tarifa: this.getTarifaValue(d.codigoIVA, generalIva),
                        baseImponible: Number(d.baseImponible.toFixed(2)),
                        valor: Number(d.valorIVA.toFixed(2))
                    }
                ]
            }))
        };
    }

    /**
     * Genera el JSON estandarizado para una Nota de Crédito (Doc 04)
     */
    static standardizeNotaCredito(data: any, generalIva: number = 15) {
        return {
            infoTributaria: {
                ambiente: data.ambiente,
                tipoEmision: data.tipoEmision,
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial || '',
                ruc: data.ruc,
                codDoc: '04',
                estab: data.estab.padStart(3, '0'),
                ptoEmi: data.ptoEmi.padStart(3, '0'),
                secuencial: data.secuencial.padStart(9, '0'),
                dirMatriz: data.dirMatriz
            },
            infoNotaCredito: {
                fechaEmision: this.formatDate(data.fechaEmision),
                dirEstablecimiento: data.dirEstablecimiento || data.dirMatriz,
                obligadoContabilidad: data.obligadoContabilidad,
                tipoIdentificacionAdquirente: data.tipoIdentificacionAdquirente,
                razonSocialAdquirente: data.razonSocialAdquirente,
                identificacionAdquirente: data.identificacionAdquirente,
                codDocModificado: data.codDocModificado,
                numDocModificado: data.numDocModificado,
                fechaEmisionDocSustento: this.formatDate(data.fechaEmisionDocSustento),
                totalSinImpuestos: Number(data.totalSinImpuestos.toFixed(2)),
                valorModificacion: Number(data.valorModificacion.toFixed(2)),
                moneda: 'DOLAR',
                totalConImpuestos: this.summarizeTaxes(data.detalles),
                motivo: data.motivo
            },
            detalles: data.detalles.map((d: any) => ({
                codigoInterno: d.codigoPrincipal,
                descripcion: d.descripcion,
                cantidad: Number(d.cantidad.toFixed(2)),
                precioUnitario: Number(d.precioUnitario.toFixed(6)),
                descuento: Number(d.descuento.toFixed(2)),
                precioTotalSinImpuesto: Number(d.baseImponible.toFixed(2)),
                impuestos: [
                    {
                        codigo: CODIGO_IMPUESTO.IVA,
                        codigoPorcentaje: d.codigoIVA,
                        tarifa: this.getTarifaValue(d.codigoIVA, generalIva),
                        baseImponible: Number(d.baseImponible.toFixed(2)),
                        valor: Number(d.valorIVA.toFixed(2))
                    }
                ]
            }))
        };
    }

    /**
     * Genera el JSON estandarizado para una Nota de Débito (Doc 05)
     */
    static standardizeNotaDebito(data: any, generalIva: number = 15) {
        return {
            infoTributaria: {
                ambiente: data.ambiente,
                tipoEmision: data.tipoEmision,
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial || '',
                ruc: data.ruc,
                codDoc: '05',
                estab: data.estab.padStart(3, '0'),
                ptoEmi: data.ptoEmi.padStart(3, '0'),
                secuencial: data.secuencial.padStart(9, '0'),
                dirMatriz: data.dirMatriz
            },
            infoNotaDebito: {
                fechaEmision: this.formatDate(data.fechaEmision),
                dirEstablecimiento: data.dirEstablecimiento || data.dirMatriz,
                obligadoContabilidad: data.obligadoContabilidad,
                tipoIdentificacionAdquirente: data.tipoIdentificacionAdquirente,
                razonSocialAdquirente: data.razonSocialAdquirente,
                identificacionAdquirente: data.identificacionAdquirente,
                codDocModificado: data.codDocModificado,
                numDocModificado: data.numDocModificado,
                fechaEmisionDocSustento: this.formatDate(data.fechaEmisionDocSustento),
                totalSinImpuestos: Number(data.totalSinImpuestos.toFixed(2)),
                impuestos: [
                    {
                        codigo: CODIGO_IMPUESTO.IVA,
                        codigoPorcentaje: data.codigoIVA,
                        tarifa: this.getTarifaValue(data.codigoIVA, generalIva),
                        baseImponible: Number(data.totalSinImpuestos.toFixed(2)),
                        valor: Number(data.valorIVA.toFixed(2))
                    }
                ],
                valorTotal: Number(data.valorTotal.toFixed(2)),
                pagos: data.pagos?.map((p: any) => ({
                    formaPago: p.formaPago,
                    total: Number(p.total.toFixed(2))
                })) || []
            },
            motivos: data.motivos?.map((m: any) => ({
                razon: m.razon,
                valor: Number(m.valor.toFixed(2))
            })) || []
        };
    }

    /**
     * Genera el JSON estandarizado para un Comprobante de Retención (Doc 07)
     */
    static standardizeRetencion(data: any) {
        return {
            infoTributaria: {
                ambiente: data.ambiente,
                tipoEmision: data.tipoEmision,
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial || '',
                ruc: data.ruc,
                codDoc: '07',
                estab: data.estab.padStart(3, '0'),
                ptoEmi: data.ptoEmi.padStart(3, '0'),
                secuencial: data.secuencial.padStart(9, '0'),
                dirMatriz: data.dirMatriz
            },
            infoCompRetencion: {
                fechaEmision: this.formatDate(data.fechaEmision),
                dirEstablecimiento: data.dirEstablecimiento || data.dirMatriz,
                obligadoContabilidad: data.obligadoContabilidad,
                tipoIdentificacionSujetoRetenido: data.tipoIdentificacionSujetoRetenido,
                razonSocialSujetoRetenido: data.razonSocialSujetoRetenido,
                identificacionSujetoRetenido: data.identificacionSujetoRetenido,
                periodoFiscal: data.periodoFiscal
            },
            impuestos: data.impuestos.map((imp: any) => ({
                codigo: imp.codigo,
                codigoRetencion: imp.codigoRetencion,
                baseImponible: Number(imp.baseImponible.toFixed(2)),
                porcentajeRetener: imp.porcentajeRetener,
                valorRetenido: Number(imp.valorRetenido.toFixed(2)),
                codDocSustento: imp.codDocSustento,
                numDocSustento: imp.numDocSustento,
                fechaEmisionDocSustento: this.formatDate(imp.fechaEmisionDocSustento)
            }))
        };
    }

    /**
     * Genera el JSON estandarizado para una Guía de Remisión (Doc 06)
     */
    static standardizeGuia(data: any) {
        return {
            infoTributaria: {
                ambiente: data.ambiente,
                tipoEmision: data.tipoEmision,
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial || '',
                ruc: data.ruc,
                codDoc: '06',
                estab: data.estab.padStart(3, '0'),
                ptoEmi: data.ptoEmi.padStart(3, '0'),
                secuencial: data.secuencial.padStart(9, '0'),
                dirMatriz: data.dirMatriz
            },
            infoGuiaRemision: {
                dirEstablecimiento: data.dirEstablecimiento || data.dirMatriz,
                dirPartida: data.dirPartida,
                razonSocialTransportista: data.razonSocialTransportista,
                tipoIdentificacionTransportista: data.tipoIdentificacionTransportista,
                rucTransportista: data.rucTransportista,
                obligadoContabilidad: data.obligadoContabilidad,
                contribuyenteEspecial: data.contribuyenteEspecial,
                fechaIniTraslado: this.formatDate(data.fechaIniTraslado),
                fechaFinTraslado: this.formatDate(data.fechaFinTraslado),
                placa: data.placa
            },
            destinatarios: data.destinatarios.map((dest: any) => ({
                identificacionDestinatario: dest.identificacionDestinatario,
                razonSocialDestinatario: dest.razonSocialDestinatario,
                dirDestinatario: dest.dirDestinatario,
                motivoTraslado: dest.motivoTraslado,
                docAduaneroUnico: dest.docAduaneroUnico,
                codEstabDestino: dest.codEstabDestino,
                ruta: dest.ruta,
                codDocSustento: dest.codDocSustento,
                numDocSustento: dest.numDocSustento,
                numAutDocSustento: dest.numAutDocSustento,
                fechaEmisionDocSustento: this.formatDate(dest.fechaEmisionDocSustento),
                detalles: dest.detalles.map((det: any) => ({
                    codigoInterno: det.codigoInterno,
                    codigoAdicional: det.codigoAdicional,
                    descripcion: det.descripcion,
                    cantidad: Number(det.cantidad.toFixed(2))
                }))
            }))
        };
    }

    private static formatDate(dateStr: string): string {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    public static getTarifaValue(codigo: string, generalIva: number = 15): number {
        switch (codigo) {
            case '4': return 15;
            case '2': return generalIva;
            case '0': return 0;
            default: return 0;
        }
    }

    private static summarizeTaxes(detalles: DetalleFactura[]) {
        const resumen: any[] = [];
        const grupos = detalles.reduce((acc: any, d) => {
            const key = d.codigoIVA;
            if (!acc[key]) acc[key] = { base: 0, valor: 0 };
            acc[key].base += d.baseImponible;
            acc[key].valor += d.valorIVA;
            return acc;
        }, {});

        for (const codigoPorcentaje in grupos) {
            resumen.push({
                codigo: CODIGO_IMPUESTO.IVA,
                codigoPorcentaje,
                baseImponible: Number(grupos[codigoPorcentaje].base.toFixed(2)),
                valor: Number(grupos[codigoPorcentaje].valor.toFixed(2))
            });
        }
        return resumen;
    }
}
