import { FacturaViewModel, DetalleFactura } from '../models/FacturaViewModel';
import { CODIGO_IMPUESTO } from '../../domain/catalogos';

export class SriStandardizer {
    /**
     * Genera el JSON estandarizado para una Factura (Doc 01)
     */
    static standardizeFactura(data: FacturaViewModel) {
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
                        tarifa: this.getTarifaValue(d.codigoIVA),
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
    static standardizeLiquidacion(data: any) {
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
                        tarifa: this.getTarifaValue(d.codigoIVA),
                        baseImponible: Number(d.baseImponible.toFixed(2)),
                        valor: Number(d.valorIVA.toFixed(2))
                    }
                ]
            }))
        };
    }

    private static formatDate(dateStr: string): string {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    private static getTarifaValue(codigo: string): number {
        switch (codigo) {
            case '4': return 15;
            case '2': return 12;
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
