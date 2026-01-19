'use client';

import { useState, useEffect } from 'react';
import { X, Save, Truck, MapPin, Package, User, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Transportista, MotivoTraslado, GuiaRemision } from '../../domain/guias';
import { InMemoryGuiaRemisionRepository } from '../../infrastructure/GuiaRemisionRepository';
import { EstadoSRI } from '@/shared/types';

interface GuiaRemisionModalProps {
    facturaReferencia?: any;
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const GuiaRemisionModal = ({ facturaReferencia, onClose, onSave, empresaId }: GuiaRemisionModalProps) => {
    const [transportistas, setTransportistas] = useState<Transportista[]>([]);
    const [transportistaId, setTransportistaId] = useState('');
    const [puntoPartida, setPuntoPartida] = useState('Matriz / Bodega Principal');
    const [puntoDestino, setPuntoDestino] = useState(facturaReferencia?.direccion || '');
    const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
    const [motivo, setMotivo] = useState(MotivoTraslado.VENTA);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        const loadTransportistas = async () => {
            const repo = new InMemoryGuiaRemisionRepository();
            const data = await repo.getTransportistas(empresaId);
            setTransportistas(data);
            if (data.length > 0) setTransportistaId(data[0].id);
        };
        loadTransportistas();
    }, [empresaId]);

    const handleGuardar = async () => {
        if (!transportistaId || !puntoPartida || !puntoDestino) {
            alert('Por favor complete los campos obligatorios.');
            return;
        }

        setGuardando(true);
        const repo = new InMemoryGuiaRemisionRepository();
        const transportista = transportistas.find(t => t.id === transportistaId)!;

        const nuevaGuia: GuiaRemision = {
            id: Math.random().toString(36).substr(2, 9),
            empresaId,
            secuencial: `001-001-${Math.floor(Math.random() * 1000000).toString().padStart(9, '0')}`,
            fechaEmision: new Date().toISOString().split('T')[0],
            fechaInicioTraslado: fechaInicio,
            fechaFinTraslado: fechaFin,
            puntoPartida,
            transportista,
            destinatarios: [
                {
                    identificacion: facturaReferencia?.terceroId || '9999999999999',
                    razonSocial: facturaReferencia?.terceroNombre || 'CONSUMIDOR FINAL',
                    direccionDestino: puntoDestino,
                    motivoTraslado: motivo,
                    documentoReferencia: facturaReferencia?.secuencial,
                    ruta: `${puntoPartida} - ${puntoDestino}`,
                    items: facturaReferencia?.items?.map((i: any) => ({
                        codigo: i.codigo || 'S/N',
                        descripcion: i.nombre || i.descripcion,
                        cantidad: i.cantidad || 1
                    })) || []
                }
            ],
            estado: EstadoSRI.PENDIENTE,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'admin'
        };

        await repo.saveGuia(nuevaGuia);
        setGuardando(false);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Truck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Generar Guía de Remisión</h2>
                            <p className="text-slate-400 text-xs">Documento de acompañamiento para traslado de mercadería.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Sección Transportista */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <User size={16} /> Información del Transportista
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500">Seleccionar Transportista *</label>
                                <select
                                    value={transportistaId}
                                    onChange={(e) => setTransportistaId(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                                >
                                    {transportistas.map(t => (
                                        <option key={t.id} value={t.id}>{t.razonSocial} ({t.placa})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <Button variant="secondary" className="w-full flex items-center gap-2 justify-center">
                                    <Plus size={16} /> Nuevo Transportista
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Sección Ruta */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <MapPin size={16} /> Ruta y Tiempos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500">Punto de Partida *</label>
                                <input
                                    type="text"
                                    value={puntoPartida}
                                    onChange={(e) => setPuntoPartida(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500">Punto de Destino *</label>
                                <input
                                    type="text"
                                    value={puntoDestino}
                                    onChange={(e) => setPuntoDestino(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500">Fecha Inicio Traslado</label>
                                <input
                                    type="date"
                                    value={fechaInicio}
                                    onChange={(e) => setFechaInicio(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500">Fecha Fin Traslado</label>
                                <input
                                    type="date"
                                    value={fechaFin}
                                    onChange={(e) => setFechaFin(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección Mercadería */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Package size={16} /> Detalle de Mercadería
                        </h3>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-slate-500">Motivo del Traslado:</span>
                                <select
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value as MotivoTraslado)}
                                    className="text-xs border-none bg-transparent font-bold text-sri-blue outline-none"
                                >
                                    <option value={MotivoTraslado.VENTA}>Venta</option>
                                    <option value={MotivoTraslado.TRASLADO_BODEGAS}>Traslado entre Bodegas</option>
                                    <option value={MotivoTraslado.DEVOLUCION}>Devolución</option>
                                    <option value={MotivoTraslado.COMPRA}>Compra</option>
                                </select>
                            </div>
                            <table className="w-full text-xs text-left">
                                <thead className="text-slate-400 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="pb-2">Descripción</th>
                                        <th className="pb-2 text-right">Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {facturaReferencia?.items?.map((item: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="py-2 text-slate-700">{item.nombre || item.descripcion}</td>
                                            <td className="py-2 text-right font-bold">{item.cantidad || 1}</td>
                                        </tr>
                                    )) || (
                                            <tr><td colSpan={2} className="py-4 text-center text-slate-400 italic">No hay ítems cargados.</td></tr>
                                        )}
                                </tbody>
                            </table>
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
                        className="flex items-center gap-2 min-w-[160px] justify-center bg-slate-800 hover:bg-slate-700"
                    >
                        {guardando ? 'Generando...' : <><Save size={18} /> Guardar y Emitir</>}
                    </Button>
                </div>
            </div>
        </div>
    );
};
