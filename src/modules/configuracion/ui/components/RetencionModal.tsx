'use client';

import { useState } from 'react';
import { Save, ShieldCheck } from 'lucide-react';
import { CodigoRetencion } from '../../domain/types';
import { ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

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

    const handleSubmit = async () => {
        if (!formData.codigo || !formData.concepto) {
            alert('Complete los campos obligatorios');
            return;
        }

        setGuardando(true);
        try {
            await ConfiguracionUseCases.guardarRetencion({
                ...formData,
                id: retencionEditar?.id,
                empresaId
            });
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al guardar la retención');
        } finally {
            setGuardando(false);
        }
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose} disabled={guardando}>Cancelar</Button>
            <Button onClick={handleSubmit} className="flex items-center gap-2" disabled={guardando}>
                {guardando ? (
                    <>Guardando...</>
                ) : (
                    <>
                        <Save size={18} /> {retencionEditar ? 'Actualizar Retención' : 'Guardar Retención'}
                    </>
                )}
            </Button>
        </>
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
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Impuesto</label>
                    <select
                        value={formData.tipo}
                        onChange={e => setFormData({ ...formData, tipo: e.target.value as 'RENTA' | 'IVA' })}
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
                            onChange={e => setFormData({ ...formData, codigo: e.target.value })}
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
                                onChange={e => setFormData({ ...formData, porcentaje: Number(e.target.value) })}
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
                        onChange={e => setFormData({ ...formData, concepto: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all h-32 resize-none"
                        placeholder="Descripción detallada del concepto..."
                    />
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={formData.activo}
                        onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                        className="w-5 h-5 rounded-lg border-slate-300 text-sri-blue focus:ring-sri-blue/20"
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-sri-blue transition-colors">Este registro se encuentra activo</span>
                </label>
            </div>
        </Modal>
    );
};
