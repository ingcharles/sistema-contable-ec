import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: PLANES
 */
export class PlanesUseCases extends BaseUseCase {
    static async listarPlanes() {
        return this.request('/api/planes');
    }
}
