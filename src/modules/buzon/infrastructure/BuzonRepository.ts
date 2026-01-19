import { ComprobanteRecibido, TipoComprobanteBuzon, BuzonRepository } from '../domain/types';

const MOCK_RECIBIDOS: ComprobanteRecibido[] = [
    {
        id: 'rec1',
        empresaId: '1',
        tipo: TipoComprobanteBuzon.FACTURA,
        secuencial: '001-001-000001234',
        rucEmisor: '1790016919001',
        razonSocialEmisor: 'CORPORACIÓN FAVORITA C.A.',
        fechaEmision: '2023-10-20',
        fechaRecepcion: '2023-10-21',
        montoTotal: 45.80,
        claveAcceso: '2010202301179001691900120010010000012341234567819',
        estado: 'RECIBIDO',
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'rec2',
        empresaId: '1',
        tipo: TipoComprobanteBuzon.FACTURA,
        secuencial: '005-002-000099887',
        rucEmisor: '1791256115001',
        razonSocialEmisor: 'CONECEL S.A.',
        fechaEmision: '2023-10-22',
        fechaRecepcion: '2023-10-22',
        montoTotal: 22.40,
        claveAcceso: '2210202301179125611500120050020000998871234567811',
        estado: 'PROCESADO',
        asociadoA: 'compra-123',
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

export class InMemoryBuzonRepository implements BuzonRepository {
    async getComprobantes(empresaId: string, _filtros?: any): Promise<ComprobanteRecibido[]> {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_RECIBIDOS.filter(c => c.empresaId === empresaId);
    }

    async importarDesdeSRI(_empresaId: string, _fechaInicio: string, _fechaFin: string): Promise<number> {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return 5; // Simula que importó 5 comprobantes
    }

    async procesarComprobante(id: string): Promise<void> {
        const comp = MOCK_RECIBIDOS.find(c => c.id === id);
        if (comp) comp.estado = 'PROCESADO';
    }
}
