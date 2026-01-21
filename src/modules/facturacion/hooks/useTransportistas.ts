import { useState, useCallback } from 'react';
import { FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Transportista } from '../domain/guias';

/**
 * Hook para gestionar transportistas
 */
export const useTransportistas = () => {
    const [transportistas, setTransportistas] = useState<Transportista[]>([]);
    const [loading, setLoading] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarTransportistas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await FacturacionUseCases.listarTransportistas();
            setTransportistas(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar transportistas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const guardarTransportista = useCallback(async (transportista: any) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await FacturacionUseCases.guardarTransportista(transportista);
            return result.data;
        } catch (err: any) {
            setError(err.message || 'Error al guardar transportista');
            console.error(err);
            throw err;
        } finally {
            setGuardando(false);
        }
    }, []);

    return {
        transportistas,
        loading,
        guardando,
        error,
        cargarTransportistas,
        guardarTransportista
    };
};
