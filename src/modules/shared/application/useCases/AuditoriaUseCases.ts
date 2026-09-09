import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: AUDITORÍA
 */
export class AuditoriaUseCases extends BaseUseCase {
    static async consultarLogs(filtros: { desde?: string, hasta?: string, usuarioId?: string, modulo?: string, evento?: string, severidad?: string, limit?: number, offset?: number }) {
        const query = new URLSearchParams(filtros as any).toString();
        return this.request(`/api/auditoria/sistema?${query}`);
    }
}
