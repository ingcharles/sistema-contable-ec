import { AsientoContable, CentroCosto, ContabilidadRepository, BalanceGeneral, EstadoResultados } from '../domain/types';

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

export let PLAN_CUENTAS_MOCK: any[] = [
    // 1. ACTIVO
    { codigo: '1', nombre: 'ACTIVO', nivel: 1, tipo: 'ACTIVO', saldo: 250000 },
    // 1.1 ACTIVO CORRIENTE
    { codigo: '1.1', nombre: 'ACTIVO CORRIENTE', nivel: 2, tipo: 'ACTIVO', saldo: 150000 },
    { codigo: '1.1.01', nombre: 'EFECTIVO Y EQUIVALENTES', nivel: 3, tipo: 'ACTIVO', saldo: 45000 },
    { codigo: '1.1.01.01', nombre: 'CAJA GENERAL', nivel: 4, tipo: 'ACTIVO', saldo: 5000 },
    { codigo: '1.1.01.02', nombre: 'CAJA CHICA', nivel: 4, tipo: 'ACTIVO', saldo: 500 },
    { codigo: '1.1.01.03', nombre: 'BANCOS', nivel: 4, tipo: 'ACTIVO', saldo: 35000 },
    { codigo: '1.1.01.04', nombre: 'INVERSIONES TEMPORALES', nivel: 4, tipo: 'ACTIVO', saldo: 4500 },
    { codigo: '1.1.02', nombre: 'CUENTAS POR COBRAR', nivel: 3, tipo: 'ACTIVO', saldo: 65000 },
    { codigo: '1.1.02.01', nombre: 'CUENTAS POR COBRAR CLIENTES', nivel: 4, tipo: 'ACTIVO', saldo: 55000 },
    { codigo: '1.1.02.02', nombre: 'PROVISIÓN CUENTAS INCOBRABLES', nivel: 4, tipo: 'ACTIVO', saldo: -2000 },
    { codigo: '1.1.02.03', nombre: 'DOCUMENTOS POR COBRAR', nivel: 4, tipo: 'ACTIVO', saldo: 8000 },
    { codigo: '1.1.02.04', nombre: 'ANTICIPOS A PROVEEDORES', nivel: 4, tipo: 'ACTIVO', saldo: 4000 },
    { codigo: '1.1.02.05', nombre: 'ANTICIPO A PROVEEDORES (CARTERA)', nivel: 4, tipo: 'ACTIVO', saldo: 0 },
    { codigo: '1.1.03', nombre: 'INVENTARIOS', nivel: 3, tipo: 'ACTIVO', saldo: 32000 },
    { codigo: '1.1.03.01', nombre: 'INVENTARIO DE MERCADERÍAS', nivel: 4, tipo: 'ACTIVO', saldo: 28000 },
    { codigo: '1.1.03.02', nombre: 'INVENTARIO DE SUMINISTROS', nivel: 4, tipo: 'ACTIVO', saldo: 4000 },
    { codigo: '1.1.04', nombre: 'OTROS ACTIVOS CORRIENTES', nivel: 3, tipo: 'ACTIVO', saldo: 8000 },
    { codigo: '1.1.04.01', nombre: 'IVA PAGADO', nivel: 4, tipo: 'ACTIVO', saldo: 5000 },
    { codigo: '1.1.04.02', nombre: 'CRÉDITO TRIBUTARIO IVA', nivel: 4, tipo: 'ACTIVO', saldo: 2000 },
    { codigo: '1.1.04.03', nombre: 'RETENCIONES EN LA FUENTE', nivel: 4, tipo: 'ACTIVO', saldo: 1000 },
    { codigo: '1.1.05.01', nombre: 'IVA COMPRAS (PARAM)', nivel: 4, tipo: 'ACTIVO', saldo: 0 },
    // 1.2 ACTIVO NO CORRIENTE
    { codigo: '1.2', nombre: 'ACTIVO NO CORRIENTE', nivel: 2, tipo: 'ACTIVO', saldo: 100000 },
    { codigo: '1.2.01', nombre: 'PROPIEDAD, PLANTA Y EQUIPO', nivel: 3, tipo: 'ACTIVO', saldo: 85000 },
    { codigo: '1.2.01.01', nombre: 'TERRENOS', nivel: 4, tipo: 'ACTIVO', saldo: 40000 },
    { codigo: '1.2.01.02', nombre: 'EDIFICIOS', nivel: 4, tipo: 'ACTIVO', saldo: 50000 },
    { codigo: '1.2.01.03', nombre: 'DEPRECIACIÓN ACUMULADA EDIFICIOS', nivel: 4, tipo: 'ACTIVO', saldo: -10000 },
    { codigo: '1.2.01.04', nombre: 'MUEBLES Y ENSERES', nivel: 4, tipo: 'ACTIVO', saldo: 8000 },
    { codigo: '1.2.01.05', nombre: 'DEPRECIACIÓN ACUMULADA MUEBLES', nivel: 4, tipo: 'ACTIVO', saldo: -1600 },
    { codigo: '1.2.01.06', nombre: 'EQUIPO DE COMPUTACIÓN', nivel: 4, tipo: 'ACTIVO', saldo: 6000 },
    { codigo: '1.2.01.07', nombre: 'DEPRECIACIÓN ACUMULADA EQUIPO CÓMPUTO', nivel: 4, tipo: 'ACTIVO', saldo: -2000 },
    { codigo: '1.2.01.08', nombre: 'VEHÍCULOS', nivel: 4, tipo: 'ACTIVO', saldo: 25000 },
    { codigo: '1.2.01.09', nombre: 'DEPRECIACIÓN ACUMULADA VEHÍCULOS', nivel: 4, tipo: 'ACTIVO', saldo: -5000 },
    { codigo: '1.2.02', nombre: 'ACTIVOS INTANGIBLES', nivel: 3, tipo: 'ACTIVO', saldo: 15000 },
    { codigo: '1.2.02.01', nombre: 'SOFTWARE Y LICENCIAS', nivel: 4, tipo: 'ACTIVO', saldo: 12000 },
    { codigo: '1.2.02.02', nombre: 'AMORTIZACIÓN ACUMULADA INTANGIBLES', nivel: 4, tipo: 'ACTIVO', saldo: -2000 },
    { codigo: '1.2.02.03', nombre: 'MARCAS Y PATENTES', nivel: 4, tipo: 'ACTIVO', saldo: 5000 },
    // 2. PASIVO
    { codigo: '2', nombre: 'PASIVO', nivel: 1, tipo: 'PASIVO', saldo: 120000 },
    // 2.1 PASIVO CORRIENTE
    { codigo: '2.1', nombre: 'PASIVO CORRIENTE', nivel: 2, tipo: 'PASIVO', saldo: 80000 },
    { codigo: '2.1.01', nombre: 'CUENTAS POR PAGAR', nivel: 3, tipo: 'PASIVO', saldo: 45000 },
    { codigo: '2.1.01.01', nombre: 'CUENTAS POR PAGAR PROVEEDORES', nivel: 4, tipo: 'PASIVO', saldo: 40000 },
    { codigo: '2.1.01.02', nombre: 'DOCUMENTOS POR PAGAR', nivel: 4, tipo: 'PASIVO', saldo: 5000 },
    { codigo: '2.1.01.05', nombre: 'ANTICIPO DE CLIENTES (CARTERA)', nivel: 4, tipo: 'PASIVO', saldo: 0 },
    { codigo: '2.1.02', nombre: 'OBLIGACIONES FISCALES', nivel: 3, tipo: 'PASIVO', saldo: 18000 },
    { codigo: '2.1.02.01', nombre: 'IVA POR PAGAR', nivel: 4, tipo: 'PASIVO', saldo: 8000 },
    { codigo: '2.1.02.02', nombre: 'RETENCIONES EN LA FUENTE POR PAGAR', nivel: 4, tipo: 'PASIVO', saldo: 5000 },
    { codigo: '2.1.02.03', nombre: 'RETENCIONES IVA POR PAGAR', nivel: 4, tipo: 'PASIVO', saldo: 3000 },
    { codigo: '2.1.02.04', nombre: 'IMPUESTO A LA RENTA POR PAGAR', nivel: 4, tipo: 'PASIVO', saldo: 2000 },
    { codigo: '2.1.03.01', nombre: 'RETENCION RENTA POR PAGAR (PARAM)', nivel: 4, tipo: 'PASIVO', saldo: 0 },
    { codigo: '2.1.07.01', nombre: 'IVA VENTAS (PARAM)', nivel: 4, tipo: 'PASIVO', saldo: 0 },
    // 3. PATRIMONIO
    { codigo: '3', nombre: 'PATRIMONIO', nivel: 1, tipo: 'PATRIMONIO', saldo: 130000 },
    { codigo: '3.1', nombre: 'CAPITAL', nivel: 2, tipo: 'PATRIMONIO', saldo: 100000 },
    { codigo: '3.1.01', nombre: 'CAPITAL SOCIAL', nivel: 3, tipo: 'PATRIMONIO', saldo: 100000 },
    { codigo: '3.1.01.01', nombre: 'CAPITAL SUSCRITO', nivel: 4, tipo: 'PATRIMONIO', saldo: 100000 },
    { codigo: '3.2', nombre: 'RESERVAS', nivel: 2, tipo: 'PATRIMONIO', saldo: 15000 },
    { codigo: '3.2.01', nombre: 'RESERVA LEGAL', nivel: 3, tipo: 'PATRIMONIO', saldo: 10000 },
    { codigo: '3.2.02', nombre: 'RESERVA FACULTATIVA', nivel: 3, tipo: 'PATRIMONIO', saldo: 5000 },
    { codigo: '3.3', nombre: 'RESULTADOS', nivel: 2, tipo: 'PATRIMONIO', saldo: 15000 },
    { codigo: '3.3.01', nombre: 'UTILIDADES RETENIDAS', nivel: 3, tipo: 'PATRIMONIO', saldo: 10000 },
    { codigo: '3.3.02', nombre: 'UTILIDAD DEL EJERCICIO', nivel: 3, tipo: 'PATRIMONIO', saldo: 5000 },
    { codigo: '3.3.03', nombre: 'PÉRDIDA DEL EJERCICIO', nivel: 3, tipo: 'PATRIMONIO', saldo: 0 },
    // 4. INGRESOS
    { codigo: '4', nombre: 'INGRESOS', nivel: 1, tipo: 'INGRESO', saldo: 0 },
    { codigo: '4.1', nombre: 'INGRESOS OPERACIONALES', nivel: 2, tipo: 'INGRESO', saldo: 0 },
    { codigo: '4.1.01', nombre: 'VENTAS', nivel: 3, tipo: 'INGRESO', saldo: 0 },
    { codigo: '4.1.01.01', nombre: 'VENTAS TARIFA 15%', nivel: 4, tipo: 'INGRESO', saldo: 0 },
    { codigo: '4.1.01.02', nombre: 'VENTAS TARIFA 0%', nivel: 4, tipo: 'INGRESO', saldo: 0 },
    // 5. COSTOS
    { codigo: '5', nombre: 'COSTOS', nivel: 1, tipo: 'GASTO', saldo: 0 },
    { codigo: '5.1', nombre: 'COSTO DE VENTAS', nivel: 2, tipo: 'GASTO', saldo: 0 },
    { codigo: '5.1.01', nombre: 'COSTO DE VENTAS MERCADERÍAS', nivel: 3, tipo: 'GASTO', saldo: 0 },
    // 6. GASTOS
    { codigo: '6', nombre: 'GASTOS', nivel: 1, tipo: 'GASTO', saldo: 0 },
    { codigo: '6.1', nombre: 'GASTOS ADMINISTRATIVOS', nivel: 2, tipo: 'GASTO', saldo: 0 },
    { codigo: '6.1.01', nombre: 'SUELDOS Y SALARIOS', nivel: 3, tipo: 'GASTO', saldo: 0 },
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

    async getPlanCuentas(_empresaId: string): Promise<any[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return PLAN_CUENTAS_MOCK;
    }

    async saveCuenta(cuenta: any): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const index = PLAN_CUENTAS_MOCK.findIndex(c => c.codigo === cuenta.codigo);
        if (index >= 0) {
            PLAN_CUENTAS_MOCK[index] = cuenta;
        } else {
            PLAN_CUENTAS_MOCK.push(cuenta);
            // Sort by code to keep tree structure
            PLAN_CUENTAS_MOCK.sort((a, b) => a.codigo.localeCompare(b.codigo));
        }
    }

    async deleteCuenta(codigo: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const index = PLAN_CUENTAS_MOCK.findIndex(c => c.codigo === codigo);
        if (index >= 0) {
            PLAN_CUENTAS_MOCK.splice(index, 1);
        }
    }

    async getBalanceGeneral(_empresaId: string, _fechaCorte: string): Promise<BalanceGeneral> {
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
            activos: {
                codigo: '1', nombre: 'ACTIVO', saldo: 185000.00, nivel: 1, tipo: 'ACTIVO',
                hijos: [
                    {
                        codigo: '1.1', nombre: 'ACTIVO CORRIENTE', saldo: 85000.00, nivel: 2, tipo: 'ACTIVO',
                        hijos: [
                            { codigo: '1.1.01', nombre: 'EFECTIVO Y EQUIVALENTES', saldo: 45000.00, nivel: 3, tipo: 'ACTIVO' },
                            { codigo: '1.1.02', nombre: 'CUENTAS POR COBRAR', saldo: 40000.00, nivel: 3, tipo: 'ACTIVO' }
                        ]
                    },
                    {
                        codigo: '1.2', nombre: 'ACTIVO NO CORRIENTE', saldo: 100000.00, nivel: 2, tipo: 'ACTIVO',
                        hijos: [
                            { codigo: '1.2.01', nombre: 'PROPIEDAD PLANTA Y EQUIPO', saldo: 100000.00, nivel: 3, tipo: 'ACTIVO' }
                        ]
                    }
                ]
            },
            pasivos: {
                codigo: '2', nombre: 'PASIVO', saldo: 45000.00, nivel: 1, tipo: 'PASIVO',
                hijos: [
                    {
                        codigo: '2.1', nombre: 'PASIVO CORRIENTE', saldo: 45000.00, nivel: 2, tipo: 'PASIVO',
                        hijos: [
                            { codigo: '2.1.01', nombre: 'CUENTAS POR PAGAR', saldo: 25000.00, nivel: 3, tipo: 'PASIVO' },
                            { codigo: '2.1.02', nombre: 'OBLIGACIONES LABORALES', saldo: 20000.00, nivel: 3, tipo: 'PASIVO' }
                        ]
                    }
                ]
            },
            patrimonio: {
                codigo: '3', nombre: 'PATRIMONIO', saldo: 140000.00, nivel: 1, tipo: 'PATRIMONIO',
                hijos: [
                    { codigo: '3.1', nombre: 'CAPITAL SOCIAL', saldo: 100000.00, nivel: 2, tipo: 'PATRIMONIO' },
                    { codigo: '3.2', nombre: 'RESULTADOS ACUMULADOS', saldo: 40000.00, nivel: 2, tipo: 'PATRIMONIO' }
                ]
            },
            totalActivos: 185000.00,
            totalPasivos: 45000.00,
            totalPatrimonio: 140000.00,
            ecuacionContable: true
        };
    }

    async getEstadoResultados(_empresaId: string, _fechaInicio: string, _fechaFin: string): Promise<EstadoResultados> {
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
            ingresos: {
                codigo: '4', nombre: 'INGRESOS', saldo: 125000.00, nivel: 1, tipo: 'INGRESOS',
                hijos: [
                    { codigo: '4.1', nombre: 'VENTAS NETAS', saldo: 125000.00, nivel: 2, tipo: 'INGRESOS' }
                ]
            },
            gastos: {
                codigo: '5', nombre: 'GASTOS', saldo: 85000.00, nivel: 1, tipo: 'GASTOS',
                hijos: [
                    { codigo: '5.1', nombre: 'COSTO DE VENTAS', saldo: 45000.00, nivel: 2, tipo: 'GASTOS' },
                    { codigo: '5.2', nombre: 'GASTOS ADMINISTRATIVOS', saldo: 25000.00, nivel: 2, tipo: 'GASTOS' },
                    { codigo: '5.3', nombre: 'GASTOS DE VENTAS', saldo: 15000.00, nivel: 2, tipo: 'GASTOS' }
                ]
            },
            utilidadOperativa: 40000.00,
            utilidadNeta: 40000.00
        };
    }
}
