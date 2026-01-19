'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Bodega } from '../../domain/types';
import { Sucursal } from '@/modules/configuracion/domain/types';
import { InMemoryConfiguracionRepository } from '@/modules/configuracion/infrastructure/ConfiguracionRepository';
import { Button } from '@/shared/ui/Button';

interface Props {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const BodegaModal: React.FC<Props> = ({ onClose, onSave, empresaId }) => {
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [formData, setFormData] = useState<Partial<Bodega>>({
        nombre: '', codigo: '', responsable: '', ubicacion: '', sucursalId: ''
    });

    useEffect(() => {
        const repo = new InMemoryConfiguracionRepository();
        repo.getSucursales(empresaId).then(setSucursales);
    }, [empresaId]);

    const handleSave = async () => {
        if (!formData.nombre || !formData.sucursalId) return;
        // Simulación de guardado
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95">
                <div className="p-5 border-b flex justify-between">
                    <h3 className="font-bold text-slate-800">Nueva Bodega</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sucursal Asociada</label>
                        <select value={formData.sucursalId} onChange={e => setFormData({ ...formData, sucursalId: e.target.value })} className="w-full border rounded p-2 text-sm bg-white">
                            <option value="">Seleccione Sucursal...</option>
                            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código</label>
                            <input type="text" value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value })} className="w-full border rounded p-2 text-sm" placeholder="B001" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                            <input type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="w-full border rounded p-2 text-sm" placeholder="Principal" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Responsable</label>
                        <input type="text" value={formData.responsable} onChange={e => setFormData({ ...formData, responsable: e.target.value })} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ubicación / Dirección</label>
                        <input type="text" value={formData.ubicacion} onChange={e => setFormData({ ...formData, ubicacion: e.target.value })} className="w-full border rounded p-2 text-sm" />
                    </div>
                </div>
                <div className="p-5 border-t flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Guardar</Button>
                </div>
            </div>
        </div>
    );
};
