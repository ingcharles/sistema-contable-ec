import React, { useState, useEffect } from 'react';
import { Save, Target, Hash, Type, Layers } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { CentroCosto } from '@/modules/contabilidad/domain/types';

interface Props {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
    centroCosto?: CentroCosto | null;
}

export const CentroCostoModal: React.FC<Props> = ({ onClose, onSave, empresaId, centroCosto }) => {
    const [nombre, setNombre] = useState('');
    const [codigo, setCodigo] = useState('');
    const [nivel, setNivel] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (centroCosto) {
            setNombre(centroCosto.nombre);
            setCodigo(centroCosto.codigo);
            setNivel(centroCosto.nivel);
        } else {
            setNombre('');
            setCodigo('');
            setNivel(1);
        }
    }, [centroCosto]);

    const handleSave = async () => {
        if (!nombre || !codigo) return;
        setLoading(true);
        try {
            const data = {
                id: centroCosto?.id,
                empresaId,
                codigo,
                nombre,
                nivel,
                activo: true
            };

            if (centroCosto) {
                await ContabilidadUseCases.actualizarCentroCosto(data);
            } else {
                await ContabilidadUseCases.guardarCentroCosto(data);
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Error al guardar centro de costo:', error);
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleSave}
            isDisabled={!nombre || !codigo || loading}
            submitLabel={centroCosto ? "Actualizar Centro" : "Guardar Centro"}
            submitIcon={<Save size={18} />}
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={centroCosto ? "Editar Centro de Costo" : "Nuevo Centro de Costo"}
            description="Gestione las unidades de negocio para segmentar gastos e ingresos."
            icon={<Target size={24} />}
            footer={footer}
            size="sm"
        >
            <div className="space-y-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Hash size={14} className="text-sri-blue" /> Código *
                    </label>
                    <input
                        type="text"
                        value={codigo}
                        onChange={e => setCodigo(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sri-blue outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        placeholder="Ej: 10.01"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Type size={14} className="text-sri-blue" /> Nombre del Centro *
                    </label>
                    <input
                        type="text"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 uppercase outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        placeholder="Ej: SUCURSAL NORTE"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Layers size={14} className="text-sri-blue" /> Nivel Jerárquico
                    </label>
                    <select
                        value={nivel}
                        onChange={e => setNivel(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                    >
                        <option value="1">1 - Centro Principal</option>
                        <option value="2">2 - Sub-centro</option>
                    </select>
                </div>
            </div>
        </Modal>
    );
};
