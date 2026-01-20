import { useState, useCallback } from 'react';
import { NominaUseCases } from '@/modules/shared/application/useCases/systemUseCases';

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
            const data = await NominaUseCases.listarEmpleados();
            setEmpleados(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar empleados');
            console.error(err);
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
            const data = await NominaUseCases.listarRoles(periodo);
            setRoles(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar roles de pago');
            console.error(err);
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
 * Hook para mutaciones de nómina
 */
export const useNominaMutations = () => {
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const guardarEmpleado = useCallback(async (empleado: any) => {
        setProcesando(true);
        setError(null);
        try {
            const result = await NominaUseCases.guardarEmpleado(empleado);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al guardar empleado');
            console.error(err);
            throw err;
        } finally {
            setProcesando(false);
        }
    }, []);

    const generarRol = useCallback(async (periodo: string) => {
        setProcesando(true);
        setError(null);
        try {
            const result = await NominaUseCases.generarRol(periodo);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al generar rol de pago');
            console.error(err);
            throw err;
        } finally {
            setProcesando(false);
        }
    }, []);

    const eliminarEmpleado = useCallback(async (id: string) => {
        setProcesando(true);
        setError(null);
        try {
            const result = await NominaUseCases.eliminarEmpleado(id);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al eliminar empleado');
            console.error(err);
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
