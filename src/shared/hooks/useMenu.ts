import { useState, useCallback } from 'react';
import { ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';

/**
 * Hook para gestionar el menú dinámico del sistema
 */
export const useMenu = () => {
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cargarMenu = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ConfiguracionUseCases.obtenerMenu();
            setMenuItems(data);
            return data;
        } catch (err: any) {
            setError(err.message || 'Error al cargar el menú');
            console.error('Error loading menu:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        menuItems,
        loading,
        error,
        cargarMenu
    };
};
