import { useState, useCallback } from 'react';
import { apiClient } from '@/shared/utils/api-client';

/**
 * Hook para gestionar impuestos y formularios SRI
 */
export const useImpuestos = () => {
    const [formularios, setFormularios] = useState<any[]>([]);
    const [anexos, setAnexos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarFormularios = useCallback(async (tipo: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.get<any[]>(`/api/impuestos?tipo=${tipo}`);
            setFormularios(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar formularios');
        } finally {
            setLoading(false);
        }
    }, []);

    const cargarAnexos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.get<any[]>('/api/impuestos?tipo=ATS');
            setAnexos(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar anexos');
        } finally {
            setLoading(false);
        }
    }, []);

    const generarFormulario = async (tipo: string, periodo: string) => {
        setLoading(true);
        try {
            await apiClient.post('/api/impuestos', { action: 'generar', tipo, periodo });
            await cargarFormularios(tipo);
        } catch (err: any) {
            setError(err.message || 'Error al generar formulario');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const generarATS = async (periodo: string) => {
        setLoading(true);
        try {
            await apiClient.post('/api/impuestos', { action: 'generar', tipo: 'ATS', periodo });
            await cargarAnexos();
        } catch (err: any) {
            setError(err.message || 'Error al generar ATS');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        formularios,
        anexos,
        loading,
        error,
        cargarFormularios,
        cargarAnexos,
        generarFormulario,
        generarATS
    };
};
