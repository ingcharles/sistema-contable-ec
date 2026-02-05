/**
 * ViewModel para Factura
 * Representa la estructura de datos de una factura en el frontend
 */

export interface DetalleFactura {
    id?: string;
    productoId: string;
    codigoPrincipal: string;
    codigoAuxiliar?: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    codigoIVA: string; // Catálogo 4 (Tarifa IVA)
    baseImponible: number;
    valorIVA: number;
    total: number;
}

export interface PagoFactura {
    formaPago: string; // Catálogo 24
    total: number;
    plazo?: number;
    unidadTiempo?: string;
}

export interface FacturaViewModel {
    id?: string;
    // Datos de encabezado (InfoTributaria)
    ambiente: string; // 1 o 2
    tipoEmision: string; // 1
    razonSocial: string;
    nombreComercial?: string;
    ruc: string;
    claveAcceso?: string;
    codDoc: string; // 01
    estab: string; // 001
    ptoEmi: string; // 001
    secuencial: string; // 000000001
    dirMatriz: string;

    // Datos de factura (InfoFactura)
    fechaEmision: string;
    dirEstablecimiento?: string;
    contribuyenteEspecial?: string;
    obligadoContabilidad: 'SI' | 'NO';
    tipoIdentificacionComprador: string; // Catálogo 4
    razonSocialComprador: string;
    identificacionComprador: string;
    direccionComprador?: string;
    emailComprador?: string;

    detalles: DetalleFactura[];

    // Totales
    totalSinImpuestos: number;
    totalDescuento: number;
    totalIVA: number;
    importeTotal: number;

    pagos: PagoFactura[];

    estado: 'BORRADOR' | 'AUTORIZADA' | 'ANULADA';
    fechaAutorizacion?: string;
    numeroAutorizacion?: string;
    observaciones?: string;
}


export interface FiltroFactura {
    fechaDesde?: string;
    fechaHasta?: string;
    clienteId?: string;
    estado?: string;
    numeroFactura?: string;
}
