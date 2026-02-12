import { AsientoContable, CuentaContable } from '@/modules/contabilidad/domain/types';
import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: CONTABILIDAD
 */
export class ContabilidadUseCases extends BaseUseCase {
    static async listarCuentas() {
        return this.request('/api/contabilidad/cuentas');
    }
    static async listarTodasLasCuentas() {
        return this.request('/api/contabilidad/cuentas?all=true');
    }
    static async listarCuentasMovimiento() {
        return this.request('/api/contabilidad/cuentas?all=true&soloMovimiento=true');
    }
    static async registrarAsiento(asiento: AsientoContable) {
        return this.request('/api/contabilidad/asientos', {
            method: 'POST',
            body: JSON.stringify(asiento)
        });
    }
    static async listarAsientos() {
        return this.request('/api/contabilidad/asientos');
    }
    static async listarCentrosCostos() {
        return this.request('/api/contabilidad/centros-costos');
    }

    static async eliminarCentroCosto(id: string) {
        return this.request(`/api/contabilidad/centros-costos/${id}`, {
            method: 'DELETE'
        });
    }
    static async obtenerBalanceGeneral(fechaCorte: string) {
        return this.request(`/api/contabilidad/reportes/balance?fecha=${fechaCorte}`);
    }
    static async obtenerEstadoResultados(desde: string, hasta: string) {
        return this.request(`/api/contabilidad/reportes/resultados?desde=${desde}&hasta=${hasta}`);
    }
    static async guardarCuenta(cuenta: CuentaContable) {
        return this.request('/api/contabilidad/cuentas', {
            method: 'POST',
            body: JSON.stringify(cuenta)
        });
    }
    static async eliminarCuenta(codigo: string) {
        return this.request(`/api/contabilidad/cuentas/${codigo}`, {
            method: 'DELETE'
        });
    }

    static async obtenerFlujoEfectivo(desde: string, hasta: string) {
        return this.request(`/api/contabilidad/reportes/flujo-efectivo?desde=${desde}&hasta=${hasta}`);
    }

    static async obtenerCambiosPatrimonio(desde: string, hasta: string) {
        return this.request(`/api/contabilidad/reportes/cambios-patrimonio?desde=${desde}&hasta=${hasta}`);
    }

    static async obtenerBalanceComprobacion(desde: string, hasta: string, nivel: number = 4) {
        return this.request(`/api/contabilidad/reportes/balance-comprobacion?desde=${desde}&hasta=${hasta}&nivel=${nivel}`);
    }

    static async obtenerLibroDiario(desde: string, hasta: string, centroCostoId?: string) {
        let url = `/api/contabilidad/reportes/libro-diario?desde=${desde}&hasta=${hasta}`;
        if (centroCostoId) url += `&centroCostoId=${centroCostoId}`;
        return this.request(url);
    }

    static async obtenerLibroMayor(desde: string, hasta: string, cuentaCodigo: string) {
        return this.request(`/api/contabilidad/reportes/libro-mayor?desde=${desde}&hasta=${hasta}&cuentaCodigo=${cuentaCodigo}`);
    }
}
