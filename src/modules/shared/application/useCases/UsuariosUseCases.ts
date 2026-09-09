import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: USUARIOS Y SUSCRIPCIONES
 */
export class UsuariosUseCases extends BaseUseCase {
    static async obtenerSuscripcion() {
        return this.request('/api/users/me/subscription');
    }

    static async obtenerEstadisticasUso(periodo?: string) {
        const query = periodo ? `?periodo=${periodo}` : '';
        return this.request(`/api/users/me/usage${query}`);
    }

    // --- ADMINISTRACIÓN DE USUARIOS ---
    static async listarUsuarios(filtros?: any) {
        const query = filtros ? `?${new URLSearchParams(filtros).toString()}` : '';
        return this.request(`/api/administracion/usuarios${query}`);
    }

    static async obtenerUsuario(id: string) {
        return this.request(`/api/administracion/usuarios/${id}`);
    }

    static async guardarUsuario(usuario: any) {
        if (usuario.id) {
            return this.request(`/api/administracion/usuarios/${usuario.id}`, {
                method: 'PUT',
                body: JSON.stringify(usuario)
            });
        }
        return this.request('/api/administracion/usuarios', {
            method: 'POST',
            body: JSON.stringify(usuario)
        });
    }

    static async eliminarUsuario(id: string) {
        return this.request(`/api/administracion/usuarios/${id}`, {
            method: 'DELETE'
        });
    }

    // --- ASIGNACIÓN DE PUNTOS DE EMISIÓN ---
    static async listarAsignacionesPuntos(filtros?: any) {
        const query = filtros ? `?${new URLSearchParams(filtros).toString()}` : '';
        return this.request(`/api/administracion/puntos-emision/asignaciones${query}`);
    }

    static async guardarAsignacionPunto(asignacion: any) {
        return this.request('/api/administracion/puntos-emision/asignaciones', {
            method: 'POST',
            body: JSON.stringify(asignacion)
        });
    }

    static async eliminarAsignacionPunto(id: string) {
        return this.request(`/api/administracion/puntos-emision/asignaciones/${id}`, {
            method: 'DELETE'
        });
    }
}
