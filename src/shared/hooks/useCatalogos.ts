import { useState, useEffect } from 'react';

export interface CatalogoItem {
    codigo: string;
    valor: string;
    descripcion?: string;
}

export interface CatalogosResult {
    [key: string]: CatalogoItem[];
}

/**
 * Hook para obtener catálogos dinámicos desde la API.
 * @param codigosArray Lista de códigos de catálogo a obtener (ej: ['SRI_TIPO_COMPROBANTE'])
 */
export function useCatalogos(codigosArray: string[]) {
    const [catalogos, setCatalogos] = useState<CatalogosResult>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCatalogos = async () => {
            if (codigosArray.length === 0) return;

            try {
                setLoading(true);
                // Construir query string: ?codigos=SRI_A,SRI_B
                const codigosParam = codigosArray.join(',');
                const response = await fetch(`/api/catalogos?codigos=${codigosParam}`);

                if (!response.ok) {
                    throw new Error('Error al cargar catálogos');
                }

                const data = await response.json();
                setCatalogos(data);
                setError(null);
            } catch (err: any) {
                // Silenciar error si el endpoint no existe aún
                console.warn('Hook useCatalogos: No se pudieron cargar catálogos', err.message);
                setError(err.message || 'Error desconocido');
                setCatalogos({}); // Retornar objeto vacío en caso de error
            } finally {
                setLoading(false);
            }
        };

        fetchCatalogos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(codigosArray)]); // Re-ejecutar solo si el array cambia de contenido

    /**
     * Helper para obtener items de un catálogo específico con tipo seguro
     */
    const getCatalogo = (codigo: string): CatalogoItem[] => {
        return catalogos[codigo] || [];
    };

    return { catalogos, getCatalogo, loading, error };
}
