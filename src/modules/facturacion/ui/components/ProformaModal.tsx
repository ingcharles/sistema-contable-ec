import { useState, useEffect } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { InventarioUseCases, TercerosUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Proforma } from '@/modules/facturacion/domain/types';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Save, Plus, Trash2, User, FileText } from 'lucide-react';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { getLocalDateIso } from '@/shared/utils/dateUtils';

interface ProformaModalProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    proforma?: Proforma;
}


const DEFAULT_VALIDEZ_DIAS = 15;

export function ProformaModal({ open, onClose, onSave, proforma }: ProformaModalProps) {
    const { currentEmpresa } = useEmpresa();
    const parametros = currentEmpresa?.parametros;
    const [loading, setLoading] = useState(false);

    // Form state
    const [clienteId, setClienteId] = useState('');
    const [fecha, setFecha] = useState(getLocalDateIso());
    const [validezDias, setValidezDias] = useState(DEFAULT_VALIDEZ_DIAS);
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
                setClienteId(proforma.clienteId);
                setFecha(proforma.fecha);
                // setValidezDias(proforma.validezDias); // Adjust if validezDias is on Proforma
                setObservaciones(proforma.observaciones || '');
                setItems(proforma.detalles || []);
            } else {
                setClienteId('');
                setFecha(getLocalDateIso());
                setValidezDias(DEFAULT_VALIDEZ_DIAS);
                setObservaciones('');
                setItems([]);
            }
        }
    }, [open, proforma]);

    const loadInitialData = async () => {
        try {
            const [cRes, pRes] = await Promise.all([
                TercerosUseCases.listarTerceros('CLIENTE'),
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

        const subtotal = prod.precioVenta * cantidad;
        const ivaValue = (parametros?.ivaValor || 0) / 100;
        const valorIva = prod.grabaIva ? subtotal * ivaValue : 0;

        const newItem = {
            productoId: prod.id,
            descripcion: prod.nombre,
            cantidad,
            precioUnitario: prod.precioVenta,
            subtotal,
            porcentajeIva: prod.grabaIva ? (parametros?.ivaValor) : 0,
            valorIva: valorIva,
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
        subtotalIva: acc.subtotalIva + (item.porcentajeIva > 0 ? item.subtotal : 0),
        subtotal0: acc.subtotal0 + (item.porcentajeIva === 0 ? item.subtotal : 0),
        valorIva: acc.valorIva + item.valorIva,
        total: acc.total + item.total
    }), { subtotalIva: 0, subtotal0: 0, valorIva: 0, total: 0 });

    const handleSave = async () => {
        if (!clienteId || items.length === 0) {
            alert('Debe seleccionar un cliente y agregar al menos un ítem');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                id: proforma?.id,
                clienteId: clienteId,
                fecha,
                // validezDias: validezDias,
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
            <div className="space-y-8">
                {/* Sección Información General */}
                <div>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-sri-blue/10">
                        <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                            <User size={16} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Información del Cliente y Proforma</h3>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cliente *</label>
                            <select
                                value={clienteId}
                                onChange={(e) => setClienteId(e.target.value)}
                                className="w-full h-11 px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-medium text-slate-700"
                            >
                                <option value="">Seleccionar Cliente...</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id}>{c.razonSocial} ({c.identificacion})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha</label>
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="w-full h-11 px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-bold text-slate-700"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Validez (Días)</label>
                            <input
                                type="number"
                                value={validezDias}
                                onChange={(e) => setValidezDias(Number(e.target.value))}
                                className="w-full h-11 px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-bold text-slate-700"
                            />
                        </div>
                    </div>
                </div>

                {/* Sección Agregar Productos */}
                <div>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-sri-blue/10">
                        <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                            <Plus size={16} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Agregar Ítems a la Proforma</h3>
                    </div>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap md:flex-nowrap gap-4 items-end">
                        <div className="flex-1 space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Producto/Servicio</label>
                            <select
                                value={selectedProducto}
                                onChange={(e) => setSelectedProducto(e.target.value)}
                                className="w-full h-11 px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-medium text-slate-700"
                            >
                                <option value="">Buscar producto...</option>
                                {productos.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre} - {formatMoney(p.precioVenta)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-24 space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cant.</label>
                            <input
                                type="number"
                                value={cantidad}
                                onChange={(e) => setCantidad(Number(e.target.value))}
                                className="w-full h-11 px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-black text-center text-sri-blue"
                                min="1"
                            />
                        </div>
                        <Button onClick={addItem} type="button" className="h-11 px-6 bg-sri-blue hover:bg-sri-light text-white rounded-xl shadow-lg shadow-sri-blue/20 font-black gap-2">
                            <Plus size={18} /> Agregar
                        </Button>
                    </div>
                </div>

                {/* Tabla de Items */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-xs text-left">
                        <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-200 bg-slate-50">
                            <tr>
                                <th className="py-3 px-4">Descripción</th>
                                <th className="py-3 px-4 text-center w-24">Cant.</th>
                                <th className="py-3 px-4 text-right w-32">P. Unit</th>
                                <th className="py-3 px-4 text-right w-32">Total</th>
                                <th className="py-3 px-4 w-12 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-sri-blue/5 transition-colors group">
                                    <td className="py-3 px-4 font-medium text-slate-700">{item.descripcion}</td>
                                    <td className="py-3 px-4 text-center font-bold text-slate-500">{item.cantidad}</td>
                                    <td className="py-3 px-4 text-right font-bold text-slate-400 font-mono">{formatMoney(item.precioUnitario)}</td>
                                    <td className="py-3 px-4 text-right font-black text-slate-900 font-mono text-base">{formatMoney(item.total)}</td>
                                    <td className="py-3 px-4 text-center">
                                        <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400 italic bg-slate-50/30">
                                        No hay productos agregados en esta proforma
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pie de Proforma: Observaciones y Totales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-slate-100">
                            <FileText size={16} className="text-slate-400" />
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Observaciones / Notas</h3>
                        </div>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            className="w-full h-32 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-sri-blue/10 outline-none transition-all text-sm text-slate-600 shadow-inner"
                            placeholder="Detalles adicionales, condiciones de pago, validez extendida..."
                        />
                    </div>

                    <div className="bg-sri-blue p-8 rounded-3xl text-white shadow-xl shadow-sri-blue/20 space-y-4">
                        <div className="flex justify-between text-blue-100 font-bold text-[10px] uppercase tracking-widest">
                            <span>Subtotal Gravado ({parametros?.ivaEtiqueta || '15%'}):</span>
                            <span className="font-mono text-base text-white">{formatMoney(totals.subtotalIva)}</span>
                        </div>
                        <div className="flex justify-between text-blue-100 font-bold text-[10px] uppercase tracking-widest">
                            <span>Subtotal Exento (0%):</span>
                            <span className="font-mono text-base text-white">{formatMoney(totals.subtotal0)}</span>
                        </div>
                        <div className="flex justify-between text-blue-100 font-bold text-[10px] uppercase tracking-widest">
                            <span>IVA ({parametros?.ivaEtiqueta || '15%'}):</span>
                            <span className="font-mono text-base text-white">{formatMoney(totals.valorIva)}</span>
                        </div>
                        <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest text-blue-100">Total Proforma:</span>
                            <span className="text-3xl font-black font-mono">{formatMoney(totals.total)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 justify-end pt-8 border-t border-slate-100">
                    <Button variant="outline" onClick={onClose} className="px-10 h-12 rounded-2xl text-slate-500 font-bold border-2 border-slate-200 hover:bg-slate-50 transition-all">
                        Cerrar
                    </Button>
                    <Button onClick={handleSave} isLoading={loading} className="px-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-100 gap-2 transition-all">
                        <Save size={20} />
                        {proforma ? 'Actualizar Proforma' : 'Guardar Proforma'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
