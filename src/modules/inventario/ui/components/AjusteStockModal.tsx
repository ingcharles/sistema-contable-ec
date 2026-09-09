'use client';

import React, { useState, useEffect } from 'react';
import { Save, TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { Producto, Bodega, TipoMovimientoInventario } from '../../domain/types';
import { InventarioUseCases } from '@/modules/shared/application/useCases/systemUseCases';

interface Props {
    producto: Producto;
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const AjusteStockModal: React.FC<Props> = ({ producto, onClose, onSave, empresaId }) => {
    const [bodegas, setBodegas] = useState<Bodega[]>([]);
    const [tipo, setTipo] = useState<TipoMovimientoInventario>(TipoMovimientoInventario.ENTRADA);
    const [bodegaId, setBodegaId] = useState('');
    const [cantidad, setCantidad] = useState<number>(0);
    const [costoUnitario, setCostoUnitario] = useState<number>(producto.costoPromedio || 0);
    const [referencia, setReferencia] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const cargarBodegas = async () => {
            try {
                const data = await InventarioUseCases.listarBodegas();
                setBodegas(data);
                if (data.length > 0) {
                    setBodegaId(data[0].id);
                }
            } catch (err) {
                console.error('Error cargando bodegas:', err);
            }
        };
        cargarBodegas();
    }, [empresaId]);

    const handleSubmit = async () => {
        if (!bodegaId || cantidad <= 0) {
            setError('Debe seleccionar una bodega e ingresar una cantidad válida');
            return;
        }

        setGuardando(true);
        setError(null);

        try {
            await InventarioUseCases.ajustarStock({
                productoId: producto.id,
                bodegaId,
                tipo,
                cantidad,
                costoUnitario: (tipo === TipoMovimientoInventario.ENTRADA || tipo === TipoMovimientoInventario.AJUSTE_POSITIVO) ? costoUnitario : 0,
                referencia,
                observaciones
            });

            onSave();
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al registrar el movimiento';
            setError(msg);
        } finally {
            setGuardando(false);
        }
    };

    const esEntrada = tipo === TipoMovimientoInventario.ENTRADA || tipo === TipoMovimientoInventario.AJUSTE_POSITIVO || tipo === TipoMovimientoInventario.DEVOLUCION_VENTA;
    const nuevoStock = esEntrada ? producto.stockActual + cantidad : producto.stockActual - cantidad;

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleSubmit}
            isLoading={guardando}
            submitLabel="Registrar Movimiento"
            submitIcon={<Save size={18} />}
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Ajustar Stock de Inventario"
            description={`Producto: ${producto.nombre} | Stock Actual: ${producto.stockActual}`}
            icon={<Package size={24} />}
            footer={footer}
            size="lg"
        >
            <div className="space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {/* Tipo de Movimiento */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Movimiento *</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setTipo(TipoMovimientoInventario.ENTRADA)}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${tipo === 'ENTRADA'
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-white hover:border-emerald-300'
                                }`}
                        >
                            <TrendingUp size={24} className={tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-slate-400'} />
                            <div className="text-left">
                                <div className="font-bold">Entrada</div>
                                <div className="text-xs opacity-75">Compra o ingreso</div>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipo(TipoMovimientoInventario.SALIDA)}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${tipo === 'SALIDA'
                                ? 'border-rose-500 bg-rose-50 text-rose-700'
                                : 'border-slate-200 bg-white hover:border-rose-300'
                                }`}
                        >
                            <TrendingDown size={24} className={tipo === 'SALIDA' ? 'text-rose-600' : 'text-slate-400'} />
                            <div className="text-left">
                                <div className="font-bold">Salida</div>
                                <div className="text-xs opacity-75">Venta o egreso</div>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipo(TipoMovimientoInventario.AJUSTE_POSITIVO)}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${tipo === 'AJUSTE_POSITIVO'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-slate-200 bg-white hover:border-blue-300'
                                }`}
                        >
                            <TrendingUp size={24} className={tipo === 'AJUSTE_POSITIVO' ? 'text-blue-600' : 'text-slate-400'} />
                            <div className="text-left">
                                <div className="font-bold">Ajuste +</div>
                                <div className="text-xs opacity-75">Corrección positiva</div>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipo(TipoMovimientoInventario.AJUSTE_NEGATIVO)}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${tipo === 'AJUSTE_NEGATIVO'
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-slate-200 bg-white hover:border-orange-300'
                                }`}
                        >
                            <TrendingDown size={24} className={tipo === 'AJUSTE_NEGATIVO' ? 'text-orange-600' : 'text-slate-400'} />
                            <div className="text-left">
                                <div className="font-bold">Ajuste -</div>
                                <div className="text-xs opacity-75">Merma o daño</div>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipo(TipoMovimientoInventario.DEVOLUCION_VENTA)}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${tipo === 'DEVOLUCION_VENTA'
                                ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                                : 'border-slate-200 bg-white hover:border-cyan-300'
                                }`}
                        >
                            <TrendingUp size={24} className={tipo === 'DEVOLUCION_VENTA' ? 'text-cyan-600' : 'text-slate-400'} />
                            <div className="text-left">
                                <div className="font-bold">Dev. Cliente</div>
                                <div className="text-xs opacity-75">Regresa inventario</div>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipo(TipoMovimientoInventario.DEVOLUCION_COMPRA)}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${tipo === 'DEVOLUCION_COMPRA'
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-slate-200 bg-white hover:border-purple-300'
                                }`}
                        >
                            <TrendingDown size={24} className={tipo === 'DEVOLUCION_COMPRA' ? 'text-purple-600' : 'text-slate-400'} />
                            <div className="text-left">
                                <div className="font-bold">Dev. Proveedor</div>
                                <div className="text-xs opacity-75">Sale inventario</div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Bodega y Cantidad */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Bodega *</label>
                        <select
                            value={bodegaId}
                            onChange={(e) => setBodegaId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                        >
                            {bodegas.map(b => (
                                <option key={b.id} value={b.id}>{b.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Cantidad *</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={cantidad}
                            onChange={(e) => setCantidad(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-bold"
                        />
                    </div>
                </div>

                {/* Costo Unitario (solo para entradas) */}
                {esEntrada && (
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Costo Unitario</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={costoUnitario}
                            onChange={(e) => setCostoUnitario(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-mono"
                        />
                        <p className="text-xs text-slate-500 mt-1">Costo actual: ${Number(producto.costoPromedio || 0).toFixed(2)}</p>
                    </div>
                )}

                {/* Referencia */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Referencia / Documento</label>
                    <input
                        type="text"
                        value={referencia}
                        onChange={(e) => setReferencia(e.target.value)}
                        placeholder="Ej: FACTURA-001-123456"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                    />
                </div>

                {/* Observaciones */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Observaciones</label>
                    <textarea
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        rows={3}
                        placeholder="Detalles adicionales del movimiento..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all resize-none"
                    />
                </div>

                {/* Preview del resultado */}
                <div className="p-4 bg-sri-blue/5 rounded-xl border border-sri-blue/20">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Stock Actual:</span>
                        <span className="text-lg font-bold text-slate-800">{producto.stockActual}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-medium text-slate-600">Nuevo Stock:</span>
                        <span className={`text-lg font-black ${nuevoStock < 0 ? 'text-red-600' : 'text-sri-blue'}`}>
                            {nuevoStock}
                        </span>
                    </div>
                    {nuevoStock < 0 && (
                        <p className="text-xs text-red-600 mt-2">⚠️ El stock resultante es negativo</p>
                    )}
                </div>
            </div>
        </Modal>
    );
};
