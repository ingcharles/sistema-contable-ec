
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, FileCheck, Calendar, TrendingUp, DollarSign, ShoppingBag, Wallet, Clock, Sparkles, AlertTriangle } from 'lucide-react';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { DashboardUseCases } from '@/modules/shared/application/useCases/systemUseCases';

export default function DashboardPage() {
    const { currentEmpresa } = useEmpresa();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const data = await DashboardUseCases.obtenerEstadisticas();
            setStats(data);
        } catch (error) {
            console.error('Error cargando stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, [currentEmpresa?.id]);

    const obligaciones = useMemo(() => {
        if (!currentEmpresa) return [];
        const ultimoDigito = currentEmpresa.ruc.charAt(8);
        const diaVencimiento = 10 + parseInt(ultimoDigito) * 2;

        return [
            { id: '103', nombre: 'Retenciones en la Fuente (F103)', fecha: `${diaVencimiento} de cada mes`, estado: 'PENDIENTE', urgencia: 'ALTA' },
            { id: '104', nombre: 'Declaración de IVA (F104)', fecha: `${diaVencimiento} de cada mes`, estado: 'AL DÍA', urgencia: 'BAJA' },
            { id: 'ATS', nombre: 'Anexo Transaccional (ATS)', fecha: `${diaVencimiento + 2} de cada mes`, estado: 'PENDIENTE', urgencia: 'MEDIA' },
        ];
    }, [currentEmpresa?.ruc]);

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-8 pb-12">
            {/* Welcome Header */}
            <div className="relative overflow-hidden bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            ¡Hola, <span className="text-sri-blue">Bienvenido!</span>
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            Resumen financiero para <span className="text-slate-800 font-bold underline decoration-sky-400 underline-offset-4">{currentEmpresa.razonSocial}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                        <div className="p-2 bg-white rounded-xl shadow-sm text-sri-blue">
                            <Calendar size={20} />
                        </div>
                        <div className="pr-4">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fecha Actual</p>
                            <p className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
                {/* Decorative background element */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-sri-blue/5 rounded-full blur-3xl" />
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-sky-400/5 rounded-full blur-3xl" />
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Ventas del Mes', value: stats?.ventasMes || 0, trend: 'up', icon: DollarSign, color: 'blue' },
                    { label: 'Compras y Gastos', value: stats?.comprasMes || 0, trend: 'neutral', icon: ShoppingBag, color: 'rose' },
                    { label: 'CxC Pendiente', value: stats?.carteraPendiente || 0, trend: 'neutral', icon: FileCheck, color: 'amber' },
                    { label: 'Saldo Bancos', value: stats?.saldoBancos || 0, trend: 'up', icon: Wallet, color: 'emerald' },
                ].map((kpi, i) => (
                    <div key={i} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-start">
                            <div className={`p-3 rounded-2xl bg-${kpi.color}-50 text-${kpi.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                                <kpi.icon size={24} />
                            </div>
                            {loading ? (
                                <div className="h-4 w-12 bg-slate-100 animate-pulse rounded"></div>
                            ) : kpi.trend === 'up' ? (
                                <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">Real</span>
                            ) : (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg uppercase">Real</span>
                            )}
                        </div>
                        <div className="mt-5">
                            <p className="text-sm text-slate-500 font-medium">{kpi.label}</p>
                            {loading ? (
                                <div className="h-8 w-24 bg-slate-100 animate-pulse rounded mt-1"></div>
                            ) : (
                                <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{formatMoney(kpi.value)}</h3>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Card */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[480px]">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp size={22} className="text-sri-blue" /> Flujo de Caja Real
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">Comparativa de ingresos vs egresos (Dinámico)</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-[10px] font-bold text-green-700 uppercase">Ventas</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-full">
                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                                <span className="text-[10px] font-bold text-rose-700 uppercase">Gastos</span>
                            </div>
                        </div>
                    </div>
                    {loading ? (
                        <div className="h-[350px] w-full bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest">
                            Procesando datos...
                        </div>
                    ) : (
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.graficoLiquidez || []}>
                                    <defs>
                                        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                                        tickFormatter={(value) => `$${value}`}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            padding: '12px'
                                        }}
                                        formatter={(value: any, name: string | undefined) => [formatMoney(value), name === 'ingresos' ? 'Ingresos' : 'Egresos Totales']}
                                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}
                                        cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="ingresos"
                                        stroke="#0ea5e9"
                                        fillOpacity={1}
                                        fill="url(#colorIngresos)"
                                        strokeWidth={3}
                                        animationDuration={1500}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="egresos"
                                        stroke="#f43f5e"
                                        fillOpacity={1}
                                        fill="url(#colorEgresos)"
                                        strokeWidth={3}
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Tax Calendar Card */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Clock size={22} className="text-sri-blue" /> Agenda Fiscal
                        </h3>
                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <AlertTriangle size={16} />
                        </div>
                    </div>

                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 mb-6">
                        <p className="text-xs text-amber-800 font-bold flex items-center gap-2">
                            <AlertTriangle size={14} /> Recordatorio de RUC
                        </p>
                        <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                            Tus fechas de vencimiento se calculan según el 9no dígito de tu RUC: <span className="font-black underline">{currentEmpresa.ruc.charAt(8)}</span>.
                        </p>
                    </div>

                    <div className="flex-1 space-y-4">
                        {obligaciones.map((obs) => (
                            <div key={obs.id} className="group p-4 rounded-2xl border border-slate-50 hover:border-sri-blue/20 hover:bg-slate-50/50 transition-all duration-300">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-3">
                                        <div className={`mt-1 h-2.5 w-2.5 rounded-full ring-4 ${obs.urgencia === 'ALTA' ? 'bg-rose-500 ring-rose-50' :
                                            obs.urgencia === 'MEDIA' ? 'bg-amber-400 ring-amber-50' : 'bg-emerald-500 ring-emerald-50'
                                            }`} />
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 group-hover:text-sri-blue transition-colors">{obs.nombre}</p>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                                                <Calendar size={10} /> Vence: {obs.fecha}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${obs.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {obs.estado}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-6 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden group cursor-pointer">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={16} className="text-sky-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Asistente IA</span>
                            </div>
                            <p className="text-xs font-medium text-slate-300 leading-relaxed">
                                "¿Cómo puedo optimizar mis retenciones este mes?"
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-sri-blue font-bold text-[11px]">
                                Consultar ahora <ArrowUpRight size={14} />
                            </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-sri-blue/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    </div>
                </div>
            </div>
        </div>
    );
}
