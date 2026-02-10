import { CuentaBancaria, MovimientoBancario } from '@/modules/bancos/domain/types';
import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: BANCOS
 */
export class BancosUseCases extends BaseUseCase {
    static async listarCuentas() {
        return this.request('/api/bancos/cuentas');
    }

    static async listarMovimientos(filtros?: any) {
        const query = filtros ? `?${new URLSearchParams(filtros).toString()}` : '';
        return this.request(`/api/bancos/movimientos${query}`);
    }

    static async registrarTransaccion(transaccion: MovimientoBancario) {
        return this.request('/api/bancos/movimientos', {
            method: 'POST',
            body: JSON.stringify(transaccion)
        });
    }

    static async guardarCuenta(cuenta: CuentaBancaria) {
        return this.request('/api/bancos/cuentas', {
            method: 'POST',
            body: JSON.stringify(cuenta)
        });
    }
}
