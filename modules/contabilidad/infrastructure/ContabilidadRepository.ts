import { AsientoContable, CentroCosto, ContabilidadRepository } from '../domain/types';

const MOCK_ASIENTOS: AsientoContable[] = [
    {
        id: 'as1',
        empresaId: '1',
        numero: 'CD-10-2023-001',
        fecha: '2023-10-01',
        glosa: 'Asiento de Apertura - Inicio de Operaciones 2023',
        tipo: 'DIARIO',
        estado: 'MAYORIZADO',
        totalDebe: 150000.00,
        totalHaber: 150000.00,
        detalles: [
            { cuentaCodigo: '1.1.01.02', cuentaNombre: 'BANCOS', debe: 150000.00, haber: 0 },
            { cuentaCodigo: '3.1.01', cuentaNombre: 'CAPITAL SOCIAL', debe: 0, haber: 150000.00 }
        ],
        createdAt: '2023-10-01T08:00:00Z',
        updatedAt: '2023-10-01T08:00:00Z',
        createdBy: 'admin'
    },
    {
        id: 'as2',
        empresaId: '1',
        numero: 'CE-10-2023-045',
        fecha: '2023-10-25',
        glosa: 'Pago Proveedor CONECEL S.A. Fac/ 001-001-005699874',
        tipo: 'EGRESO',
        estado: 'MAYORIZADO',
        totalDebe: 51.75,
        totalHaber: 51.75,
        detalles: [
            { cuentaCodigo: '2.1.01', cuentaNombre: 'CUENTAS POR PAGAR', debe: 51.75, haber: 0 },
            { cuentaCodigo: '1.1.01.02', cuentaNombre: 'BANCOS', debe: 0, haber: 51.75 }
        ],
        createdAt: '2023-10-25T14:00:00Z',
        updatedAt: '2023-10-25T14:00:00Z',
        createdBy: 'admin'
    },
    {
        id: 'as3',
        empresaId: '1',
        numero: 'CI-10-2023-088',
        fecha: '2023-10-27',
        glosa: 'Cobro Cliente SUPERMAXI S.A. Fac/ 001-002-000004521',
        tipo: 'INGRESO',
        estado: 'MAYORIZADO',
        totalDebe: 1680.00,
        totalHaber: 1680.00,
        detalles: [
            { cuentaCodigo: '1.1.01.02', cuentaNombre: 'BANCOS', debe: 1680.00, haber: 0 },
            { cuentaCodigo: '1.1.02', cuentaNombre: 'CUENTAS POR COBRAR', debe: 0, haber: 1680.00 }
        ],
        createdAt: '2023-10-27T10:00:00Z',
        updatedAt: '2023-10-27T10:00:00Z',
        createdBy: 'admin'
    }
];

const MOCK_CENTROS_COSTOS: CentroCosto[] = [
    { id: 'cc1', empresaId: '1', codigo: '10', nombre: 'ADMINISTRACIÓN', nivel: 1, activo: true, createdAt: '', updatedAt: '', createdBy: '' },
    { id: 'cc2', empresaId: '1', codigo: '20', nombre: 'COMERCIAL / VENTAS', nivel: 1, activo: true, createdAt: '', updatedAt: '', createdBy: '' },
    { id: 'cc3', empresaId: '1', codigo: '20.01', nombre: 'SUCURSAL QUITO', nivel: 2, activo: true, createdAt: '', updatedAt: '', createdBy: '' },
    { id: 'cc4', empresaId: '1', codigo: '20.02', nombre: 'SUCURSAL GUAYAQUIL', nivel: 2, activo: true, createdAt: '', updatedAt: '', createdBy: '' },
    { id: 'cc5', empresaId: '1', codigo: '30', nombre: 'PRODUCCIÓN', nivel: 1, activo: true, createdAt: '', updatedAt: '', createdBy: '' }
];

export class InMemoryContabilidadRepository implements ContabilidadRepository {
    async getAsientos(empresaId: string): Promise<AsientoContable[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_ASIENTOS.filter(a => a.empresaId === empresaId);
    }

    async saveAsiento(asiento: AsientoContable): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 300));
        MOCK_ASIENTOS.unshift(asiento); // Add to beginning
    }

    async getCentrosCostos(empresaId: string): Promise<CentroCosto[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_CENTROS_COSTOS.filter(c => c.empresaId === empresaId);
    }
}
