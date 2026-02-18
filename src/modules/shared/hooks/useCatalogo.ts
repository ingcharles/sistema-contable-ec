import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/shared/utils/api-client';

export interface CatalogoItem {
    id: string;
    codigo: string;
    valor: string;
    catalogo_codigo: string;
    activo: boolean;
}

export function useCatalogo(tipo: string) {
    const [items, setItems] = useState<CatalogoItem[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarItems = useCallback(async () => {
        if (!tipo) return;

        setCargando(true);
        setError(null);
        try {
            const data = await apiClient.get<CatalogoItem[]>(`/api/configuracion/catalogos?tipo=${tipo}`);
            setItems(data || []);
        } catch (err: any) {
            console.error(`Error al cargar catálogo ${tipo}:`, err);
            setError(err.message || 'Error al cargar catálogo');
        } finally {
            setCargando(false);
        }
    }, [tipo]);

    useEffect(() => {
        cargarItems();
    }, [cargarItems]);

    return { items, cargando, error, recargar: cargarItems };
}
