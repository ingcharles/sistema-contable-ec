import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, FileCheck, AlertTriangle, Calendar, Building2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { Empresa } from '../../../types';
import { getObligacionesPendientes } from '../../../services/sriService';

const dataLiquidez = [
  { name: 'Ene', ingresos: 4000, egresos: 2400 },
  { name: 'Feb', ingresos: 3000, egresos: 1398 },
  { name: 'Mar', ingresos: 2000, egresos: 9800 },
  { name: 'Abr', ingresos: 2780, egresos: 3908 },
  { name: 'May', ingresos: 1890, egresos: 4800 },
  { name: 'Jun', ingresos: 2390, egresos: 3800 },
  { name: 'Jul', ingresos: 3490, egresos: 4300 },
];

export const DashboardPage: React.FC = () => {
  const { currentEmpresa } = useOutletContext<{ currentEmpresa: Empresa }>();
  const obligaciones = useMemo(() => getObligacionesPendientes(currentEmpresa.ruc), [currentEmpresa.ruc]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel General</h1>
          <p className="text-slate-500 flex items-center gap-2">
             <Building2 size={14} /> 
             {currentEmpresa.razonSocial} 
             <span className="text-slate-300">|</span> 
             RUC: {currentEmpresa.ruc}
          </p>
        </div>
        <div className="flex gap-2">
           <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            Ambiente SRI: PRODUCCIÓN
          </span>
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
            Firma Electrónica: VIGENTE
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-5">
             <ArrowUpRight size={100} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500">Ventas (Mes)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">$24,500.00</h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <p className="text-xs text-emerald-600 mt-4 flex items-center font-medium relative z-10">
            +12.5% <span className="text-slate-400 ml-1">vs mes anterior</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Compras (Mes)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">$18,200.00</h3>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <p className="text-xs text-rose-500 mt-4 flex items-center font-medium">
            +5.2% <span className="text-slate-400 ml-1">vs mes anterior</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">IVA por Pagar</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">$856.40</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-sri-blue">
              <FileCheck size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">Proyección formulario 104</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Bancos</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">$42,100.00</h3>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <p className="text-xs text-indigo-600 mt-4 font-medium">Conciliado</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Flujo de Caja (Enero - Julio)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataLiquidez}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [`$${value}`, '']}
                />
                <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#22c55e" fillOpacity={1} fill="url(#colorIngresos)" strokeWidth={2} />
                <Area type="monotone" dataKey="egresos" name="Egresos" stroke="#ef4444" fillOpacity={1} fill="url(#colorEgresos)" strokeWidth={2} />
                <Legend iconType="circle" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SRI Obligations - Semáforo Tributario */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-sri-blue" />
            Agenda Tributaria
          </h3>
          <div className="flex-1 space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 mb-4">
              <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
                <AlertTriangle size={16} />
                Próximo Vencimiento: {obligaciones[0].fechaVencimiento}
              </p>
              <p className="text-xs text-yellow-600 mt-1 pl-6">
                 Basado en el 9no dígito del RUC ({currentEmpresa.ruc.charAt(8)}).
              </p>
            </div>

            <div className="space-y-3">
              {obligaciones.map((obs) => (
                <div key={obs.codigo} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100 group">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm ${
                      obs.estado === 'VENCIDO' ? 'bg-red-500' :
                      obs.estado === 'PENDIENTE' ? 'bg-amber-400' : 'bg-emerald-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-slate-700 group-hover:text-sri-blue transition-colors">{obs.nombre}</p>
                      <p className="text-xs text-slate-400">Vence: {obs.fechaVencimiento}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                      obs.estado === 'VENCIDO' ? 'bg-red-50 text-red-700 border-red-100' :
                      obs.estado === 'PENDIENTE' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}>
                    {obs.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <button className="w-full mt-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Ver Calendario Fiscal Completo
          </button>
        </div>
      </div>
    </div>
  );
};
