import { useState, useCallback } from 'react';
import { apiClient } from '@/shared/utils/api-client';

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
            const data = await apiClient.get<any[]>('/api/compras');
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
            const data = await apiClient.get<any[]>('/api/compras/ordenes');
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

    const registrarCompra = async (compra: any) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await apiClient.post('/api/compras', compra);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al registrar compra');
            throw err;
        } finally {
            setGuardando(false);
        }
    };

    const registrarOrden = async (orden: any) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await apiClient.post('/api/compras/ordenes', orden);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al registrar orden de compra');
            throw err;
        } finally {
            setGuardando(false);
        }
    };

    const generarRetencion = async (compraId: string) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await apiClient.post('/api/compras', { action: 'retencion', compraId });
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al generar retención');
            throw err;
        } finally {
            setGuardando(false);
        }
    };

    return {
        guardando,
        error,
        registrarCompra,
        registrarOrden,
        generarRetencion
    };
};
