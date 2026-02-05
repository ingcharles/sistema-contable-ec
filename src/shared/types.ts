// SHARED KERNEL & DOMAIN LAYER
// Definiciones transversales del sistema

export enum TipoIdentificacion {
    RUC = '04',
    CEDULA = '05',
    PASAPORTE = '06',
    CONSUMIDOR_FINAL = '07',
    EXTERIOR = '08'
}

export enum EstadoSRI {
    PENDIENTE = 'PENDIENTE',
    AUTORIZADO = 'AUTORIZADO',
    ANULADO = 'ANULADO',
    DEVUELTO = 'DEVUELTO',
    RECHAZADO = 'RECHAZADO'
}

export enum TipoComprobante {
    FACTURA = '01',
    NOTA_CREDITO = '04',
    NOTA_DEBITO = '05',
    GUIA_REMISION = '06',
    RETENCION = '07',
    LIQUIDACION_COMPRA = '03'
}

export interface PlanFeature {
    id: string;
    planId: string;
    featureKey: string; // 'MAX_EMPRESAS', 'IA_ACCESO_LOCAL', etc
    tipoDocumento?: string; // Código SRI '01', '07', etc
    valueType: 'NUMERO' | 'BOOLEANO' | 'NUMBER' | 'BOOLEAN';
    valueNumber?: number;
    valueBool?: boolean;
}

export interface Plan {
    id: string;
    codigo: string; // 'GRATUITO', 'PROFESIONAL', 'EMPRESARIAL'
    nombre: string;
    precioMensual: number;
    activo: boolean;
    features?: PlanFeature[];
}

export interface Empresa {
    id: string;
    razonSocial: string;
    nombreComercial: string;
    ruc: string;
    direccionMatriz: string;
    obligadoContabilidad: boolean;
    agenteRetencion: boolean;
    contribuyenteEspecial: string | null;
    rimpe: 'NEGOCIO_POPULAR' | 'EMPRENDEDOR' | null;
    logoUrl?: string;
    ambienteSri?: number;
    ambienteSriNombre?: string;
}

export interface Usuario {
    id: string;
    nombre: string;
    roles: ('SUPERADMIN' | 'ADMIN' | 'CONTADOR' | 'AUDITOR' | 'ASISTENTE')[];
    email: string;
    plan?: Plan; // Plan poblado
    planId?: string;
    planStatus?: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
    usageStats?: {
        createdCompanies: number;
        currentMonthDocs: number;
    };
}

// Entidad de Auditoría Base
export interface Auditable {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

export interface ObligacionTributaria {
    nombre: string;
    codigo: string;
    fechaVencimiento: string;
    estado: 'PENDIENTE' | 'PRESENTADO' | 'VENCIDO';
}

export interface ComprobanteElectronico {
    id: string;
    tipo: TipoComprobante;
    secuencial: string;
    fechaEmision: string;
    terceroNombre: string; // Deprecated: use razonSocialComprador
    razonSocialComprador: string;
    terceroId: string;
    identificacionComprador: string;
    totalSinImpuestos: number;
    totalImpuestos: number;
    importeTotal: number;
    estado: EstadoSRI;
    claveAcceso: string;
    tipoIdentificacionComprador?: string;
}

export interface CuentaContable {
    codigo: string;
    nombre: string;
    nivel: number;
    tipo: string;
    saldo: number;
    aceptaMovimiento?: boolean;
    activa?: boolean;
}

// Tipos de Facturación
export interface Factura extends Auditable {
    id: string;
    empresaId?: string;
    tipo?: TipoComprobante; // Para compatibilidad
    tipoComprobante?: string; // Lo que realmente viene de la API
    tipoComprobanteNombre?: string;
    secuencial: string;
    fechaEmision: string;
    terceroNombre: string; // Deprecated: use razonSocialComprador
    razonSocialComprador: string;
    terceroId?: string;
    terceroRuc?: string; // Deprecated: use identificacionComprador
    identificacionComprador: string;
    terceroEmail?: string; // Deprecated: use emailComprador
    emailComprador?: string;
    tipoIdentificacionComprador?: string;
    subtotal?: number;
    descuento?: number;
    iva?: number;
    totalImpuestos?: number;
    importeTotal: number;
    estado: EstadoSRI;
    claveAcceso: string;
    numeroAutorizacion?: string;
    fechaAutorizacion?: string;
    xmlFirmado?: string;
    documentoModificadoId?: string;
    motivoModificacion?: string;
    direccionComprador?: string;
}

export interface GuiaRemision extends Auditable {
    id: string;
    empresaId: string;
    secuencial: string;
    fechaEmision: string;
    fechaInicioTransporte: string;
    fechaFinTransporte: string;
    transportista: string;
    placa: string;
    puntoPartida: string;
    puntoLlegada: string;
    estado: EstadoSRI;
}
