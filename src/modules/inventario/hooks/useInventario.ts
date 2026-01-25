import { useState, useEffect, useCallback } from 'react';
import { InventarioUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { CategoriaProducto } from '../domain/types';

/**
 * Hook para gestionar la lectura de Categorías
 * Encapsula el ciclo de vida y el mapeo de datos.
 */
export const useCategorias = (empresaId: string) => {
    const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategorias = useCallback(async () => {
        if (!empresaId) return;
        setLoading(true);
        try {
            const response = await InventarioUseCases.listarTodasCategorias();
            // Extraer datos de la respuesta paginada
            const data = response.data || [];
           
            setCategorias(data);
            setError(null);
        } catch (err: any) {
            console.error("Error cargando categorías:", err);
            setError(err.message || 'Error al cargar categorías');
        } finally {
            setLoading(false);
        }
    }, [empresaId]);

    useEffect(() => {
        fetchCategorias();
    }, [fetchCategorias]);

    return { categorias, loading, error, refetch: fetchCategorias };
};

/**
 * Hook para operaciones de escritura (Mutaciones) de Inventario
 * Maneja estados de carga y errores de guardado.
 */
export const useInventarioMutations = () => {
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const guardarProducto = async (producto: any) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await InventarioUseCases.guardarProducto(producto);
            return { success: true, data: result };
        } catch (err: any) {
            const msg = err.message || 'Error al guardar el producto';
            setError(msg);
            return { success: false, error: msg };
        } finally {
            setGuardando(false);
        }
    };

    const guardarCategoria = async (categoria: any) => {
        setGuardando(true);
        setError(null);
        try {
            const result = await InventarioUseCases.guardarCategoria(categoria);
            return { success: true, data: result };
        } catch (err: any) {
            const msg = err.message || 'Error al guardar la categoría';
            setError(msg);
            return { success: false, error: msg };
        } finally {
            setGuardando(false);
        }
    };

    return {
        guardando,
        error,
        guardarProducto,
        guardarCategoria
    };
};
