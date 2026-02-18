import { useState, useEffect } from 'react';
import { Save, Briefcase, Building2, TrendingUp, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { Area, Cargo } from '@/modules/rrhh/domain/types';
import { RRHHUseCases } from '@/modules/rrhh/application/useCases/RRHHUseCases';

interface CargoModalProps {
    cargo?: Cargo;
    areas: Area[];
    onClose: () => void;
    onSave: () => void;
}

export const CargoModal = ({ cargo, areas, onClose, onSave }: CargoModalProps) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Cargo>>({
        codigo: '',
        nombre: '',
        descripcion: '',
        areaId: '',
        nivelJerarquico: 4,
        sueldoMinimo: 0,
        sueldoMaximo: 0,
        activo: true
    });

    useEffect(() => {
        if (cargo) {
            setFormData({
                ...cargo,
                areaId: cargo.areaId || '',
            });
        }
    }, [cargo]);

    const handleChange = (field: keyof Cargo, value: any) => {
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
            const success = await RRHHUseCases.guardarCargo(formData);
            if (success) {
                onSave();
                onClose();
            } else {
                setError('Error al guardar el cargo');
            }
        } catch (err: any) {
            setError(err.message || 'Error al guardar el cargo');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleSave}
            isLoading={loading}
            submitLabel="Guardar Cargo"
            submitIcon={<Save size={18} />}
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={cargo ? 'Editar Cargo / Posición' : 'Nuevo Cargo / Posición'}
            description="Defina los cargos y niveles salariales de su empresa."
            icon={<Briefcase size={24} className="text-sri-blue" />}
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
                            placeholder="EJ: CONT-GEN"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado</label>
                        <select
                            value={formData.activo ? 'true' : 'false'}
                            onChange={(e) => handleChange('activo', e.target.value === 'true')}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        >
                            <option value="true">Activo</option>
                            <option value="false">Inactivo</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre del Cargo *</label>
                    <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => handleChange('nombre', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        placeholder="Ej: Gerente Comercial"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Building2 size={12} /> Área
                        </label>
                        <select
                            value={formData.areaId}
                            onChange={(e) => handleChange('areaId', e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        >
                            <option value="">Ninguna (Cargo General)</option>
                            {areas.map(a => (
                                <option key={a.id} value={a.id}>{a.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp size={12} /> Nivel Jerárquico
                        </label>
                        <select
                            value={formData.nivelJerarquico}
                            onChange={(e) => handleChange('nivelJerarquico', parseInt(e.target.value))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        >
                            <option value={1}>1 - Directivo / Ejecutivo</option>
                            <option value={2}>2 - Gerencial</option>
                            <option value={3}>3 - Supervisión</option>
                            <option value={4}>4 - Operativo / Auxiliar</option>
                        </select>
                    </div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <DollarSign size={14} className="text-sri-blue" /> Rangos Salariales Estimados
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Sueldo Mínimo</label>
                            <input
                                type="number"
                                value={formData.sueldoMinimo}
                                onChange={(e) => handleChange('sueldoMinimo', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-600 outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Sueldo Máximo</label>
                            <input
                                type="number"
                                value={formData.sueldoMaximo}
                                onChange={(e) => handleChange('sueldoMaximo', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-600 outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={12} /> Descripción / Funciones
                    </label>
                    <textarea
                        value={formData.descripcion}
                        onChange={(e) => handleChange('descripcion', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all min-h-[80px]"
                        placeholder="Responsabilidades principales del cargo..."
                    />
                </div>
            </div>
        </Modal>
    );
};
