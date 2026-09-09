import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: PLANES
 */
export class PlanesUseCases extends BaseUseCase {
    static async listarPlanes() {
        return this.request('/api/configuracion/planes');
    }

    static async crearPlan(plan: any) {
        return this.request('/api/configuracion/planes', {
            method: 'POST',
            body: JSON.stringify(plan)
        });
    }

    static async actualizarPlan(id: string, plan: any) {
        return this.request(`/api/configuracion/planes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(plan)
        });
    }

    static async eliminarPlan(id: string) {
        return this.request(`/api/configuracion/planes/${id}`, {
            method: 'DELETE'
        });
    }
}
