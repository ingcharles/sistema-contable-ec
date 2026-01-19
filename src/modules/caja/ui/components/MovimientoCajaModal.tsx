import { useState } from 'react';
import { X, DollarSign, Calendar, FileText, Save, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

interface MovimientoCajaModalProps {
    tipo: 'INGRESO' | 'EGRESO';
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const MovimientoCajaModal = ({ tipo, onClose, onSave, empresaId }: MovimientoCajaModalProps) => {
    const [monto, setMonto] = useState(0);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [concepto, setConcepto] = useState('');
    const [comprobante, setComprobante] = useState('');
    const [guardando, setGuardando] = useState(false);

    const handleGuardar = async () => {
        setGuardando(true);
        // Simulate API call using empresaId
        console.log('Guardando movimiento para empresa:', empresaId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${tipo === 'INGRESO' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    <div>
                        <h2 className={`text-lg font-bold flex items-center gap-2 ${tipo === 'INGRESO' ? 'text-emerald-800' : 'text-rose-800'}`}>
                            {tipo === 'INGRESO' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                            {tipo === 'INGRESO' ? 'Registrar Ingreso' : 'Registrar Gasto'}
                        </h2>
                        <p className="text-xs text-slate-500">Movimiento de Caja Chica</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="number"
                                value={monto}
                                onChange={(e) => setMonto(Number(e.target.value))}
                                className="w-full pl-9 pr-4 py-2 text-lg font-bold text-slate-800 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                min="0"
                                step="0.01"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Concepto / Descripción</label>
                        <textarea
                            value={concepto}
                            onChange={(e) => setConcepto(e.target.value)}
                            placeholder="Ej: Compra de suministros de limpieza"
                            className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none resize-none h-20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nro. Comprobante (Opcional)</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={comprobante}
                                onChange={(e) => setComprobante(e.target.value)}
                                placeholder="Ej: Factura 001-001-12345"
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleGuardar} disabled={guardando || monto <= 0 || !concepto} className={`flex items-center gap-2 ${tipo === 'INGRESO' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                        <Save size={18} /> {guardando ? 'Guardando...' : 'Guardar Movimiento'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
