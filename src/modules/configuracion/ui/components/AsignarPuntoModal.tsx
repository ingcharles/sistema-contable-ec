'use client';

import { useState, useEffect } from 'react';
import { X, Save, MapPin, Check, Plus, Trash2, Home } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { UsuarioSistema, PuntoEmision } from '@/modules/configuracion/domain/types';
import { UsuariosUseCases, ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';

interface AsignarPuntoModalProps {
    usuario: UsuarioSistema;
    onClose: () => void;
    onSave: () => void;
}

export function AsignarPuntoModal({ usuario, onClose, onSave }: AsignarPuntoModalProps) {
    const [loading, setLoading] = useState(false);
    const [puntosDisponibles, setPuntosDisponibles] = useState<PuntoEmision[]>([]);
    const [asignaciones, setAsignaciones] = useState<any[]>([]);
    const [puntoSeleccionado, setPuntoSeleccionado] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [puntosRes, asignRes] = await Promise.all([
                ConfiguracionUseCases.listarPuntosEmision(),
                UsuariosUseCases.listarAsignacionesPuntos({ usuarioId: usuario.id })
            ]);
            setPuntosDisponibles(puntosRes || []);
            setAsignaciones(asignRes.asignaciones || []);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [usuario.id]);

    const handleAsignar = async () => {
        if (!puntoSeleccionado) return;
        setLoading(true);
        try {
            await UsuariosUseCases.guardarAsignacionPunto({
                usuarioId: usuario.id,
                puntoEmisionId: puntoSeleccionado,
                activo: true,
                esPrincipal: asignaciones.length === 0, // Primero es principal por defecto
                puedeCambiar: true
            });
            setPuntoSeleccionado('');
            loadData();
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (id: string) => {
        if (!confirm('¿Eliminar esta asignación?')) return;
        setLoading(true);
        try {
            await UsuariosUseCases.eliminarAsignacionPunto(id);
            loadData();
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
                <div className="flex items-center justify-between p-6 border-b bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sri-blue rounded-lg text-white">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Puntos de Emisión Autorizados</h2>
                            <p className="text-xs text-slate-500">Usuario: {usuario.nombreCompleto || (usuario as any).nombre}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Selector de nuevo punto */}
                    <div className="flex gap-3 items-end p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div className="flex-1 space-y-1.5">
                            <label className="text-xs font-bold text-blue-700 uppercase">Seleccionar Punto de Emisión</label>
                            <select
                                value={puntoSeleccionado}
                                onChange={(e) => setPuntoSeleccionado(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            >
                                <option value="">-- Seleccione un punto --</option>
                                {puntosDisponibles
                                    .filter(p => !asignaciones.some(a => a.puntoEmisionId === p.id))
                                    .map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.codigo} - {p.nombre}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                        <Button
                            onClick={handleAsignar}
                            disabled={!puntoSeleccionado || loading}
                            className="gap-2 shrink-0"
                        >
                            <Plus size={18} />
                            Asignar
                        </Button>
                    </div>

                    {/* Lista de asignaciones actuales */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            Puntos Asignados ({asignaciones.length})
                        </h3>

                        {asignaciones.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm italic">No hay puntos asignados a este usuario.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {asignaciones.map((asig) => (
                                    <div key={asig.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${asig.esPrincipal ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {asig.esPrincipal ? <Home size={20} /> : <MapPin size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 flex items-center gap-2">
                                                    {asig.puntoCodigo} - {asig.puntoNombre}
                                                    {asig.esPrincipal && <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase leading-none">Principal</span>}
                                                </p>
                                                <p className="text-xs text-slate-500">Sucursal: {asig.sucursalCodigo}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEliminar(asig.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Quitar acceso"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t bg-slate-50 flex justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Cerrar
                    </Button>
                </div>
            </div>
        </div>
    );
}
