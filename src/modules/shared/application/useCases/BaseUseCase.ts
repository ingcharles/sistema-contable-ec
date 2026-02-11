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
            let errorDetails: any = { error: 'Error en la petición al servidor' };

            try {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    errorDetails = await res.json();
                } else {
                    const text = await res.text();
                    errorDetails = { error: `Error ${res.status}: ${res.statusText}`, details: text.substring(0, 100) };
                }
            } catch (e) {
                errorDetails = { error: `Error ${res.status}: ${res.statusText}` };
            }

            const error = new Error(errorDetails.error || errorDetails.message || 'Error en la petición') as any;
            error.details = errorDetails.details;
            error.xml = errorDetails.xml;
            error.success = errorDetails.success;
            error.status = res.status;

            console.error('Error API:', errorDetails);
            throw error;
        }

        try {
            return await res.json();
        } catch (e) {
            console.error('Error parseando JSON de respuesta exitosa:', e);
            throw new Error('La respuesta del servidor no es un JSON válido');
        }
    }
}
