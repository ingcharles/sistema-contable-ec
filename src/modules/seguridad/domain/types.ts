export interface Permiso {
    id: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    modulo: string;
}

export interface Rol {
    id: string;
    nombre: string;
    descripcion?: string;
    permisos?: Permiso[]; // Lista de permisos asignados
    esEditable?: boolean; // if false, cannot be deleted/edited (e.g. SUPERADMIN)
}

export interface UsuarioRol {
    usuarioId: string;
    rol: Rol;
}
