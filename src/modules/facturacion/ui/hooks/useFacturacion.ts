'use client';

/**
 * Hook personalizado para el módulo de facturación
 * Conecta la UI con los casos de uso
 */

import { useState, useEffect, useCallback } from 'react';
import { FacturaViewModel, FiltroFactura } from '../../application/models/FacturaViewModel';
import { listarFacturas } from '../../application/useCases/listarFacturas';
import { registrarFactura } from '../../application/useCases/registrarFactura';

export function useFacturacion() {
    const [facturas, setFacturas] = useState<FacturaViewModel[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filtros, setFiltros] = useState<FiltroFactura>({});

    /**
     * Carga las facturas aplicando filtros
     */
    const cargarFacturas = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await listarFacturas({ filtros });

            if (result.success) {
                setFacturas(result.facturas);
            } else {
                setError(result.mensaje || 'Error al cargar facturas');
            }
        } catch (err) {
            setError('Error inesperado al cargar facturas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filtros]);

    /**
     * Agrega una nueva factura
     */
    const agregarFactura = async (factura: FacturaViewModel) => {
        setLoading(true);
        setError(null);

        try {
            const result = await registrarFactura({ factura });

            if (result.success) {
                // Recargar facturas después de agregar
                await cargarFacturas();
                return true;
            } else {
                setError(result.mensaje);
                return false;
            }
        } catch (err) {
            setError('Error al registrar factura');
            console.error(err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Actualiza los filtros
     */
    const actualizarFiltros = (nuevosFiltros: FiltroFactura) => {
        setFiltros(nuevosFiltros);
    };

    // Cargar facturas al montar el componente o cambiar filtros
    useEffect(() => {
        cargarFacturas();
    }, [cargarFacturas]);

    return {
        facturas,
        loading,
        error,
        filtros,
        agregarFactura,
        actualizarFiltros,
        recargar: cargarFacturas,
    };
}
