/**
 * Definiciones de tipos para los comprobantes electrónicos del SRI (Ecuador)
 * Basado en la Ficha Técnica v2.3.2
 */

export interface SriInfoTributaria {
    ambiente: string;
    tipoEmision: string;
    razonSocial: string;
    nombreComercial?: string;
    ruc: string;
    claveAcceso: string;
    codDoc: string;
    estab: string;
    ptoEmi: string;
    secuencial: string;
    dirMatriz: string;
    agenteRetencion?: string;
    regimenMicroempresas?: string;
    contribuyenteRimpe?: string;
    contribuyenteEspecial?: string;
}

export interface SriImpuesto {
    codigo: string;
    codigoPorcentaje: string;
    tarifa: number;
    baseImponible: number;
    valor: number;
}

export interface SriPago {
    formaPago: string;
    total: number;
    plazo?: number;
    unidadTiempo?: string;
}

export interface SriDetalleFactura {
    codigoPrincipal: string;
    codigoAuxiliar?: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    precioTotalSinImpuesto: number;
    impuestos: SriImpuesto[];
}

export interface SriInfoFactura {
    fechaEmision: string;
    dirEstablecimiento?: string;
    contribuyenteEspecial?: string;
    obligadoContabilidad: string;
    tipoIdentificacionComprador: string;
    razonSocialComprador: string;
    identificacionComprador: string;
    direccionComprador?: string;
    totalSinImpuestos: number;
    totalDescuento: number;
    totalConImpuestos: {
        codigo: string;
        codigoPorcentaje: string;
        baseImponible: number;
        valor: number;
    }[];
    propina: number;
    importeTotal: number;
    moneda: string;
    pagos: SriPago[];
}

export interface SriFactura {
    infoTributaria: SriInfoTributaria;
    infoFactura: SriInfoFactura;
    detalles: SriDetalleFactura[];
    infoAdicional?: { nombre: string; valor: string }[];
}

export interface SriInfoNotaCredito {
    fechaEmision: string;
    dirEstablecimiento?: string;
    contribuyenteEspecial?: string;
    tipoIdentificacionComprador: string;
    razonSocialComprador: string;
    identificacionComprador: string;
    obligadoContabilidad: string;
    codDocModificado: string;
    numDocModificado: string;
    fechaEmisionDocSustento: string;
    totalSinImpuestos: number;
    valorModificacion: number;
    moneda: string;
    totalConImpuestos: {
        codigo: string;
        codigoPorcentaje: string;
        baseImponible: number;
        valor: number;
    }[];
    motivo: string;
}

export interface SriNotaCredito {
    infoTributaria: SriInfoTributaria;
    infoNotaCredito: SriInfoNotaCredito;
    detalles: any[];
    infoAdicional?: { nombre: string; valor: string }[];
}

export interface SriNotaCreditoInput {
    puntoEmisionId: string;
    fechaEmision: string;
    clienteId: string;
    motivo: string;
    codDocModificado: string;
    numDocModificado: string;
    fechaEmisionDocSustento: string;
    detalles: any[];
    generarGuia?: boolean;
}

export interface SriInfoNotaDebito {
    fechaEmision: string;
    dirEstablecimiento?: string;
    contribuyenteEspecial?: string;
    obligadoContabilidad?: string;
    tipoIdentificacionComprador: string;
    razonSocialComprador: string;
    identificacionComprador: string;
    codDocModificado: string;
    numDocModificado: string;
    fechaEmisionDocSustento: string;
    totalSinImpuestos: number;
    impuestos: SriImpuesto[];
    valorTotal: number;
    pagos: SriPago[];
}

export interface SriNotaDebito {
    infoTributaria: SriInfoTributaria;
    infoNotaDebito: SriInfoNotaDebito;
    motivos: { razon: string; valor: number }[];
    infoAdicional?: { nombre: string; valor: string }[];
}

export interface SriNotaDebitoInput {
    puntoEmisionId: string;
    fechaEmision: string;
    clienteId: string;
    motivo: string;
    codDocModificado: string;
    numDocModificado: string;
    fechaEmisionDocSustento: string;
    detalles: any[];
    pagos: any[];
    generarGuia?: boolean;
}

export interface SriInfoCompRetencion {
    fechaEmision: string;
    dirEstablecimiento?: string;
    contribuyenteEspecial?: string;
    obligadoContabilidad?: string;
    tipoIdentificacionSujetoRetenido: string;
    tipoSujetoRetenido?: string;
    parteRel?: string;
    razonSocialSujetoRetenido: string;
    identificacionSujetoRetenido: string;
    periodoFiscal: string;
}

export interface SriCompRetencion {
    infoTributaria: SriInfoTributaria;
    infoCompRetencion: SriInfoCompRetencion;
    impuestos: any[];
    infoAdicional?: { nombre: string; valor: string }[];
}

export interface SriInfoLiquidacionCompra {
    fechaEmision: string;
    dirEstablecimiento?: string;
    contribuyenteEspecial?: string;
    obligadoContabilidad: string;
    tipoIdentificacionProveedor: string;
    razonSocialProveedor: string;
    identificacionProveedor: string;
    direccionProveedor?: string;
    totalSinImpuestos: number;
    totalDescuento: number;
    totalConImpuestos: {
        codigo: string;
        codigoPorcentaje: string;
        baseImponible: number;
        valor: number;
    }[];
    importeTotal: number;
    moneda: string;
    pagos: SriPago[];
}

export interface SriLiquidacion {
    infoTributaria: SriInfoTributaria;
    infoLiquidacionCompra: SriInfoLiquidacionCompra;
    detalles: any[];
    infoAdicional?: { nombre: string; valor: string }[];
}

export interface SriLiquidacionInput {
    puntoEmisionId: string;
    fechaEmision: string;
    proveedor: {
        tipoIdentificacion: string;
        identificacion: string;
        nombre: string;
        direccion?: string;
    };
    detalles: any[];
    pagos: any[];
    generarGuia?: boolean;
}

export interface SriInfoGuiaRemision {
    dirEstablecimiento?: string;
    dirPartida: string;
    razonSocialTransportista: string;
    tipoIdentificacionTransportista: string;
    rucTransportista: string;
    contribuyenteEspecial?: string;
    obligadoContabilidad: string;

    fechaIniTransporte: string;
    fechaFinTransporte: string;
    placa: string;
}

export interface SriGuia {
    infoTributaria: SriInfoTributaria;
    infoGuiaRemision: SriInfoGuiaRemision;
    destinatarios: any[];
    infoAdicional?: { nombre: string; valor: string }[];
}

export interface SriGuiaInput {
    puntoEmisionId: string;
    generarGuia?: boolean;
    transportistaId: string;
    fechaEmision: string;
    dirPartida: string;
    clienteId?: string;
    destinatarios: any[];
}

/**
 * Tipo unión para cualquier comprobante electrónico
 */
export type SriComprobante =
    | { type: '01', data: SriFactura }
    | { type: '03', data: SriLiquidacion }
    | { type: '04', data: SriNotaCredito }
    | { type: '05', data: SriNotaDebito }
    | { type: '06', data: SriGuia }
    | { type: '07', data: SriCompRetencion };

/**
 * Interfaces para respuestas de los Web Services del SRI
 */

export interface SriMensaje {
    identificador: string;
    mensaje: string;
    tipo: string;
    informacionAdicional?: string;
}

export type SriEstadoComprobante =
    | 'RECIBIDA'
    | 'DEVUELTA'
    | 'AUTORIZADO'
    | 'NO AUTORIZADO'
    | 'EN PROCESO'
    | 'ERROR';

export interface SriRespuesta {
    estado: SriEstadoComprobante;
    claveAcceso?: string;
    mensajes?: SriMensaje[];
    numeroAutorizacion?: string;
    fechaAutorizacion?: string;
    ambiente?: string;
}
