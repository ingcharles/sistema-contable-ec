import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

export interface Rol {
    id: string;
    nombre: string;
    descripcion?: string;
    permisos?: Permiso[];
}

export interface Permiso {
    id: string;
    codigo: string;
    nombre: string;
    modulo: string;
    descripcion?: string;
}

export class RolesUseCases extends BaseUseCase {
    static async listarRoles() {
        return this.request('/api/seguridad/roles');
    }

    static async obtenerRol(id: string) {
        return this.request(`/api/seguridad/roles/${id}`);
    }

    static async guardarRol(rol: Partial<Rol> & { permisosIds: string[] }) {
        const method = rol.id ? 'PUT' : 'POST';
        const url = rol.id ? `/api/seguridad/roles/${rol.id}` : '/api/seguridad/roles';

        return this.request(url, {
            method,
            body: JSON.stringify(rol)
        });
    }

    static async eliminarRol(id: string) {
        return this.request(`/api/seguridad/roles/${id}`, {
            method: 'DELETE'
        });
    }

    static async listarPermisos() {
        return this.request('/api/seguridad/permisos');
    }
}
