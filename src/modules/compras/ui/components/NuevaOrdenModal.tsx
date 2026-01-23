'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Save, ShoppingCart, Calendar, User, Tag, AlertCircle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { DetalleOrden } from '../../domain/types';
import { ComprasUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';

interface Props {
    onClose: () => void;
    onSave: () => void;
}

export const NuevaOrdenModal: React.FC<Props> = ({ onClose, onSave }) => {
    const [proveedorNombre, setProveedorNombre] = useState('');
    const [proveedorRuc, setProveedorRuc] = useState('');
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
    const [fechaEntrega, setFechaEntrega] = useState('');
    const [observacion, setObservacion] = useState('');
    const [detalles, setDetalles] = useState<DetalleOrden[]>([]);
    const [guardando, setGuardando] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

    const [nuevoProducto, setNuevoProducto] = useState('');
    const [nuevaCantidad, setNuevaCantidad] = useState(1);
    const [nuevoPrecio, setNuevoPrecio] = useState(0);
    const [nuevaGrabaIva, setNuevaGrabaIva] = useState(true);

    const subtotalNoIva = detalles.filter(d => !d.grabaIva).reduce((acc, d) => acc + d.subtotal, 0);
    const subtotalIva = detalles.filter(d => d.grabaIva).reduce((acc, d) => acc + d.subtotal, 0);
    const iva = Number((subtotalIva * 0.15).toFixed(2));
    const subtotalTotal = subtotalNoIva + subtotalIva;
    const total = subtotalTotal + iva;

    const agregarDetalle = () => {
        if (!nuevoProducto || nuevaCantidad <= 0 || nuevoPrecio < 0) return;

        const detalle: DetalleOrden = {
            producto: nuevoProducto,
            cantidad: nuevaCantidad,
            precioUnitario: nuevoPrecio,
            subtotal: Number((nuevaCantidad * nuevoPrecio).toFixed(2)),
            grabaIva: nuevaGrabaIva
        };

        setDetalles([...detalles, detalle]);
        setNuevoProducto('');
        setNuevaCantidad(1);
        setNuevoPrecio(0);
        if (errorValidacion) setErrorValidacion(null);
    };

    const eliminarDetalle = (index: number) => {
        setDetalles(detalles.filter((_, i) => i !== index));
    };

    const handleGuardar = async () => {
        if (!proveedorRuc || !proveedorNombre || detalles.length === 0) {
            setErrorValidacion('Por favor complete los datos del proveedor y agregue al menos un detalle.');
            return;
        }

        setGuardando(true);
        setErrorValidacion(null);
        try {
            await ComprasUseCases.registrarOrden({
                proveedorId: proveedorRuc,
                secuencial: `OC-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`,
                fechaEmision,
                fechaEntrega: fechaEntrega || fechaEmision,
                observacion,
                detalles,
                subtotal: subtotalTotal,
                iva: iva,
                total
            });
            onSave();
            onClose();
        } catch (error: any) {
            console.error(error);
            setErrorValidacion(error.message || 'Error al registrar la orden');
        } finally {
            setGuardando(false);
        }
    };

    const footer = (
        <div className="flex justify-between items-center w-full bg-slate-50 -m-6 p-6 border-t border-slate-100 rounded-b-2xl">
            <div className="flex gap-10 items-center">
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</p>
                    <p className="text-xl font-black text-slate-600">{formatMoney(subtotalTotal)}</p>
                </div>
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IVA (15%)</p>
                    <p className="text-xl font-black text-slate-600">{formatMoney(iva)}</p>
                </div>
                <div className="h-10 w-px bg-slate-200"></div>
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-sri-blue uppercase tracking-widest">Total Orden</p>
                    <p className="text-3xl font-black text-sri-blue leading-none">{formatMoney(total)}</p>
                </div>
            </div>
            <div className="flex gap-3">
                <Button variant="secondary" onClick={onClose} disabled={guardando}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleGuardar}
                    disabled={!proveedorRuc || detalles.length === 0 || guardando}
                    className="flex items-center gap-2 min-w-[200px] justify-center"
                >
                    {guardando ? (
                        'Procesando...'
                    ) : (
                        <>
                            <Save size={20} /> Guardar Orden de Compra
                        </>
                    )}
                </Button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Nueva Orden de Compra"
            description="Planifique sus adquisiciones registrando una nueva orden de servicio o productos."
            icon={<ShoppingCart size={24} />}
            footer={footer}
            size="xl"
        >
            <div className="space-y-8 pb-4">
                {errorValidacion && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-sm font-medium">{errorValidacion}</p>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-8">
                    {/* Panel Izquierdo: Proveedor */}
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 text-sri-blue mb-2">
                            <User size={16} className="font-bold" />
                            <h3 className="text-[11px] font-black uppercase tracking-widest">Datos del Proveedor</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identificación / RUC *</label>
                                <input
                                    type="text"
                                    value={proveedorRuc}
                                    onChange={e => setProveedorRuc(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all text-xs font-medium"
                                    placeholder="1790000000001"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Razón Social *</label>
                                <input
                                    type="text"
                                    value={proveedorNombre}
                                    onChange={e => setProveedorNombre(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all text-xs font-medium"
                                    placeholder="Nombre completo de la empresa"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Panel Derecho: Fechas */}
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 text-sri-blue mb-2">
                            <Calendar size={16} className="font-bold" />
                            <h3 className="text-[11px] font-black uppercase tracking-widest">Cronograma y Notas</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha Emisión</label>
                                <input
                                    type="date"
                                    value={fechaEmision}
                                    onChange={e => setFechaEmision(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all text-xs font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha Entrega</label>
                                <input
                                    type="date"
                                    value={fechaEntrega}
                                    onChange={e => setFechaEntrega(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all text-xs font-medium"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Observaciones</label>
                            <textarea
                                value={observacion}
                                onChange={e => setObservacion(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all text-xs h-10 resize-none font-medium"
                                placeholder="Notas adicionales sobre la orden..."
                            />
                        </div>
                    </div>
                </div>

                {/* Sección Items */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2 text-sri-blue">
                            <Tag size={16} className="font-bold" />
                            <h3 className="text-[11px] font-black uppercase tracking-widest">Detalle de Productos / Servicios</h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Total Items: {detalles.length}</span>
                    </div>

                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-12 lg:col-span-5 space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Producto / Servicio *</label>
                            <input
                                type="text"
                                value={nuevoProducto}
                                onChange={e => setNuevoProducto(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all text-sm font-medium"
                                placeholder="Nombre del ítem"
                            />
                        </div>
                        <div className="col-span-3 lg:col-span-1 space-y-1.5 text-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cant.</label>
                            <input
                                type="number"
                                value={nuevaCantidad}
                                onChange={e => setNuevaCantidad(Number(e.target.value))}
                                className="w-full px-2 py-2.5 bg-white border border-slate-200 rounded-xl text-center font-black text-slate-700 outline-none"
                            />
                        </div>
                        <div className="col-span-4 lg:col-span-2 space-y-1.5 text-right">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mr-1">P. Unitario ($)</label>
                            <input
                                type="number"
                                value={nuevoPrecio}
                                onChange={e => setNuevoPrecio(Number(e.target.value))}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-right font-black text-sri-blue outline-none"
                                step="0.01"
                            />
                        </div>
                        <div className="col-span-5 lg:col-span-2 mb-3">
                            <label className="flex items-center gap-2 cursor-pointer group px-2">
                                <div className="relative">
                                    <input type="checkbox" checked={nuevaGrabaIva} onChange={e => setNuevaGrabaIva(e.target.checked)} className="peer sr-only" />
                                    <div className="w-9 h-5 bg-slate-200 rounded-full transition-all peer-checked:bg-sri-blue"></div>
                                    <div className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all peer-checked:left-5"></div>
                                </div>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight group-hover:text-sri-blue transition-colors">Aplica IVA</span>
                            </label>
                        </div>
                        <div className="col-span-12 lg:col-span-2">
                            <button
                                onClick={agregarDetalle}
                                className="w-full py-2.5 bg-sri-blue text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Añadir
                            </button>
                        </div>
                    </div>

                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción del Ítem</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cant.</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unitario</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Impuesto</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Subtotal</th>
                                    <th className="px-6 py-4 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {detalles.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <ShoppingCart size={32} className="mx-auto text-slate-200 mb-3" />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No hay productos en la orden</p>
                                        </td>
                                    </tr>
                                ) : detalles.map((d, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-black text-xs text-slate-700 uppercase tracking-tight">{d.producto}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="inline-block px-2 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-600">{d.cantidad}</span>
                                        </td>
                                        <td className="px-4 py-4 text-right font-bold text-xs text-slate-600">{formatMoney(d.precioUnitario)}</td>
                                        <td className="px-4 py-4 text-center">
                                            {d.grabaIva ? (
                                                <span className="px-2 py-0.5 bg-blue-50 text-sri-blue rounded-full text-[9px] font-black border border-blue-100">IVA 15%</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[9px] font-black">EXENTO</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-right font-black text-xs text-sri-blue">{formatMoney(d.subtotal)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => eliminarDetalle(i)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
