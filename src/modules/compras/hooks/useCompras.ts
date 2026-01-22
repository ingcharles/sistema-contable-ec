import { useState, useCallback } from 'react';
import { ComprasUseCases } from '../../shared/application/useCases/systemUseCases';

/**
 * Hook para gestionar compras y órdenes de compra
 */
export const useCompras = () => {
    const [compras, setCompras] = useState<any[]>([]);
    const [ordenes, setOrdenes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarCompras = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ComprasUseCases.listarCompras();
            setCompras(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar compras');
        } finally {
            setLoading(false);
        }
    }, []);

    const cargarOrdenes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ComprasUseCases.listarOrdenes();
            setOrdenes(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar órdenes de compra');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        compras,
        ordenes,
        loading,
        error,
        cargarCompras,
        cargarOrdenes
    };
};

/**
 * Hook para mutaciones de compras
 */
export const useComprasMutations = () => {
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const registrarCompra = useCallback(async (compra: any) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await ComprasUseCases.registrarCompra(compra);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al registrar compra');
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    const registrarOrden = useCallback(async (orden: any) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await ComprasUseCases.registrarOrden(orden);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al registrar orden de compra');
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    const generarRetencion = useCallback(async (compraId: string) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await ComprasUseCases.generarRetencion(compraId);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al generar retención');
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    return {
        guardando,
        error,
        registrarCompra,
        registrarOrden,
        generarRetencion
    };
};
