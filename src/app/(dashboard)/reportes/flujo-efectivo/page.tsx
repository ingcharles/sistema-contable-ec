'use client';

import { useState, useEffect } from 'react';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';
import { Calendar, Download, Printer, Filter, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { formatMoney } from '@/shared/utils/formatearDinero';

export default function FlujoEfectivoPage() {
    const [desde, setDesde] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
    const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await ContabilidadUseCases.obtenerFlujoEfectivo(desde, hasta);
            setData(res);
        } catch (error) {
            console.error('Error al cargar flujo de efectivo:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (!data && loading) return <div className="p-12 text-center text-slate-500">Cargando reporte...</div>;

    const renderSection = (title: string, items: any[], color: string) => (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
            <div className={`px-8 py-5 flex items-center justify-between border-b border-slate-50 ${color}`}>
                <h3 className="text-sm font-black uppercase tracking-widest text-white">{title}</h3>
                <span className="text-white/80 font-bold text-xs">Subtotal Actividad</span>
            </div>
            <div className="divide-y divide-slate-50">
                {items.map((item, idx) => (
                    <div key={idx} className="px-8 py-4 flex justify-between items-center group hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl ${item.monto >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {item.monto >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                            </div>
                            <span className="font-bold text-slate-700">{item.concepto}</span>
                        </div>
                        <span className={`font-black text-lg ${item.monto >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {formatMoney(item.monto)}
                        </span>
                    </div>
                ))}
            </div>
            <div className="bg-slate-50/50 px-8 py-4 flex justify-between items-center">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Neto Sección</span>
                <span className="text-xl font-black text-slate-800">
                    {formatMoney(items.reduce((acc, i) => acc + i.monto, 0))}
                </span>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 p-8 pb-32">
            {/* Header / Filtros */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-800 tracking-tighter mb-2">Flujo de Efectivo</h1>
                    <p className="text-slate-500 font-bold flex items-center gap-2">
                        <Wallet className="text-indigo-500" size={20} />
                        Análisis de liquidez y movimientos de caja
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white p-3 rounded-[28px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 px-4 border-r border-slate-100">
                        <Calendar size={18} className="text-indigo-500" />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-slate-400">Desde</span>
                            <input
                                type="date"
                                value={desde}
                                onChange={(e) => setDesde(e.target.value)}
                                className="text-sm font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4">
                        <Calendar size={18} className="text-indigo-500" />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-slate-400">Hasta</span>
                            <input
                                type="date"
                                value={hasta}
                                onChange={(e) => setHasta(e.target.value)}
                                className="text-sm font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                            />
                        </div>
                    </div>
                    <Button onClick={loadData} isLoading={loading} className="h-12 w-12 p-0 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100">
                        <Filter size={20} />
                    </Button>
                </div>
            </div>

            {/* Resumen Superior */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[40px] text-white shadow-2xl shadow-indigo-200">
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-200">Saldo Inicial</span>
                    <h2 className="text-4xl font-black mt-2">{formatMoney(data?.saldoInicial || 0)}</h2>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Movimiento Neto</span>
                    <h2 className={`text-4xl font-black mt-2 ${(data?.saldoFinal - data?.saldoInicial) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatMoney((data?.saldoFinal || 0) - (data?.saldoInicial || 0))}
                    </h2>
                </div>
                <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl shadow-slate-200">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Saldo Final</span>
                    <h2 className="text-4xl font-black mt-2 text-indigo-400">{formatMoney(data?.saldoFinal || 0)}</h2>
                </div>
            </div>

            {/* Detalles Actividades */}
            <div className="max-w-4xl mx-auto">
                {renderSection('Actividades de Operación', data?.actividadesOperacion || [], 'bg-indigo-600')}
                {renderSection('Actividades de Inversión', data?.actividadesInversion || [], 'bg-slate-800')}
                {renderSection('Actividades de Financiación', data?.actividadesFinanciacion || [], 'bg-indigo-900')}
            </div>

            {/* Floating Actions */}
            <div className="fixed bottom-8 right-8 flex gap-3">
                <Button variant="secondary" className="h-14 px-8 rounded-2xl bg-white border-slate-200 text-slate-700 font-black shadow-xl gap-2">
                    <Printer size={20} />
                    Imprimir
                </Button>
                <Button className="h-14 px-8 rounded-2xl bg-sri-blue hover:bg-blue-800 text-white font-black shadow-xl gap-2 shadow-blue-100">
                    <Download size={20} />
                    Exportar PDF
                </Button>
            </div>
        </div>
    );
}
