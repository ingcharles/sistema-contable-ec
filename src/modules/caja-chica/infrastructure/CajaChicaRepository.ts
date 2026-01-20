import { CajaChicaInfo, CajaChicaRepository, ValeCajaChica, TipoMovimientoCaja, EstadoVale } from '../domain/types';

const MOCK_VALES: ValeCajaChica[] = [
    {
        id: '1',
        empresaId: '1',
        numero: 'VAL-001',
        fecha: '2024-03-10',
        beneficiario: 'Juan Pérez',
        concepto: 'Suministros de oficina urgentes',
        monto: 25.50,
        tipo: TipoMovimientoCaja.EGRESO,
        estado: EstadoVale.PENDIENTE,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'admin'
    },
    {
        id: '2',
        empresaId: '1',
        numero: 'VAL-002',
        fecha: '2024-03-12',
        beneficiario: 'Taxi Seguro S.A.',
        concepto: 'Transporte mensajería SRI',
        monto: 12.00,
        tipo: TipoMovimientoCaja.EGRESO,
        estado: EstadoVale.PENDIENTE,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'admin'
    }
];

const MOCK_CAJA: CajaChicaInfo = {
    id: '1',
    empresaId: '1',
    nombre: 'Caja Principal Matriz',
    responsable: 'María Auxiliadora',
    montoAsignado: 500.00,
    saldoActual: 462.50,
    ultimaReposicion: '2024-03-01'
};

export class InMemoryCajaChicaRepository implements CajaChicaRepository {
    async getCajaInfo(empresaId: string): Promise<CajaChicaInfo> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return { ...MOCK_CAJA, empresaId };
    }

    async getVales(empresaId: string): Promise<ValeCajaChica[]> {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_VALES.filter(v => v.empresaId === empresaId);
    }

    async saveVale(vale: ValeCajaChica): Promise<void> {
        const index = MOCK_VALES.findIndex(v => v.id === vale.id);
        if (index >= 0) MOCK_VALES[index] = vale;
        else MOCK_VALES.push(vale);
    }

    async liquidarVales(ids: string[]): Promise<void> {
        MOCK_VALES.forEach(v => {
            if (ids.includes(v.id)) v.estado = EstadoVale.LIQUIDADO;
        });
    }

    async anularVale(id: string): Promise<void> {
        const vale = MOCK_VALES.find(v => v.id === id);
        if (vale) {
            vale.estado = EstadoVale.ANULADO;
        }
    }
}
