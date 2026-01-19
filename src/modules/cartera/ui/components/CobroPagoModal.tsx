import { useState } from 'react';
import { X, DollarSign, Calendar, CreditCard, Save } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { DocumentoPendiente, TipoCartera } from '../../domain/types';
import { formatMoney } from '@/shared/utils/formatearDinero';

interface CobroPagoModalProps {
    documento: DocumentoPendiente;
    tipo: TipoCartera;
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const CobroPagoModal = ({ documento, tipo, onClose, onSave, empresaId }: CobroPagoModalProps) => {
    const [monto, setMonto] = useState(documento.saldoPendiente);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [formaPago, setFormaPago] = useState('TRANSFERENCIA');
    const [referencia, setReferencia] = useState('');
    const [guardando, setGuardando] = useState(false);

    const handleGuardar = async () => {
        setGuardando(true);
        // Simulate API call using empresaId
        console.log('Procesando transacción para empresa:', empresaId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${tipo === TipoCartera.CXC ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                    <div>
                        <h2 className={`text-lg font-bold flex items-center gap-2 ${tipo === TipoCartera.CXC ? 'text-emerald-800' : 'text-blue-800'}`}>
                            <DollarSign size={20} />
                            {tipo === TipoCartera.CXC ? 'Registrar Cobro' : 'Registrar Pago'}
                        </h2>
                        <p className="text-xs text-slate-500">{documento.terceroNombre} - {documento.nroComprobante}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                        <span className="text-sm text-slate-500">Saldo Pendiente:</span>
                        <span className="text-lg font-bold text-slate-800">{formatMoney(documento.saldoPendiente)}</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Monto a {tipo === TipoCartera.CXC ? 'Cobrar' : 'Pagar'}</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="number"
                                value={monto}
                                onChange={(e) => setMonto(Number(e.target.value))}
                                className="w-full pl-9 pr-4 py-2 text-lg font-bold text-slate-800 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                max={documento.saldoPendiente}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pago</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <select
                                    value={formaPago}
                                    onChange={(e) => setFormaPago(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none appearance-none bg-white"
                                >
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="TARJETA">Tarjeta Crédito/Débito</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Referencia / Nro. Documento</label>
                        <input
                            type="text"
                            value={referencia}
                            onChange={(e) => setReferencia(e.target.value)}
                            placeholder="Ej: Transferencia #123456"
                            className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleGuardar} disabled={guardando || monto <= 0} className={`flex items-center gap-2 ${tipo === TipoCartera.CXC ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        <Save size={18} /> {guardando ? 'Procesando...' : 'Confirmar Transacción'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
