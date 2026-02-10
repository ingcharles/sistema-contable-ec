/**
 * Base class for Use Cases to handle common validation and headers
 */
export class BaseUseCase {
    protected static getHeaders() {
        // En una app real, estos vendrían de un store global (Pinia/Redux) o sesión
        // Intentamos obtener de localStorage si están disponibles
        const empresaId = typeof window !== 'undefined' ? localStorage.getItem('current_empresa_id') : null;
        const usuarioId = typeof window !== 'undefined' ? localStorage.getItem('current_usuario_id') : null;

        return {
            'Content-Type': 'application/json',
            'x-empresa-id': empresaId || '',
            'x-usuario-id': usuarioId || ''
        };
    }

    protected static async request(url: string, options: RequestInit = {}) {
        const headers = { ...this.getHeaders(), ...options.headers };
        const res = await fetch(url, { ...options, headers });
        if (!res.ok) {
            const err = await res.json();
            // Crear error con detalles completos del SRI
            const error = new Error(err.error || err.message || 'Error en la petición al servidor') as any;
            error.details = err.details;
            error.xml = err.xml;
            error.success = err.success;
            error.status = res.status;
            console.error('Error API:', err);
            throw error;
        }
        return await res.json();
    }
}
