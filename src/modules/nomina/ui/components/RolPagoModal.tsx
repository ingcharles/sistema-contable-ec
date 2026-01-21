import { useState } from 'react';
import { FileText, Save, Plus, Minus, Receipt } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
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

    const footer = (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full bg-sri-blue/5 -m-6 p-6 border-t border-sri-blue/10 rounded-b-2xl">
            <div className="space-y-1">
                <p className="text-[10px] font-black text-sri-blue uppercase tracking-[0.2em]">Neto a Recibir</p>
                <h3 className="text-4xl font-black text-sri-blue tracking-tighter">{formatMoney(netoRecibir)}</h3>
            </div>
            <div className="flex gap-3">
                <Button variant="secondary" className="flex items-center gap-2">
                    <FileText size={18} /> Previsualizar PDF
                </Button>
                <Button
                    onClick={handleGuardar}
                    disabled={guardando}
                    className="flex items-center gap-2 min-w-[180px] justify-center shadow-lg shadow-sri-blue/20"
                >
                    {guardando ? (
                        'Generando...'
                    ) : (
                        <>
                            <Save size={18} /> Generar Rol de Pago
                        </>
                    )}
                </Button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={empleado.nombre}
            description={`${empleado.cargo} • Periodo: ${periodo}`}
            icon={<Receipt size={24} />}
            footer={footer}
            size="xl"
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Ingresos */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b-2 border-emerald-100">
                            <div className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/20">
                                <Plus size={16} />
                            </div>
                            <h3 className="text-sm font-black text-emerald-700 uppercase tracking-wider">Ingresos</h3>
                        </div>
                        <div className="space-y-3">
                            {ingresos.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center group p-2 rounded-lg hover:bg-emerald-50/50 transition-colors">
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{item.concepto}</span>
                                    <input
                                        type="number"
                                        value={item.valor}
                                        onChange={(e) => {
                                            const newIngresos = [...ingresos];
                                            newIngresos[idx].valor = Number(e.target.value);
                                            setIngresos(newIngresos);
                                        }}
                                        className="w-28 text-right px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-sm text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t-2 border-emerald-100 flex justify-between items-center">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Total Ingresos</span>
                            <span className="text-lg font-black text-emerald-600">{formatMoney(totalIngresos)}</span>
                        </div>
                    </div>

                    {/* Egresos */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b-2 border-rose-100">
                            <div className="p-1.5 bg-rose-500 text-white rounded-lg shadow-lg shadow-rose-500/20">
                                <Minus size={16} />
                            </div>
                            <h3 className="text-sm font-black text-rose-700 uppercase tracking-wider">Egresos / Descuentos</h3>
                        </div>
                        <div className="space-y-3">
                            {egresos.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center group p-2 rounded-lg hover:bg-rose-50/50 transition-colors">
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{item.concepto}</span>
                                    <input
                                        type="number"
                                        value={item.valor}
                                        onChange={(e) => {
                                            const newEgresos = [...egresos];
                                            newEgresos[idx].valor = Number(e.target.value);
                                            setEgresos(newEgresos);
                                        }}
                                        className="w-28 text-right px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-sm text-rose-600 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t-2 border-rose-100 flex justify-between items-center">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Total Egresos</span>
                            <span className="text-lg font-black text-rose-600">{formatMoney(totalEgresos)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
