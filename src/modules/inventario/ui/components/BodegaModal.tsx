'use client';

import React, { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import { Bodega } from '../../domain/types';
import { Sucursal } from '@/modules/configuracion/domain/types';
import { ConfiguracionUseCases, InventarioUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';

interface Props {
    bodega?: Bodega; // Opcional para edición
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const BodegaModal: React.FC<Props> = ({ bodega, onClose, onSave, empresaId }) => {
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [formData, setFormData] = useState<Partial<Bodega>>({
        nombre: '', codigo: '', responsable: '', ubicacion: '', sucursalId: ''
    });

    useEffect(() => {
        ConfiguracionUseCases.listarSucursales().then(setSucursales);

        if (bodega) {
            setFormData(bodega);
        }
    }, [empresaId, bodega]);

    const handleSave = async () => {
        if (!formData.nombre || !formData.sucursalId) {
            alert('Por favor complete los campos obligatorios (Nombre y Sucursal)');
            return;
        }

        if (bodega && bodega.id) {
            // Si es edicion, el backend manejara POST como update o create nuevo (pendiente implementar PUT)
        }

        await InventarioUseCases.guardarBodega({
            id: bodega?.id, // Backend ignorará si user uuid_generate_v4(), pero enviamos por si acaso
            empresaId,
            sucursalId: formData.sucursalId,
            codigo: formData.codigo,
            nombre: formData.nombre,
            responsable: formData.responsable,
            ubicacion: formData.ubicacion,
            activo: true
        });
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95">
                <div className="p-5 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h3 className="font-bold text-slate-800">{bodega ? 'Editar Bodega' : 'Nueva Bodega'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sucursal Asociada *</label>
                        <select
                            value={formData.sucursalId}
                            onChange={e => setFormData({ ...formData, sucursalId: e.target.value })}
                            className="w-full border rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-sri-blue/20 outline-none"
                        >
                            <option value="">Seleccione Sucursal...</option>
                            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código</label>
                            <input
                                type="text"
                                value={formData.codigo}
                                onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                placeholder="B001"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre *</label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                placeholder="Principal"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Responsable</label>
                        <input
                            type="text"
                            value={formData.responsable}
                            onChange={e => setFormData({ ...formData, responsable: e.target.value })}
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ubicación / Dirección</label>
                        <input
                            type="text"
                            value={formData.ubicacion}
                            onChange={e => setFormData({ ...formData, ubicacion: e.target.value })}
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                        />
                    </div>
                </div>
                <div className="p-5 border-t flex justify-end gap-2 bg-slate-50 rounded-b-xl">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} className="flex items-center gap-2">
                        <Save size={18} /> {bodega ? 'Actualizar' : 'Guardar'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

