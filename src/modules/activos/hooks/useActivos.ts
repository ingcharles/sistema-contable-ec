import { useState, useCallback } from 'react';
import { ActivosUseCases } from '../../shared/application/useCases/systemUseCases';

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
            const data = await ActivosUseCases.listarActivos();
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

    const guardarActivo = useCallback(async (activo: any) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await ActivosUseCases.guardarActivo(activo);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al guardar activo');
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    const eliminarActivo = useCallback(async (id: string) => {
        setGuardando(true);
        setError(null);
        try {
            await ActivosUseCases.eliminarActivo(id);
        } catch (err: any) {
            setError(err.message || 'Error al eliminar activo');
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    const calcularDepreciacion = useCallback(async (periodo: string) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await ActivosUseCases.calcularDepreciacion(periodo);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al calcular depreciación');
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    return {
        guardando,
        error,
        guardarActivo,
        eliminarActivo,
        calcularDepreciacion
    };
};
