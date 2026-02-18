'use client';

import { useState, useEffect } from 'react';
import { X, Save, Box, Warehouse, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { InventarioUseCases } from '@/modules/shared/application/useCases/systemUseCases';

interface TransferenciaModalProps {
    onClose: () => void;
    onSave: () => void;
}

export function TransferenciaModal({ onClose, onSave }: TransferenciaModalProps) {
    const { currentEmpresa } = useEmpresa();
    const [loading, setLoading] = useState(false);
    const [bodegas, setBodegas] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);

    // Form State
    const [bodegaOrigen, setBodegaOrigen] = useState('');
    const [bodegaDestino, setBodegaDestino] = useState('');
    const [referencia, setReferencia] = useState('');
    const [observacion, setObservacion] = useState('');
    const [items, setItems] = useState<any[]>([]);

    // Item Temporary State
    const [selectedProducto, setSelectedProducto] = useState('');
    const [cantidad, setCantidad] = useState(1);

    useEffect(() => {
        const loadData = async () => {
            if (!currentEmpresa) return;
            setLoading(true);
            try {
                const [bRes, pRes] = await Promise.all([
                    InventarioUseCases.listarBodegas(),
                    InventarioUseCases.listarProductos()
                ]);
                setBodegas(Array.isArray(bRes) ? bRes : []);
                // La API de productos devuelve un objeto paginado { data: [], pagination: ... }
                setProductos(pRes?.data || (Array.isArray(pRes) ? pRes : []));
            } catch (err) {
                console.error('Error al cargar datos:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [currentEmpresa]);

    const addItem = () => {
        const prod = productos.find(p => p.id === selectedProducto);
        if (!prod) return;

        // Evitar duplicados
        if (items.some(i => i.productoId === prod.id)) {
            setItems(items.map(i => i.productoId === prod.id ? { ...i, cantidad: i.cantidad + cantidad } : i));
        } else {
            setItems([...items, { ...prod, cantidad, productoId: prod.id }]);
        }

        setSelectedProducto('');
        setCantidad(1);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bodegaOrigen || !bodegaDestino) {
            alert('Debe seleccionar bodega de origen y destino');
            return;
        }
        if (bodegaOrigen === bodegaDestino) {
            alert('La bodega de origen y destino no pueden ser la misma');
            return;
        }
        if (items.length === 0) {
            alert('Debe agregar al menos un producto');
            return;
        }

        setLoading(true);
        try {
            await InventarioUseCases.registrarTransferencia({
                bodegaOrigenId: bodegaOrigen,
                bodegaDestinoId: bodegaDestino,
                referencia,
                observacion,
                items
            });
            onSave();
        } catch (error: any) {
            alert('Error al transferir: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg text-white">
                            <Box size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Nueva Transferencia</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex gap-4 items-center">
                                <Warehouse className="text-red-500" size={24} />
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-red-700 uppercase">Bodega Origen</label>
                                    <select
                                        required
                                        value={bodegaOrigen}
                                        onChange={e => setBodegaOrigen(e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-slate-800"
                                    >
                                        <option value="">Seleccione origen</option>
                                        {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex gap-4 items-center">
                                <Warehouse className="text-green-500" size={24} />
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-green-700 uppercase">Bodega Destino</label>
                                    <select
                                        required
                                        value={bodegaDestino}
                                        onChange={e => setBodegaDestino(e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-slate-800"
                                    >
                                        <option value="">Seleccione destino</option>
                                        {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700">Referencia / Documento</label>
                            <input
                                required
                                value={referencia}
                                onChange={e => setReferencia(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                                placeholder="Ej: TRF-001"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700">Observación</label>
                            <input
                                value={observacion}
                                onChange={e => setObservacion(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                                placeholder="Motivo del traslado..."
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Plus size={16} /> Agregar Productos
                        </h3>
                        <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
                            <div className="flex-1">
                                <select
                                    value={selectedProducto}
                                    onChange={e => setSelectedProducto(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                                >
                                    <option value="">Seleccione Producto</option>
                                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                            </div>
                            <div className="w-24">
                                <input
                                    type="number"
                                    value={cantidad}
                                    onChange={e => setCantidad(Number(e.target.value))}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                                    min="1"
                                />
                            </div>
                            <Button type="button" onClick={addItem} disabled={!selectedProducto}>
                                Agregar
                            </Button>
                        </div>

                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-bold text-slate-600">Producto</th>
                                        <th className="text-right px-4 py-3 font-bold text-slate-600">Cant.</th>
                                        <th className="text-center px-4 py-3 font-bold text-slate-600 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 font-medium">{item.nombre}</td>
                                            <td className="px-4 py-3 text-right font-mono">{item.cantidad}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => removeItem(index)} className="p-1 text-slate-400 hover:text-red-500">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No hay productos agregados</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t bg-slate-50 flex gap-4">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                        Cancelar
                    </Button>
                    <Button type="button" onClick={handleSave} isLoading={loading} className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700">
                        <Save size={18} />
                        Procesar Transferencia
                    </Button>
                </div>
            </div>
        </div>
    );
}
