import { useState, useCallback } from 'react';
import { RRHHUseCases } from '@/modules/shared/application/useCases/systemUseCases';

/**
 * Hook para listar empleados
 */
export const useEmpleados = () => {
    const [empleados, setEmpleados] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarEmpleados = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await RRHHUseCases.listarEmpleados();
            setEmpleados(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cargar empleados');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        empleados,
        loading,
        error,
        cargarEmpleados
    };
};

/**
 * Hook para gestión de roles de pago
 */
export const useRolesPago = () => {
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarRoles = useCallback(async (periodo: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await RRHHUseCases.listarRoles(periodo);
            setRoles(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cargar roles de pago');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        roles,
        loading,
        error,
        cargarRoles
    };
};

/**
 * Hook para gestión de áreas
 */
export const useAreas = () => {
    const [areas, setAreas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const cargarAreas = useCallback(async () => {
        setLoading(true);
        try {
            const data = await RRHHUseCases.listarAreas();
            setAreas(data);
        } catch (error) {
            console.error('Error al cargar áreas:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    return { areas, loading, cargarAreas };
};

/**
 * Hook para gestión de cargos
 */
export const useCargos = () => {
    const [cargos, setCargos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const cargarCargos = useCallback(async (areaId?: string) => {
        setLoading(true);
        try {
            const data = await RRHHUseCases.listarCargos(areaId);
            setCargos(data);
        } catch (error) {
            console.error('Error al cargar cargos:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    return { cargos, loading, cargarCargos };
};

/**
 * Hook para gestión de tipos de contrato
 */
export const useTiposContrato = () => {
    const [tiposContrato, setTiposContrato] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const cargarTipos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await RRHHUseCases.listarTiposContrato();
            setTiposContrato(data);
        } catch (error) {
            console.error('Error al cargar tipos de contrato:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    return { tiposContrato, loading, cargarTipos };
};

/**
 * Hook para mutaciones de nómina
 */
export const useNominaMutations = () => {
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const guardarEmpleado = useCallback(async (empleado: any) => {
        setProcesando(true);
        setError(null);
        try {
            const result = await RRHHUseCases.guardarEmpleado(empleado);
            return result;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al guardar empleado';
            setError(msg);
            throw err;
        } finally {
            setProcesando(false);
        }
    }, []);

    const generarRol = useCallback(async (periodo: string) => {
        setProcesando(true);
        setError(null);
        try {
            const result = await RRHHUseCases.generarRol(periodo);
            return result;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al generar rol de pago';
            setError(msg);
            throw err;
        } finally {
            setProcesando(false);
        }
    }, []);

    const eliminarEmpleado = useCallback(async (id: string) => {
        setProcesando(true);
        setError(null);
        try {
            const result = await RRHHUseCases.eliminarEmpleado(id);
            return result;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al eliminar empleado';
            setError(msg);
            throw err;
        } finally {
            setProcesando(false);
        }
    }, []);

    return {
        procesando,
        error,
        guardarEmpleado,
        generarRol,
        eliminarEmpleado
    };
};
