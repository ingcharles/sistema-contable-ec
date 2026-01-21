'use client';

import { useState } from 'react';
import { Save, Edit3, Hash, Info, Type, AlertTriangle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { CuentaContable } from '@/shared/types';

interface EditarCuentaModalProps {
    cuenta: CuentaContable;
    onClose: () => void;
    onSave: (cuenta: CuentaContable) => void;
}

export const EditarCuentaModal = ({ cuenta, onClose, onSave }: EditarCuentaModalProps) => {
    const [formData, setFormData] = useState({
        nombre: cuenta.nombre,
        saldo: cuenta.saldo,
    });
    const [error, setError] = useState('');

    const handleSubmit = () => {
        setError('');

        if (!formData.nombre) {
            setError('El nombre es obligatorio');
            return;
        }

        const cuentaActualizada: CuentaContable = {
            ...cuenta,
            nombre: formData.nombre.toUpperCase(),
            saldo: formData.saldo,
        };

        onSave(cuentaActualizada);
        onClose();
    };

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={onClose}>
                Cancelar
            </Button>
            <Button
                onClick={handleSubmit}
                className="flex items-center gap-2 min-w-[160px] justify-center"
            >
                <Save size={18} /> Guardar Cambios
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Editar Cuenta"
            description={`Modificando cuenta: ${cuenta.codigo}`}
            icon={<Edit3 size={24} />}
            footer={footer}
            size="md"
        >
            <div className="space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                        <Info size={18} /> {error}
                    </div>
                )}

                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Código</span>
                        <p className="font-mono font-black text-sri-blue text-sm">{cuenta.codigo}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo</span>
                        <p className="font-black text-slate-700 text-sm">{cuenta.tipo}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nivel</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-sri-blue" />
                            <p className="font-black text-slate-700 text-sm">{cuenta.nivel}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Type size={14} className="text-sri-blue" /> Nombre de la Cuenta *
                    </label>
                    <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-700 uppercase outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-medium"
                        autoFocus
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Hash size={14} className="text-sri-blue" /> Saldo Actual
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.saldo}
                        onChange={(e) => setFormData({ ...formData, saldo: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-mono font-bold text-right text-slate-600"
                    />
                </div>

                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 flex items-start gap-4">
                    <div className="p-2 bg-amber-500 text-white rounded-lg shadow-lg shadow-amber-500/20">
                        <AlertTriangle size={18} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Aviso de Integridad</h4>
                        <p className="text-[10px] text-amber-700/80 font-medium leading-relaxed">
                            Los cambios en el saldo afectan directamente a los balances históricos.
                            Use esta opción solo para ajustes de auditoría o correcciones de saldo inicial.
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
