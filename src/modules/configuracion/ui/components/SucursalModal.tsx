'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
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

    const handleSubmit = async () => {
        if (!formData.codigo || !formData.nombre) {
            alert('El código y nombre son obligatorios');
            return;
        }

        setGuardando(true);
        try {
            await ConfiguracionUseCases.guardarSucursal({
                ...formData,
                id: sucursalEditar?.id
            });
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al guardar la sucursal');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800">
                        {sucursalEditar ? 'Editar Sucursal' : 'Nueva Sucursal'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                            <input
                                type="text"
                                value={formData.codigo}
                                onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono"
                                placeholder="001"
                                maxLength={3}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                                placeholder="Sucursal Norte"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                        <textarea
                            value={formData.direccion}
                            onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm h-20 resize-none"
                            placeholder="Av. 10 de Agosto..."
                        />
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.esMatriz}
                                onChange={e => setFormData({ ...formData, esMatriz: e.target.checked })}
                                className="rounded text-sri-blue focus:ring-sri-blue"
                            />
                            <span className="text-sm text-slate-700">Es Casa Matriz</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.activa}
                                onChange={e => setFormData({ ...formData, activa: e.target.checked })}
                                className="rounded text-sri-blue focus:ring-sri-blue"
                            />
                            <span className="text-sm text-slate-700">Sucursal Activa</span>
                        </label>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl bg-slate-50">
                    <Button variant="secondary" onClick={onClose} disabled={guardando}>Cancelar</Button>
                    <Button onClick={handleSubmit} className="flex items-center gap-2" disabled={guardando}>
                        <Save size={18} /> {guardando ? 'Guardando...' : 'Guardar'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
