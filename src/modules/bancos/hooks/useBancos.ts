import { useState, useCallback } from 'react';
import { BancosUseCases } from '@/modules/shared/application/useCases/systemUseCases';

/**
 * Hook para listar cuentas bancarias
 */
export const useCuentasBancarias = () => {
    const [cuentas, setCuentas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarCuentas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await BancosUseCases.listarCuentasBancarias();
            setCuentas(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar cuentas bancarias');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        cuentas,
        loading,
        error,
        cargarCuentas
    };
};

/**
 * Hook para listar movimientos bancarios
 */
export const useMovimientosBancarios = () => {
    const [movimientos, setMovimientos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarMovimientos = useCallback(async (cuentaId: string, desde: string, hasta: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await BancosUseCases.listarMovimientos(cuentaId, desde, hasta);
            setMovimientos(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar movimientos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        movimientos,
        loading,
        error,
        cargarMovimientos
    };
};

/**
 * Hook para mutaciones bancarias (transacciones)
 */
export const useBancosMutations = () => {
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const registrarTransaccion = useCallback(async (transaccion: any) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await BancosUseCases.registrarTransaccion(transaccion);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al registrar transacción');
            console.error(err);
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    return {
        guardando,
        error,
        registrarTransaccion
    };
};
