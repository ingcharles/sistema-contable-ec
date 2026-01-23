'use client';

import { useState } from 'react';
import { Calculator, FileText, Save, AlertCircle, TrendingUp, TrendingDown, ReceiptText } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { formatMoney } from '@/shared/utils/formatearDinero';

interface DeclaracionModalProps {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const DeclaracionModal = ({ onClose, onSave, empresaId }: DeclaracionModalProps) => {
    const [tipoFormulario, setTipoFormulario] = useState<'104' | '103'>('104');
    const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [calculando, setCalculando] = useState(false);
    const [valores, setValores] = useState<{ ventas: number, compras: number, impuesto: number, saldo: number } | null>(null);

    const handleCalcular = async () => {
        setCalculando(true);
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (tipoFormulario === '104') {
            setValores({
                ventas: 12500.00,
                compras: 8400.00,
                impuesto: 1500.00,
                saldo: 492.00
            });
        } else {
            setValores({
                ventas: 12500.00,
                compras: 8400.00,
                impuesto: 125.00,
                saldo: 125.00
            });
        }
        setCalculando(false);
    };

    const handleGuardar = async () => {
        console.log(`Guardando declaración ${tipoFormulario} para empresa:`, empresaId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        onSave();
        onClose();
    };

    const footer = (
    const footer = (
            <ModalFooter
                onCancel={onClose}
                onSubmit={handleGuardar}
                isDisabled={!valores}
                submitLabel="Guardar Declaración"
                submitIcon={<Save size={18} />}
            />
        );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Nueva Declaración"
            description="Procese sus impuestos locales basándose en los registros contables del periodo."
            icon={<Calculator size={24} />}
            footer={footer}
            size="lg"
        >
            <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            Formulario del SRI
                        </label>
                        <select
                            value={tipoFormulario}
                            onChange={(e) => { setTipoFormulario(e.target.value as any); setValores(null); }}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-sri-blue focus:ring-4 focus:ring-sri-blue/10 outline-none transition-all"
                        >
                            <option value="104">Formulario 104 - IVA Mensual</option>
                            <option value="103">Formulario 103 - Retenciones Fuente</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            Periodo Fiscal (Mes/Año)
                        </label>
                        <input
                            type="month"
                            value={periodo}
                            onChange={(e) => { setPeriodo(e.target.value); setValores(null); }}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:ring-4 focus:ring-sri-blue/10 outline-none transition-all"
                        />
                    </div>
                </div>

                {!valores ? (
                    <div className="py-12 px-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-sri-blue/5 rounded-2xl flex items-center justify-center mx-auto text-sri-blue animate-pulse">
                            <Calculator size={32} />
                        </div>
                        <div className="max-w-xs mx-auto space-y-2">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Analítico Contable</h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                El sistema consolidará automáticamente sus comprobantes electrónicos y asientos contables para este periodo.
                            </p>
                        </div>
                        <Button
                            onClick={handleCalcular}
                            disabled={calculando}
                            className="flex items-center gap-2 mx-auto min-w-[200px] justify-center"
                        >
                            {calculando ? (
                                'Consolidando Datos...'
                            ) : (
                                <>
                                    <ReceiptText size={18} /> Procesar Borrador
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
                            <div className="bg-sri-blue/5 px-6 py-3 border-b border-slate-100">
                                <h3 className="text-[10px] font-black text-sri-blue uppercase tracking-[0.2em]">Resumen de Valores Calculados</h3>
                            </div>
                            <div className="p-6 grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                                                <TrendingUp size={16} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Ventas Netas</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-700">{formatMoney(valores.ventas)}</span>
                                    </div>
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                                                <TrendingDown size={16} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Compras Netas</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-700">{formatMoney(valores.compras)}</span>
                                    </div>
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 text-slate-500 rounded-lg group-hover:scale-110 transition-transform">
                                                <FileText size={16} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                                                {tipoFormulario === '104' ? 'IVA Generado' : 'Retenciones'}
                                            </span>
                                        </div>
                                        <span className="text-sm font-black text-slate-700">{formatMoney(valores.impuesto)}</span>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-6 flex flex-col justify-center items-center border border-slate-100 space-y-2">
                                    <span className="text-[10px] font-black text-sri-blue uppercase tracking-widest">Saldo a Liquidar</span>
                                    <div className="text-4xl font-black text-sri-blue tracking-tighter">
                                        {formatMoney(valores.saldo)}
                                    </div>
                                    <div className="px-2 py-1 bg-sri-blue/10 rounded text-[9px] font-bold text-sri-blue uppercase">
                                        Impuesto {tipoFormulario === '104' ? 'IVA' : 'Renta'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-5 bg-amber-50/50 rounded-2xl border border-amber-100 shadow-sm shadow-amber-500/5">
                            <div className="p-2 bg-amber-500 text-white rounded-lg shadow-lg shadow-amber-500/20">
                                <AlertCircle size={20} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-[11px] font-black text-amber-800 uppercase tracking-wide">Validación Requerida</h4>
                                <p className="text-[10px] text-amber-700/80 font-medium leading-relaxed">
                                    Este cálculo preliminar se genera basándose exclusivamente en los registros digitales.
                                    Asegúrese de cruzar esta información con su libro diario antes de formalizar la declaración ante el SRI.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
