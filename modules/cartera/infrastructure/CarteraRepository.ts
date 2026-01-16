
import { DocumentoPendiente, TipoCartera, TransaccionCartera } from '../domain/types';

// Helper para fechas
const today = new Date();
const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
};

const MOCK_DOCUMENTOS: DocumentoPendiente[] = [
    // CUENTAS POR COBRAR (Clientes me deben)
    {
        id: 'cxc1',
        empresaId: '1',
        tipo: TipoCartera.CXC,
        terceroId: '1790016919001',
        terceroNombre: 'CORPORACIÓN FAVORITA C.A.',
        nroComprobante: '001-002-000004521',
        fechaEmision: addDays(today, -45),
        fechaVencimiento: addDays(today, -15), // Venció hace 15 días
        diasCredito: 30,
        montoTotal: 1680.00,
        totalPagado: 0,
        saldoPendiente: 1680.00,
        diasVencidos: 15,
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'cxc2',
        empresaId: '1',
        tipo: TipoCartera.CXC,
        terceroId: '1791256115001',
        terceroNombre: 'CONECEL S.A.',
        nroComprobante: '001-002-000004525',
        fechaEmision: addDays(today, -5),
        fechaVencimiento: addDays(today, 25), // Vence en 25 días
        diasCredito: 30,
        montoTotal: 500.00,
        totalPagado: 200.00,
        saldoPendiente: 300.00,
        diasVencidos: -25,
        createdAt: '', updatedAt: '', createdBy: ''
    },
    // CUENTAS POR PAGAR (Yo debo a proveedores)
    {
        id: 'cxp1',
        empresaId: '1',
        tipo: TipoCartera.CXP,
        terceroId: '0990004196001',
        terceroNombre: 'IMPORTADORA EL ROSADO S.A.',
        nroComprobante: '045-002-000123456',
        fechaEmision: addDays(today, -20),
        fechaVencimiento: addDays(today, 10), // Vence en 10 días
        diasCredito: 30,
        montoTotal: 153.58,
        totalPagado: 0,
        saldoPendiente: 153.58,
        diasVencidos: -10,
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

export class InMemoryCarteraRepository {
    async getPendientes(empresaId: string, tipo: TipoCartera): Promise<DocumentoPendiente[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        // Recalcular dias vencidos dinámicamente
        const now = new Date();
        return MOCK_DOCUMENTOS
            .filter(d => d.empresaId === empresaId && d.tipo === tipo && d.saldoPendiente > 0)
            .map(d => {
                const venc = new Date(d.fechaVencimiento);
                const diffTime = Math.abs(now.getTime() - venc.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                const isVencido = now > venc;
                return {
                    ...d,
                    diasVencidos: isVencido ? diffDays : -diffDays
                };
            });
    }

    async registrarTransaccion(tx: TransaccionCartera): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 500));
        const docIndex = MOCK_DOCUMENTOS.findIndex(d => d.id === tx.documentoId);
        if (docIndex >= 0) {
            const doc = MOCK_DOCUMENTOS[docIndex];
            const totalAbono = tx.valorEfectivo + (tx.valorRetencion || 0);
            
            doc.totalPagado += totalAbono;
            doc.saldoPendiente = Math.max(0, doc.montoTotal - doc.totalPagado);
        }
    }
}
