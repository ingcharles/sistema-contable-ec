import { useState, useEffect } from 'react';
import { Cargo } from '../domain/types';

interface useCargosOptions {
    areaId?: string | null;
}

export function useCargos(options?: useCargosOptions) {
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCargos = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (options?.areaId) {
                params.append('areaId', options.areaId);
            }

            const response = await fetch(`/api/rrhh/cargos?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Error al cargar cargos');
            }
            const data = await response.json();
            setCargos(data);
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCargos();
    }, [options?.areaId]);

    const createCargo = async (cargoData: Partial<Cargo>) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/rrhh/cargos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cargoData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear cargo');
            }

            await fetchCargos(); // Recargar listado
            return true;
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateCargo = async (id: string, cargoData: Partial<Cargo>) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/rrhh/cargos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...cargoData, id })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al actualizar cargo');
            }

            await fetchCargos(); // Recargar listado
            return true;
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteCargo = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/rrhh/cargos?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar cargo');
            }

            await fetchCargos(); // Recargar listado
            return true;
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        cargos,
        loading,
        error,
        fetchCargos,
        createCargo,
        updateCargo,
        deleteCargo
    };
}
