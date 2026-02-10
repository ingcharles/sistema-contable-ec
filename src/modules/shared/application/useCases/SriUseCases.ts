import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: SRI / CONFIGURACIÓN
 */
export class SriUseCases extends BaseUseCase {
    static async obtenerMetadata() {
        return this.request('/api/configuracion/sri/metadata');
    }

    static async guardarConfiguracion(data: any) {
        return this.request('/api/configuracion/sri', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async obtenerAmbientes() {
        return this.request('/api/configuracion/sri/ambientes');
    }
}
