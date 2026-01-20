import { useState, useCallback } from 'react';
import { DirectorioUseCases } from '@/modules/shared/application/useCases/systemUseCases';

/**
 * Hook para listar terceros (clientes/proveedores)
 */
export const useTerceros = () => {
    const [terceros, setTerceros] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarTerceros = useCallback(async (tipo?: string, buscar?: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await DirectorioUseCases.listarTerceros(tipo, buscar);
            setTerceros(data);
            return data;
        } catch (err: any) {
            setError(err.message || 'Error al cargar terceros');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        terceros,
        loading,
        error,
        cargarTerceros
    };
};

/**
 * Hook para mutaciones de directorio (crear, actualizar, eliminar)
 */
export const useDirectorioMutations = () => {
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const guardarTercero = useCallback(async (tercero: any) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await DirectorioUseCases.guardarTercero(tercero);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al guardar tercero');
            console.error(err);
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    const actualizarTercero = useCallback(async (id: string, tercero: any) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await DirectorioUseCases.actualizarTercero(id, tercero);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al actualizar tercero');
            console.error(err);
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    const eliminarTercero = useCallback(async (id: string) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await DirectorioUseCases.eliminarTercero(id);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al eliminar tercero');
            console.error(err);
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    return {
        guardando,
        error,
        guardarTercero,
        actualizarTercero,
        eliminarTercero
    };
};
