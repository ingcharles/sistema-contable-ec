
export interface InfoTributaria {
    ambiente: string;
    tipoEmision: string;
    razonSocial: string;
    nombreComercial?: string;
    ruc: string;
    claveAcceso?: string;
    codDoc: string;
    estab: string;
    ptoEmi: string;
    secuencial: string;
    dirMatriz: string;
    regimenMicroempresas?: boolean;
    agenteRetencion?: string;
}

export interface Impuesto {
    codigo: string;
    codigoPorcentaje: string;
    baseImponible: number;
    valor: number;
    tarifa?: number;
}

export interface Pago {
    formaPago: string;
    total: number;
    plazo?: string;
    unidadTiempo?: string;
}

export interface TotalImpuesto extends Impuesto {
    descuentoAdicional?: number;
    valorDevolucionIva?: number;
}

export interface Detalle {
    codigoPrincipal: string;
    codigoAuxiliar?: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    precioTotalSinImpuesto: number;
    impuestos: Impuesto[];
}

export interface InfoFactura {
    fechaEmision: string;
    dirEstablecimiento: string;
    contribuyenteEspecial?: string;
    obligadoContabilidad: string;
    tipoIdentificacionComprador: string;
    razonSocialComprador: string;
    identificacionComprador: string;
    direccionComprador?: string;
    totalSinImpuestos: number;
    totalDescuento: number;
    totalConImpuestos: TotalImpuesto[];
    propina: number;
    importeTotal: number;
    moneda: string;
    pagos: Pago[];
}

export interface InfoLiquidacionCompra {
    fechaEmision: string;
    dirEstablecimiento: string;
    obligadoContabilidad: string;
    tipoIdentificacionProveedor: string;
    razonSocialProveedor: string;
    identificacionProveedor: string;
    direccionProveedor?: string;
    totalSinImpuestos: number;
    totalDescuento: number;
    totalConImpuestos: TotalImpuesto[];
    importeTotal: number;
    moneda: string;
    pagos: Pago[];
}

export interface InfoNotaCredito {
    fechaEmision: string;
    dirEstablecimiento: string;
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
    totalConImpuestos: TotalImpuesto[];
    motivo: string;
}

export interface InfoCompRetencion {
    fechaEmision: string;
    dirEstablecimiento: string;
    obligadoContabilidad: string;
    tipoIdentificacionSujetoRetenido: string;
    razonSocialSujetoRetenido: string;
    identificacionSujetoRetenido: string;
    periodoFiscal: string;
}

export interface ImpuestoRetencion {
    codigo: string;
    codigoRetencion: string;
    baseImponible: number;
    porcentajeRetener: number;
    valorRetenido: number;
    codDocSustento: string;
    numDocSustento: string;
    fechaEmisionDocSustento: string;
}

export interface Destinatario {
    identificacionDestinatario: string;
    razonSocialDestinatario: string;
    dirDestinatario: string;
    motivoTraslado: string;
    docAduaneroUnico?: string;
    codEstabDestino?: string;
    ruta?: string;
    codDocSustento?: string;
    numDocSustento?: string;
    numAutDocSustento?: string;
    fechaEmisionDocSustento?: string;
    detalles: DetalleGuia[];
}

export interface DetalleGuia {
    codigoInterno: string;
    codigoAdicional?: string;
    descripcion: string;
    cantidad: number;
}

export interface InfoGuiaRemision {
    dirEstablecimiento?: string;
    dirPartida: string;
    razonSocialTransportista: string;
    tipoIdentificacionTransportista: string;
    rucTransportista: string;
    rise?: string;
    obligadoContabilidad: string;
    contribuyenteEspecial?: string;
    fechaIniTransporte: string;
    fechaFinTransporte: string;
    placa: string;
}

export interface BillingData {
    ambiente?: string;
    infoTributaria: InfoTributaria;
    infoFactura?: InfoFactura;
    infoLiquidacionCompra?: InfoLiquidacionCompra;
    infoNotaCredito?: InfoNotaCredito;
    infoGuiaRemision?: InfoGuiaRemision;
    infoCompRetencion?: InfoCompRetencion;
    detalles?: Detalle[];
    impuestos?: ImpuestoRetencion[];
    destinatarios?: Destinatario[];
}
