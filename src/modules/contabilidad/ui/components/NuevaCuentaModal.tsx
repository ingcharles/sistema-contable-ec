'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { PLAN_CUENTAS } from '@/shared/constants';
import { CuentaContable } from '@/shared/types';

interface NuevaCuentaModalProps {
    onClose: () => void;
    onSave: (cuenta: CuentaContable) => void;
    cuentaPadre?: CuentaContable; // Para crear subcuentas
}

export const NuevaCuentaModal = ({ onClose, onSave, cuentaPadre }: NuevaCuentaModalProps) => {
    const [formData, setFormData] = useState({
        codigo: cuentaPadre ? `${cuentaPadre.codigo}.` : '',
        nombre: '',
        tipo: cuentaPadre?.tipo || 'ACTIVO',
        saldo: 0,
    });
    const [error, setError] = useState('');

    const nivel = cuentaPadre ? cuentaPadre.nivel + 1 : 1;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validaciones
        if (!formData.codigo || !formData.nombre) {
            setError('Código y nombre son obligatorios');
            return;
        }

        // Validar que el código no exista
        if (PLAN_CUENTAS.find(c => c.codigo === formData.codigo)) {
            setError('El código ya existe en el plan de cuentas');
            return;
        }

        // Validar estructura jerárquica
        if (cuentaPadre && !formData.codigo.startsWith(cuentaPadre.codigo + '.')) {
            setError(`El código debe comenzar con ${cuentaPadre.codigo}.`);
            return;
        }

        // Validar nivel correcto
        const partes = formData.codigo.split('.');
        if (partes.length !== nivel) {
            setError(`El código debe tener ${nivel} niveles (ej: ${cuentaPadre ? cuentaPadre.codigo + '.01' : '1'})`);
            return;
        }

        const nuevaCuenta: CuentaContable = {
            codigo: formData.codigo,
            nombre: formData.nombre.toUpperCase(),
            nivel,
            tipo: formData.tipo as 'ACTIVO' | 'PASIVO' | 'PATRIMONIO',
            saldo: formData.saldo,
        };

        onSave(nuevaCuenta);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-sri-blue to-blue-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">
                            {cuentaPadre ? 'Nueva Subcuenta' : 'Nueva Cuenta'}
                        </h2>
                        {cuentaPadre && (
                            <p className="text-sm text-blue-100 mt-1">
                                Cuenta Padre: {cuentaPadre.codigo} - {cuentaPadre.nombre}
                            </p>
                        )}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Código */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Código <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.codigo}
                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                placeholder={cuentaPadre ? `${cuentaPadre.codigo}.01` : '1'}
                                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sri-blue/20 focus:border-sri-blue outline-none"
                                autoFocus
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Nivel {nivel} - {nivel === 1 ? 'Cuenta Principal' : `Subcuenta de nivel ${nivel}`}
                            </p>
                        </div>

                        {/* Tipo */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Tipo <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                disabled={!!cuentaPadre}
                                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sri-blue/20 focus:border-sri-blue outline-none disabled:bg-slate-100"
                            >
                                <option value="ACTIVO">Activo</option>
                                <option value="PASIVO">Pasivo</option>
                                <option value="PATRIMONIO">Patrimonio</option>
                            </select>
                            {cuentaPadre && (
                                <p className="text-xs text-slate-500 mt-1">
                                    Heredado de cuenta padre
                                </p>
                            )}
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
                            placeholder="Ej: CAJA GENERAL"
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sri-blue/20 focus:border-sri-blue outline-none"
                        />
                    </div>

                    {/* Saldo Inicial */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Saldo Inicial
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.saldo}
                            onChange={(e) => setFormData({ ...formData, saldo: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sri-blue/20 focus:border-sri-blue outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Opcional - Puede dejarse en 0
                        </p>
                    </div>

                    {/* Información Adicional */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="font-bold text-blue-900 mb-2">Información</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• El código debe ser único en todo el plan de cuentas</li>
                            <li>• Los nombres se guardarán en mayúsculas automáticamente</li>
                            <li>• El nivel se calcula automáticamente según la jerarquía</li>
                            {cuentaPadre && (
                                <li>• El tipo se hereda de la cuenta padre</li>
                            )}
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
                            className="flex items-center gap-2"
                        >
                            <Save size={18} />
                            Guardar Cuenta
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
