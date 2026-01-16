
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Empresa } from '../../../types';
import { LogAuditoria, ModuloSistema, TipoAccion } from '../domain/types';
import { InMemoryLogRepository } from '../infrastructure/LogRepository';
import { ShieldAlert, Search, Filter, Download, User, Calendar, Activity } from 'lucide-react';

const AccionBadge = ({ accion }: { accion: TipoAccion }) => {
    switch(accion) {
        case TipoAccion.CREAR: return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">CREAR</span>;
        case TipoAccion.MODIFICAR: return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">EDITAR</span>;
        case TipoAccion.ELIMINAR: return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">ELIMINAR</span>;
        case TipoAccion.ANULAR: return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold">ANULAR</span>;
        case TipoAccion.LOGIN: return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold">LOGIN</span>;
        default: return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">{accion}</span>;
    }
};

export const AuditoriaPage: React.FC = () => {
    const { currentEmpresa } = useOutletContext<{ currentEmpresa: Empresa }>();
    const [logs, setLogs] = useState<LogAuditoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroTexto, setFiltroTexto] = useState('');
    const [filtroModulo, setFiltroModulo] = useState('');

    useEffect(() => {
        const repo = new InMemoryLogRepository();
        repo.getLogs(currentEmpresa.id).then(data => {
            setLogs(data);
            setLoading(false);
        });
    }, [currentEmpresa.id]);

    const filteredLogs = logs.filter(l => 
        (l.descripcion.toLowerCase().includes(filtroTexto.toLowerCase()) || l.usuarioNombre.toLowerCase().includes(filtroTexto.toLowerCase())) &&
        (filtroModulo === '' || l.modulo === filtroModulo)
    );

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ShieldAlert className="text-sri-blue" /> Auditoría del Sistema
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Registro inmutable de actividades y cambios realizados por usuarios.
                    </p>
                </div>
                <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                    <Download size={16} /> Exportar Reporte
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar por usuario o actividad..." 
                            value={filtroTexto}
                            onChange={e => setFiltroTexto(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none" 
                        />
                    </div>
                    <div>
                        <select 
                            value={filtroModulo} 
                            onChange={e => setFiltroModulo(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-sri-blue/20 outline-none"
                        >
                            <option value="">Todos los Módulos</option>
                            {Object.values(ModuloSistema).map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 justify-end">
                        <Activity size={14} /> Total Registros: <strong>{filteredLogs.length}</strong>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 w-40">Fecha / Hora</th>
                                <th className="px-6 py-3 w-48">Usuario</th>
                                <th className="px-6 py-3 w-32">Módulo</th>
                                <th className="px-6 py-3 w-24 text-center">Acción</th>
                                <th className="px-6 py-3">Detalle Actividad</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Cargando registros...</td></tr>
                            ) : filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            {new Date(log.fecha).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User size={12} />
                                            </div>
                                            <span className="font-medium text-slate-700">{log.usuarioNombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                            {log.modulo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <AccionBadge accion={log.accion} />
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {log.descripcion}
                                        {log.recursoId && <span className="ml-2 text-xs font-mono bg-slate-50 px-1 border rounded">ID: {log.recursoId}</span>}
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
