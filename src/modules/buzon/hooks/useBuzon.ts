import { useState, useCallback } from 'react';
import { BuzonUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { ComprobanteRecibido } from '../domain/types';

/**
 * Hook para gestionar el buzón de comprobantes recibidos del SRI
 */
export const useBuzon = () => {
    const [comprobantes, setComprobantes] = useState<ComprobanteRecibido[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarComprobantes = useCallback(async (empresaId: string) => {
        if (!empresaId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await BuzonUseCases.listarComprobantes(empresaId);
            setComprobantes(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar comprobantes del buzón');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const sincronizarSRI = useCallback(async (empresaId: string, desde: string, hasta: string) => {
        if (!empresaId) return;
        setImporting(true);
        setError(null);
        try {
            await BuzonUseCases.sincronizarSRI(empresaId, desde, hasta);
            await cargarComprobantes(empresaId);
        } catch (err: any) {
            setError(err.message || 'Error al sincronizar con el SRI');
            console.error(err);
            throw err;
        } finally {
            setImporting(false);
        }
    }, [cargarComprobantes]);

    const procesarComprobante = useCallback(async (id: string, empresaId: string) => {
        try {
            await BuzonUseCases.procesarComprobante(id);
            await cargarComprobantes(empresaId);
        } catch (err: any) {
            console.error('Error al procesar comprobante:', err);
        }
    }, [cargarComprobantes]);

    return {
        comprobantes,
        loading,
        importing,
        error,
        cargarComprobantes,
        sincronizarSRI,
        procesarComprobante
    };
};
