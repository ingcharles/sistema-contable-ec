import { useState } from 'react';
import { Box, Calendar, DollarSign, Save, Hash, Clock, Package } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';

interface ActivoFijoModalProps {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const ActivoFijoModal = ({ onClose, onSave, empresaId }: ActivoFijoModalProps) => {
    const [nombre, setNombre] = useState('');
    const [codigo, setCodigo] = useState('');
    const [fechaAdquisicion, setFechaAdquisicion] = useState(new Date().toISOString().split('T')[0]);
    const [valorOriginal, setValorOriginal] = useState(0);
    const [vidaUtil, setVidaUtil] = useState(10);
    const [valorResidual, setValorResidual] = useState(0);
    const [guardando, setGuardando] = useState(false);

    const handleGuardar = async () => {
        setGuardando(true);
        console.log('Guardando activo para empresa:', empresaId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        onSave();
        onClose();
    };

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={onClose}>
                Cancelar
            </Button>
            <Button
                onClick={handleGuardar}
                disabled={guardando || !nombre || valorOriginal <= 0}
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 min-w-[160px] justify-center"
            >
                {guardando ? (
                    'Guardando...'
                ) : (
                    <>
                        <Save size={18} /> Guardar Activo
                    </>
                )}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Registrar Nuevo Activo Fijo"
            description="Ingreso de bienes para control y depreciación."
            icon={<Box size={24} className="text-indigo-600" />}
            footer={footer}
            size="lg"
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Package size={14} className="text-sri-blue" /> Nombre del Activo *
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Laptop Dell XPS 15"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 uppercase outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Hash size={14} className="text-sri-blue" /> Código / Serie *
                        </label>
                        <input
                            type="text"
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value)}
                            placeholder="Ej: ACT-001"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-700 uppercase outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={14} className="text-sri-blue" /> Fecha de Adquisición *
                        </label>
                        <input
                            type="date"
                            value={fechaAdquisicion}
                            onChange={(e) => setFechaAdquisicion(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign size={14} className="text-emerald-600" /> Valor de Adquisición *
                        </label>
                        <input
                            type="number"
                            value={valorOriginal}
                            onChange={(e) => setValorOriginal(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-mono font-bold text-emerald-700 text-right outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign size={14} className="text-slate-400" /> Valor Residual (Salvamento)
                        </label>
                        <input
                            type="number"
                            value={valorResidual}
                            onChange={(e) => setValorResidual(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium text-slate-600 text-right outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Clock size={14} className="text-indigo-600" /> Vida Útil (Años) *
                        </label>
                        <input
                            type="number"
                            value={vidaUtil}
                            onChange={(e) => setVidaUtil(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-black text-indigo-700 text-center outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            min="1"
                        />
                    </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-700 uppercase tracking-wider">Depreciación Anual Estimada:</span>
                        <span className="font-mono font-black text-indigo-900">
                            ${vidaUtil > 0 ? ((valorOriginal - valorResidual) / vidaUtil).toFixed(2) : '0.00'}
                        </span>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
