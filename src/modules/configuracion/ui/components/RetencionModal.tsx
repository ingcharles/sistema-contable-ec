'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { CodigoRetencion } from '../../domain/types';
import { InMemoryConfiguracionRepository } from '../../infrastructure/ConfiguracionRepository';
import { Button } from '@/shared/ui/Button';

interface RetencionModalProps {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
    retencionEditar?: CodigoRetencion;
}

export const RetencionModal = ({ onClose, onSave, empresaId, retencionEditar }: RetencionModalProps) => {
    const [formData, setFormData] = useState<Partial<CodigoRetencion>>(retencionEditar || {
        codigo: '',
        concepto: '',
        porcentaje: 0,
        tipo: 'RENTA',
        activo: true
    });

    const handleSubmit = async () => {
        if (!formData.codigo || !formData.concepto) {
            alert('Complete los campos obligatorios');
            return;
        }

        const newRet: CodigoRetencion = {
            ...formData as CodigoRetencion,
            id: retencionEditar?.id || Math.random().toString(36).substr(2, 9),
            empresaId,
            createdAt: retencionEditar?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: retencionEditar?.createdBy || 'user'
        };

        const repo = new InMemoryConfiguracionRepository();
        await repo.saveCodigoRetencion(newRet);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800">
                        {retencionEditar ? 'Editar Retención' : 'Nueva Retención'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Impuesto</label>
                        <select
                            value={formData.tipo}
                            onChange={e => setFormData({ ...formData, tipo: e.target.value as 'RENTA' | 'IVA' })}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                        >
                            <option value="RENTA">Impuesto a la Renta</option>
                            <option value="IVA">IVA</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Código SRI</label>
                            <input
                                type="text"
                                value={formData.codigo}
                                onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono"
                                placeholder="Ej: 312"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Porcentaje %</label>
                            <input
                                type="number"
                                value={formData.porcentaje}
                                onChange={e => setFormData({ ...formData, porcentaje: Number(e.target.value) })}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Concepto</label>
                        <textarea
                            value={formData.concepto}
                            onChange={e => setFormData({ ...formData, concepto: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm h-24 resize-none"
                            placeholder="Descripción del concepto de retención..."
                        />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.activo}
                            onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                            className="rounded text-sri-blue focus:ring-sri-blue"
                        />
                        <span className="text-sm text-slate-700">Registro Activo</span>
                    </label>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl bg-slate-50">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} className="flex items-center gap-2">
                        <Save size={18} /> Guardar
                    </Button>
                </div>
            </div>
        </div>
    );
};
