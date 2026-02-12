'use client';

import { useState, useCallback } from 'react';

/**
 * Hook genérico para operaciones asíncronas con manejo de loading/error.
 * Elimina la duplicación del patrón try/catch/finally/setLoading en todos los hooks del proyecto.
 *
 * @example
 * const { data, loading, error, execute } = useAsyncData(
 *   () => FacturacionUseCases.listarComprobantes()
 * );
 */
export function useAsyncData<T>(initialData: T) {
    const [data, setData] = useState<T>(initialData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(async <R = T>(
        fetcher: () => Promise<R>,
        transform?: (result: R) => T
    ): Promise<R | undefined> => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetcher();
            if (transform) {
                setData(transform(result));
            } else {
                setData(result as unknown as T);
            }
            return result;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error desconocido';
            setError(msg);
            console.error(msg);
            return undefined;
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, setData, loading, error, execute };
}

/**
 * Hook para operaciones de mutación (crear, actualizar, eliminar)
 * donde no necesitas almacenar el resultado en estado.
 */
export function useAsyncMutation() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutate = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
        setLoading(true);
        setError(null);
        try {
            const result = await operation();
            return result;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error desconocido';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, mutate };
}
