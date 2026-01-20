import { Factura } from '@/shared/types';

export interface VentasRepository {
    getFacturas(empresaId: string): Promise<Factura[]>;
    saveFactura(factura: Factura): Promise<void>;
    deleteFactura(id: string): Promise<void>;
}
