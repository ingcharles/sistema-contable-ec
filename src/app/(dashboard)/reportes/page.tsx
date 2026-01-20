'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown,
    PieChart as PieChartIcon, BarChart3, ArrowUpRight,
    FileBarChart, Sparkles
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { InMemoryReportesRepository } from '@/modules/reportes/infrastructure/ReportesRepository';
import { KpiFinanciero } from '@/modules/reportes/domain/types';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';

const COLORS = ['#00548b', '#007cc3', '#0ea5e9', '#38bdf8', '#7dd3fc'];

const dataGastos = [
    { name: 'Nómina', value: 4500 },
    { name: 'Arriendos', value: 1200 },
    { name: 'Suministros', value: 800 },
    { name: 'Servicios', value: 600 },
    { name: 'Impuestos', value: 1500 },
];

const dataAnual = [
    { month: 'Ene', ventas: 12000, gastos: 8000 },
    { month: 'Feb', ventas: 15000, gastos: 9000 },
    { month: 'Mar', ventas: 18000, gastos: 11000 },
    { month: 'Abr', ventas: 14000, gastos: 10000 },
    { month: 'May', ventas: 22000, gastos: 13000 },
    { month: 'Jun', ventas: 25000, gastos: 15000 },
];

export default function ReportesPage() {
    const { currentEmpresa } = useEmpresa();
    const [kpis, setKpis] = useState<KpiFinanciero[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (!currentEmpresa) return;
            const repoBI = new InMemoryReportesRepository();
            const kpisData = await repoBI.getKpis(currentEmpresa.id, '2024-03');
            setKpis(kpisData);
        };
        loadData();
    }, [currentEmpresa?.id]);

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <FileBarChart className="text-sri-blue" size={32} /> Dashboard de Inteligencia de Negocios
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Análisis avanzado, KPIs y visualizaciones para <span className="text-sri-blue font-bold">{currentEmpresa.razonSocial}</span></p>
                    <p className="text-xs text-slate-400 mt-1">💡 Los Estados Financieros ahora están en el módulo de Contabilidad</p>
                </div>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-sri-blue/5 rounded-full blur-3xl" />
            </div>

            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* KPI Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kpis.map((kpi, index) => (
                        <div key={index} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                            <div className="flex justify-between items-start">
                                <div className={`p-3 rounded-2xl ${kpi.tendencia === 'ALZA' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} group-hover:scale-110 transition-transform`}>
                                    {kpi.tendencia === 'ALZA' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${kpi.tendencia === 'ALZA' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {kpi.porcentajeVariacion}%
                                </span>
                            </div>
                            <div className="mt-5">
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">{kpi.nombre}</p>
                                <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{formatMoney(kpi.valor)}</h3>
                                <p className="text-[10px] text-slate-400 mt-2 font-medium italic">vs periodo anterior</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Annual Performance */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <BarChart3 size={22} className="text-sri-blue" /> Rendimiento Anual
                                </h3>
                                <p className="text-sm text-slate-400 mt-1">Comparativa de Ventas vs Gastos</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-sri-blue" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Ventas</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-sky-300" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Gastos</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataAnual}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} tickFormatter={(val) => `$${val / 1000}k`} dx={-10} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="ventas" fill="#00548b" radius={[6, 6, 0, 0]} barSize={20} />
                                    <Bar dataKey="gastos" fill="#7dd3fc" radius={[6, 6, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Expense Distribution */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <PieChartIcon size={22} className="text-sri-blue" /> Distribución de Gastos
                                </h3>
                                <p className="text-sm text-slate-400 mt-1">Desglose por categorías principales</p>
                            </div>
                            <Button variant="secondary" size="sm" className="rounded-xl">Ver Detalles</Button>
                        </div>
                        <div className="h-[350px] w-full flex flex-col md:flex-row items-center">
                            <div className="w-full md:w-1/2 h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dataGastos}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {dataGastos.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full md:w-1/2 space-y-3 px-4">
                                {dataGastos.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="text-sm font-bold text-slate-700">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">{formatMoney(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Strategic Insights */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-sri-blue rounded-xl">
                                    <Sparkles size={20} className="text-sky-300 animate-pulse" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-sky-400">AI Strategic Insight</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Optimización de Rentabilidad Detectada</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Tus ventas han crecido un <span className="text-emerald-400 font-bold">15%</span> este trimestre, pero los gastos operativos aumentaron un <span className="text-rose-400 font-bold">8%</span>.
                                Se recomienda revisar la categoría de "Suministros" donde detectamos una desviación del 12% respecto al presupuesto proyectado.
                            </p>
                        </div>
                        <button className="whitespace-nowrap px-8 py-4 bg-sri-blue text-white rounded-2xl font-bold hover:bg-sri-light transition-all duration-300 shadow-xl border border-white/10 flex items-center gap-3 group">
                            Generar Reporte IA Detallado
                            <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </button>
                    </div>
                    {/* Decorative background */}
                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-sri-blue/20 rounded-full blur-[100px]" />
                    <div className="absolute -left-20 -top-20 w-80 h-80 bg-sky-500/10 rounded-full blur-[100px]" />
                </div>
            </div>
        </div>
    );
}
