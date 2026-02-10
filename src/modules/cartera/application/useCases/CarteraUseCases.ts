import { Anticipo, TransaccionCartera } from '@/modules/cartera/domain/types';
import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: CARTERA
 */
export class CarteraUseCases extends BaseUseCase {
    static async listarCuentasPorCobrar() {
        return this.request('/api/cartera/cxc');
    }
    static async registrarPago(pago: TransaccionCartera) {
        return this.request('/api/cartera/pagos', {
            method: 'POST',
            body: JSON.stringify(pago)
        });
    }
    static async listarDocumentosPendientes(tipo: string, terceroId?: string) {
        let url = `/api/cartera/documentos?tipo=${tipo}`;
        if (terceroId) url += `&terceroId=${terceroId}`;
        return this.request(url);
    }
    static async listarAnticipos(tipo: string) {
        return this.request(`/api/cartera/anticipos?tipo=${tipo}`);
    }
    static async registrarAnticipo(anticipo: Anticipo) {
        return this.request('/api/cartera/anticipos', {
            method: 'POST',
            body: JSON.stringify(anticipo)
        });
    }

    static async obtenerReporteAging(tipo: string) {
        return this.request(`/api/cartera/aging?tipo=${tipo}`);
    }
}
