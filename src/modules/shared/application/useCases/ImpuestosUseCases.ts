import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: IMPUESTOS
 */
export class ImpuestosUseCases extends BaseUseCase {
    static async listarFormularios(tipo: string) {
        return this.request(`/api/impuestos?tipo=${tipo}`);
    }

    static async generarFormulario(tipo: string, periodo: string) {
        return this.request('/api/impuestos', {
            method: 'POST',
            body: JSON.stringify({ action: 'generar', tipo, periodo })
        });
    }
}
