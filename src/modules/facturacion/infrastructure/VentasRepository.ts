import { Factura, EstadoSRI, TipoComprobante } from '@/shared/types';
import { VentasRepository } from '../domain/types';

const MOCK_FACTURAS: Factura[] = [
    {
        id: 'f1',
        empresaId: '1',
        tipo: TipoComprobante.FACTURA,
        secuencial: '001-002-000004521',
        fechaEmision: '2023-10-25',
        terceroNombre: 'SUPERMAXI S.A.',
        terceroId: '1790016919001',
        subtotal: 1500.00,
        descuento: 0,
        totalImpuestos: 225.00,
        importeTotal: 1725.00,
        estado: EstadoSRI.AUTORIZADO,
        claveAcceso: '2510202301179001691900120010020000045211234567811',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin'
    }
];

export class InMemoryVentasRepository implements VentasRepository {
    async getFacturas(empresaId: string): Promise<Factura[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_FACTURAS.filter(f => f.empresaId === empresaId);
    }

    async saveFactura(factura: Factura): Promise<void> {
        const index = MOCK_FACTURAS.findIndex(f => f.id === factura.id);
        if (index >= 0) {
            MOCK_FACTURAS[index] = factura;
        } else {
            MOCK_FACTURAS.push(factura);
        }
    }

    async deleteFactura(id: string): Promise<void> {
        const index = MOCK_FACTURAS.findIndex(f => f.id === id);
        if (index >= 0) {
            MOCK_FACTURAS.splice(index, 1);
        }
    }
}
