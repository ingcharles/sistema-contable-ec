import { useState, useEffect } from 'react';
import { Save, FileText, Calendar, AlertCircle, Info } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { TipoContratoEntity } from '@/modules/rrhh/domain/types';
import { RRHHUseCases } from '@/modules/rrhh/application/useCases/RRHHUseCases';

interface TipoContratoModalProps {
    tipo?: TipoContratoEntity;
    onClose: () => void;
    onSave: () => void;
}

export const TipoContratoModal = ({ tipo, onClose, onSave }: TipoContratoModalProps) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<TipoContratoEntity>>({
        codigo: '',
        nombre: '',
        descripcion: '',
        requiereFechaFin: false,
        activo: true
    });

    useEffect(() => {
        if (tipo) {
            setFormData(tipo);
        }
    }, [tipo]);

    const handleChange = (field: keyof TipoContratoEntity, value: any) => {
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
            const success = await RRHHUseCases.guardarTipoContrato(formData);
            if (success) {
                onSave();
                onClose();
            } else {
                setError('Error al guardar el tipo de contrato');
            }
        } catch (err: any) {
            setError(err.message || 'Error al guardar el tipo de contrato');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleSave}
            isLoading={loading}
            submitLabel="Guardar"
            submitIcon={<Save size={18} />}
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={tipo ? 'Editar Tipo de Contrato' : 'Nuevo Tipo de Contrato'}
            description="Configure las modalidades de contratación de su empresa."
            icon={<FileText size={24} className="text-sri-blue" />}
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
                            placeholder="EJ: INDEFINIDO"
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre del Contrato *</label>
                    <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => handleChange('nombre', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        placeholder="Ej: Contrato Indefinido de Trabajo"
                    />
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Calendar size={20} className="text-sri-blue" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">Requiere Fecha de Finalización</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.requiereFechaFin}
                                    onChange={(e) => handleChange('requiereFechaFin', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sri-blue"></div>
                            </label>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                            Active esta opción para contratos con plazo definido (eventuales, temporales, etc.)
                        </p>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Info size={12} /> Descripción / Notas Legales
                    </label>
                    <textarea
                        value={formData.descripcion}
                        onChange={(e) => handleChange('descripcion', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all min-h-[80px]"
                        placeholder="Información adicional sobre este tipo de contrato..."
                    />
                </div>
            </div>
        </Modal>
    );
};
