import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: DASHBOARD
 */
export class DashboardUseCases extends BaseUseCase {
    static async obtenerEstadisticas() {
        return this.request('/api/dashboard/stats');
    }
}
