'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Download, Eye, Terminal, User, Activity, AlertCircle, ShieldCheck } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { LogAuditoria, NivelSeveridad } from '@/modules/auditoria/domain/types';
import { InMemoryAuditoriaRepository } from '@/modules/auditoria/infrastructure/AuditoriaRepository';
import { Button } from '@/shared/ui/Button';

export default function AuditoriaPage() {
    const { currentEmpresa } = useEmpresa();
    const [logs, setLogs] = useState<LogAuditoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        const repo = new InMemoryAuditoriaRepository();
        const data = await repo.getLogs(currentEmpresa.id);
        setLogs(data);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id]);

    const filteredLogs = logs.filter(l =>
        l.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.modulo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200">
                        <ShieldAlert size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Registro de Auditoría</h1>
                        <p className="text-slate-500 text-sm mt-1">Trazabilidad completa de operaciones y seguridad del sistema.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" className="flex items-center gap-2">
                        <Terminal size={18} /> Ver Logs Raw
                    </Button>
                    <Button className="flex items-center gap-2">
                        <Download size={18} /> Exportar Reporte
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Activity size={20} /></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Eventos Hoy</p>
                        <h3 className="text-xl font-black text-slate-800">124</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldCheck size={20} /></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Accesos Exitosos</p>
                        <h3 className="text-xl font-black text-slate-800">42</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><AlertCircle size={20} /></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Advertencias</p>
                        <h3 className="text-xl font-black text-slate-800">3</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><ShieldAlert size={20} /></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Críticos</p>
                        <h3 className="text-xl font-black text-rose-600">1</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/30">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por usuario, descripción o módulo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" className="flex items-center gap-2">
                            <Filter size={16} /> Filtrar por Severidad
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                            <tr>
                                <th className="px-6 py-4">Fecha / Hora</th>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Módulo / Evento</th>
                                <th className="px-6 py-4">Descripción</th>
                                <th className="px-6 py-4 text-center">Severidad</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400">Cargando registros...</td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400">No hay registros de auditoría.</td></tr>
                            ) : filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-700">{new Date(log.createdAt).toLocaleDateString()}</span>
                                            <span className="text-[10px] font-mono text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User size={14} />
                                            </div>
                                            <span className="font-medium text-slate-600">{log.usuario}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sri-blue text-[11px] uppercase tracking-wider">{log.modulo}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">{log.evento}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 max-w-xs">{log.descripcion}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-tighter uppercase ${log.severidad === NivelSeveridad.CRITICAL ? 'bg-rose-100 text-rose-700' :
                                                log.severidad === NivelSeveridad.WARNING ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {log.severidad}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-slate-400 hover:text-sri-blue hover:bg-blue-50 rounded-lg transition-all" title="Ver Detalles">
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
