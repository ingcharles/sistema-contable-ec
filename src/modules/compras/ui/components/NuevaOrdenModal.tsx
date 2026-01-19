'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { OrdenCompra, DetalleOrden } from '../../domain/types';
import { InMemoryCompraRepository } from '../../infrastructure/CompraRepository';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';

interface Props {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const NuevaOrdenModal: React.FC<Props> = ({ onClose, onSave, empresaId }) => {
    const [proveedorNombre, setProveedorNombre] = useState('');
    const [proveedorRuc, setProveedorRuc] = useState('');
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
    const [fechaEntrega, setFechaEntrega] = useState('');
    const [observacion, setObservacion] = useState('');
    const [detalles, setDetalles] = useState<DetalleOrden[]>([]);

    // Estados para el nuevo producto
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
    };

    const eliminarDetalle = (index: number) => {
        setDetalles(detalles.filter((_, i) => i !== index));
    };

    const handleGuardar = async () => {
        if (!proveedorRuc || !proveedorNombre || detalles.length === 0) return;

        const repo = new InMemoryCompraRepository();

        const nuevaOrden: OrdenCompra = {
            id: Math.random().toString(36).substring(2, 9),
            empresaId,
            secuencial: `OC-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`,
            proveedor: {
                id: Math.random().toString(36).substring(2, 9),
                razonSocial: proveedorNombre,
                ruc: proveedorRuc,
                esContribuyenteEspecial: false
            },
            fechaEmision,
            fechaEntrega: fechaEntrega || fechaEmision,
            observacion,
            detalles,
            subtotal: subtotalTotal,
            iva: iva,
            total,
            estado: 'PENDIENTE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user'
        };

        await repo.saveOrden(nuevaOrden);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col animate-in zoom-in-95 duration-200 my-8">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Nueva Orden de Compra</h2>
                        <p className="text-xs text-slate-500">Registre una orden para planificar sus adquisiciones.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                <div className="p-8 space-y-6">
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-sri-blue uppercase tracking-wider border-b pb-1">Datos del Proveedor</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">RUC Proveedor</label>
                                    <input type="text" value={proveedorRuc} onChange={e => setProveedorRuc(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="1790000000001" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Razón Social</label>
                                    <input type="text" value={proveedorNombre} onChange={e => setProveedorNombre(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Nombre de la empresa" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-sri-blue uppercase tracking-wider border-b pb-1">Fechas y Notas</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Fecha Emisión</label>
                                    <input type="date" value={fechaEmision} onChange={e => setFechaEmision(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Fecha Entrega</label>
                                    <input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Observación</label>
                                <textarea value={observacion} onChange={e => setObservacion(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm h-10" placeholder="Detalles de la compra..." />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-sri-blue uppercase tracking-wider border-b pb-1">Detalles de la Orden</h3>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-5">
                                <label className="block text-xs font-bold text-slate-600 mb-1">Producto / Servicio</label>
                                <input type="text" value={nuevoProducto} onChange={e => setNuevoProducto(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" placeholder="Ej: Resmas de papel" />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-slate-600 mb-1">Cant.</label>
                                <input type="number" value={nuevaCantidad} onChange={e => setNuevaCantidad(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-center" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-600 mb-1">P. Unitario</label>
                                <input type="number" value={nuevoPrecio} onChange={e => setNuevoPrecio(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-right font-mono" />
                            </div>
                            <div className="md:col-span-2 flex flex-col justify-center h-full pb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={nuevaGrabaIva} onChange={e => setNuevaGrabaIva(e.target.checked)} className="h-4 w-4 text-sri-blue rounded" />
                                    <span className="text-xs text-slate-600">Graba IVA</span>
                                </label>
                            </div>
                            <div className="md:col-span-2">
                                <button onClick={agregarDetalle} className="w-full py-2 bg-sri-blue text-white rounded-lg text-sm font-bold hover:bg-sri-light flex items-center justify-center gap-2 shadow-sm transition-all focus:ring-2 focus:ring-sri-blue/30 outline-none">
                                    <Plus size={16} /> Añadir
                                </button>
                            </div>
                        </div>

                        <div className="border rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Descripción</th>
                                        <th className="px-4 py-3 text-center w-20">Cant.</th>
                                        <th className="px-4 py-3 text-right w-32">Precio</th>
                                        <th className="px-4 py-3 text-center w-20">IVA</th>
                                        <th className="px-4 py-3 text-right w-32">Subtotal</th>
                                        <th className="px-4 py-3 text-center w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {detalles.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">No hay productos añadidos</td>
                                        </tr>
                                    ) : detalles.map((d, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-medium text-slate-700">{d.producto}</td>
                                            <td className="px-4 py-3 text-center text-slate-600">{d.cantidad}</td>
                                            <td className="px-4 py-3 text-right text-slate-600 font-mono">{formatMoney(d.precioUnitario)}</td>
                                            <td className="px-4 py-3 text-center">
                                                {d.grabaIva ? <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">15%</span> : <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">0%</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-800 font-mono">{formatMoney(d.subtotal)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => eliminarDetalle(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 rounded-b-xl flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-6">
                        <div className="text-right border-r pr-6 border-slate-200">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Subtotal</p>
                            <p className="text-lg font-mono text-slate-600 font-bold">{formatMoney(subtotalTotal)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">IVA Estimado</p>
                            <p className="text-lg font-mono text-slate-600 font-bold">{formatMoney(iva)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total a Ordenar</p>
                            <p className="text-3xl font-mono text-sri-blue font-bold">{formatMoney(total)}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button onClick={handleGuardar} disabled={!proveedorRuc || detalles.length === 0} className="px-6 flex items-center gap-2">
                                <Save size={20} /> Guardar Orden
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
