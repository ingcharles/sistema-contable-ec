import { useState, useEffect } from 'react';
import { Save, UserPlus, User, Mail, Briefcase, DollarSign, Calendar, CreditCard, Landmark, Hash } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Empleado, EstadoEmpleado, TipoContrato } from '../../domain/types';
import { useNominaMutations } from '../../hooks/useNomina';

interface EmpleadoModalProps {
    empleado?: Empleado;
    onClose: () => void;
    onSave: () => void;
}

export const EmpleadoModal = ({ empleado, onClose, onSave }: EmpleadoModalProps) => {
    const { guardarEmpleado, procesando: guardando } = useNominaMutations();
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

        try {
            await guardarEmpleado({
                cedula: formData.identificacion,
                nombres: formData.nombres,
                apellidos: formData.apellidos,
                email: formData.email || '',
                telefono: '',
                fechaIngreso: formData.fechaIngreso,
                cargo: formData.cargo || '',
                departamento: '',
                sueldoBase: formData.sueldoBase,
                tipoContrato: formData.tipoContrato,
                activo: formData.estado === EstadoEmpleado.ACTIVO
            });
            onSave();
            onClose();
        } catch (error) {
            console.error('Error al guardar empleado:', error);
            alert('Error al guardar el empleado');
        }
    };

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={onClose} disabled={guardando}>
                Cancelar
            </Button>
            <Button
                onClick={handleSave}
                disabled={guardando}
                className="flex items-center gap-2 min-w-[160px] justify-center"
            >
                {guardando ? (
                    'Guardando...'
                ) : (
                    <>
                        <Save size={18} /> Guardar Empleado
                    </>
                )}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={empleado ? 'Editar Empleado' : 'Nuevo Empleado'}
            description="Administre la información del personal de su empresa."
            icon={empleado ? <User size={24} /> : <UserPlus size={24} />}
            footer={footer}
            size="lg"
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <CreditCard size={14} className="text-sri-blue" /> Identificación *
                        </label>
                        <input
                            type="text"
                            value={formData.identificacion}
                            onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            placeholder="RUC / Cédula"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Mail size={14} className="text-sri-blue" /> Email Corporativo
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            placeholder="correo@empresa.com"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <User size={14} className="text-sri-blue" /> Nombres *
                        </label>
                        <input
                            type="text"
                            value={formData.nombres}
                            onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 uppercase outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            placeholder="NOMBRES COMPLETOS"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <User size={14} className="text-sri-blue" /> Apellidos *
                        </label>
                        <input
                            type="text"
                            value={formData.apellidos}
                            onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 uppercase outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            placeholder="APELLIDOS COMPLETOS"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Briefcase size={14} className="text-sri-blue" /> Cargo / Posición
                        </label>
                        <input
                            type="text"
                            value={formData.cargo}
                            onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            placeholder="Ej: Contador General"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign size={14} className="text-sri-blue" /> Sueldo Base Mensual *
                        </label>
                        <input
                            type="number"
                            value={formData.sueldoBase}
                            onChange={(e) => setFormData({ ...formData, sueldoBase: Number(e.target.value) })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-right text-sri-blue outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-mono"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={14} className="text-sri-blue" /> Fecha de Ingreso
                        </label>
                        <input
                            type="date"
                            value={formData.fechaIngreso}
                            onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Contrato</label>
                        <select
                            value={formData.tipoContrato}
                            onChange={(e) => setFormData({ ...formData, tipoContrato: e.target.value as TipoContrato })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        >
                            {Object.values(TipoContrato).map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Landmark size={16} className="text-sri-blue" /> Información Bancaria
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Banco</label>
                            <input
                                type="text"
                                value={formData.banco}
                                onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                                placeholder="Nombre del banco"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Hash size={12} className="text-sri-blue" /> Número de Cuenta
                            </label>
                            <input
                                type="text"
                                value={formData.cuentaBancaria}
                                onChange={(e) => setFormData({ ...formData, cuentaBancaria: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-600 outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                                placeholder="Nro. de cuenta"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado del Empleado</label>
                    <select
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoEmpleado })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                    >
                        {Object.values(EstadoEmpleado).map(e => (
                            <option key={e} value={e}>{e}</option>
                        ))}
                    </select>
                </div>
            </div>
        </Modal>
    );
};
