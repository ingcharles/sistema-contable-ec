import { FacturaViewModel } from './FacturaViewModel';
import { SriRespuesta } from './SriTypes';
export { type FacturaViewModel, type SriRespuesta };
import { Auditable, Factura } from '@/shared/types';

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
    detalles: any[]; // Or reuse DetalleFactura if appropriate
}

export interface Transportista extends Auditable {
    id: string;
    empresaId: string;
    ruc: string;
    razonSocial: string;
    placa: string;
    email?: string;
}

export interface VentasRepository {
    getFacturas(empresaId: string): Promise<Factura[]>;
    saveFactura(factura: Factura): Promise<void>;
    deleteFactura(id: string): Promise<void>;
}
