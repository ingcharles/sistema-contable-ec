/**
 * Shared API client for direct src/app/api calls
 * Handles common headers and error management
 */

export const apiClient = {
    getHeaders() {
        const empresaId = typeof window !== 'undefined' ? localStorage.getItem('current_empresa_id') : null;
        const usuarioId = typeof window !== 'undefined' ? localStorage.getItem('current_usuario_id') : null;

        return {
            'Content-Type': 'application/json',
            'x-empresa-id': empresaId || '',
            'x-usuario-id': usuarioId || ''
        };
    },

    async request<T>(url: string, options: RequestInit = {}): Promise<T> {
        const headers = { ...this.getHeaders(), ...options.headers };
        const res = await fetch(url, { ...options, headers });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(err.error || `Error ${res.status}: ${res.statusText}`);
        }

        return await res.json();
    },

    async get<T>(url: string, options: RequestInit = {}): Promise<T> {
        return this.request<T>(url, { ...options, method: 'GET' });
    },

    async post<T>(url: string, body: any, options: RequestInit = {}): Promise<T> {
        return this.request<T>(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    async put<T>(url: string, body: any, options: RequestInit = {}): Promise<T> {
        return this.request<T>(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    async delete<T>(url: string, options: RequestInit = {}): Promise<T> {
        return this.request<T>(url, { ...options, method: 'DELETE' });
    }
};
