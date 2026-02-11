import { Auditable } from '@/shared/types';

export interface Proforma extends Auditable {
    id: string;
    empresaId: string;
    secuencial: string;
    fecha: string;
    clienteId: string;
    clienteNombre: string;
    clienteIdentificacion: string;
    subtotal: number;
    iva: number;
    total: number;
    estado: 'PENDIENTE' | 'FACTURADA' | 'ANULADA';
    observaciones?: string;
    detalles: any[]; // Or reuse DetalleFactura if appropriate
}
