'use client';

import { useState } from 'react';
import { Save, Monitor, Building2, Hash, Layers, ToggleLeft, ToggleRight, AlertCircle, Users, ShieldCheck, FileText } from 'lucide-react';
import { PuntoEmision, Sucursal } from '@/modules/configuracion/domain/types';
import { ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { TipoComprobante } from '@/shared/types';

interface PuntoEmisionFormProps {
    onClose: () => void;
    onSave: () => void;
    sucursales: Sucursal[];
    puntoEditar?: PuntoEmision;
}

export const PuntoEmisionForm = ({ onClose, onSave, sucursales, puntoEditar }: PuntoEmisionFormProps) => {
    const [formData, setFormData] = useState<Partial<PuntoEmision>>(puntoEditar || {
        sucursalId: sucursales[0]?.id || '',
        codigo: '',
        nombre: '',
        descripcion: '',
        activo: true,
        requiereAsignacion: true,
        permiteMultiplesUsuarios: true,
        secuenciales: [
            { tipoComprobante: TipoComprobante.FACTURA, secuencialActual: 1 },
            { tipoComprobante: TipoComprobante.LIQUIDACION_COMPRA, secuencialActual: 1 },
            { tipoComprobante: TipoComprobante.NOTA_CREDITO, secuencialActual: 1 },
            { tipoComprobante: TipoComprobante.NOTA_DEBITO, secuencialActual: 1 },
            { tipoComprobante: TipoComprobante.GUIA_REMISION, secuencialActual: 1 },
            { tipoComprobante: TipoComprobante.RETENCION, secuencialActual: 1 }
        ]
    });

    const [guardando, setGuardando] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.codigo || !formData.nombre || !formData.sucursalId) {
            setErrorValidacion('Complete los campos obligatorios (Sucursal, Código y Nombre)');
            return;
        }

        setGuardando(true);
        setErrorValidacion(null);
        try {
            await ConfiguracionUseCases.guardarPuntoEmision({
                ...formData,
                id: puntoEditar?.id
            } as PuntoEmision);
            onSave();
            onClose();
        } catch (error: any) {
            console.error(error);
            setErrorValidacion(error.message || 'Error al guardar punto de emisión');
        } finally {
            setGuardando(false);
        }
    };

    const updateSecuencial = (index: number, val: number) => {
        const newSecs = [...(formData.secuenciales || [])];
        newSecs[index].secuencialActual = val;
        setFormData({ ...formData, secuenciales: newSecs });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {errorValidacion && (
                <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-medium">{errorValidacion}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Básica */}
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Building2 size={14} className="text-sri-blue" /> Sucursal *
                        </label>
                        <select
                            value={formData.sucursalId}
                            onChange={e => setFormData({ ...formData, sucursalId: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-medium text-xs"
                        >
                            <option value="">Seleccione Sucursal</option>
                            {sucursales.map(s => (
                                <option key={s.id} value={s.id}>{s.codigo} - {s.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Hash size={14} className="text-sri-blue" /> Código *
                            </label>
                            <input
                                type="text"
                                value={formData.codigo}
                                onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-black text-center text-sri-blue text-lg"
                                maxLength={3}
                                placeholder="001"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Monitor size={14} className="text-sri-blue" /> Nombre *
                            </label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all text-sm font-medium"
                                placeholder="Ej: Caja Principal"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={14} className="text-sri-blue" /> Descripción
                        </label>
                        <textarea
                            value={formData.descripcion}
                            onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all text-xs min-h-[80px]"
                            placeholder="Notas adicionales sobre este punto..."
                        />
                    </div>

                    {/* Configuración de Acceso */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 text-sri-blue mb-2">
                            <ShieldCheck size={16} />
                            <h3 className="text-[10px] font-black uppercase tracking-widest">Configuración de Acceso</h3>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${formData.requiereAsignacion ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Users size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">Requiere Asignación</p>
                                        <p className="text-[10px] text-slate-500">Solo usuarios asignados pueden usarlo</p>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={formData.requiereAsignacion}
                                    onChange={e => setFormData({ ...formData, requiereAsignacion: e.target.checked })}
                                    className="sr-only"
                                />
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.requiereAsignacion ? 'bg-sri-blue' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.requiereAsignacion ? 'right-1' : 'left-1'}`} />
                                </div>
                            </label>

                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${formData.permiteMultiplesUsuarios ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Users size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">Múltiples Usuarios</p>
                                        <p className="text-[10px] text-slate-500">Varios usuarios pueden usarlo a la vez</p>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={formData.permiteMultiplesUsuarios}
                                    onChange={e => setFormData({ ...formData, permiteMultiplesUsuarios: e.target.checked })}
                                    className="sr-only"
                                />
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.permiteMultiplesUsuarios ? 'bg-sri-blue' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.permiteMultiplesUsuarios ? 'right-1' : 'left-1'}`} />
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Secuenciales */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 h-fit">
                    <div className="flex items-center gap-2 text-sri-blue mb-2">
                        <Layers size={16} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Secuenciales de Documentos</h3>
                    </div>

                    <div className="space-y-2">
                        {formData.secuenciales?.map((sec, idx) => (
                            <div key={sec.tipoComprobante} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm transition-all hover:border-sri-blue/20">
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                                    {sec.tipoComprobante === TipoComprobante.FACTURA ? 'Factura' :
                                        sec.tipoComprobante === TipoComprobante.LIQUIDACION_COMPRA ? 'Liquidación' :
                                            sec.tipoComprobante === TipoComprobante.NOTA_CREDITO ? 'Nota Crédito' :
                                                sec.tipoComprobante === TipoComprobante.NOTA_DEBITO ? 'Nota Débito' :
                                                    sec.tipoComprobante === TipoComprobante.GUIA_REMISION ? 'Guía Remisión' :
                                                        sec.tipoComprobante === TipoComprobante.RETENCION ? 'Retención' : sec.tipoComprobante}
                                </span>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={sec.secuencialActual}
                                        onChange={e => updateSecuencial(idx, Number(e.target.value))}
                                        className="w-24 pl-2 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right font-black text-sri-blue outline-none focus:ring-2 focus:ring-sri-blue/10 text-sm"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={guardando}
                    className="px-8 py-2.5 bg-sri-blue text-white rounded-xl text-sm font-bold shadow-lg shadow-sri-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {guardando ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Save size={18} />
                    )}
                    {puntoEditar ? 'Actualizar Punto' : 'Crear Punto'}
                </button>
            </div>
        </form>
    );
};
