import { useState, useEffect } from 'react';
import { Area } from '../domain/types';

export function useAreas() {
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAreas = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/rrhh/areas');
            if (!response.ok) {
                throw new Error('Error al cargar áreas');
            }
            const data = await response.json();
            setAreas(data);
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas();
    }, []);

    const createArea = async (areaData: Partial<Area>) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/rrhh/areas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(areaData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear área');
            }

            await fetchAreas(); // Recargar listado
            return true;
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateArea = async (id: string, areaData: Partial<Area>) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/rrhh/areas', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...areaData, id })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al actualizar área');
            }

            await fetchAreas(); // Recargar listado
            return true;
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteArea = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/rrhh/areas?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar área');
            }

            await fetchAreas(); // Recargar listado
            return true;
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        areas,
        loading,
        error,
        fetchAreas,
        createArea,
        updateArea,
        deleteArea
    };
}
