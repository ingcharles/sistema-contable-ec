'use client';

import { useEmpresa } from '@/shared/context/EmpresaContext';
import { InventarioUseCases, TercerosUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Save, Plus, Trash2 } from 'lucide-react';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { getLocalDateIso } from '@/shared/utils/dateUtils';

interface ProformaModalProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    proforma?: any;
}

export function ProformaModal({ open, onClose, onSave, proforma }: ProformaModalProps) {
    const { currentEmpresa } = useEmpresa();
    const parametros = currentEmpresa?.parametros;
    const [loading, setLoading] = useState(false);

    // Form state
    const [clienteId, setClienteId] = useState('');
    const [fecha, setFecha] = useState(getLocalDateIso());
    const [validezDias, setValidezDias] = useState(15);
    const [observaciones, setObservaciones] = useState('');
    const [items, setItems] = useState<any[]>([]);

    // Aux state
    const [clientes, setClientes] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);
    const [selectedProducto, setSelectedProducto] = useState('');
    const [cantidad, setCantidad] = useState(1);

    useEffect(() => {
        if (open) {
            loadInitialData();
            if (proforma) {
                setClienteId(proforma.cliente_id);
                setFecha(proforma.fecha);
                setValidezDias(proforma.validez_dias);
                setObservaciones(proforma.observaciones || '');
                setItems(proforma.detalles || []);
            } else {
                setClienteId('');
                setFecha(getLocalDateIso());
                setValidezDias(15);
                setObservaciones('');
                setItems([]);
            }
        }
    }, [open, proforma]);

    const loadInitialData = async () => {
        try {
            const [cRes, pRes] = await Promise.all([
                TercerosUseCases.listarTerceros({ tipo: 'CLIENTE' }),
                InventarioUseCases.listarProductos()
            ]);
            setClientes(cRes || []);
            setProductos(pRes || []);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        }
    };

    const addItem = () => {
        const prod = productos.find(p => p.id === selectedProducto);
        if (!prod) return;

        const subtotal = prod.precio_venta * cantidad;
        const ivaValue = (parametros?.ivaValor || 15) / 100;
        const valorIva = prod.graba_iva ? subtotal * ivaValue : 0;

        const newItem = {
            producto_id: prod.id,
            descripcion: prod.nombre,
            cantidad,
            precio_unitario: prod.precio_venta,
            subtotal,
            porcentaje_iva: prod.graba_iva ? (parametros?.ivaValor || 15) : 0,
            valor_iva: valorIva,
            total: subtotal + valorIva
        };

        setItems([...items, newItem]);
        setSelectedProducto('');
        setCantidad(1);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const totals = items.reduce((acc, item) => ({
        subtotal_iva: acc.subtotal_iva + (item.porcentaje_iva > 0 ? item.subtotal : 0),
        subtotal_0: acc.subtotal_0 + (item.porcentaje_iva === 0 ? item.subtotal : 0),
        monto_iva: acc.monto_iva + item.valor_iva,
        total: acc.total + item.total
    }), { subtotal_iva: 0, subtotal_0: 0, monto_iva: 0, total: 0 });

    const handleSave = async () => {
        if (!clienteId || items.length === 0) {
            alert('Debe seleccionar un cliente y agregar al menos un ítem');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                id: proforma?.id,
                cliente_id: clienteId,
                fecha,
                validez_dias: validezDias,
                observaciones,
                items,
                ...totals
            };

            await fetch('/api/facturacion/proformas', {
                method: proforma ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            onSave();
            onClose();
        } catch (error: any) {
            alert('Error al guardar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={open} onClose={onClose} title={proforma ? 'Editar Proforma' : 'Nueva Proforma'} size="xl">
            <div className="space-y-6">
                {/* Cabecera */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Cliente</label>
                        <select
                            value={clienteId}
                            onChange={(e) => setClienteId(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Seleccionar Cliente...</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.razon_social} ({c.identificacion})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Fecha</label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Validez (Días)</label>
                        <input
                            type="number"
                            value={validezDias}
                            onChange={(e) => setValidezDias(Number(e.target.value))}
                            className="w-full h-10 px-3 rounded-lg border-slate-200"
                        />
                    </div>
                </div>

                {/* Agregar Items */}
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Producto</label>
                        <select
                            value={selectedProducto}
                            onChange={(e) => setSelectedProducto(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border-slate-200"
                        >
                            <option value="">Buscar producto...</option>
                            {productos.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre} - {formatMoney(p.precio_venta)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-24">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Cant.</label>
                        <input
                            type="number"
                            value={cantidad}
                            onChange={(e) => setCantidad(Number(e.target.value))}
                            className="w-full h-10 px-3 rounded-lg border-slate-200"
                            min="1"
                        />
                    </div>
                    <Button onClick={addItem} type="button" className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                        <Plus size={18} />
                    </Button>
                </div>

                {/* Tabla de Items */}
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-bold text-slate-600">Descripción</th>
                                <th className="px-4 py-3 text-right font-bold text-slate-600">Cant.</th>
                                <th className="px-4 py-3 text-right font-bold text-slate-600">P. Unit</th>
                                <th className="px-4 py-3 text-right font-bold text-slate-600">Total</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">{item.descripcion}</td>
                                    <td className="px-4 py-3 text-right font-medium">{item.cantidad}</td>
                                    <td className="px-4 py-3 text-right text-slate-500">{formatMoney(item.precio_unitario)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-700">{formatMoney(item.total)}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No hay productos agregados</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totales y Observaciones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Observaciones</label>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            className="w-full h-32 px-3 py-2 rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Detalles adicionales..."
                        />
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl flex flex-col gap-3">
                        <div className="flex justify-between items-center text-slate-600">
                            <span className="text-sm font-medium">Subtotal Gravado ({parametros?.ivaEtiqueta || '15%'})</span>
                            <span className="font-bold">{formatMoney(totals.subtotal_iva)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                            <span className="text-sm font-medium">Subtotal Exento (0%)</span>
                            <span className="font-bold">{formatMoney(totals.subtotal_0)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                            <span className="text-sm font-medium">IVA ({parametros?.ivaEtiqueta || '15%'})</span>
                            <span className="font-bold">{formatMoney(totals.monto_iva)}</span>
                        </div>
                        <div className="border-t border-slate-200 mt-2 pt-4 flex justify-between items-center text-indigo-900">
                            <span className="text-lg font-black uppercase tracking-wider">Total</span>
                            <span className="text-2xl font-black">{formatMoney(totals.total)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                    <Button variant="outline" onClick={onClose} className="px-8 h-12 rounded-xl text-slate-600 font-bold">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} isLoading={loading} className="px-8 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-100 gap-2">
                        <Save size={20} />
                        {proforma ? 'Actualizar Proforma' : 'Guardar Proforma'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
