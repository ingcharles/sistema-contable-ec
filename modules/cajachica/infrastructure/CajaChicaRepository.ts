
import { FondoCaja, GastoCaja, ReposicionCaja, EstadoCaja } from '../domain/types';

const MOCK_FONDOS: FondoCaja[] = [
    {
        id: 'fc1',
        empresaId: '1',
        nombre: 'Caja Chica Administración',
        responsable: 'María Asistente',
        montoAsignado: 300.00,
        saldoActual: 245.50,
        estado: EstadoCaja.ABIERTA,
        cuentaContableId: '1.1.01.03',
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'fc2',
        empresaId: '1',
        nombre: 'Caja Chica Ventas',
        responsable: 'Juan Vendedor',
        montoAsignado: 200.00,
        saldoActual: 20.00, // Necesita reposición
        estado: EstadoCaja.EN_REPOSICION,
        cuentaContableId: '1.1.01.03',
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

const MOCK_GASTOS: GastoCaja[] = [
    {
        id: 'g1',
        fondoCajaId: 'fc1',
        fecha: '2023-10-25',
        concepto: 'Taxi envío documentos SRI',
        proveedor: 'Taxi Rutas',
        monto: 12.50,
        categoriaGasto: 'Movilización',
        estado: 'REGISTRADO',
        centroCostoId: '10', // Administración
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'g2',
        fondoCajaId: 'fc1',
        fecha: '2023-10-26',
        concepto: 'Compra café y azúcar',
        proveedor: 'Tienda La Esquina',
        nroComprobante: '001-001-123',
        monto: 42.00,
        categoriaGasto: 'Suministros',
        estado: 'REGISTRADO',
        centroCostoId: '10',
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

export class InMemoryCajaChicaRepository {
    async getFondos(empresaId: string): Promise<FondoCaja[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_FONDOS.filter(f => f.empresaId === empresaId);
    }

    async getGastosPendientes(fondoId: string): Promise<GastoCaja[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return MOCK_GASTOS.filter(g => g.fondoCajaId === fondoId && g.estado === 'REGISTRADO');
    }

    async registrarGasto(gasto: GastoCaja): Promise<void> {
        MOCK_GASTOS.unshift(gasto);
        const fondo = MOCK_FONDOS.find(f => f.id === gasto.fondoCajaId);
        if (fondo) {
            fondo.saldoActual -= gasto.monto;
        }
    }

    async generarReposicion(reposicion: ReposicionCaja): Promise<void> {
        // En prod: Crear registro Reposicion y actualizar estado de gastos
        const fondo = MOCK_FONDOS.find(f => f.id === reposicion.fondoCajaId);
        if (fondo) {
            fondo.saldoActual += reposicion.montoTotal; // Repuesto
            fondo.estado = EstadoCaja.ABIERTA;
        }
        // Marcar gastos como repuestos
        MOCK_GASTOS.forEach(g => {
            if (reposicion.gastosIncluidosIds.includes(g.id)) {
                g.estado = 'REPUESTO';
            }
        });
    }
}
