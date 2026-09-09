import { useState, useCallback } from 'react';
import { CajaChicaUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { ValeCajaChica, CajaChicaInfo } from '../domain/types';

export const useCajaChica = () => {
    const [caja, setCaja] = useState<CajaChicaInfo | null>(null);
    const [vales, setVales] = useState<ValeCajaChica[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarCajaInfo = useCallback(async (empresaId: string) => {
        if (!empresaId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await CajaChicaUseCases.obtenerInfo(empresaId);
            setCaja(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cargar información de caja chica');
        } finally {
            setLoading(false);
        }
    }, []);

    const cargarVales = useCallback(async (empresaId: string) => {
        if (!empresaId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await CajaChicaUseCases.listarVales(empresaId);
            setVales(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cargar vales de caja chica');
        } finally {
            setLoading(false);
        }
    }, []);

    const cargarTodo = useCallback(async (empresaId: string) => {
        if (!empresaId) return;
        setLoading(true);
        setError(null);
        try {
            const [info, valesData] = await Promise.all([
                CajaChicaUseCases.obtenerInfo(empresaId),
                CajaChicaUseCases.listarVales(empresaId)
            ]);
            setCaja(info);
            setVales(valesData);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al cargar datos de caja chica');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        caja,
        vales,
        loading,
        error,
        cargarCajaInfo,
        cargarVales,
        cargarTodo
    };
};

export const useCajaChicaMutations = () => {
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const guardarVale = useCallback(async (empresaId: string, vale: any) => {
        setProcesando(true);
        setError(null);
        try {
            const result = await CajaChicaUseCases.guardarVale(empresaId, vale);
            return result;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al guardar vale';
            setError(msg);
            throw err;
        } finally {
            setProcesando(false);
        }
    }, []);

    const anularVale = useCallback(async (empresaId: string, valeId: string) => {
        setProcesando(true);
        setError(null);
        try {
            const result = await CajaChicaUseCases.anularVale(empresaId, valeId);
            return result;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al anular vale';
            setError(msg);
            throw err;
        } finally {
            setProcesando(false);
        }
    }, []);

    return {
        procesando,
        error,
        guardarVale,
        anularVale
    };
};
