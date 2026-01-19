import { useState } from 'react';
import { X, Box, Calendar, DollarSign, Save, Hash, Clock } from 'lucide-react';
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
        // Simulate API call using empresaId
        console.log('Guardando activo para empresa:', empresaId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                            <Box size={20} />
                            Registrar Nuevo Activo Fijo
                        </h2>
                        <p className="text-xs text-indigo-600">Ingreso de bienes para control y depreciación.</p>
                    </div>
                    <button onClick={onClose} className="text-indigo-400 hover:text-indigo-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Activo</label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ej: Laptop Dell XPS 15"
                                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Código / Serie</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value)}
                                    placeholder="Ej: ACT-001"
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Adquisición</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="date"
                                    value={fechaAdquisicion}
                                    onChange={(e) => setFechaAdquisicion(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Valor de Adquisición</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="number"
                                    value={valorOriginal}
                                    onChange={(e) => setValorOriginal(Number(e.target.value))}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Valor Residual (Salvamento)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="number"
                                    value={valorResidual}
                                    onChange={(e) => setValorResidual(Number(e.target.value))}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Vida Útil (Años)</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="number"
                                    value={vidaUtil}
                                    onChange={(e) => setVidaUtil(Number(e.target.value))}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                    min="1"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleGuardar} disabled={guardando || !nombre || valorOriginal <= 0} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
                        <Save size={18} /> {guardando ? 'Guardando...' : 'Guardar Activo'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
