'use client';

import { useState } from 'react';
import { Save, BookOpen, Hash, Info, Type } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { CuentaContable } from '@/shared/types';

interface NuevaCuentaModalProps {
    onClose: () => void;
    onSave: (cuenta: CuentaContable) => void;
    cuentaPadre?: CuentaContable;
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

    const handleSubmit = () => {
        setError('');

        if (!formData.codigo || !formData.nombre) {
            setError('Código y nombre son obligatorios');
            return;
        }

        if (cuentaPadre && !formData.codigo.startsWith(cuentaPadre.codigo + '.')) {
            setError(`El código debe comenzar con ${cuentaPadre.codigo}.`);
            return;
        }

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

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={onClose}>
                Cancelar
            </Button>
            <Button
                onClick={handleSubmit}
                className="flex items-center gap-2 min-w-[160px] justify-center"
            >
                <Save size={18} /> Guardar Cuenta
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={cuentaPadre ? 'Nueva Subcuenta' : 'Nueva Cuenta Principal'}
            description={cuentaPadre ? `Añadiendo nivel a: ${cuentaPadre.codigo} - ${cuentaPadre.nombre}` : 'Inicie una nueva rama en su catálogo de cuentas.'}
            icon={<BookOpen size={24} />}
            footer={footer}
            size="md"
        >
            <div className="space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                        <Info size={18} /> {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Hash size={14} className="text-sri-blue" /> Código Contable *
                        </label>
                        <input
                            type="text"
                            value={formData.codigo}
                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                            placeholder={cuentaPadre ? `${cuentaPadre.codigo}.01` : '1'}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sri-blue outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            Tipo de Cuenta
                        </label>
                        <select
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                            disabled={!!cuentaPadre}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all disabled:opacity-60"
                        >
                            <option value="ACTIVO">Activo</option>
                            <option value="PASIVO">Pasivo</option>
                            <option value="PATRIMONIO">Patrimonio</option>
                        </select>
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
                        placeholder="EJ: CAJA GENERAL"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-700 uppercase outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                    />
                </div>

                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-2">
                    <div className="flex items-center gap-2 text-blue-900">
                        <Info size={14} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Reglas Contables</span>
                    </div>
                    <ul className="text-[10px] text-blue-800/70 font-medium space-y-1 ml-5 list-disc">
                        <li>El código debe seguir la estructura jerárquica del plan.</li>
                        <li>Los nombres se normalizan a mayúsculas automáticamente.</li>
                        <li>Nivel actual de creación: <span className="font-bold text-sri-blue">Nivel {nivel}</span>.</li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
};
