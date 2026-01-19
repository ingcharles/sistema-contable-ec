import { CuentaBancaria, MovimientoBancario, TipoCuenta, TipoMovimientoBancario, BancosRepository } from '../domain/types';

const MOCK_CUENTAS: CuentaBancaria[] = [
    {
        id: 'cta1',
        empresaId: '1',
        banco: 'BANCO PICHINCHA C.A.',
        numeroCuenta: '2100456789',
        tipo: TipoCuenta.CORRIENTE,
        saldoContable: 15400.50,
        saldoDisponible: 15400.50,
        moneda: 'USD',
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'cta2',
        empresaId: '1',
        banco: 'BANCO DE GUAYAQUIL S.A.',
        numeroCuenta: '4300123456',
        tipo: TipoCuenta.CORRIENTE,
        saldoContable: 8200.00,
        saldoDisponible: 7500.00,
        moneda: 'USD',
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

const MOCK_MOVIMIENTOS: MovimientoBancario[] = [
    {
        id: 'm1',
        cuentaId: 'cta1',
        fecha: '2023-10-25',
        tipo: TipoMovimientoBancario.TRANSFERENCIA_RECIBIDA,
        referencia: 'SPI-998877',
        beneficiario: 'COMERCIAL ECUADOR S.A.',
        concepto: 'Pago Factura 001-002-4521 Cliente Supermaxi',
        monto: 1680.00,
        esEgreso: false,
        conciliado: true,
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'm2',
        cuentaId: 'cta1',
        fecha: '2023-10-26',
        tipo: TipoMovimientoBancario.CHEQUE,
        referencia: 'CHQ-000451',
        beneficiario: 'CONECEL S.A.',
        concepto: 'Pago servicios telefonía',
        monto: 51.75,
        esEgreso: true,
        conciliado: false,
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'm3',
        cuentaId: 'cta1',
        fecha: '2023-10-27',
        tipo: TipoMovimientoBancario.DEPOSITO,
        referencia: 'DEP-123',
        beneficiario: 'COMERCIAL ECUADOR S.A.',
        concepto: 'Depósito ventas efectivo del día',
        monto: 450.00,
        esEgreso: false,
        conciliado: true,
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

export class InMemoryBancosRepository implements BancosRepository {
    async getCuentas(empresaId: string): Promise<CuentaBancaria[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_CUENTAS.filter(c => c.empresaId === empresaId);
    }

    async getMovimientos(cuentaId: string, fechaInicio: string, fechaFin: string): Promise<MovimientoBancario[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return MOCK_MOVIMIENTOS.filter(m => m.cuentaId === cuentaId && m.fecha >= fechaInicio && m.fecha <= fechaFin);
    }

    async saveMovimiento(movimiento: MovimientoBancario): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 300));
        MOCK_MOVIMIENTOS.unshift(movimiento);

        const cuenta = MOCK_CUENTAS.find(c => c.id === movimiento.cuentaId);
        if (cuenta) {
            if (movimiento.esEgreso) {
                cuenta.saldoContable -= movimiento.monto;
                cuenta.saldoDisponible -= movimiento.monto;
            } else {
                cuenta.saldoContable += movimiento.monto;
                cuenta.saldoDisponible += movimiento.monto;
            }
        }
    }
}
