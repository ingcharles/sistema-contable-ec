import { useState, useCallback } from 'react';
import { ContabilidadUseCases } from '../../shared/application/useCases/systemUseCases';

/**
 * Hook para listar cuentas contables
 */
export const useCuentasContables = () => {
    const [cuentas, setCuentas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarCuentas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await ContabilidadUseCases.listarCuentas();
            // La API devuelve { data: [], pagination: {} }
            const data = response.data || [];
            setCuentas(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar cuentas');
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
 * Hook para listar TODAS las cuentas contables (sin paginación)
 */
export const useTodasLasCuentas = () => {
    const [cuentas, setCuentas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarTodasLasCuentas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await ContabilidadUseCases.listarTodasLasCuentas();
            const listaCuentas = response.data || [];
            setCuentas(listaCuentas);
            return listaCuentas;
        } catch (err: any) {
            setError(err.message || 'Error al cargar cuentas');
            console.error(err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        cuentas,
        loading,
        error,
        cargarTodasLasCuentas
    };
};

/**
 * Hook para listar SOLO cuentas de movimiento (para selects)
 */
export const useCuentasMovimiento = () => {
    const [cuentas, setCuentas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarCuentasMovimiento = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await ContabilidadUseCases.listarCuentasMovimiento();
            const listaCuentas = response.data || [];
            setCuentas(listaCuentas);
            return listaCuentas;
        } catch (err: any) {
            setError(err.message || 'Error al cargar cuentas de movimiento');
            console.error(err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        cuentas,
        loading,
        error,
        cargarCuentasMovimiento
    };
};

/**
 * Hook para listar asientos contables
 */
export const useAsientosContables = () => {
    const [asientos, setAsientos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarAsientos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ContabilidadUseCases.listarAsientos();
            setAsientos(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar asientos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        asientos,
        loading,
        error,
        cargarAsientos
    };
};

/**
 * Hook para listar centros de costos
 */
export const useCentrosCostos = () => {
    const [centros, setCentros] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarCentros = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ContabilidadUseCases.listarCentrosCostos();
            setCentros(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar centros de costos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        centros,
        loading,
        error,
        cargarCentros
    };
};

/**
 * Hook para mutaciones de contabilidad (crear, actualizar, eliminar)
 */
export const useContabilidadMutations = () => {
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const registrarAsiento = useCallback(async (asiento: any) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await ContabilidadUseCases.registrarAsiento(asiento);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al registrar asiento');
            console.error(err);
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    const guardarCuenta = useCallback(async (cuenta: any) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await ContabilidadUseCases.guardarCuenta(cuenta);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al guardar cuenta');
            console.error(err);
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    const eliminarCuenta = useCallback(async (codigo: string) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await ContabilidadUseCases.eliminarCuenta(codigo);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al eliminar cuenta');
            console.error(err);
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    return {
        guardando,
        error,
        registrarAsiento,
        guardarCuenta,
        eliminarCuenta
    };
};

/**
 * Hook para reportes contables
 */
export const useReportesContables = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const obtenerBalanceGeneral = useCallback(async (fechaCorte: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await ContabilidadUseCases.obtenerBalanceGeneral(fechaCorte);
            return data;
        } catch (err: any) {
            setError(err.message || 'Error al obtener balance general');
            console.error(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const obtenerEstadoResultados = useCallback(async (desde: string, hasta: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await ContabilidadUseCases.obtenerEstadoResultados(desde, hasta);
            return data;
        } catch (err: any) {
            setError(err.message || 'Error al obtener estado de resultados');
            console.error(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        obtenerBalanceGeneral,
        obtenerEstadoResultados
    };
};
