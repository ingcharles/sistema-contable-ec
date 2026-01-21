import { useState, useCallback } from 'react';
import { apiClient } from '@/shared/utils/api-client';

/**
 * Hook para gestionar activos fijos
 */
export const useActivos = () => {
    const [activos, setActivos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarActivos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.get<any[]>('/api/activos');
            setActivos(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar activos');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        activos,
        loading,
        error,
        cargarActivos
    };
};

/**
 * Hook para mutaciones de activos fijos
 */
export const useActivosMutations = () => {
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const guardarActivo = async (activo: any) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await apiClient.post('/api/activos', activo);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al guardar activo');
            throw err;
        } finally {
            setGuardando(false);
        }
    };

    const eliminarActivo = async (id: string) => {
        setGuardando(true);
        setError(null);
        try {
            await apiClient.delete(`/api/activos?id=${id}`);
        } catch (err: any) {
            setError(err.message || 'Error al eliminar activo');
            throw err;
        } finally {
            setGuardando(false);
        }
    };

    const calcularDepreciacion = async (periodo: string) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await apiClient.post('/api/activos', { action: 'depreciar', periodo });
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al calcular depreciación');
            throw err;
        } finally {
            setGuardando(false);
        }
    };

    return {
        guardando,
        error,
        guardarActivo,
        eliminarActivo,
        calcularDepreciacion
    };
};
