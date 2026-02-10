import { ActivoFijo } from '@/modules/activos/domain/types';
import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: ACTIVOS FIJOS
 */
export class ActivosUseCases extends BaseUseCase {
    static async listarActivos() {
        return this.request('/api/activos');
    }

    static async guardarActivo(activo: ActivoFijo) {
        return this.request('/api/activos', {
            method: 'POST',
            body: JSON.stringify(activo)
        });
    }

    static async eliminarActivo(id: string) {
        return this.request(`/api/activos?id=${id}`, {
            method: 'DELETE'
        });
    }

    static async calcularDepreciacion(periodo: string) {
        return this.request('/api/activos', {
            method: 'POST',
            body: JSON.stringify({ action: 'depreciar', periodo })
        });
    }
}
