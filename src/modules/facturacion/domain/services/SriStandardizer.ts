import { DetalleFactura } from '../FacturaViewModel';
import { isoToSriDate } from '@/shared/utils/dateUtils';

export class SriStandardizer {
    /**
     * Estandariza los datos de una factura
     */
    static standardizeFactura(data: any) {
        // Mapeo robusto de campos (soporta ViewModel y Entidad de DB)
        const identificacion = data.identificacionComprador;
        const razonSocial = data.razonSocialComprador;

        let tipoIdentificacion = data.tipoIdentificacionComprador;
        // Inferencia de tipo de identificación si falta
        // if (!tipoIdentificacion && identificacion) {
        //     if (identificacion === '9999999999999') {
        //         tipoIdentificacion = '07'; // Consumidor Final
        //     } else if (identificacion.length === 13) {
        //         tipoIdentificacion = '04'; // RUC
        //     } else if (identificacion.length === 10) {
        //         tipoIdentificacion = '05'; // CEDULA
        //     } else {
        //         tipoIdentificacion = '06'; // PASAPORTE / OTRO
        //     }
        // }

        return {
            infoTributaria: {
                ambiente: data.ambienteSri || data.ambiente || '1',
                tipoEmision: data.tipoEmisionSri || data.tipoEmision || '1',
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial || '',
                ruc: data.ruc,
                claveAcceso: data.claveAcceso || '',
                codDoc: '01',
                estab: (data.estab || '001').padStart(3, '0'),
                ptoEmi: (data.ptoEmi || '001').padStart(3, '0'),
                secuencial: (data.secuencial || '').toString().padStart(9, '0'),
                dirMatriz: data.dirMatriz
            },
            infoFactura: {
                fechaEmision: this.formatDate(data.fechaEmision),
                dirEstablecimiento: data.dirEstablecimiento || data.dirMatriz,
                contribuyenteEspecial: data.contribuyenteEspecial,
                obligadoContabilidad: data.obligadoContabilidad || 'NO',
                tipoIdentificacionComprador: tipoIdentificacion,
                razonSocialComprador: razonSocial,
                identificacionComprador: identificacion,
                direccionComprador: data.direccionComprador || data.direccion || '',
                totalSinImpuestos: Number((data.totalSinImpuestos || 0).toFixed(2)),
                totalDescuento: Number((data.totalDescuento || 0).toFixed(2)),
                totalConImpuestos: this.summarizeTaxes(data.detalles),
                propina: 0.00,
                importeTotal: Number((data.importeTotal || 0).toFixed(2)),
                moneda: 'DOLAR',
                pagos: (data.pagos || []).map((p: any) => ({
                    formaPago: p.formaPago,
                    total: Number((p.total || 0).toFixed(2)),
                    plazo: p.plazo || 0,
                    unidadTiempo: p.unidadTiempo || 'dias'
                }))
            },
            detalles: (data.detalles || []).map((d: any) => ({
                codigoPrincipal: d.codigoPrincipal,
                codigoAuxiliar: d.codigoAuxiliar || '',
                descripcion: d.descripcion,
                cantidad: Number((d.cantidad || 0).toFixed(2)),
                precioUnitario: Number((d.precioUnitario || 0).toFixed(6)),
                descuento: Number((d.descuento || 0).toFixed(2)),
                precioTotalSinImpuesto: Number((d.baseImponible || (d.cantidad * d.precioUnitario) || 0).toFixed(2)),
                impuestos: [
                    {
                        codigo: '2',
                        codigoPorcentaje: d.codigoIVA || '2',
                        tarifa: d.tarifa ?? 0,
                        baseImponible: Number((d.baseImponible || (d.cantidad * d.precioUnitario) || 0).toFixed(2)),
                        valor: Number((d.valorIVA || ((d.baseImponible || (d.cantidad * d.precioUnitario) || 0) * ((d.tarifa ?? 0) / 100)) || 0).toFixed(2))
                    }
                ]
            })),
            infoAdicional: [
                { nombre: 'Direccion', valor: data.direccionComprador || data.direccion },
                { nombre: 'Email', valor: data.emailComprador || data.email }
            ].filter(i => i.valor)
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
                codDoc: data.codDoc || '03',
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
                        codigo: '2',
                        codigoPorcentaje: d.codigoIVA,
                        tarifa: d.tarifa ?? 0,
                        baseImponible: Number(d.baseImponible.toFixed(2)),
                        valor: Number((d.valorIVA || 0).toFixed(2))
                    }
                ]
            })),
            infoAdicional: [
                { nombre: 'Direccion', valor: data.direccionProveedor || data.direccion || 'N/A' },
                { nombre: 'Email', valor: data.emailProveedor || data.email || 'N/A' }
            ]
        };
    }

    /**
     * Estandariza los datos de una nota de crédito
     */
    static standardizeNotaCredito(data: any) {
        const identificacion = data.identificacionComprador || data.terceroRuc || data.terceroId;
        const razonSocial = data.razonSocialComprador || data.terceroNombre || data.razonSocial;

        let tipoIdentificacion = data.tipoIdentificacionComprador || data.tipoIdentificacion;

        if (!tipoIdentificacion && identificacion) {
            if (identificacion === '9999999999999') tipoIdentificacion = '07';
            else if (identificacion.length === 13) tipoIdentificacion = '04';
            else if (identificacion.length === 10) tipoIdentificacion = '05';
            else tipoIdentificacion = '06';
        }

        return {
            infoTributaria: {
                ambiente: data.ambiente || '1',
                tipoEmision: data.tipoEmision || '1',
                razonSocial: data.razonSocial,
                ruc: data.ruc,
                codDoc: '04',
                estab: (data.estab || '001').padStart(3, '0'),
                ptoEmi: (data.ptoEmi || '001').padStart(3, '0'),
                secuencial: (data.secuencial || '').padStart(9, '0'),
                dirMatriz: data.dirMatriz
            },
            infoNotaCredito: {
                fechaEmision: this.formatDate(data.fechaEmision),
                dirEstablecimiento: data.dirEstablecimiento || data.dirMatriz,
                tipoIdentificacionComprador: tipoIdentificacion,
                razonSocialComprador: razonSocial,
                identificacionComprador: identificacion,
                obligadoContabilidad: data.obligadoContabilidad || 'NO',
                codDocModificado: data.codDocModificado || '01', // Generalmente facturas
                numDocModificado: data.numDocModificado || data.documentoModificadoSecuencial,
                fechaEmisionDocSustento: this.formatDate(data.fechaEmisionDocSustento),
                totalSinImpuestos: Number((data.totalSinImpuestos || 0).toFixed(2)),
                valorModificacion: Number((data.importeTotal || 0).toFixed(2)),
                moneda: 'DOLAR',
                totalConImpuestos: this.summarizeTaxes(data.detalles),
                motivo: data.motivo || data.motivoModificacion || 'DEVOLUCION'
            },
            detalles: data.detalles.map((d: any) => ({
                codigoInterno: d.codigoPrincipal,
                descripcion: d.descripcion,
                cantidad: Number((d.cantidad || 0).toFixed(2)),
                precioUnitario: Number((d.precioUnitario || 0).toFixed(6)),
                descuento: Number((d.descuento || 0).toFixed(2)),
                precioTotalSinImpuesto: Number((d.baseImponible || (d.cantidad * d.precioUnitario) || 0).toFixed(2)),
                impuestos: [
                    {
                        codigo: '2',
                        codigoPorcentaje: d.codigoIVA || '2',
                        tarifa: d.tarifa ?? 0,
                        baseImponible: Number((d.baseImponible || (d.cantidad * d.precioUnitario) || 0).toFixed(2)),
                        valor: Number((d.valorIVA || ((d.baseImponible || (d.cantidad * d.precioUnitario) || 0) * ((d.tarifa ?? 0) / 100)) || 0).toFixed(2))
                    }
                ]
            })),
            infoAdicional: [
                { nombre: 'Direccion', valor: data.direccionComprador || data.direccion },
                { nombre: 'Email', valor: data.emailComprador || data.email }
            ].filter(i => i.valor)
        };
    }

    /**
     * Estandariza los datos de una nota de débito
     */
    static standardizeNotaDebito(data: any) {
        const identificacion = data.identificacionComprador || data.terceroRuc || data.terceroId;
        const razonSocial = data.razonSocialComprador || data.terceroNombre || data.razonSocial;

        let tipoIdentificacion = data.tipoIdentificacionComprador || data.tipoIdentificacion;

        if (!tipoIdentificacion && identificacion) {
            if (identificacion === '9999999999999') tipoIdentificacion = '07';
            else if (identificacion.length === 13) tipoIdentificacion = '04';
            else if (identificacion.length === 10) tipoIdentificacion = '05';
            else tipoIdentificacion = '06';
        }

        return {
            infoTributaria: {
                ambiente: data.ambiente || '1',
                tipoEmision: data.tipoEmision || '1',
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial || '',
                ruc: data.ruc,
                codDoc: '05',
                estab: (data.estab || '001').padStart(3, '0'),
                ptoEmi: (data.ptoEmi || '001').padStart(3, '0'),
                secuencial: (data.secuencial || '').padStart(9, '0'),
                dirMatriz: data.dirMatriz
            },
            infoNotaDebito: {
                fechaEmision: this.formatDate(data.fechaEmision),
                dirEstablecimiento: data.dirEstablecimiento || data.dirMatriz,
                obligadoContabilidad: data.obligadoContabilidad || 'NO',
                tipoIdentificacionComprador: tipoIdentificacion,
                razonSocialComprador: razonSocial,
                identificacionComprador: identificacion,
                codDocModificado: data.codDocModificado || '01',
                numDocModificado: data.numDocModificado,
                fechaEmisionDocSustento: this.formatDate(data.fechaEmisionDocSustento),
                totalSinImpuestos: Number((data.totalSinImpuestos || 0).toFixed(2)),
                impuestos: [
                    {
                        codigo: '2',
                        codigoPorcentaje: data.codigoIVA || '2',
                        tarifa: data.tarifa ?? 0,
                        baseImponible: Number((data.totalSinImpuestos || 0).toFixed(2)),
                        valor: Number((data.valorIVA || (data.totalSinImpuestos * ((data.tarifa ?? 0) / 100)) || 0).toFixed(2))
                    }
                ],
                valorTotal: Number((data.valorTotal || 0).toFixed(2)),
                pagos: data.pagos?.map((p: any) => ({
                    formaPago: p.formaPago,
                    total: Number((p.total || 0).toFixed(2))
                })) || []
            },
            motivos: data.motivos?.map((m: any) => ({
                razon: m.razon,
                valor: Number((m.valor || 0).toFixed(2))
            })) || [],
            infoAdicional: [
                { nombre: 'Direccion', valor: data.direccionComprador || data.direccion },
                { nombre: 'Email', valor: data.emailComprador || data.email }
            ].filter(i => i.valor)
        };
    }

    /**
     * Genera el JSON estandarizado para un Comprobante de Retención (Doc 07)
     * Compatible con versión 2.0.0 del esquema XSD del SRI
     */
    static standardizeRetencion(data: any) {
        return {
            infoTributaria: {
                ambiente: data.ambiente,
                tipoEmision: data.tipoEmision,
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial,
                ruc: data.ruc,
                codDoc: '07',
                estab: data.estab,
                ptoEmi: data.ptoEmi,
                secuencial: data.secuencial,
                dirMatriz: data.dirMatriz
            },
            infoCompRetencion: {
                fechaEmision: this.formatDate(data.fechaEmision),
                dirEstablecimiento: data.dirEstablecimiento || data.dirMatriz,
                obligadoContabilidad: data.obligadoContabilidad,
                tipoIdentificacionSujetoRetenido: data.tipoIdentificacionSujetoRetenido,
                tipoSujetoRetenido: data.tipoSujetoRetenido, // Opcional para v2.0.0
                parteRel: data.parteRel || 'NO', // Obligatorio en v2.0.0
                razonSocialSujetoRetenido: data.razonSocialSujetoRetenido,
                identificacionSujetoRetenido: data.identificacionSujetoRetenido,
                periodoFiscal: data.periodoFiscal
            },
            impuestos: data.impuestos.map((imp: any) => ({
                codigo: imp.codigo,
                codigoRetencion: imp.codigoRetencion,
                baseImponible: Number(Number(imp.baseImponible).toFixed(2)),
                porcentajeRetener: Number(Number(imp.porcentajeRetener).toFixed(2)),
                valorRetenido: Number(Number(imp.valorRetenido).toFixed(2)),
                codDocSustento: imp.codDocSustento,
                codSustento: imp.codSustento || '01', // Código sustento tributario
                numDocSustento: imp.numDocSustento,
                fechaEmisionDocSustento: this.formatDate(imp.fechaEmisionDocSustento),
                numAutDocSustento: imp.numAutDocSustento,
                // Campos adicionales para v2.0.0
                totalSinImpuestosDocSustento: Number(imp.totalSinImpuestosDocSustento ?? 0),
                baseImponibleIvaDocSustento: Number(imp.baseImponibleIvaDocSustento ?? 0),
                importeTotalDocSustento: Number(imp.importeTotalDocSustento ?? 0),
                pagoLocExt: imp.pagoLocExt || '01', // 01=Local
                formaPago: imp.formaPago || '20', // 20=Otros con utilización del sistema financiero
                codigoPorcentajeIva: imp.codigoPorcentajeIva || '0', // 0=0%, 2=12%, etc.
                tarifaIva: imp.tarifaIva || '0',
                ivaDocSustento: Number(imp.ivaDocSustento || 0)
            })),
            infoAdicional: [
                { nombre: 'Direccion', valor: data.direccionSujetoRetenido || data.direccion || 'N/A' },
                { nombre: 'Email', valor: data.emailSujetoRetenido || data.email || 'N/A' }
            ]
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
            })),
            infoAdicional: [
                { nombre: 'Direccion', valor: data.direccionTransp || data.direccion || 'N/A' },
                { nombre: 'Email', valor: data.emailTransp || data.email || 'N/A' }
            ]
        };
    }

    private static formatDate(dateStr: string): string {
        if (!dateStr) return '';
        // Usar utilidad que maneja correctamente la zona horaria
        return isoToSriDate(dateStr);
    }



    private static summarizeTaxes(detalles: DetalleFactura[]) {
        const resumen: any[] = [];
        const grupos = detalles.reduce((acc: any, d: any) => {
            const key = d.codigoIVA;
            if (!acc[key]) acc[key] = { base: 0, valor: 0, codigo: d.codigoImpuesto };
            acc[key].base += d.baseImponible;
            acc[key].valor += d.valorIVA;
            return acc;
        }, {});

        for (const codigoPorcentaje in grupos) {
            resumen.push({
                codigo: grupos[codigoPorcentaje].codigo || '2',
                codigoPorcentaje: codigoPorcentaje,
                baseImponible: Number(grupos[codigoPorcentaje].base.toFixed(2)),
                valor: Number(grupos[codigoPorcentaje].valor.toFixed(2))
            });
        }
        return resumen;
    }
}
