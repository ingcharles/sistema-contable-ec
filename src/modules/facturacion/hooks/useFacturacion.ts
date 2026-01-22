import { useState, useCallback } from 'react';
import { FacturacionUseCases } from '../../shared/application/useCases/systemUseCases';

/**
 * Hook para listar comprobantes electrónicos
 */
export const useComprobantes = () => {
    const [comprobantes, setComprobantes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarComprobantes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await FacturacionUseCases.listarComprobantes();
            setComprobantes(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar comprobantes');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        comprobantes,
        loading,
        error,
        cargarComprobantes
    };
};

/**
 * Hook para listar guías de remisión
 */
export const useGuiasRemision = () => {
    const [guias, setGuias] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarGuias = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await FacturacionUseCases.listarGuias();
            setGuias(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar guías de remisión');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        guias,
        loading,
        error,
        cargarGuias
    };
};

/**
 * Hook para mutaciones de facturación (emitir comprobantes)
 */
export const useFacturacionMutations = () => {
    const [emitiendo, setEmitiendo] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const emitirFactura = useCallback(async (factura: any) => {
        setEmitiendo(true);
        setError(null);
        try {
            const result = await FacturacionUseCases.emitirFactura(factura);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al emitir factura');
            console.error(err);
            throw err;
        } finally {
            setEmitiendo(false);
        }
    }, []);

    const guardarGuiaRemision = useCallback(async (guia: any) => {
        setEmitiendo(true);
        setError(null);
        try {
            const result = await FacturacionUseCases.guardarGuiaRemision(guia);
            return result;
        } catch (err: any) {
            setError(err.message || 'Error al guardar guía de remisión');
            console.error(err);
            throw err;
        } finally {
            setEmitiendo(false);
        }
    }, []);

    return {
        emitiendo,
        error,
        emitirFactura,
        guardarGuiaRemision
    };
};
