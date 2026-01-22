import { Auditable } from '@/shared/types';

// Sustentos tributarios comunes según Ficha Técnica SRI
export enum SustentoTributario {
    CREDITO_TRIBUTARIO = '01', // Crédito Tributario para declaración de IVA
    COSTO_GASTO = '02', // Costo o Gasto para Impuesto a la Renta (sin IVA)
    ACTIVO_FIJO = '06', // Crédito Tributario para Activos Fijos
    CONSUMIDOR_FINAL = '07' // Consumidor Final (No deducible)
}

export interface Proveedor {
    id: string;
    razonSocial: string;
    ruc: string; // Validación estricta
    nombreComercial?: string;
    esContribuyenteEspecial: boolean;
}

export interface DetalleOrden {
    producto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    grabaIva: boolean;
}

export interface OrdenCompra extends Auditable {
    id: string;
    empresaId: string;
    secuencial: string; // OC-0001
    proveedor: Proveedor;
    fechaEmision: string;
    fechaEntrega: string;
    observacion: string;
    detalles: DetalleOrden[];

    // Totales
    subtotal: number;
    iva: number;
    total: number;

    estado: 'PENDIENTE' | 'APROBADA' | 'FACTURADA' | 'ANULADA';
}

export interface Compra extends Auditable {
    id: string;
    empresaId: string;
    proveedor: Proveedor;

    // Datos del Comprobante Físico/Electrónico recibido
    tipoComprobante: string; // '01' Factura, '03' Liq. Compra
    secuencial: string; // 001-001-123456789
    autorizacion: string; // 10, 37 o 49 dígitos
    fechaEmision: string;
    fechaRegistro: string;

    // Clasificación SRI
    sustento: SustentoTributario;
    descripcion: string;

    // Valores
    subtotalIva: number;
    subtotal0: number;
    montoIva: number;
    montoIce?: number;
    total: number;

    // Vinculación con OC
    ordenCompraId?: string;

    // Estado de la Retención (Obligación del Agente de Retención)
    tieneRetencion: boolean;
    estadoRetencion: 'PENDIENTE' | 'EMITIDA' | 'ANULADA' | 'NO_APLICA';
    nroRetencion?: string;
}

export interface CompraRepository {
    getAll(empresaId: string): Promise<Compra[]>;
    save(compra: Compra): Promise<void>;
    generarRetencion(compraId: string): Promise<void>;

    // Métodos Órdenes
    getOrdenes(empresaId: string): Promise<OrdenCompra[]>;
    saveOrden(orden: OrdenCompra): Promise<void>;
    actualizarEstadoOrden(id: string, estado: OrdenCompra['estado']): Promise<void>;
}
