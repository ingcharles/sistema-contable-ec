import React from 'react';
import { PLAN_CUENTAS } from '../constants';
import { Download, Plus, Filter, ChevronRight, Folder, FileText } from 'lucide-react';
import { formatMoney } from '../services/sriService';

export const Accounting: React.FC = () => {
  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contabilidad General</h1>
          <p className="text-slate-500">Plan de cuentas y movimientos contables.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
            <Download size={16} /> Exportar
          </button>
          <button className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm">
            <Plus size={16} /> Nueva Cuenta
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Filtrar por código o nombre..." 
                  className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sri-blue/50"
                />
            </div>
            <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600 focus:outline-none">
                <option>Nivel 1</option>
                <option>Nivel 2</option>
                <option>Nivel 3</option>
                <option>Nivel 4</option>
                <option selected>Todos los Niveles</option>
            </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 w-48">Código</th>
                <th className="px-6 py-3">Nombre de Cuenta</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3 text-right">Saldo</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PLAN_CUENTAS.map((cuenta) => (
                <tr key={cuenta.codigo} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-mono text-slate-600 font-medium">
                    <span style={{ paddingLeft: `${(cuenta.nivel - 1) * 1.5}rem` }} className="flex items-center gap-2">
                       {cuenta.nivel < 4 ? <Folder size={14} className="text-yellow-500 fill-yellow-500" /> : <FileText size={14} className="text-slate-400" />}
                       {cuenta.codigo}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={cuenta.nivel === 1 ? 'font-bold text-slate-900' : cuenta.nivel === 2 ? 'font-semibold text-slate-800' : 'text-slate-600'}>
                        {cuenta.nombre}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                        {cuenta.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-slate-700">
                    {formatMoney(cuenta.saldo)}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button className="text-sri-light hover:text-sri-blue font-medium text-xs">Ver Mayor</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
            <span>Mostrando 10 cuentas de 243</span>
            <div className="flex gap-2">
                <button className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50">Anterior</button>
                <button className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100">Siguiente</button>
            </div>
        </div>
      </div>
    </div>
  );
};
