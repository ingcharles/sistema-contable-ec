/**
 * Gestión de almacenamiento de autenticación
 * Maneja tokens, datos de usuario y sesión
 */

export interface Usuario {
    id: string;
    nombre: string;
    email: string;
    rol: string;
}

export interface AuthData {
    token: string;
    usuario: Usuario;
    empresaId?: string;
}

const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';
const EMPRESA_ID_KEY = 'empresaId';

export const authStorage = {
    // Guardar datos de autenticación
    setAuthData(data: AuthData): void {
        if (typeof window === 'undefined') return;

        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.usuario));

        if (data.empresaId) {
            localStorage.setItem(EMPRESA_ID_KEY, data.empresaId);
        }
    },

    // Obtener token
    getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(AUTH_TOKEN_KEY);
    },

    // Obtener datos del usuario
    getUsuario(): Usuario | null {
        if (typeof window === 'undefined') return null;

        const userData = localStorage.getItem(USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    },

    // Obtener ID de empresa
    getEmpresaId(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(EMPRESA_ID_KEY);
    },

    // Cambiar empresa activa
    setEmpresaId(empresaId: string): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(EMPRESA_ID_KEY, empresaId);
    },

    // Verificar si está autenticado
    isAuthenticated(): boolean {
        return !!this.getToken();
    },

    // Limpiar datos de autenticación
    clearAuthData(): void {
        if (typeof window === 'undefined') return;

        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        localStorage.removeItem(EMPRESA_ID_KEY);
    },
};
