'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { PLAN_CUENTAS } from '@/shared/constants';
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Editar Cuenta</h2>
                        <p className="text-sm text-amber-100 mt-1">
                            Código: {cuenta.codigo} - Nivel {cuenta.nivel}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Información No Editable */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Código</label>
                            <p className="font-mono font-bold text-slate-800">{cuenta.codigo}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
                            <p className="font-bold text-slate-800">{cuenta.tipo}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Nivel</label>
                            <p className="font-bold text-slate-800">{cuenta.nivel}</p>
                        </div>
                    </div>

                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Nombre de la Cuenta <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                            autoFocus
                        />
                    </div>

                    {/* Saldo */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Saldo Actual
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.saldo}
                            onChange={(e) => setFormData({ ...formData, saldo: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Modificar solo si es necesario ajustar el saldo
                        </p>
                    </div>

                    {/* Información */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <h4 className="font-bold text-amber-900 mb-2">⚠️ Información Importante</h4>
                        <ul className="text-sm text-amber-800 space-y-1">
                            <li>• El código, tipo y nivel no pueden modificarse</li>
                            <li>• Los nombres se guardarán en mayúsculas automáticamente</li>
                            <li>• Cambiar el saldo afectará los reportes contables</li>
                        </ul>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600"
                        >
                            <Save size={18} />
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
