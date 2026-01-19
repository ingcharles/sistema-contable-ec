import { DocumentoPendiente, TipoCartera, TransaccionCartera, Anticipo, CarteraRepository } from '../domain/types';

const today = new Date();
const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
};

const MOCK_DOCUMENTOS: DocumentoPendiente[] = [
    {
        id: 'cxc1',
        empresaId: '1',
        tipo: TipoCartera.CXC,
        terceroId: '1790016919001',
        terceroNombre: 'CORPORACIÓN FAVORITA C.A.',
        nroComprobante: '001-002-000004521',
        fechaEmision: addDays(today, -45),
        fechaVencimiento: addDays(today, -15),
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
        fechaVencimiento: addDays(today, 25),
        diasCredito: 30,
        montoTotal: 500.00,
        totalPagado: 200.00,
        saldoPendiente: 300.00,
        diasVencidos: -25,
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'cxp1',
        empresaId: '1',
        tipo: TipoCartera.CXP,
        terceroId: '0990004196001',
        terceroNombre: 'IMPORTADORA EL ROSADO S.A.',
        nroComprobante: '045-002-000123456',
        fechaEmision: addDays(today, -20),
        fechaVencimiento: addDays(today, 10),
        diasCredito: 30,
        montoTotal: 153.58,
        totalPagado: 0,
        saldoPendiente: 153.58,
        diasVencidos: -10,
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

const MOCK_ANTICIPOS: Anticipo[] = [
    {
        id: 'ant1',
        empresaId: '1',
        tipo: TipoCartera.CXP,
        terceroId: '0990004196001',
        terceroNombre: 'IMPORTADORA EL ROSADO S.A.',
        fecha: addDays(today, -30),
        referencia: 'Transf. Inicial Obra',
        montoOriginal: 500.00,
        montoUsado: 0,
        saldoDisponible: 500.00,
        estado: 'DISPONIBLE',
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

export class InMemoryCarteraRepository implements CarteraRepository {
    async getDocumentosPendientes(empresaId: string, tipo: TipoCartera): Promise<DocumentoPendiente[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
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

    async getAnticiposDisponibles(empresaId: string, tipo: TipoCartera, terceroId?: string): Promise<Anticipo[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_ANTICIPOS.filter(a =>
            a.empresaId === empresaId &&
            a.tipo === tipo &&
            a.saldoDisponible > 0 &&
            (!terceroId || a.terceroId === terceroId)
        );
    }

    async savePago(tx: TransaccionCartera): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 500));

        if (tx.documentoId) {
            const doc = MOCK_DOCUMENTOS.find(d => d.id === tx.documentoId);
            if (doc) {
                const totalAbono = (tx.valorEfectivo || 0) + (tx.valorRetencion || 0) + (tx.valorCruce || 0);
                doc.totalPagado += totalAbono;
                doc.saldoPendiente = Math.max(0, doc.montoTotal - doc.totalPagado);
            }
        }

        if (tx.formaPago === 'CRUCE_ANTICIPO' && tx.anticipoId) {
            const ant = MOCK_ANTICIPOS.find(a => a.id === tx.anticipoId);
            if (ant) {
                ant.montoUsado += (tx.valorCruce || 0);
                ant.saldoDisponible = ant.montoOriginal - ant.montoUsado;
                if (ant.saldoDisponible <= 0.01) ant.estado = 'AGOTADO';
            }
        }
    }

    async saveAnticipo(anticipo: Anticipo): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 500));
        MOCK_ANTICIPOS.push(anticipo);
    }
}
