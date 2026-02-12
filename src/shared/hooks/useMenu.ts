import { useState, useCallback } from 'react';
import { ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';

// Helper recursivo para construir el árbol
function buildMenuTree(items: any[]) {
    const map = new Map();
    const roots: any[] = [];

    // 1. Inicializar mapa con children vacío
    items.forEach(item => {
        map.set(item.id, { ...item, children: [] });
    });

    // 2. Construir relaciones
    items.forEach(item => {
        const node = map.get(item.id);
        if (item.padreId && map.has(item.padreId)) {
            map.get(item.padreId).children.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
}

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
            const tree = buildMenuTree(data);
            setMenuItems(tree);
            return tree;
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cargar el menú');
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
