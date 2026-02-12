'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Calendar, Filter, Layers, LayoutGrid } from 'lucide-react';
import { CuentaSelect } from './CuentaSelect';

interface FinancialFilterValues {
    desde?: string;
    hasta?: string;
    fechaCorte?: string;
    cuentaCodigo?: string;
    centroCostoId?: string;
    nivel?: number;
}

interface FinancialReportFilterProps {
    initialValues?: FinancialFilterValues;
    showRange?: boolean;
    showCutoff?: boolean;
    showAccount?: boolean;
    showCostCenter?: boolean;
    showLevel?: boolean;
    onFilter: (values: FinancialFilterValues) => void;
    isLoading?: boolean;
}

/**
 * Componente genérico de filtrado para reportes financieros con estética premium.
 */
export function FinancialReportFilter({
    initialValues,
    showRange = true,
    showCutoff = false,
    showAccount = false,
    showCostCenter = false,
    showLevel = false,
    onFilter,
    isLoading = false
}: FinancialReportFilterProps) {
    const [values, setValues] = useState<FinancialFilterValues>({
        desde: initialValues?.desde || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        hasta: initialValues?.hasta || new Date().toISOString().split('T')[0],
        fechaCorte: initialValues?.fechaCorte || new Date().toISOString().split('T')[0],
        cuentaCodigo: initialValues?.cuentaCodigo || '',
        centroCostoId: initialValues?.centroCostoId || '',
        nivel: initialValues?.nivel || 4,
        ...initialValues
    });

    const handleChange = (field: keyof FinancialFilterValues, value: any) => {
        setValues(prev => ({ ...prev, [field]: value }));
    };

    const handleApply = () => {
        onFilter(values);
    };

    return (
        <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-wrap items-center gap-4 transition-all hover:shadow-md">
            {showRange && (
                <>
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all group">
                        <Calendar size={18} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Desde</span>
                            <input
                                type="date"
                                value={values.desde}
                                onChange={(e) => handleChange('desde', e.target.value)}
                                className="text-sm font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer min-w-[120px]"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all group">
                        <Calendar size={18} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Hasta</span>
                            <input
                                type="date"
                                value={values.hasta}
                                onChange={(e) => handleChange('hasta', e.target.value)}
                                className="text-sm font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer min-w-[120px]"
                            />
                        </div>
                    </div>
                </>
            )}

            {showCutoff && (
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all group">
                    <Calendar size={18} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Fecha de Corte</span>
                        <input
                            type="date"
                            value={values.fechaCorte}
                            onChange={(e) => handleChange('fechaCorte', e.target.value)}
                            className="text-sm font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer min-w-[120px]"
                        />
                    </div>
                </div>
            )}

            {showAccount && (
                <CuentaSelect
                    value={values.cuentaCodigo}
                    onChange={(codigo) => handleChange('cuentaCodigo', codigo)}
                    className="flex-1 min-w-[280px]"
                />
            )}

            {showCostCenter && (
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all group">
                    <LayoutGrid size={18} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Centro Costo</span>
                        <select
                            value={values.centroCostoId}
                            onChange={(e) => handleChange('centroCostoId', e.target.value)}
                            className="text-sm font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer min-w-[140px]"
                        >
                            <option value="">Todos los Centros</option>
                            {/* Aquí se podrían cargar dinámicamente o pasar por props */}
                        </select>
                    </div>
                </div>
            )}

            {showLevel && (
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all group">
                    <Layers size={18} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Nivel</span>
                        <select
                            value={values.nivel}
                            onChange={(e) => handleChange('nivel', parseInt(e.target.value))}
                            className="text-sm font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer w-20"
                        >
                            {[1, 2, 3, 4, 5, 6].map(n => (
                                <option key={n} value={n}>Nivel {n}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <Button
                onClick={handleApply}
                isLoading={isLoading}
                className="ml-auto h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-100 flex items-center gap-2 group transition-all active:scale-95"
            >
                <Filter size={20} className="group-hover:rotate-12 transition-transform" />
                <span>Refrescar Reporte</span>
            </Button>
        </div>
    );
}
