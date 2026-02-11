'use client';

import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { useEmpresa } from '@/shared/context/EmpresaContext';

interface ItemNC {
    producto_id: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
}

interface FormData {
    proveedor_id: string;
    factura_id: string;
    secuencial: string;
    fecha_emision: string;
    motivo: string;
    items: ItemNC[];
}

export function NotaCreditoCompraModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
    const { currentEmpresa } = useEmpresa();
    const [proveedores, setProveedores] = useState<any[]>([]);
    const [facturas, setFacturas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormData>({
        proveedor_id: '',
        factura_id: '',
        secuencial: '',
        fecha_emision: new Date().toISOString().split('T')[0],
        motivo: '',
        items: [{ producto_id: '', cantidad: 1, precio_unitario: 0, total: 0 }]
    });

    const parametros = currentEmpresa?.parametros;

    // Cargar proveedores
    useEffect(() => {
        if (!currentEmpresa) return;
        fetch('/api/directorio/terceros?tipo=PROVEEDOR')
            .then(res => res.json())
            .then((data: any[]) => setProveedores(data || []))
            .catch(console.error);
    }, [currentEmpresa]);

    // Cuando cambia el proveedor, cargar sus facturas (Mock)
    useEffect(() => {
        if (formData.proveedor_id && currentEmpresa) {
            fetch(`/api/compras?proveedor_id=${formData.proveedor_id}`)
                .then(res => res.json())
                .then(data => setFacturas(data || []))
                .catch(console.error);
        }
    }, [formData.proveedor_id, currentEmpresa]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index: number, field: keyof ItemNC, value: any) => {
        const newItems = [...formData.items];

        if (field === 'cantidad' || field === 'precio_unitario') {
            const val = parseFloat(value) || 0;
            newItems[index] = { ...newItems[index], [field]: val };
            // Recalculate total immediately
            newItems[index].total = newItems[index].cantidad * newItems[index].precio_unitario;
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { producto_id: '', cantidad: 1, precio_unitario: 0, total: 0 }]
        }));
    };

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const validate = () => {
        if (!formData.proveedor_id) return 'Seleccione un proveedor';
        if (!formData.secuencial) return 'Ingrese el número de nota de crédito';
        if (!formData.motivo) return 'Ingrese el motivo';
        if (formData.items.length === 0) return 'Agregue al menos un item';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) {
            setError(err);
            return;
        }

        setLoading(true);
        setError(null);

        // Calcular totales finales
        const subtotal = formData.items.reduce((acc, item) => acc + item.total, 0);
        const ivaRate = (parametros?.ivaValor) / 100;
        const iva = subtotal * ivaRate;
        const total = subtotal + iva;

        try {
            const res = await fetch('/api/compras/notas-credito', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    subtotal,
                    iva,
                    total
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al guardar');
            }

            onSave();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const subtotal = formData.items.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);
    const ivaRate = (parametros?.ivaValor) / 100;
    const iva = subtotal * ivaRate;
    const total = subtotal + iva;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800">Registrar Nota de Crédito (Proveedor)</h2>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-red-500">
                            <X size={24} />
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
                            <select
                                name="proveedor_id"
                                value={formData.proveedor_id}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            >
                                <option value="">Seleccione...</option>
                                {proveedores.map(p => (
                                    <option key={p.id} value={p.id}>{p.razonSocial}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Factura Asociada (Opcional)</label>
                            <select
                                name="factura_id"
                                value={formData.factura_id}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            >
                                <option value="">Sin factura (Crédito general)</option>
                                {facturas.map(f => (
                                    <option key={f.id} value={f.id}>{f.secuencial} - {f.total}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Secuencial NC</label>
                            <input
                                name="secuencial"
                                value={formData.secuencial}
                                onChange={handleChange}
                                placeholder="001-001-000000001"
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Emisión</label>
                            <input
                                type="date"
                                name="fecha_emision"
                                value={formData.fecha_emision}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
                            <input
                                name="motivo"
                                value={formData.motivo}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                                placeholder="Ej: Devolución de mercadería defectuosa"
                            />
                        </div>
                    </div>

                    {/* Detalle de Items */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-slate-700">Detalle de la Devolución/Ajuste</h3>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <Plus size={16} className="mr-1" /> Agregar Item
                            </Button>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="p-2">Producto ID (UUID)</th>
                                        <th className="p-2 w-24">Cant.</th>
                                        <th className="p-2 w-32">Precio Unit.</th>
                                        <th className="p-2 w-32">Total</th>
                                        <th className="p-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {formData.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="p-2">
                                                <input
                                                    value={item.producto_id}
                                                    onChange={(e) => handleItemChange(index, 'producto_id', e.target.value)}
                                                    className="w-full p-1 border rounded"
                                                    placeholder="UUID del producto..."
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number" step="0.01"
                                                    value={item.cantidad}
                                                    onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                                                    className="w-full p-1 border rounded text-right"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number" step="0.01"
                                                    value={item.precio_unitario}
                                                    onChange={(e) => handleItemChange(index, 'precio_unitario', e.target.value)}
                                                    className="w-full p-1 border rounded text-right"
                                                />
                                            </td>
                                            <td className="p-2 text-right font-medium">
                                                ${item.total.toFixed(2)}
                                            </td>
                                            <td className="p-2 text-center">
                                                <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 border-t pt-4">
                        <div className="text-right space-y-1">
                            <div className="flex justify-between w-48 text-sm">
                                <span className="text-slate-500">Subtotal:</span>
                                <span className="font-medium">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between w-48 text-sm">
                                <span className="text-slate-500">IVA ({parametros?.ivaEtiqueta || '15%'}):</span>
                                <span className="font-medium">${iva.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between w-48 text-lg font-bold text-slate-800">
                                <span>Total:</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" isLoading={loading} className="gap-2">
                            <Save size={18} />
                            Guardar Nota de Crédito
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
