import { useState } from 'react';
import { X, FileText, User, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { formatMoney } from '@/shared/utils/formatearDinero';

interface RolPagoModalProps {
    empleado: {
        id: string;
        nombre: string;
        cargo: string;
        sueldoBase: number;
    };
    periodo: string;
    onClose: () => void;
    onSave: () => void;
}

export const RolPagoModal = ({ empleado, periodo, onClose, onSave }: RolPagoModalProps) => {
    const [ingresos, setIngresos] = useState([
        { concepto: 'Sueldo Base', valor: empleado.sueldoBase },
        { concepto: 'Horas Extras', valor: 0 },
        { concepto: 'Bonificaciones', valor: 0 }
    ]);

    const [egresos, setEgresos] = useState([
        { concepto: 'Aporte IESS (9.45%)', valor: empleado.sueldoBase * 0.0945 },
        { concepto: 'Préstamos Quirografarios', valor: 0 },
        { concepto: 'Anticipos', valor: 0 }
    ]);

    const [guardando, setGuardando] = useState(false);

    const totalIngresos = ingresos.reduce((acc, i) => acc + i.valor, 0);
    const totalEgresos = egresos.reduce((acc, e) => acc + e.valor, 0);
    const netoRecibir = totalIngresos - totalEgresos;

    const handleGuardar = async () => {
        setGuardando(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sri-blue/10 rounded-full flex items-center justify-center text-sri-blue">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">{empleado.nombre}</h2>
                            <p className="text-xs text-slate-500">{empleado.cargo} • Periodo: {periodo}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Ingresos */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h3 className="font-bold text-emerald-700 flex items-center gap-2">
                                <Plus size={18} /> Ingresos
                            </h3>
                            <span className="text-xs font-bold text-slate-400 uppercase">Valor</span>
                        </div>
                        <div className="space-y-3">
                            {ingresos.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center group">
                                    <span className="text-sm text-slate-600">{item.concepto}</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={item.valor}
                                            onChange={(e) => {
                                                const newIngresos = [...ingresos];
                                                newIngresos[idx].valor = Number(e.target.value);
                                                setIngresos(newIngresos);
                                            }}
                                            className="w-24 text-right border-b border-transparent group-hover:border-slate-200 focus:border-sri-blue outline-none text-sm font-medium py-1"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center font-bold text-slate-800">
                            <span>Total Ingresos</span>
                            <span>{formatMoney(totalIngresos)}</span>
                        </div>
                    </div>

                    {/* Egresos */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h3 className="font-bold text-rose-700 flex items-center gap-2">
                                <Trash2 size={18} /> Egresos / Descuentos
                            </h3>
                            <span className="text-xs font-bold text-slate-400 uppercase">Valor</span>
                        </div>
                        <div className="space-y-3">
                            {egresos.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center group">
                                    <span className="text-sm text-slate-600">{item.concepto}</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={item.valor}
                                            onChange={(e) => {
                                                const newEgresos = [...egresos];
                                                newEgresos[idx].valor = Number(e.target.value);
                                                setEgresos(newEgresos);
                                            }}
                                            className="w-24 text-right border-b border-transparent group-hover:border-slate-200 focus:border-sri-blue outline-none text-sm font-medium py-1"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center font-bold text-slate-800">
                            <span>Total Egresos</span>
                            <span>{formatMoney(totalEgresos)}</span>
                        </div>
                    </div>

                    {/* Resumen Final */}
                    <div className="md:col-span-2 bg-sri-blue/5 rounded-2xl p-6 border border-sri-blue/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <p className="text-sm text-sri-blue font-medium uppercase tracking-wider">Neto a Recibir</p>
                            <h3 className="text-3xl font-black text-sri-blue">{formatMoney(netoRecibir)}</h3>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" className="flex items-center gap-2">
                                <FileText size={18} /> Previsualizar PDF
                            </Button>
                            <Button onClick={handleGuardar} disabled={guardando} className="flex items-center gap-2 shadow-lg shadow-sri-blue/20">
                                <Save size={18} /> {guardando ? 'Generando...' : 'Generar Rol de Pago'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
