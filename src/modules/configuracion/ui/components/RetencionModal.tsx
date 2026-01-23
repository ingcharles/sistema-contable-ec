'use client';

import { useState } from 'react';
import { Save, ShieldCheck, AlertCircle } from 'lucide-react';
import { CodigoRetencion } from '../../domain/types';
import { ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';

interface RetencionModalProps {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
    retencionEditar?: CodigoRetencion;
}

export const RetencionModal = ({ onClose, onSave, empresaId, retencionEditar }: RetencionModalProps) => {
    const [formData, setFormData] = useState<Partial<CodigoRetencion>>(retencionEditar || {
        codigo: '',
        concepto: '',
        porcentaje: 0,
        tipo: 'RENTA',
        activo: true
    });

    const [guardando, setGuardando] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

    const handleChange = (field: keyof CodigoRetencion, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errorValidacion) setErrorValidacion(null);
    };

    const handleSubmit = async () => {
        if (!formData.codigo || !formData.concepto) {
            setErrorValidacion('Complete los campos obligatorios (Código y Concepto)');
            return;
        }

        setGuardando(true);
        setErrorValidacion(null);
        try {
            await ConfiguracionUseCases.guardarRetencion({
                ...formData,
                id: retencionEditar?.id,
                empresaId
            });
            onSave();
            onClose();
        } catch (error: any) {
            console.error(error);
            setErrorValidacion(error.message || 'Error al guardar la retención');
        } finally {
            setGuardando(false);
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleSubmit}
            isLoading={guardando}
            submitLabel={retencionEditar ? 'Actualizar Retención' : 'Guardar Retención'}
            submitIcon={<Save size={18} />}
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={retencionEditar ? 'Editar Retención' : 'Nueva Retención'}
            description="Configure los códigos de retención autorizados por el SRI."
            icon={<ShieldCheck size={24} />}
            footer={footer}
            size="md"
        >
            <div className="space-y-6">
                {errorValidacion && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-sm font-medium">{errorValidacion}</p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Impuesto</label>
                    <select
                        value={formData.tipo}
                        onChange={e => handleChange('tipo', e.target.value as 'RENTA' | 'IVA')}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium"
                    >
                        <option value="RENTA">Impuesto a la Renta</option>
                        <option value="IVA">IVA</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Código SRI</label>
                        <input
                            type="text"
                            value={formData.codigo}
                            onChange={e => handleChange('codigo', e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-mono font-bold text-sri-blue"
                            placeholder="Ej: 312"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Porcentaje %</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={formData.porcentaje}
                                onChange={e => handleChange('porcentaje', Number(e.target.value))}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-bold pr-10"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Concepto de Retención</label>
                    <textarea
                        value={formData.concepto}
                        onChange={e => handleChange('concepto', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all h-32 resize-none"
                        placeholder="Descripción detallada del concepto..."
                    />
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={formData.activo}
                        onChange={e => handleChange('activo', e.target.checked)}
                        className="w-5 h-5 rounded-lg border-slate-300 text-sri-blue focus:ring-sri-blue/20"
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-sri-blue transition-colors">Este registro se encuentra activo</span>
                </label>
            </div>
        </Modal>
    );
};
