import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: BUZÓN SRI
 */
export class BuzonUseCases extends BaseUseCase {
    static async listarComprobantes(empresaId: string) {
        return this.request(`/api/buzon?empresaId=${empresaId}`);
    }

    static async sincronizarSRI(empresaId: string, desde: string, hasta: string) {
        return this.request('/api/buzon', {
            method: 'POST',
            body: JSON.stringify({
                action: 'importar',
                empresaId,
                desde,
                hasta
            })
        });
    }

    static async procesarComprobante(id: string) {
        return this.request(`/api/buzon/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ estado: 'PROCESADO' })
        });
    }
}
