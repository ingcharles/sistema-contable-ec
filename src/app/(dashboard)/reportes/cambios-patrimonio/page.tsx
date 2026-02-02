'use client';

import { useState, useEffect } from 'react';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';
import { Calendar, Download, Printer, Filter, Layers } from 'lucide-react';
import { formatMoney } from '@/shared/utils/formatearDinero';

export default function CambiosPatrimonioPage() {
    const [desde, setDesde] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
    const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await ContabilidadUseCases.obtenerCambiosPatrimonio(desde, hasta);
            setData(Array.isArray(res) ? res : []);
        } catch (error) {
            console.error('Error al cargar cambios patrimonio:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="space-y-10 p-10 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-800 tracking-tighter mb-2">Estado de Cambios en el Patrimonio</h1>
                    <p className="text-slate-500 font-bold flex items-center gap-2 uppercase tracking-widest text-[10px]">
                        <Layers className="text-indigo-500" size={16} />
                        Evolución de las cuentas patrimoniales
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white p-3 rounded-[28px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 px-4 border-r border-slate-100">
                        <Calendar size={18} className="text-indigo-500" />
                        <input
                            type="date"
                            value={desde}
                            onChange={(e) => setDesde(e.target.value)}
                            className="text-sm font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0"
                        />
                    </div>
                    <div className="flex items-center gap-2 px-4">
                        <Calendar size={18} className="text-indigo-500" />
                        <input
                            type="date"
                            value={hasta}
                            onChange={(e) => setHasta(e.target.value)}
                            className="text-sm font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0"
                        />
                    </div>
                    <Button onClick={loadData} isLoading={loading} className="h-12 w-12 p-0 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100">
                        <Filter size={20} />
                    </Button>
                </div>
            </div>

            {/* Report Table */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-indigo-100/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white font-black uppercase tracking-widest text-[11px]">
                                <th className="px-8 py-6 text-left border-r border-white/5">Concepto</th>
                                <th className="px-8 py-6 text-right border-r border-white/5">Capital Social</th>
                                <th className="px-8 py-6 text-right border-r border-white/5">Reservas</th>
                                <th className="px-8 py-6 text-right border-r border-white/5">Resul. Acumulados</th>
                                <th className="px-8 py-6 text-right bg-indigo-600">Total Patrimonio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map((row, idx) => (
                                <tr key={idx} className={`group ${idx === 0 || idx === data.length - 1 ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}>
                                    <td className={`px-8 py-6 border-r border-slate-50 ${idx === 0 || idx === data.length - 1 ? 'font-black text-slate-800' : 'font-bold text-slate-600'}`}>
                                        {row.concepto}
                                    </td>
                                    <td className="px-8 py-6 text-right border-r border-slate-50 font-medium text-slate-700">
                                        {formatMoney(row.capital)}
                                    </td>
                                    <td className="px-8 py-6 text-right border-r border-slate-50 font-medium text-slate-700">
                                        {formatMoney(row.reservas)}
                                    </td>
                                    <td className="px-8 py-6 text-right border-r border-slate-50 font-medium text-slate-700">
                                        {formatMoney(row.resultadosAcumulados)}
                                    </td>
                                    <td className={`px-8 py-6 text-right ${idx === 0 || idx === data.length - 1 ? 'font-black text-indigo-700 bg-indigo-50/30' : 'font-black text-slate-900'}`}>
                                        {formatMoney(row.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legend / Info */}
            <div className="p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-100/50 text-indigo-900 max-w-2xl">
                <h4 className="font-black mb-2 flex items-center gap-2 uppercase tracking-widest text-xs">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    Notas al Estado Financiero
                </h4>
                <p className="text-sm font-medium leading-relaxed opacity-70">
                    Este reporte refleja las variaciones patrimoniales originadas durante el periodo seleccionado,
                    incluyendo aportes de capital, constitución de reservas legal y estatutaria, y la distribución o acumulación
                    del resultado neto del ejercicio.
                </p>
            </div>

            {/* Floating Actions */}
            <div className="fixed bottom-10 right-10 flex gap-4">
                <Button variant="secondary" className="h-16 px-10 rounded-2xl bg-white border-slate-200 text-slate-800 font-black shadow-2xl gap-3 hover:scale-105 transition-transform">
                    <Printer size={20} />
                    Imprimir
                </Button>
                <Button className="h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-2xl gap-3 shadow-indigo-200 hover:scale-105 transition-transform">
                    <Download size={20} />
                    Descargar Excel
                </Button>
            </div>
        </div>
    );
}
