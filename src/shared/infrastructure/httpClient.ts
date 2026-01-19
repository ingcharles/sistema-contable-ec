/**
 * Cliente HTTP centralizado para todas las peticiones API
 * Maneja autenticación, interceptores y manejo de errores
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface HttpClientConfig {
    headers?: Record<string, string>;
    baseURL?: string;
}

class HttpClient {
    private baseURL: string;
    private defaultHeaders: Record<string, string>;

    constructor(config?: HttpClientConfig) {
        this.baseURL = config?.baseURL || API_BASE_URL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            ...config?.headers,
        };
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;

        // Obtener token de autenticación si existe
        const token = typeof window !== 'undefined'
            ? localStorage.getItem('authToken')
            : null;

        const headers = {
            ...this.defaultHeaders,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Manejar sesión expirada
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('authToken');
                        window.location.href = '/login';
                    }
                }

                const error = await response.json().catch(() => ({
                    message: 'Error en la petición',
                }));

                throw new Error(error.message || `HTTP Error ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('HTTP Client Error:', error);
            throw error;
        }
    }

    async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }

    async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }
}

// Exportar instancia singleton
export const httpClient = new HttpClient();
