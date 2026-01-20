import { useState, useEffect } from 'react';
import { X, User, Mail, Briefcase, DollarSign, Calendar, Save, CreditCard, Landmark } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Empleado, EstadoEmpleado, TipoContrato } from '../../domain/types';
import { InMemoryNominaRepository } from '../../infrastructure/NominaRepository';

interface EmpleadoModalProps {
    empleado?: Empleado;
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const EmpleadoModal = ({ empleado, onClose, onSave, empresaId }: EmpleadoModalProps) => {
    const [formData, setFormData] = useState<Partial<Empleado>>({
        identificacion: '',
        nombres: '',
        apellidos: '',
        email: '',
        fechaIngreso: new Date().toISOString().split('T')[0],
        cargo: '',
        sueldoBase: 0,
        tipoContrato: TipoContrato.INDEFINIDO,
        estado: EstadoEmpleado.ACTIVO,
        banco: '',
        cuentaBancaria: ''
    });

    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (empleado) {
            setFormData(empleado);
        }
    }, [empleado]);

    const handleSave = async () => {
        if (!formData.identificacion || !formData.nombres || !formData.apellidos || !formData.sueldoBase) {
            alert('Por favor complete los campos obligatorios');
            return;
        }

        setGuardando(true);
        const repo = new InMemoryNominaRepository();

        const empleadoToSave: Empleado = {
            ...formData as Empleado,
            id: empleado?.id || Math.random().toString(36).substr(2, 9),
            empresaId,
            createdAt: empleado?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: empleado?.createdBy || 'user'
        };

        await repo.saveEmpleado(empleadoToSave);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <User className="text-sri-blue" size={20} />
                            {empleado ? 'Editar Empleado' : 'Nuevo Empleado'}
                        </h2>
                        <p className="text-xs text-slate-500">Información del personal</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Identificación *</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={formData.identificacion}
                                    onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                    placeholder="RUC / Cédula"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombres *</label>
                            <input
                                type="text"
                                value={formData.nombres}
                                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                placeholder="Nombres completos"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Apellidos *</label>
                            <input
                                type="text"
                                value={formData.apellidos}
                                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                placeholder="Apellidos completos"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={formData.cargo}
                                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                    placeholder="Ej: Contador"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sueldo Base *</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="number"
                                    value={formData.sueldoBase}
                                    onChange={(e) => setFormData({ ...formData, sueldoBase: Number(e.target.value) })}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Ingreso</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="date"
                                    value={formData.fechaIngreso}
                                    onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Contrato</label>
                            <select
                                value={formData.tipoContrato}
                                onChange={(e) => setFormData({ ...formData, tipoContrato: e.target.value as TipoContrato })}
                                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                            >
                                {Object.values(TipoContrato).map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Banco</label>
                            <div className="relative">
                                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={formData.banco}
                                    onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                    placeholder="Nombre del banco"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cuenta Bancaria</label>
                            <input
                                type="text"
                                value={formData.cuentaBancaria}
                                onChange={(e) => setFormData({ ...formData, cuentaBancaria: e.target.value })}
                                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                placeholder="Nro. de cuenta"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                            <select
                                value={formData.estado}
                                onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoEmpleado })}
                                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                            >
                                {Object.values(EstadoEmpleado).map(e => (
                                    <option key={e} value={e}>{e}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={guardando} className="flex items-center gap-2">
                        <Save size={18} /> {guardando ? 'Guardando...' : 'Guardar Empleado'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
