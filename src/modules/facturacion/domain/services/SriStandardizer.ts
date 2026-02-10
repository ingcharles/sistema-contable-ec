import { SriFactura, SriNotaCredito, SriNotaDebito, SriCompRetencion, SriLiquidacion, SriGuia, SriDetalleFactura } from '../SriTypes';
import { isoToSriDate } from '@/shared/utils/dateUtils';

export class SriStandardizer {
    /**
     * Estandariza los datos de una factura
     */
    static standardizeFactura(data: any): SriFactura {
        console.log('standardizeFactura input:', data);
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
                ambiente: data.ambienteSri,
                tipoEmision: data.tipoEmisionSri,
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial || '',
                ruc: data.ruc,
                claveAcceso: data.claveAcceso || '',
                codDoc: data.codDoc || '01',
                estab: (data.estab || '001').padStart(3, '0'),
                ptoEmi: (data.ptoEmi || '001').padStart(3, '0'),
                secuencial: (data.secuencial || '').padStart(9, '0'),
                dirMatriz: data.dirMatriz,
                agenteRetencion: data.agenteRetencion,
                regimenMicroempresas: data.regimenMicroempresas,
                contribuyenteRimpe: data.contribuyenteRimpe
            },
            infoFactura: {
                fechaEmision: this.formatDate(data.fechaEmision),
                dirEstablecimiento: data.dirEstablecimiento || data.dirMatriz,
                contribuyenteEspecial: data.contribuyenteEspecial,
                obligadoContabilidad: this.formatObligado(data.obligadoContabilidad),
                tipoIdentificacionComprador: tipoIdentificacion,
                razonSocialComprador: razonSocial,
                identificacionComprador: identificacion,
                direccionComprador: data.direccionComprador || data.direccion || '',
                totalSinImpuestos: Number(Number(data.totalSinImpuestos || 0).toFixed(2)),
                totalDescuento: Number(Number(data.totalDescuento || 0).toFixed(2)),
                totalConImpuestos: this.summarizeTaxes(data.detalles),
                propina: 0.00,
                importeTotal: Number(Number(data.importeTotal || 0).toFixed(2)),
                moneda: 'DOLAR',
                pagos: (data.pagos || []).map((p: any) => ({
                    formaPago: p.formaPago,
                    total: Number(Number(p.total || 0).toFixed(2)),
                    plazo: p.plazo || 0,
                    unidadTiempo: p.unidadTiempo || 'dias'
                }))
            },
            detalles: (data.detalles || []).map((d: any) => ({
                codigoPrincipal: d.codigoPrincipal,
                codigoAuxiliar: d.codigoAuxiliar || '',
                descripcion: d.descripcion,
                cantidad: Number(Number(d.cantidad || 0).toFixed(2)),
                precioUnitario: Number(Number(d.precioUnitario || 0).toFixed(6)),
                descuento: Number(Number(d.descuento || 0).toFixed(2)),
                precioTotalSinImpuesto: Number(Number(d.baseImponible || (d.cantidad * d.precioUnitario) || 0).toFixed(2)),
                impuestos: [
                    {
                        codigo: '2',
                        codigoPorcentaje: d.codigoIVA || '2',
                        tarifa: d.tarifa ?? 0,
                        baseImponible: Number(Number(d.baseImponible || (d.cantidad * d.precioUnitario) || 0).toFixed(2)),
                        valor: Number(Number(d.valorIVA || ((d.baseImponible || (d.cantidad * d.precioUnitario) || 0) * ((d.tarifa ?? 0) / 100)) || 0).toFixed(2))
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
    static standardizeLiquidacion(data: any): SriLiquidacion {
        return {
            infoTributaria: {
                ambiente: data.ambienteSri,
                tipoEmision: data.tipoEmisionSri,
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial || '',
                ruc: data.ruc,
                codDoc: data.codDoc || '03',
                estab: (data.estab || '001').padStart(3, '0'),
                ptoEmi: (data.ptoEmi || '001').padStart(3, '0'),
                secuencial: (data.secuencial || '').padStart(9, '0'),
                dirMatriz: data.dirMatriz,
                claveAcceso: data.claveAcceso || '',
                agenteRetencion: data.agenteRetencion,
                regimenMicroempresas: data.regimenMicroempresas,
                contribuyenteRimpe: data.contribuyenteRimpe
            },
            infoLiquidacionCompra: {
                fechaEmision: this.formatDate(data.fechaEmision),
                dirEstablecimiento: data.dirEstablecimiento || data.dirMatriz,
                obligadoContabilidad: this.formatObligado(data.obligadoContabilidad),
                tipoIdentificacionProveedor: data.tipoIdentificacionProveedor,
                razonSocialProveedor: data.razonSocialProveedor,
                identificacionProveedor: data.identificacionProveedor,
                direccionProveedor: data.direccionProveedor || '',
                totalSinImpuestos: Number(Number(data.totalSinImpuestos || 0).toFixed(2)),
                totalDescuento: Number(Number(data.totalDescuento || 0).toFixed(2)),
                totalConImpuestos: this.summarizeTaxes(data.detalles),
                importeTotal: Number(Number(data.importeTotal || 0).toFixed(2)),
                moneda: 'DOLAR',
                pagos: (data.pagos || []).map((p: any) => ({
                    formaPago: p.formaPago,
                    total: Number(Number(p.total || 0).toFixed(2)),
                    plazo: p.plazo || 0,
                    unidadTiempo: p.unidadTiempo || 'dias'
                }))
            },
            detalles: (data.detalles || []).map((d: any) => ({
                codigoPrincipal: d.codigoPrincipal,
                descripcion: d.descripcion,
                cantidad: Number(Number(d.cantidad || 0).toFixed(2)),
                precioUnitario: Number(Number(d.precioUnitario || 0).toFixed(6)),
                descuento: Number(Number(d.descuento || 0).toFixed(2)),
                precioTotalSinImpuesto: Number(Number(d.baseImponible || 0).toFixed(2)),
                impuestos: [
                    {
                        codigo: '2',
                        codigoPorcentaje: d.codigoIVA,
                        tarifa: d.tarifa ?? 0,
                        baseImponible: Number(Number(d.baseImponible || 0).toFixed(2)),
                        valor: Number(Number(d.valorIVA || 0).toFixed(2))
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
    static standardizeNotaCredito(data: any): SriNotaCredito {
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
                ambiente: data.ambienteSri,
                tipoEmision: data.tipoEmisionSri,
                razonSocial: data.razonSocial,
                ruc: data.ruc,
                codDoc: data.codDoc || '04',
                estab: (data.estab || '001').padStart(3, '0'),
                ptoEmi: (data.ptoEmi || '001').padStart(3, '0'),
                secuencial: (data.secuencial || '').padStart(9, '0'),
                dirMatriz: data.dirMatriz,
                claveAcceso: data.claveAcceso || '',
                agenteRetencion: data.agenteRetencion,
                regimenMicroempresas: data.regimenMicroempresas,
                contribuyenteRimpe: data.contribuyenteRimpe
            },
            infoNotaCredito: {
                fechaEmision: this.formatDate(data.fechaEmision),
                dirEstablecimiento: data.dirEstablecimiento || data.dirMatriz,
                tipoIdentificacionComprador: tipoIdentificacion,
                razonSocialComprador: razonSocial,
                identificacionComprador: identificacion,
                obligadoContabilidad: this.formatObligado(data.obligadoContabilidad),
                codDocModificado: data.codDocModificado, // Generalmente facturas
                numDocModificado: this.formatNumDoc(data.numDocModificado || data.documentoModificadoSecuencial, data.estabModificado, data.ptoEmiModificado),
                fechaEmisionDocSustento: this.formatDate(data.fechaEmisionDocSustento),
                totalSinImpuestos: Number(Number(data.totalSinImpuestos || 0).toFixed(2)),
                valorModificacion: Number(Number(data.importeTotal || 0).toFixed(2)),
                moneda: 'DOLAR',
                totalConImpuestos: this.summarizeTaxes(data.detalles),
                motivo: data.motivo || data.motivoModificacion || 'DEVOLUCION'
            },
            detalles: (data.detalles || []).map((d: any) => ({
                codigoInterno: d.codigoPrincipal,
                descripcion: d.descripcion,
                cantidad: Number(Number(d.cantidad || 0).toFixed(2)),
                precioUnitario: Number(Number(d.precioUnitario || 0).toFixed(6)),
                descuento: Number(Number(d.descuento || 0).toFixed(2)),
                precioTotalSinImpuesto: Number(Number(d.baseImponible || (d.cantidad * d.precioUnitario) || 0).toFixed(2)),
                impuestos: [
                    {
                        codigo: '2',
                        codigoPorcentaje: d.codigoIVA || '2',
                        tarifa: d.tarifa ?? 0,
                        baseImponible: Number(Number(d.baseImponible || (d.cantidad * d.precioUnitario) || 0).toFixed(2)),
                        valor: Number(Number(d.valorIVA || ((d.baseImponible || (d.cantidad * d.precioUnitario) || 0) * ((d.tarifa ?? 0) / 100)) || 0).toFixed(2))
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
    static standardizeNotaDebito(data: any): SriNotaDebito {
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
                ambiente: data.ambienteSri,
                tipoEmision: data.tipoEmisionSri,
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial || '',
                ruc: data.ruc,
                codDoc: data.codDoc || '05',
                estab: (data.estab || '001').padStart(3, '0'),
                ptoEmi: (data.ptoEmi || '001').padStart(3, '0'),
                secuencial: (data.secuencial || '').padStart(9, '0'),
                dirMatriz: data.dirMatriz,
                claveAcceso: data.claveAcceso || '',
                agenteRetencion: data.agenteRetencion,
                regimenMicroempresas: data.regimenMicroempresas,
                contribuyenteRimpe: data.contribuyenteRimpe
            },
            infoNotaDebito: {
                fechaEmision: this.formatDate(data.fechaEmision),
                dirEstablecimiento: data.dirEstablecimiento || data.dirMatriz,
                obligadoContabilidad: this.formatObligado(data.obligadoContabilidad),
                tipoIdentificacionComprador: tipoIdentificacion,
                razonSocialComprador: razonSocial,
                identificacionComprador: identificacion,
                codDocModificado: data.codDocModificado,
                numDocModificado: this.formatNumDoc(data.numDocModificado, data.estabModificado, data.ptoEmiModificado),
                fechaEmisionDocSustento: this.formatDate(data.fechaEmisionDocSustento),
                totalSinImpuestos: Number(Number(data.totalSinImpuestos || 0).toFixed(2)),
                impuestos: [
                    {
                        codigo: '2',
                        codigoPorcentaje: data.codigoIVA,
                        tarifa: data.tarifa,
                        baseImponible: Number(Number(data.totalSinImpuestos || 0).toFixed(2)),
                        valor: Number(Number(data.valorIVA || (data.totalSinImpuestos * ((data.tarifa ?? 0) / 100)) || 0).toFixed(2))
                    }
                ],
                valorTotal: Number(Number(data.valorTotal || 0).toFixed(2)),
                pagos: (data.pagos || []).map((p: any) => ({
                    formaPago: p.formaPago,
                    total: Number(Number(p.total || 0).toFixed(2))
                }))
            },
            motivos: (data.motivos || []).map((m: any) => ({
                razon: m.razon,
                valor: Number(Number(m.valor || 0).toFixed(2))
            })),
            infoAdicional: [
                { nombre: 'Direccion', valor: data.direccionComprador },
                { nombre: 'Email', valor: data.emailComprador }
            ].filter(i => i.valor)
        };
    }

    /**
     * Genera el JSON estandarizado para un Comprobante de Retención (Doc 07)
     * Compatible con versión 2.0.0 del esquema XSD del SRI
     */
    static standardizeRetencion(data: any): SriCompRetencion {
        return {
            infoTributaria: {
                ambiente: data.ambienteSri,
                tipoEmision: data.tipoEmisionSri,
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial,
                ruc: data.ruc,
                codDoc: data.codDoc || '07',
                estab: (data.estab || '001').padStart(3, '0'),
                ptoEmi: (data.ptoEmi || '001').padStart(3, '0'),
                secuencial: (data.secuencial || '').padStart(9, '0'),
                dirMatriz: data.dirMatriz,
                claveAcceso: data.claveAcceso || '',
                agenteRetencion: data.agenteRetencion,
                regimenMicroempresas: data.regimenMicroempresas,
                contribuyenteRimpe: data.contribuyenteRimpe
            },
            infoCompRetencion: {
                fechaEmision: this.formatDate(data.fechaEmision),
                dirEstablecimiento: data.dirEstablecimiento || data.dirMatriz,
                obligadoContabilidad: this.formatObligado(data.obligadoContabilidad),
                tipoIdentificacionSujetoRetenido: data.tipoIdentificacionSujetoRetenido,
                tipoSujetoRetenido: data.tipoSujetoRetenido, // Opcional para v2.0.0
                parteRel: data.parteRel || 'NO', // Obligatorio en v2.0.0
                razonSocialSujetoRetenido: data.razonSocialSujetoRetenido,
                identificacionSujetoRetenido: data.identificacionSujetoRetenido,
                periodoFiscal: data.periodoFiscal
            },
            impuestos: (data.impuestos || []).map((imp: any) => ({
                codigo: imp.codigo,
                codigoRetencion: imp.codigoRetencion,
                baseImponible: Number(Number(imp.baseImponible || 0).toFixed(2)),
                porcentajeRetener: Number(Number(imp.porcentajeRetener || 0).toFixed(2)),
                valorRetenido: Number(Number(imp.valorRetenido || 0).toFixed(2)),
                codDocSustento: imp.codDocSustento,
                codSustento: imp.codSustento || '01', // Código sustento tributario
                numDocSustento: imp.numDocSustento,
                fechaEmisionDocSustento: this.formatDate(imp.fechaEmisionDocSustento),
                numAutDocSustento: imp.numAutDocSustento,
                // Campos adicionales para v2.0.0
                totalSinImpuestosDocSustento: Number(Number(imp.totalSinImpuestosDocSustento || 0).toFixed(2)),
                baseImponibleIvaDocSustento: Number(Number(imp.baseImponibleIvaDocSustento || 0).toFixed(2)),
                importeTotalDocSustento: Number(Number(imp.importeTotalDocSustento || 0).toFixed(2)),
                pagoLocExt: imp.pagoLocExt || '01', // 01=Local
                formaPago: imp.formaPago || '20', // 20=Otros con utilización del sistema financiero
                codigoPorcentajeIva: imp.codigoPorcentajeIva || '0', // 0=0%, 2=12%, etc.
                tarifaIva: imp.tarifaIva || '0',
                ivaDocSustento: Number(Number(imp.ivaDocSustento || 0).toFixed(2))
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
    static standardizeGuia(data: any): SriGuia {
        return {
            infoTributaria: {
                ambiente: data.ambienteSri,
                tipoEmision: data.tipoEmisionSri,
                razonSocial: data.razonSocial,
                nombreComercial: data.nombreComercial || '',
                ruc: data.ruc,
                codDoc: data.codDoc || '06',
                estab: (data.estab || '001').padStart(3, '0'),
                ptoEmi: (data.ptoEmi || '001').padStart(3, '0'),
                secuencial: (data.secuencial || '').padStart(9, '0'),
                dirMatriz: data.dirMatriz,
                claveAcceso: data.claveAcceso || '',
                agenteRetencion: data.agenteRetencion,
                regimenMicroempresas: data.regimenMicroempresas,
                contribuyenteRimpe: data.contribuyenteRimpe
            },
            infoGuiaRemision: {
                dirEstablecimiento: data.dirEstablecimiento || data.dirMatriz,
                dirPartida: data.dirPartida,
                razonSocialTransportista: data.razonSocialTransportista,
                tipoIdentificacionTransportista: data.tipoIdentificacionTransportista,
                rucTransportista: data.rucTransportista,
                obligadoContabilidad: this.formatObligado(data.obligadoContabilidad),
                contribuyenteEspecial: data.contribuyenteEspecial,
                fechaIniTransporte: this.formatDate(data.fechaIniTransporte || data.fechaIniTraslado || data.fechaEmision),
                fechaFinTransporte: this.formatDate(data.fechaFinTransporte || data.fechaFinTraslado || data.fechaEmision),
                placa: data.placa
            },
            destinatarios: (data.destinatarios || []).map((dest: any) => ({
                identificacionDestinatario: dest.identificacionDestinatario,
                razonSocialDestinatario: dest.razonSocialDestinatario,
                dirDestinatario: dest.dirDestinatario,
                motivoTraslado: dest.motivoTraslado,
                docAduaneroUnico: dest.docAduaneroUnico,
                codEstabDestino: dest.codEstabDestino,
                ruta: dest.ruta,
                codDocSustento: dest.codDocSustento,
                numDocSustento: this.formatNumDoc(dest.numDocSustento),
                numAutDocSustento: dest.numAutDocSustento,
                fechaEmisionDocSustento: this.formatDate(dest.fechaEmisionDocSustento),
                detalles: (dest.detalles || []).map((det: any) => ({
                    codigoInterno: det.codigoInterno,
                    codigoAdicional: det.codigoAdicional,
                    descripcion: det.descripcion,
                    cantidad: Number(Number(det.cantidad || 0).toFixed(2))
                }))
            })),
            infoAdicional: [
                { nombre: 'Direccion', valor: data.direccionTransp || data.direccion || 'N/A' },
                { nombre: 'Email', valor: data.emailTransp || data.email || 'N/A' }
            ]
        };
    }

    private static formatNumDoc(numDoc: string = '', defaultEstab?: string, defaultPtoEmi?: string): string {
        if (!numDoc) return `${(defaultEstab || '001').padStart(3, '0')}-${(defaultPtoEmi || '001').padStart(3, '0')}-000000001`;

        // Si ya tiene el formato correcto, devolverlo
        if (/^\d{3}-\d{3}-\d{9}$/.test(numDoc)) return numDoc;

        // Si tiene guiones pero no es el formato correcto, intentar limpiar
        const parts = numDoc.split('-');
        if (parts.length === 3) {
            return `${parts[0].padStart(3, '0')}-${parts[1].padStart(3, '0')}-${parts[2].padStart(9, '0')}`;
        }

        // Si es solo el secuencial, concatenar establecimiento y punto de emisión
        const secuencial = numDoc.padStart(9, '0');
        const estab = (defaultEstab || '001').padStart(3, '0');
        const ptoEmi = (defaultPtoEmi || '001').padStart(3, '0');

        return `${estab}-${ptoEmi}-${secuencial}`;
    }

    private static formatObligado(val: any): string {
        if (val === true || val === 'SI' || val === 'true' || val === 'S') return 'SI';
        return 'NO';
    }

    private static formatDate(dateStr: string): string {
        if (!dateStr) return '';
        // Usar utilidad que maneja correctamente la zona horaria
        return isoToSriDate(dateStr);
    }



    private static summarizeTaxes(detalles: SriDetalleFactura[]) {
        if (!detalles) return [];
        const resumen: any[] = [];
        const grupos = detalles.reduce((acc: any, d: any) => {
            const key = d.codigoIVA;
            if (!acc[key]) acc[key] = { base: 0, valor: 0, codigo: d.codigoImpuesto };
            acc[key].base += Number(d.baseImponible || 0);
            acc[key].valor += Number(d.valorIVA || 0);
            return acc;
        }, {});

        for (const codigoPorcentaje in grupos) {
            resumen.push({
                codigo: grupos[codigoPorcentaje].codigo || '2',
                codigoPorcentaje: codigoPorcentaje,
                baseImponible: Number(Number(grupos[codigoPorcentaje].base).toFixed(2)),
                valor: Number(Number(grupos[codigoPorcentaje].valor).toFixed(2))
            });
        }
        return resumen;
    }
}
