import { useState, useEffect } from 'react';
import { Save, Building2, User, FileText, AlertCircle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { Area, Empleado } from '@/modules/rrhh/domain/types';
import { RRHHUseCases } from '@/modules/rrhh/application/useCases/RRHHUseCases';

interface AreaModalProps {
    area?: Area;
    empleados: Empleado[];
    areas: Area[];
    onClose: () => void;
    onSave: () => void;
}

export const AreaModal = ({ area, empleados, areas, onClose, onSave }: AreaModalProps) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Area>>({
        codigo: '',
        nombre: '',
        descripcion: '',
        areaPadreId: '',
        responsableId: '',
        activa: true
    });

    useEffect(() => {
        if (area) {
            setFormData({
                ...area,
                areaPadreId: area.areaPadreId || '',
                responsableId: area.responsableId || ''
            });
        }
    }, [area]);

    const handleChange = (field: keyof Area, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
        if (error) setError(null);
    };

    const handleSave = async () => {
        if (!formData.codigo || !formData.nombre) {
            setError('Código y nombre son obligatorios');
            return;
        }

        setLoading(true);
        try {
            const success = await RRHHUseCases.guardarArea(formData);
            if (success) {
                onSave();
                onClose();
            } else {
                setError('Error al guardar el área');
            }
        } catch (err: any) {
            setError(err.message || 'Error al guardar el área');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleSave}
            isLoading={loading}
            submitLabel="Guardar Área"
            submitIcon={<Save size={18} />}
        />
    );

    // Filtrar áreas que pueden ser padre (evitar circularidad simple)
    const areasDisponibles = areas.filter(a => a.id !== area?.id);

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={area ? 'Editar Área / Departamento' : 'Nueva Área / Departamento'}
            description="Defina la estructura organizativa de su empresa."
            icon={<Building2 size={24} className="text-sri-blue" />}
            footer={footer}
            size="md"
        >
            <div className="space-y-5">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Código *</label>
                        <input
                            type="text"
                            value={formData.codigo}
                            onChange={(e) => handleChange('codigo', e.target.value.toUpperCase())}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-600 uppercase outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            placeholder="EJ: CONT"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado</label>
                        <select
                            value={formData.activa ? 'true' : 'false'}
                            onChange={(e) => handleChange('activa', e.target.value === 'true')}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        >
                            <option value="true">Activa</option>
                            <option value="false">Inactiva</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre del Área *</label>
                    <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => handleChange('nombre', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        placeholder="Ej: Contabilidad y Finanzas"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Building2 size={12} /> Área Superior (Padre)
                    </label>
                    <select
                        value={formData.areaPadreId}
                        onChange={(e) => handleChange('areaPadreId', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                    >
                        <option value="">Ninguna (Área Principal)</option>
                        {areasDisponibles.map(a => (
                            <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <User size={12} /> Responsable / Jefe de Área
                    </label>
                    <select
                        value={formData.responsableId}
                        onChange={(e) => handleChange('responsableId', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                    >
                        <option value="">Sin Responsable Asignado</option>
                        {empleados.map(e => (
                            <option key={e.id} value={e.id}>{e.apellidos} {e.nombres}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={12} /> Descripción
                    </label>
                    <textarea
                        value={formData.descripcion}
                        onChange={(e) => handleChange('descripcion', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all min-h-[80px]"
                        placeholder="Describa brevemente las funciones del departamento..."
                    />
                </div>
            </div>
        </Modal>
    );
};
