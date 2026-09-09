import { ValeCajaChica } from '@/modules/caja-chica/domain/types';
import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: CAJA CHICA
 */
export class CajaChicaUseCases extends BaseUseCase {
    static async obtenerInfo(empresaId: string) {
        return this.request(`/api/caja-chica?empresaId=${empresaId}&action=info`);
    }

    static async listarVales(empresaId: string) {
        return this.request(`/api/caja-chica?empresaId=${empresaId}`);
    }

    static async guardarVale(empresaId: string, vale: ValeCajaChica) {
        return this.request('/api/caja-chica', {
            method: 'POST',
            body: JSON.stringify({ empresaId, vale })
        });
    }

    static async anularVale(empresaId: string, valeId: string) {
        return this.request('/api/caja-chica', {
            method: 'POST',
            body: JSON.stringify({ action: 'anular', valeId, empresaId })
        });
    }
}
