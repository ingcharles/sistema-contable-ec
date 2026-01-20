import { useState, useCallback } from 'react';
import { InventarioUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { MovimientoKardex, TipoMovimientoInventario } from '../domain/types';

export const useKardex = () => {
    const [movimientos, setMovimientos] = useState<MovimientoKardex[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const listarMovimientos = useCallback(async (productoId: string, desde: string, hasta: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await InventarioUseCases.listarKardex(productoId, desde, hasta) as any[];
            const mappedData: MovimientoKardex[] = data.map((item: any) => {
                const isEntrada = ['ENTRADA', 'AJUSTE_POSITIVO', 'COMPRA', 'DEVOLUCION_VENTA'].includes(item.tipo);
                const cantidad = Number(item.cantidad);
                const costo = Number(item.costo_unitario);

                return {
                    id: item.id,
                    productoId: item.producto_id || productoId,
                    bodegaId: item.bodega_id,
                    fecha: item.fecha ? new Date(item.fecha).toISOString().split('T')[0] : '',
                    tipo: item.tipo as TipoMovimientoInventario,
                    referenciaComprobante: item.referencia || item.observaciones || '',
                    cantidadEntrada: isEntrada ? cantidad : 0,
                    valorEntrada: isEntrada ? cantidad * costo : 0,
                    cantidadSalida: !isEntrada ? cantidad : 0,
                    valorSalida: !isEntrada ? cantidad * costo : 0,
                    saldoCantidad: Number(item.stock_resultante),
                    saldoValor: Number(item.stock_resultante) * costo, // Costo unitario actual como proxy del costo promedio actual
                    costoUnitario: costo,
                    createdAt: item.created_at || new Date().toISOString(),
                    updatedAt: item.created_at || new Date().toISOString(),
                    createdBy: item.created_by || 'system'
                };
            });
            setMovimientos(mappedData);
        } catch (err: any) {
            setError(err.message || 'Error al cargar kardex');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        movimientos,
        loading,
        error,
        listarMovimientos
    };
};
