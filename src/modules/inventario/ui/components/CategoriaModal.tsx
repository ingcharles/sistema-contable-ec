'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CategoriaProducto } from '../../domain/types';
import { Button } from '@/shared/ui/Button';

interface Props {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const CategoriaModal: React.FC<Props> = ({ onClose, onSave, empresaId: _empresaId }) => {
    const [formData, setFormData] = useState<Partial<CategoriaProducto>>({
        nombre: '',
        cuentaInventario: '',
        cuentaCostoVenta: '',
        cuentaVenta: ''
    });

    const handleSave = async () => {
        if (!formData.nombre) return;
        // Simulación de guardado
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95">
                <div className="p-5 border-b flex justify-between">
                    <h3 className="font-bold text-slate-800">Nueva Categoría (División Artículo)</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Categoría</label>
                        <input type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="w-full border rounded p-2 text-sm" placeholder="EJ: LINEA BLANCA" />
                    </div>
                    <div className="bg-slate-50 p-4 rounded border border-slate-100 space-y-3">
                        <h4 className="text-xs font-bold text-sri-blue">Contabilización Automática</h4>
                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Cuenta Inventario (Activo)</label>
                            <input type="text" value={formData.cuentaInventario} onChange={e => setFormData({ ...formData, cuentaInventario: e.target.value })} className="w-full border rounded p-1.5 text-xs font-mono" placeholder="1.1.03..." />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Cuenta Costo Venta (Gasto)</label>
                            <input type="text" value={formData.cuentaCostoVenta} onChange={e => setFormData({ ...formData, cuentaCostoVenta: e.target.value })} className="w-full border rounded p-1.5 text-xs font-mono" placeholder="5.1.01..." />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Cuenta Venta (Ingreso)</label>
                            <input type="text" value={formData.cuentaVenta} onChange={e => setFormData({ ...formData, cuentaVenta: e.target.value })} className="w-full border rounded p-1.5 text-xs font-mono" placeholder="4.1.01..." />
                        </div>
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
