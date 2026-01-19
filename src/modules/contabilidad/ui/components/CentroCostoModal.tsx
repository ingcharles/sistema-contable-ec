'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

interface Props {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const CentroCostoModal: React.FC<Props> = ({ onClose, onSave, empresaId: _empresaId }) => {
    const [nombre, setNombre] = useState('');
    const [codigo, setCodigo] = useState('');
    const [nivel, setNivel] = useState(1);

    const handleSave = async () => {
        if (!nombre || !codigo) return;
        // Simulación de guardado
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col animate-in zoom-in-95">
                <div className="p-5 border-b flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Nuevo Centro de Costo</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código</label>
                        <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Ej: 10.01" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Ej: Sucursal Norte" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nivel</label>
                        <select value={nivel} onChange={e => setNivel(Number(e.target.value))} className="w-full border rounded p-2 text-sm bg-white">
                            <option value="1">1 - Principal</option>
                            <option value="2">2 - Sub-centro</option>
                        </select>
                    </div>
                </div>
                <div className="p-5 border-t flex justify-end gap-2 bg-slate-50 rounded-b-xl">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Guardar</Button>
                </div>
            </div>
        </div>
    );
};
