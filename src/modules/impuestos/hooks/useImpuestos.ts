import { useState, useCallback } from 'react';
import { ImpuestosUseCases } from '../../shared/application/useCases/systemUseCases';

/**
 * Hook para gestionar impuestos y formularios SRI
 */
export const useImpuestos = () => {
    const [formularios, setFormularios] = useState<any[]>([]);
    const [anexos, setAnexos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarFormularios = useCallback(async (tipo: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await ImpuestosUseCases.listarFormularios(tipo);
            setFormularios(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cargar formularios');
        } finally {
            setLoading(false);
        }
    }, []);

    const cargarAnexos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ImpuestosUseCases.listarFormularios('ATS');
            setAnexos(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cargar anexos');
        } finally {
            setLoading(false);
        }
    }, []);

    const generarFormulario = useCallback(async (tipo: string, periodo: string) => {
        setLoading(true);
        try {
            await ImpuestosUseCases.generarFormulario(tipo, periodo);
            await cargarFormularios(tipo);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al generar formulario';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [cargarFormularios]);

    const generarATS = useCallback(async (periodo: string) => {
        setLoading(true);
        try {
            await ImpuestosUseCases.generarFormulario('ATS', periodo);
            await cargarAnexos();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al generar ATS';
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [cargarAnexos]);

    return {
        formularios,
        anexos,
        loading,
        error,
        cargarFormularios,
        cargarAnexos,
        generarFormulario,
        generarATS
    };
};
