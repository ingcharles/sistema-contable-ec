'use client';

import { useState, useEffect } from 'react';
import { X, Save, Package, Tag, DollarSign, BarChart2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { InMemoryInventarioRepository } from '@/modules/inventario/infrastructure/InventarioRepository';
import { CategoriaProducto } from '@/modules/inventario/domain/types';

interface ProductoModalProps {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const ProductoModal = ({ onClose, onSave, empresaId }: ProductoModalProps) => {
    const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
    const [nombre, setNombre] = useState('');
    const [codigo, setCodigo] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [precioVenta, setPrecioVenta] = useState(0);
    const [stockMinimo, setStockMinimo] = useState(1);
    const [grabaIva, setGrabaIva] = useState(true);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        const loadCategorias = async () => {
            const repo = new InMemoryInventarioRepository();
            const data = await repo.getCategorias(empresaId);
            setCategorias(data);
            if (data.length > 0) setCategoriaId(data[0].id);
        };
        loadCategorias();
    }, [empresaId]);

    const handleGuardar = async () => {
        if (!nombre || !codigo || !categoriaId) {
            alert('Por favor complete los campos obligatorios.');
            return;
        }

        setGuardando(true);
        // Simular guardado
        await new Promise(resolve => setTimeout(resolve, 1500));
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-sri-blue p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Package size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Registrar Nuevo Producto</h2>
                            <p className="text-blue-100 text-xs">Complete la ficha técnica del artículo.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Tag size={14} className="text-sri-blue" /> Nombre del Producto *
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ej: Laptop Dell Latitude"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <BarChart2 size={14} className="text-sri-blue" /> Código Principal *
                            </label>
                            <input
                                type="text"
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value)}
                                placeholder="Ej: PROD-001"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Categoría / Línea *</label>
                            <select
                                value={categoriaId}
                                onChange={(e) => setCategoriaId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                            >
                                {categorias.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <DollarSign size={14} className="text-sri-blue" /> Precio de Venta (sin IVA) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={precioVenta}
                                onChange={(e) => setPrecioVenta(Number(e.target.value))}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Stock Mínimo (Alerta)</label>
                            <input
                                type="number"
                                value={stockMinimo}
                                onChange={(e) => setStockMinimo(Number(e.target.value))}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3 pt-8">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={grabaIva}
                                    onChange={(e) => setGrabaIva(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sri-blue"></div>
                                <span className="ml-3 text-sm font-medium text-slate-700">Graba IVA (15%)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={guardando}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGuardar}
                        disabled={guardando}
                        className="flex items-center gap-2 min-w-[140px] justify-center"
                    >
                        {guardando ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save size={18} /> Guardar Producto
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
