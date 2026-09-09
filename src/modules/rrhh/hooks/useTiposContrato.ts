import { useState, useEffect } from 'react';
import { TipoContratoEntity } from '../domain/types';

export function useTiposContrato() {
    const [tiposContrato, setTiposContrato] = useState<TipoContratoEntity[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTiposContrato = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/rrhh/tipos-contrato');
            if (!response.ok) {
                throw new Error('Error al cargar tipos de contrato');
            }
            const data = await response.json();
            setTiposContrato(data);
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTiposContrato();
    }, []);

    const createTipoContrato = async (tipoData: Partial<TipoContratoEntity>) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/rrhh/tipos-contrato', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tipoData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear tipo de contrato');
            }

            await fetchTiposContrato(); // Recargar listado
            return true;
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateTipoContrato = async (id: string, tipoData: Partial<TipoContratoEntity>) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/rrhh/tipos-contrato', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...tipoData, id })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al actualizar tipo de contrato');
            }

            await fetchTiposContrato(); // Recargar listado
            return true;
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteTipoContrato = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/rrhh/tipos-contrato?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar tipo de contrato');
            }

            await fetchTiposContrato(); // Recargar listado
            return true;
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        tiposContrato,
        loading,
        error,
        fetchTiposContrato,
        createTipoContrato,
        updateTipoContrato,
        deleteTipoContrato
    };
}
