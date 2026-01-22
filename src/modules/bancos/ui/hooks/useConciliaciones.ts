'use client';

import { useState, useCallback } from 'react';
import { BancoConciliacion, EstadoConciliacion } from '@/modules/bancos/domain/types';

interface CreateConciliacionDTO {
    empresaId: string;
    cuentaId: string;
    fechaCorte: string;
    saldoLibro: number;
    saldoExtracto: number;
    chequesNoCobrados: number;
    depositosEnTransito: number;
    diferencia: number;
    estado: EstadoConciliacion;
    observaciones?: string;
    movimientosIds: string[];
}

interface UpdateConciliacionDTO extends Partial<CreateConciliacionDTO> {
    id: string;
}

export function useConciliaciones(cuentaId?: string) {
    const [conciliaciones, setConciliaciones] = useState<BancoConciliacion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchConciliaciones = useCallback(async () => {
        if (!cuentaId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/bancos/conciliaciones?cuentaId=${cuentaId}`);
            if (!response.ok) {
                throw new Error('Error al cargar conciliaciones');
            }
            const data = await response.json();
            setConciliaciones(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [cuentaId]);

    const getConciliacion = useCallback(async (id: string): Promise<BancoConciliacion | null> => {
        try {
            const response = await fetch(`/api/bancos/conciliaciones?id=${id}`);
            if (!response.ok) {
                throw new Error('Error al cargar conciliación');
            }
            return await response.json();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            return null;
        }
    }, []);

    const createConciliacion = useCallback(async (data: CreateConciliacionDTO): Promise<BancoConciliacion | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/bancos/conciliaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear conciliación');
            }

            const newConciliacion = await response.json();
            setConciliaciones(prev => [newConciliacion, ...prev]);
            return newConciliacion;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateConciliacion = useCallback(async (data: UpdateConciliacionDTO): Promise<BancoConciliacion | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/bancos/conciliaciones', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al actualizar conciliación');
            }

            const updatedConciliacion = await response.json();
            setConciliaciones(prev =>
                prev.map(c => c.id === data.id ? updatedConciliacion : c)
            );
            return updatedConciliacion;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteConciliacion = useCallback(async (id: string): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/bancos/conciliaciones?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar conciliación');
            }

            setConciliaciones(prev => prev.filter(c => c.id !== id));
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        conciliaciones,
        loading,
        error,
        fetchConciliaciones,
        getConciliacion,
        createConciliacion,
        updateConciliacion,
        deleteConciliacion
    };
}
