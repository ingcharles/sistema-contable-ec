'use client';

import { useState } from 'react';
import { Save, Monitor, Building2, Hash, Layers, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { PuntoEmision, Sucursal } from '../../domain/types';
import { ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';
import { TipoComprobante } from '@/shared/types';

interface PuntoEmisionModalProps {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
    sucursales: Sucursal[];
    puntoEditar?: PuntoEmision;
}

export const PuntoEmisionModal = ({ onClose, onSave, sucursales, puntoEditar }: Omit<PuntoEmisionModalProps, 'empresaId'>) => {
    const [formData, setFormData] = useState<Partial<PuntoEmision>>(puntoEditar || {
        sucursalId: sucursales[0]?.id || '',
        codigo: '',
        nombre: '',
        activo: true,
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

    const handleSubmit = async () => {
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
            });
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

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={onClose} disabled={guardando}>
                Cancelar
            </Button>
            <Button
                onClick={handleSubmit}
                disabled={guardando}
                className="flex items-center gap-2 min-w-[140px] justify-center"
            >
                {guardando ? (
                    'Guardando...'
                ) : (
                    <>
                        <Save size={18} /> Guardar Punto
                    </>
                )}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={puntoEditar ? 'Editar Punto de Emisión' : 'Nuevo Punto de Emisión'}
            description="Configure una caja o terminal de facturación y sus secuenciales."
            icon={<Monitor size={24} />}
            footer={footer}
            size="md"
        >
            <div className="space-y-6">
                {errorValidacion && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-sm font-medium">{errorValidacion}</p>
                    </div>
                )}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Building2 size={14} className="text-sri-blue" /> Sucursal de Pertenencia *
                    </label>
                    <select
                        value={formData.sucursalId}
                        onChange={e => setFormData({ ...formData, sucursalId: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-medium text-xs"
                    >
                        {sucursales.map(s => (
                            <option key={s.id} value={s.id}>{s.codigo} - {s.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Hash size={14} className="text-sri-blue" /> Código (001) *
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
                            <Monitor size={14} className="text-sri-blue" /> Nombre de Caja *
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

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center gap-2 text-sri-blue mb-2">
                        <Layers size={16} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Secuenciales de Documentos</h3>
                    </div>

                    <div className="space-y-2">
                        {formData.secuenciales?.map((sec, idx) => (
                            <div key={sec.tipoComprobante} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm transition-all hover:border-sri-blue/20">
                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">
                                    {sec.tipoComprobante === TipoComprobante.FACTURA ? 'Factura Electrónica' :
                                        sec.tipoComprobante === TipoComprobante.LIQUIDACION_COMPRA ? 'Liquidación de Compra' :
                                            sec.tipoComprobante === TipoComprobante.NOTA_CREDITO ? 'Nota de Crédito' :
                                                sec.tipoComprobante === TipoComprobante.NOTA_DEBITO ? 'Nota de Débito' :
                                                    sec.tipoComprobante === TipoComprobante.GUIA_REMISION ? 'Guía de Remisión' :
                                                        sec.tipoComprobante === TipoComprobante.RETENCION ? 'Retención en la Fuente' : sec.tipoComprobante}
                                </span>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={sec.secuencialActual}
                                        onChange={e => updateSecuencial(idx, Number(e.target.value))}
                                        className="w-28 pl-3 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-black text-sri-blue outline-none focus:ring-2 focus:ring-sri-blue/10"
                                    />
                                    <span className="absolute -top-3 -right-1 px-1.5 py-0.5 bg-sri-blue text-[8px] text-white rounded-md font-black shadow-sm uppercase tracking-tighter">SIGUIENTE</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.activo ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${formData.activo ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'}`}>
                                {formData.activo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                            </div>
                            <div className="text-left">
                                <h4 className={`text-xs font-black uppercase tracking-tight ${formData.activo ? 'text-emerald-800' : 'text-slate-600'}`}>
                                    {formData.activo ? 'Punto Habilitado' : 'Punto Deshabilitado'}
                                </h4>
                                <p className="text-[10px] font-medium text-slate-500">¿Permitir emisiones desde este punto?</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </Modal>
    );
};
