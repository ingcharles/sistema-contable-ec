'use client';

import { useState, useCallback, useEffect } from 'react';
import { DescargaRobotUseCases } from '../application/useCases/DescargaRobotUseCases';
import {
    DescargaRobot, ComprobanteDescargado, ComprobanteParseado,
    FiltroDescarga, FiltroComprobantes
} from '../domain/descargaRobotTypes';

/**
 * Hook para manejar el estado del módulo Descarga por Robot
 */
export const useDescargaRobot = () => {
    const [descargas, setDescargas] = useState<DescargaRobot[]>([]);
    const [comprobantes, setComprobantes] = useState<ComprobanteDescargado[]>([]);
    const [loading, setLoading] = useState(false);
    const [descargando, setDescargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [filtrosDescarga, setFiltrosDescarga] = useState<{ anio?: number; mes?: number; razonSocial?: string } | undefined>(undefined);

    // ======== Descargas ========
    const cargarDescargas = useCallback(async (filtros?: { anio?: number; mes?: number; razonSocial?: string }, silent = false) => {
        if (!silent) setLoading(true);
        setError(null);

        // Guardar filtros para polling
        if (filtros) setFiltrosDescarga(filtros);
        const filtrosUsar = filtros || filtrosDescarga;

        try {
            const data = await DescargaRobotUseCases.listarDescargas(filtrosUsar);
            setDescargas(Array.isArray(data) ? data : []);
        } catch (err: unknown) {
            if (!silent) {
                const msg = err instanceof Error ? err.message : 'Error al cargar descargas';
                setError(msg);
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }, [filtrosDescarga]);

    // Polling automático si hay descargas en curso
    useEffect(() => {
        const hayActivos = descargas.some(d => d.estado === 'PENDIENTE' || d.estado === 'EN_CURSO');
        if (!hayActivos) return;

        const interval = setInterval(() => {
            cargarDescargas(undefined, true);
        }, 5000); // Poll cada 5s

        return () => clearInterval(interval);
    }, [descargas, cargarDescargas]);


    const iniciarDescarga = useCallback(async (filtro: FiltroDescarga) => {
        setDescargando(true);
        setError(null);
        try {
            const result = await DescargaRobotUseCases.iniciarDescarga(filtro);
            // Ya no recargamos automáticamente para no afectar la vista actual si es diferente
            return result;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al iniciar descarga';
            setError(msg);
            throw err;
        } finally {
            setDescargando(false);
        }
    }, [cargarDescargas]);

    // ======== Comprobantes ========
    const cargarComprobantes = useCallback(async (filtros?: FiltroComprobantes) => {
        setLoading(true);
        setError(null);
        try {
            const data = await DescargaRobotUseCases.listarComprobantes(filtros);
            setComprobantes(Array.isArray(data) ? data : []);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al cargar comprobantes';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const actualizarComprobante = useCallback(async (id: string, estado: string) => {
        try {
            await DescargaRobotUseCases.actualizarComprobante(id, estado);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al actualizar comprobante';
            setError(msg);
        }
    }, []);

    // ======== Parseo ========
    const parsearXml = useCallback(async (xmlContent: string): Promise<ComprobanteParseado | null> => {
        setError(null);
        try {
            return await DescargaRobotUseCases.parsearXml(xmlContent);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al parsear XML';
            setError(msg);
            return null;
        }
    }, []);

    const parsearTxt = useCallback(async (txtContent: string): Promise<ComprobanteParseado | null> => {
        setError(null);
        try {
            return await DescargaRobotUseCases.parsearTxt(txtContent);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al parsear TXT';
            setError(msg);
            return null;
        }
    }, []);

    return {
        // State
        descargas,
        comprobantes,
        loading,
        descargando,
        error,
        // Descargas
        cargarDescargas,
        iniciarDescarga,
        // Comprobantes
        cargarComprobantes,
        actualizarComprobante,
        // Parseo
        parsearXml,
        parsearTxt
    };
};
