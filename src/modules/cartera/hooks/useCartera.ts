import { useState, useCallback } from 'react';
import { CarteraUseCases } from '@/modules/shared/application/useCases/systemUseCases';

/**
 * Hook para listar cuentas por cobrar
 */
export const useCuentasPorCobrar = () => {
    const [cuentas, setCuentas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarCuentas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await CarteraUseCases.listarCuentasPorCobrar();
            setCuentas(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cargar cuentas por cobrar');
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
 * Hook para listar documentos pendientes
 */
export const useDocumentosPendientes = () => {
    const [documentos, setDocumentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarDocumentos = useCallback(async (tipo: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await CarteraUseCases.listarDocumentosPendientes(tipo);
            setDocumentos(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cargar documentos pendientes');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        documentos,
        loading,
        error,
        cargarDocumentos
    };
};

/**
 * Hook para listar anticipos
 */
export const useAnticipos = () => {
    const [anticipos, setAnticipos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarAnticipos = useCallback(async (tipo: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await CarteraUseCases.listarAnticipos(tipo);
            setAnticipos(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cargar anticipos');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        anticipos,
        loading,
        error,
        cargarAnticipos
    };
};

/**
 * Hook para mutaciones de cartera (pagos)
 */
export const useCarteraMutations = () => {
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const registrarPago = useCallback(async (pago: any) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await CarteraUseCases.registrarPago(pago);
            return result;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al registrar pago';
            setError(msg);
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    return {
        guardando,
        error,
        registrarPago
    };
};
