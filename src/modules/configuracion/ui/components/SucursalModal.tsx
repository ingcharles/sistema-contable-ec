'use client';

import { useState } from 'react';
import { Save, Building, Hash, MapPin, Stars, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Sucursal } from '../../domain/types';
import { ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';

interface SucursalModalProps {
    onClose: () => void;
    onSave: () => void;
    sucursalEditar?: Sucursal;
}

export const SucursalModal = ({ onClose, onSave, sucursalEditar }: SucursalModalProps) => {
    const [formData, setFormData] = useState<Partial<Sucursal>>(sucursalEditar || {
        codigo: '',
        nombre: '',
        direccion: '',
        esMatriz: false,
        activa: true
    });

    const [guardando, setGuardando] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

    const handleChange = (field: keyof Sucursal, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errorValidacion) setErrorValidacion(null);
    };

    const handleSubmit = async () => {
        if (!formData.codigo || !formData.nombre) {
            setErrorValidacion('El código y nombre son obligatorios');
            return;
        }

        setGuardando(true);
        setErrorValidacion(null);
        try {
            await ConfiguracionUseCases.guardarSucursal({
                ...formData,
                id: sucursalEditar?.id
            });
            onSave();
            onClose();
        } catch (error: any) {
            console.error(error);
            setErrorValidacion(error.message || 'Error al guardar la sucursal');
        } finally {
            setGuardando(false);
        }
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
                        <Save size={18} /> Guardar Sucursal
                    </>
                )}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={sucursalEditar ? 'Editar Sucursal' : 'Nueva Sucursal'}
            description="Administre los puntos físicos de operación de su empresa."
            icon={<Building size={24} />}
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

                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-1 space-y-1.5 text-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-2">
                            <Hash size={14} className="text-sri-blue" /> Código *
                        </label>
                        <input
                            type="text"
                            value={formData.codigo}
                            onChange={e => handleChange('codigo', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-black text-center text-sri-blue text-lg"
                            placeholder="001"
                            maxLength={3}
                        />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Building size={14} className="text-sri-blue" /> Nombre Comercial *
                        </label>
                        <input
                            type="text"
                            value={formData.nombre}
                            onChange={e => handleChange('nombre', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all text-sm font-medium"
                            placeholder="Ej: Sucursal Norte"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <MapPin size={14} className="text-sri-blue" /> Dirección Completa
                    </label>
                    <textarea
                        value={formData.direccion}
                        onChange={e => handleChange('direccion', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all text-sm h-24 resize-none font-medium"
                        placeholder="Av. Principal y Calle Secundaria..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setFormData({ ...formData, esMatriz: !formData.esMatriz })}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.esMatriz ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-200'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${formData.esMatriz ? 'bg-amber-500 text-white' : 'bg-slate-300 text-white'}`}>
                                <Stars size={18} />
                            </div>
                            <div className="text-left">
                                <h4 className={`text-[10px] font-black uppercase tracking-tight ${formData.esMatriz ? 'text-amber-800' : 'text-slate-600'}`}>
                                    Casa Matriz
                                </h4>
                                <p className="text-[8px] font-medium text-slate-400">Punto principal</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setFormData({ ...formData, activa: !formData.activa })}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.activa ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${formData.activa ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'}`}>
                                {formData.activa ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </div>
                            <div className="text-left">
                                <h4 className={`text-[10px] font-black uppercase tracking-tight ${formData.activa ? 'text-emerald-800' : 'text-slate-600'}`}>
                                    Estado
                                </h4>
                                <p className="text-[8px] font-medium text-slate-400">{formData.activa ? 'Operativa' : 'Cerrada'}</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </Modal>
    );
};
