import { useState, useEffect } from 'react';
import { Save, UserPlus, User, Mail, Briefcase, DollarSign, Calendar, CreditCard, Landmark, Hash, AlertCircle, Building2, FileText } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { Empleado, EstadoEmpleado, Area, Cargo, TipoContratoEntity } from '../../domain/types';
import { useNominaMutations, useAreas, useCargos, useTiposContrato } from '../../hooks/useNomina';

interface EmpleadoModalProps {
    empleado?: Empleado;
    onClose: () => void;
    onSave: () => void;
}

export const EmpleadoModal = ({ empleado, onClose, onSave }: EmpleadoModalProps) => {
    const { guardarEmpleado, procesando: guardando } = useNominaMutations();
    const { areas, cargarAreas } = useAreas();
    const { cargos, cargarCargos } = useCargos();
    const { tiposContrato, cargarTipos } = useTiposContrato();

    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Empleado>>({
        identificacion: '',
        nombres: '',
        apellidos: '',
        email: '',
        fechaIngreso: new Date().toISOString().split('T')[0],
        sueldoBase: 0,
        estado: EstadoEmpleado.ACTIVO,
        banco: '',
        numeroCuenta: '',
        areaId: '',
        cargoId: '',
        tipoContratoId: ''
    });

    useEffect(() => {
        cargarAreas();
        cargarTipos();
        cargarCargos();
    }, [cargarAreas, cargarTipos, cargarCargos]);

    useEffect(() => {
        if (empleado) {
            setFormData({
                ...empleado,
                areaId: empleado.areaId || '',
                cargoId: empleado.cargoId || '',
                tipoContratoId: empleado.tipoContratoId || '',
                numeroCuenta: empleado.numeroCuenta || empleado.cuentaBancaria || ''
            });
        }
    }, [empleado]);

    // Actualizar cargos cuando cambia el área
    const handleAreaChange = (areaId: string) => {
        handleChange('areaId', areaId);
        cargarCargos(areaId);
    };

    const handleChange = (field: keyof Empleado, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errorValidacion) setErrorValidacion(null);
    };

    const handleSave = async () => {
        if (!formData.identificacion || !formData.nombres || !formData.apellidos || !formData.sueldoBase) {
            setErrorValidacion('Por favor complete los campos obligatorios marcados con *');
            return;
        }

        try {
            // Mapear el nombre del cargo para compatibilidad con la API existente si es necesario
            const selectedCargo = cargos.find(c => c.id === formData.cargoId);

            await guardarEmpleado({
                ...formData,
                cedula: formData.identificacion, // compatibilidad con API
                cargo: selectedCargo?.nombre || '', // compatibilidad con API
                activo: formData.estado === EstadoEmpleado.ACTIVO
            });
            onSave();
            onClose();
        } catch (error) {
            console.error('Error al guardar empleado:', error);
            setErrorValidacion('Error al guardar el empleado');
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleSave}
            isLoading={guardando}
            submitLabel="Guardar Empleado"
            submitIcon={<Save size={18} />}
        />
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
                {errorValidacion && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                        <AlertCircle size={18} />
                        {errorValidacion}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <CreditCard size={14} className="text-sri-blue" /> Identificación *
                        </label>
                        <input
                            type="text"
                            value={formData.identificacion}
                            onChange={(e) => handleChange('identificacion', e.target.value)}
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
                            onChange={(e) => handleChange('email', e.target.value)}
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
                            onChange={(e) => handleChange('nombres', e.target.value)}
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
                            onChange={(e) => handleChange('apellidos', e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 uppercase outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            placeholder="APELLIDOS COMPLETOS"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Building2 size={14} className="text-sri-blue" /> Área / Departamento
                        </label>
                        <select
                            value={formData.areaId}
                            onChange={(e) => handleAreaChange(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        >
                            <option value="">Seleccione Área...</option>
                            {areas.map((a: Area) => (
                                <option key={a.id} value={a.id}>{a.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Briefcase size={14} className="text-sri-blue" /> Cargo / Posición
                        </label>
                        <select
                            value={formData.cargoId}
                            onChange={(e) => handleChange('cargoId', e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        >
                            <option value="">Seleccione Cargo...</option>
                            {cargos.map((c: Cargo) => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign size={14} className="text-sri-blue" /> Sueldo Base Mensual *
                        </label>
                        <input
                            type="number"
                            value={formData.sueldoBase}
                            onChange={(e) => handleChange('sueldoBase', Number(e.target.value))}
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
                            onChange={(e) => handleChange('fechaIngreso', e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={14} className="text-sri-blue" /> Tipo de Contrato
                        </label>
                        <select
                            value={formData.tipoContratoId}
                            onChange={(e) => handleChange('tipoContratoId', e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        >
                            <option value="">Seleccione Contrato...</option>
                            {tiposContrato.map((t: TipoContratoEntity) => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado del Empleado</label>
                        <select
                            value={formData.estado}
                            onChange={(e) => handleChange('estado', e.target.value as EstadoEmpleado)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        >
                            {Object.values(EstadoEmpleado).map(e => (
                                <option key={e} value={e}>{e}</option>
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
                                onChange={(e) => handleChange('banco', e.target.value)}
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
                                value={formData.numeroCuenta}
                                onChange={(e) => handleChange('numeroCuenta', e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-600 outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                                placeholder="Nro. de cuenta"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
