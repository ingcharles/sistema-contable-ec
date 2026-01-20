import { useState, useCallback } from 'react';
import { AuditoriaUseCases } from '@/modules/shared/application/useCases/systemUseCases';

/**
 * Hook para consultar logs de auditoría
 */
export const useAuditoria = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const consultarLogs = useCallback(async (filtros: any = {}) => {
        setLoading(true);
        setError(null);
        try {
            const data = await AuditoriaUseCases.consultarLogs(filtros);
            setLogs(data);
            return data;
        } catch (err: any) {
            setError(err.message || 'Error al consultar logs de auditoría');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        logs,
        loading,
        error,
        consultarLogs
    };
};
