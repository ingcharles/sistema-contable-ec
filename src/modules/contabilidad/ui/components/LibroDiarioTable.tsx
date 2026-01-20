import { useState, Fragment } from 'react';
import { ChevronDown, ChevronRight, Printer, Download, Search, Filter } from 'lucide-react';
import { AsientoContable } from '../../domain/types';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';
import { Empresa } from '@/shared/types';

interface LibroDiarioTableProps {
    asientos: AsientoContable[];
    loading?: boolean;
    empresa?: Empresa;
    fechaInicio?: string;
    fechaFin?: string;
}

export const LibroDiarioTable = ({ asientos, loading, empresa, fechaInicio, fechaFin }: LibroDiarioTableProps) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredAsientos = asientos.filter(a =>
        a.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.glosa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.detalles.some(d => d.cuentaNombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Cabecera con datos de la empresa */}
            {empresa && (
                <div className="text-center p-6 pb-4 border-b-2 border-slate-200 bg-slate-50/30">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{empresa.razonSocial}</h2>
                    <p className="text-xs text-slate-600 mt-1">RUC: {empresa.ruc}</p>
                    <p className="text-xs text-slate-500 mt-1">{empresa.direccionMatriz}</p>
                    <h3 className="text-lg font-bold text-sri-blue uppercase mt-3">Libro Diario General</h3>
                    {fechaInicio && fechaFin && (
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            Del {new Date(fechaInicio + 'T00:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })} al {new Date(fechaFin + 'T00:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">(Expresado en Dólares de los Estados Unidos de América)</p>
                </div>
            )}

            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por asiento, glosa o cuenta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="flex items-center gap-2">
                        <Filter size={16} /> Filtros
                    </Button>
                    <Button variant="secondary" size="sm" className="flex items-center gap-2">
                        <Printer size={16} /> Imprimir
                    </Button>
                    <Button variant="secondary" size="sm" className="flex items-center gap-2">
                        <Download size={16} /> Exportar
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 w-10"></th>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Número</th>
                            <th className="px-6 py-3">Glosa / Descripción</th>
                            <th className="px-6 py-3 text-center">Estado</th>
                            <th className="px-6 py-3 text-right">Total Debe</th>
                            <th className="px-6 py-3 text-right">Total Haber</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={7} className="p-12 text-center text-slate-400">Cargando asientos...</td></tr>
                        ) : filteredAsientos.length === 0 ? (
                            <tr><td colSpan={7} className="p-12 text-center text-slate-400">No se encontraron asientos contables.</td></tr>
                        ) : filteredAsientos.map((asiento) => {
                            const isExpanded = expanded[asiento.id];
                            return (
                                <Fragment key={asiento.id}>
                                    <tr
                                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50' : ''}`}
                                        onClick={() => toggleExpand(asiento.id)}
                                    >
                                        <td className="px-4 py-3 text-center text-slate-400">
                                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-slate-600">{asiento.fecha}</td>
                                        <td className="px-6 py-3 whitespace-nowrap font-mono font-medium text-sri-blue">{asiento.numero}</td>
                                        <td className="px-6 py-3 text-slate-700 max-w-md truncate">{asiento.glosa}</td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${asiento.estado === 'MAYORIZADO' ? 'bg-emerald-100 text-emerald-700' :
                                                asiento.estado === 'ANULADO' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                {asiento.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono text-slate-600">{formatMoney(asiento.totalDebe)}</td>
                                        <td className="px-6 py-3 text-right font-mono text-slate-600">{formatMoney(asiento.totalHaber)}</td>
                                    </tr>

                                    {isExpanded && (
                                        <tr className="bg-slate-50/50 animate-in fade-in duration-200">
                                            <td colSpan={7} className="px-4 py-4 sm:px-10">
                                                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-slate-100 text-slate-500 font-semibold">
                                                            <tr>
                                                                <th className="px-4 py-2">Código</th>
                                                                <th className="px-4 py-2">Cuenta Contable</th>
                                                                <th className="px-4 py-2 text-right">Debe</th>
                                                                <th className="px-4 py-2 text-right">Haber</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {asiento.detalles.map((det, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="px-4 py-2 font-mono text-slate-500">{det.cuentaCodigo}</td>
                                                                    <td className="px-4 py-2 text-slate-700">{det.cuentaNombre}</td>
                                                                    <td className="px-4 py-2 text-right font-mono text-slate-600">
                                                                        {det.debe > 0 ? formatMoney(det.debe) : '-'}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right font-mono text-slate-600">
                                                                        {det.haber > 0 ? formatMoney(det.haber) : '-'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            <tr className="bg-slate-50 font-bold text-slate-700 border-t border-slate-200">
                                                                <td colSpan={2} className="px-4 py-2 text-right">TOTALES:</td>
                                                                <td className="px-4 py-2 text-right">{formatMoney(asiento.totalDebe)}</td>
                                                                <td className="px-4 py-2 text-right">{formatMoney(asiento.totalHaber)}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
