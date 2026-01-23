import { useState } from 'react';
import { DollarSign, Calendar, FileText, Save, ArrowUpCircle, ArrowDownCircle, User, Wallet, AlertCircle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { TipoMovimientoCaja } from '../../domain/types';
import { useCajaChicaMutations } from '../../hooks/useCajaChica';

interface MovimientoCajaModalProps {
    tipo: 'INGRESO' | 'EGRESO';
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const MovimientoCajaModal = ({ tipo, onClose, onSave, empresaId }: MovimientoCajaModalProps) => {
    const { guardarVale, procesando } = useCajaChicaMutations();

    const [monto, setMonto] = useState(0);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [beneficiario, setBeneficiario] = useState('');
    const [concepto, setConcepto] = useState('');
    const [comprobante, setComprobante] = useState('');
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

    const handleGuardar = async () => {
        if (monto <= 0 || !concepto || (tipo === 'EGRESO' && !beneficiario)) {
            setErrorValidacion('Por favor complete los campos obligatorios');
            return;
        }

        try {
            await guardarVale(empresaId, {
                fecha,
                beneficiario: tipo === 'INGRESO' ? 'REPOSICION CAJA' : beneficiario,
                concepto,
                monto,
                tipo: tipo === 'INGRESO' ? TipoMovimientoCaja.INGRESO : TipoMovimientoCaja.EGRESO
            });
            onSave();
            onClose();
        } catch (error) {
            console.error('Error guardando vale:', error);
            setErrorValidacion('Error al guardar el vale');
        }
    };

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={onClose}>
                Cancelar
            </Button>
            <Button
                onClick={handleGuardar}
                disabled={procesando || monto <= 0 || !concepto || (tipo === 'EGRESO' && !beneficiario)}
                className={`flex items-center gap-2 min-w-[180px] justify-center ${tipo === 'INGRESO' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
            >
                {procesando ? (
                    'Guardando...'
                ) : (
                    <>
                        <Save size={18} /> Guardar Movimiento
                    </>
                )}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={tipo === 'INGRESO' ? 'Registrar Ingreso / Reposición' : 'Registrar Gasto / Vale'}
            description="Movimiento de Caja Chica"
            icon={tipo === 'INGRESO' ? <ArrowUpCircle size={24} className="text-emerald-600" /> : <ArrowDownCircle size={24} className="text-rose-600" />}
            footer={footer}
            size="md"
        >
            <div className="space-y-6">
                {errorValidacion && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                        <AlertCircle size={18} />
                        {errorValidacion}
                    </div>
                )}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign size={14} className={tipo === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'} /> Monto *
                        </label>
                        <input
                            type="number"
                            value={monto}
                            onChange={(e) => setMonto(Number(e.target.value))}
                            className={`w-full px-4 py-3 text-xl font-black text-right border-2 rounded-xl outline-none focus:ring-4 transition-all ${tipo === 'INGRESO'
                                ? 'border-emerald-200 text-emerald-700 bg-emerald-50 focus:ring-emerald-500/20'
                                : 'border-rose-200 text-rose-700 bg-rose-50 focus:ring-rose-500/20'
                                }`}
                            min="0"
                            step="0.01"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={14} className="text-sri-blue" /> Fecha *
                        </label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        />
                    </div>
                </div>

                {tipo === 'EGRESO' && (
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <User size={14} className="text-sri-blue" /> Beneficiario *
                        </label>
                        <input
                            type="text"
                            value={beneficiario}
                            onChange={(e) => setBeneficiario(e.target.value)}
                            placeholder="Nombre del beneficiario"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 uppercase outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        />
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Wallet size={14} className="text-sri-blue" /> Concepto / Descripción *
                    </label>
                    <textarea
                        value={concepto}
                        onChange={(e) => setConcepto(e.target.value)}
                        placeholder="Ej: Compra de suministros de limpieza"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all resize-none h-24"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={14} className="text-slate-400" /> Nro. Comprobante (Opcional)
                    </label>
                    <input
                        type="text"
                        value={comprobante}
                        onChange={(e) => setComprobante(e.target.value)}
                        placeholder="Ej: Factura 001-001-12345"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                    />
                </div>
            </div>
        </Modal>
    );
};

