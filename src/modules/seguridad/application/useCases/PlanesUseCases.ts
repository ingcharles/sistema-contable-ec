
import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';
import { Plan } from '@/shared/types';

export class PlanesUseCases extends BaseUseCase {
    static async listarPlanes(): Promise<Plan[]> {
        return this.request('/api/seguridad/planes');
    }

    static async crearPlan(plan: Partial<Plan>): Promise<Plan> {
        return this.request('/api/seguridad/planes', {
            method: 'POST',
            body: JSON.stringify(plan)
        });
    }

    static async obtenerPlan(id: string): Promise<Plan> {
        return this.request(`/api/seguridad/planes/${id}`);
    }

    static async actualizarPermisos(id: string, permisos: string[]): Promise<void> {
        return this.request(`/api/seguridad/planes/${id}/permisos`, {
            method: 'PUT',
            body: JSON.stringify({ permisos })
        });
    }

    static async actualizarPlan(id: string, data: Partial<Plan>): Promise<void> {
        return this.request(`/api/seguridad/planes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
}
