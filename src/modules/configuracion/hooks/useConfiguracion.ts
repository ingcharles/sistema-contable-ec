import { useState, useCallback } from 'react';
import { ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';

/**
 * Hook para gestionar la configuración (sucursales, puntos de emisión, retenciones, parámetros)
 */
export const useConfiguracion = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- SUCURSALES ---
    const [sucursales, setSucursales] = useState<any[]>([]);
    const cargarSucursales = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ConfiguracionUseCases.listarSucursales();
            setSucursales(data);
            return data;
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cargar sucursales');
        } finally {
            setLoading(false);
        }
    }, []);

    const guardarSucursal = useCallback(async (sucursal: any) => {
        setLoading(true);
        try {
            const result = await ConfiguracionUseCases.guardarSucursal(sucursal);
            await cargarSucursales();
            return result;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al guardar sucursal';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [cargarSucursales]);

    // --- PUNTOS DE EMISIÓN ---
    const [puntosEmision, setPuntosEmision] = useState<any[]>([]);
    const cargarPuntosEmision = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ConfiguracionUseCases.listarPuntosEmision();
            setPuntosEmision(data);
            return data;
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cargar puntos de emisión');
        } finally {
            setLoading(false);
        }
    }, []);

    const guardarPuntoEmision = useCallback(async (punto: any) => {
        setLoading(true);
        try {
            const result = await ConfiguracionUseCases.guardarPuntoEmision(punto);
            await cargarPuntosEmision();
            return result;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al guardar punto de emisión';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [cargarPuntosEmision]);

    // --- CÓDIGOS DE RETENCIÓN ---
    const [retenciones, setRetenciones] = useState<any[]>([]);
    const cargarRetenciones = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ConfiguracionUseCases.listarRetenciones();
            setRetenciones(data);
            return data;
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cargar códigos de retención');
        } finally {
            setLoading(false);
        }
    }, []);

    const guardarRetencion = useCallback(async (retencion: any) => {
        setLoading(true);
        try {
            const result = await ConfiguracionUseCases.guardarRetencion(retencion);
            await cargarRetenciones();
            return result;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al guardar código de retención';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [cargarRetenciones]);

    // --- PARÁMETROS ---
    const [parametros, setParametros] = useState<any>(null);
    const cargarParametros = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ConfiguracionUseCases.obtenerParametros();
            setParametros(data);
            return data;
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cargar parámetros');
        } finally {
            setLoading(false);
        }
    }, []);

    const guardarParametros = useCallback(async (params: any) => {
        setLoading(true);
        try {
            const result = await ConfiguracionUseCases.guardarParametros(params);
            setParametros(params);
            return result;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al guardar parámetros';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        sucursales,
        cargarSucursales,
        guardarSucursal,
        puntosEmision,
        cargarPuntosEmision,
        guardarPuntoEmision,
        retenciones,
        cargarRetenciones,
        guardarRetencion,
        parametros,
        setParametros,
        cargarParametros,
        guardarParametros
    };
};
