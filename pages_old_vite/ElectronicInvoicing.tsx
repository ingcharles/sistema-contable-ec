import React from 'react';
import { MOCK_FACTURAS } from '../constants';
import { EstadoSRI } from '../types';
import { Plus, Download, Send, RefreshCw, MoreHorizontal, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import { formatMoney } from '../services/sriService';

const EstadoBadge = ({ estado }: { estado: EstadoSRI }) => {
    switch (estado) {
        case EstadoSRI.AUTORIZADO:
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 size={12}/> Autorizado</span>;
        case EstadoSRI.ANULADO:
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12}/> Anulado</span>;
        case EstadoSRI.PENDIENTE:
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12}/> Pendiente</span>;
        default:
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{estado}</span>;
    }
};

export const ElectronicInvoicing: React.FC = () => {
  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Comprobantes Electrónicos</h1>
          <p className="text-slate-500">Emisión y gestión de documentos autorizados por el SRI.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm shadow-blue-900/10">
            <Plus size={16} /> Nueva Factura
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-500 mb-1">Tipo Comprobante</label>
                <select className="w-full text-sm border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white border focus:ring-2 focus:ring-sri-light/20 outline-none transition-all">
                    <option value="">Todos</option>
                    <option value="01">Factura</option>
                    <option value="04">Nota de Crédito</option>
                    <option value="07">Retención</option>
                </select>
            </div>
            <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-500 mb-1">Estado SRI</label>
                <select className="w-full text-sm border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white border focus:ring-2 focus:ring-sri-light/20 outline-none transition-all">
                    <option value="">Todos</option>
                    <option value="AUTORIZADO">Autorizado</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="DEVUELTO">Devuelto</option>
                </select>
            </div>
             <div className="flex flex-col md:col-span-2">
                <label className="text-xs font-medium text-slate-500 mb-1">Buscar Cliente / RUC</label>
                <input type="text" placeholder="Buscar..." className="w-full text-sm border-slate-200 rounded-lg p-2 border focus:ring-2 focus:ring-sri-light/20 outline-none"/>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3">Emisión</th>
                        <th className="px-6 py-3">Comprobante</th>
                        <th className="px-6 py-3">Cliente / Beneficiario</th>
                        <th className="px-6 py-3 text-right">Total</th>
                        <th className="px-6 py-3">Estado</th>
                        <th className="px-6 py-3 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {MOCK_FACTURAS.map((fac) => (
                        <tr key={fac.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                {fac.fechaEmision}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-900">{fac.tipo === '01' ? 'FACTURA' : fac.tipo === '07' ? 'RETENCIÓN' : 'NOTA CRÉDITO'}</span>
                                    <span className="text-xs text-slate-500 font-mono">{fac.secuencial}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="text-slate-800 font-medium">{fac.terceroNombre}</span>
                                    <span className="text-xs text-slate-500">RUC: {fac.terceroId}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-slate-900">
                                {formatMoney(fac.importeTotal)}
                            </td>
                            <td className="px-6 py-4">
                                <EstadoBadge estado={fac.estado} />
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button title="Descargar RIDE" className="p-1.5 text-slate-500 hover:text-sri-blue hover:bg-blue-50 rounded-md transition-colors">
                                        <FileText size={16} />
                                    </button>
                                    <button title="Descargar XML" className="p-1.5 text-slate-500 hover:text-sri-blue hover:bg-blue-50 rounded-md transition-colors">
                                        <Download size={16} />
                                    </button>
                                    <button title="Reenviar Mail" className="p-1.5 text-slate-500 hover:text-sri-blue hover:bg-blue-50 rounded-md transition-colors">
                                        <Send size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
