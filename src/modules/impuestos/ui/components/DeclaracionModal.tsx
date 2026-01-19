import { useState } from 'react';
import { X, Calculator, FileText, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
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
        // Simulate calculation delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock values based on form type
        if (tipoFormulario === '104') {
            setValores({
                ventas: 12500.00,
                compras: 8400.00,
                impuesto: 1500.00, // IVA Generado
                saldo: 492.00 // A pagar (ejemplo)
            });
        } else {
            setValores({
                ventas: 12500.00,
                compras: 8400.00,
                impuesto: 125.00, // Retenciones
                saldo: 125.00
            });
        }
        setCalculando(false);
    };

    const handleGuardar = async () => {
        // Simulate save using empresaId
        console.log(`Guardando declaración ${tipoFormulario} para empresa:`, empresaId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Calculator size={20} className="text-sri-blue" />
                            Nueva Declaración de Impuestos
                        </h2>
                        <p className="text-xs text-slate-500">Generación de formularios 103 y 104 en línea.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Formulario</label>
                            <select
                                value={tipoFormulario}
                                onChange={(e) => { setTipoFormulario(e.target.value as any); setValores(null); }}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                            >
                                <option value="104">Formulario 104 - IVA Mensual</option>
                                <option value="103">Formulario 103 - Retenciones en la Fuente</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Periodo Fiscal</label>
                            <input
                                type="month"
                                value={periodo}
                                onChange={(e) => { setPeriodo(e.target.value); setValores(null); }}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                            />
                        </div>
                    </div>

                    {!valores ? (
                        <div className="bg-slate-50 rounded-xl p-8 text-center border border-dashed border-slate-200">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-sri-blue">
                                <Calculator size={24} />
                            </div>
                            <h3 className="font-medium text-slate-700 mb-1">Listo para calcular</h3>
                            <p className="text-sm text-slate-500 mb-4 max-w-xs mx-auto">
                                El sistema analizará todos los comprobantes electrónicos emitidos y recibidos en el periodo seleccionado.
                            </p>
                            <Button onClick={handleCalcular} disabled={calculando} className="min-w-[150px]">
                                {calculando ? 'Procesando...' : 'Calcular Valores'}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <FileText size={18} className="text-sri-blue" />
                                    Resumen del Cálculo
                                </h3>
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                    <div className="text-slate-600">Total Ventas Netas:</div>
                                    <div className="text-right font-medium">{formatMoney(valores.ventas)}</div>

                                    <div className="text-slate-600">Total Compras Netas:</div>
                                    <div className="text-right font-medium">{formatMoney(valores.compras)}</div>

                                    <div className="text-slate-600">{tipoFormulario === '104' ? 'IVA Generado:' : 'Retenciones Generadas:'}</div>
                                    <div className="text-right font-medium">{formatMoney(valores.impuesto)}</div>

                                    <div className="col-span-2 border-t border-blue-200 my-2"></div>

                                    <div className="font-bold text-slate-800">Saldo a Pagar:</div>
                                    <div className="text-right font-bold text-sri-blue text-lg">{formatMoney(valores.saldo)}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-amber-50 text-amber-800 rounded-lg text-xs border border-amber-100">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <p>
                                    Este es un cálculo preliminar basado en los registros del sistema.
                                    Verifique la información con sus documentos físicos antes de enviar al SRI.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleGuardar} disabled={!valores} className="flex items-center gap-2">
                        <Save size={18} /> Guardar Declaración
                    </Button>
                </div>
            </div>
        </div>
    );
};
