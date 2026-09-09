/**
 * Tipos del dominio para el módulo de Descarga por Robot
 */

export type EstadoDescarga = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADO' | 'ERROR';
export type EstadoComprobante = 'NUEVO' | 'PROCESADO' | 'IGNORADO';
export type TipoDocumentoDescarga = 'TODOS' | 'FACTURA' | 'NOTA_CREDITO' | 'NOTA_DEBITO' | 'RETENCION';

export interface DescargaRobot {
    id: string;
    empresaId: string;
    usuarioId: string;
    anio: number;
    mes: number;
    tipoDocumento: TipoDocumentoDescarga;
    estado: EstadoDescarga;
    totalEncontrados: number;
    totalDescargados: number;
    totalProcesados: number;
    fechaInicio?: string;
    fechaFin?: string;
    errorDetalle?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ComprobanteDescargado {
    id: string;
    empresaId: string;
    descargaId?: string;
    claveAcceso: string;
    tipoComprobante: string;
    rucEmisor: string;
    razonSocialEmisor: string;
    numeroComprobante: string;
    fechaEmision: string;
    montoTotal: number;
    xmlContenido?: string;
    estado: EstadoComprobante;
    compraId?: string;
    createdAt: string;
}

/** Resultado del parseo de un XML/TXT de factura electrónica SRI */
export interface ComprobanteParseado {
    // Info tributaria del emisor
    rucEmisor: string;
    razonSocialEmisor: string;
    nombreComercialEmisor?: string;
    direccionEmisor?: string;

    // Info del comprobante
    tipoComprobante: string; // 01, 04, 05, etc.
    claveAcceso?: string;
    secuencial: string; // formato 001-001-000000001
    fechaEmision: string; // YYYY-MM-DD

    // Totales
    subtotal0: number;
    subtotalIva: number;
    montoIva: number;
    totalDescuento: number;
    total: number;

    // Detalles (productos/servicios)
    detalles: DetalleParseado[];
}

export interface DetalleParseado {
    codigoPrincipal?: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    subtotal: number;
    porcentajeIva: number;
    valorIva: number;
    total: number;
}

/** Filtro para iniciar una descarga */
export interface FiltroDescarga {
    anio: number;
    mes: number;
    tipoDocumento: TipoDocumentoDescarga;
    /** Rango manual: registro inicial (1-based) */
    registroDesde?: number;
    /** Rango manual: registro final (1-based) */
    registroHasta?: number;
}

/** Filtro para listar comprobantes descargados */
export interface FiltroComprobantes {
    anio?: number;
    mes?: number;
    tipo?: string;
    estado?: EstadoComprobante;
    busqueda?: string;
    limite?: number;
}
