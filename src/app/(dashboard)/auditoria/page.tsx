'use client';

import { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, Search, Eye, User, Activity, AlertCircle, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { LogAuditoria, NivelSeveridad } from '@/modules/auditoria/domain/types';
import { AuditoriaUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';

export default function AuditoriaPage() {
    const { currentEmpresa } = useEmpresa();
    const [logs, setLogs] = useState<LogAuditoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [moduloFiltro, setModuloFiltro] = useState<string>('TODOS');
    const [severidadFiltro, setSeveridadFiltro] = useState<string>('TODOS');

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const data = await AuditoriaUseCases.consultarLogs({});
            setLogs(data);
        } catch (error) {
            console.error('Error cargando auditoría:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id]);

    const filteredLogs = useMemo(() => {
        return logs.filter(l => {
            const matchSearch = l.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.modulo.toLowerCase().includes(searchTerm.toLowerCase());
            const matchModulo = moduloFiltro === 'TODOS' || l.modulo === moduloFiltro;
            const matchSeveridad = severidadFiltro === 'TODOS' || l.severidad === severidadFiltro;
            return matchSearch && matchModulo && matchSeveridad;
        });
    }, [logs, searchTerm, moduloFiltro, severidadFiltro]);

    const stats = useMemo(() => {
        const hoy = new Date().toISOString().split('T')[0];
        return {
            hoy: filteredLogs.filter(l => l.createdAt.startsWith(hoy)).length,
            accesos: filteredLogs.filter(l => l.evento === 'LOGIN' || l.evento === 'ACCESO').length,
            success: filteredLogs.filter(l => l.severidad === NivelSeveridad.SUCCESS).length,
            warnings: filteredLogs.filter(l => l.severidad === NivelSeveridad.WARNING).length,
            criticals: filteredLogs.filter(l => l.severidad === NivelSeveridad.CRITICAL).length
        };
    }, [filteredLogs]);

    const handleExportExcel = () => {
        if (filteredLogs.length === 0) return;

        // Simple CSV export as "Excel" implementation
        const headers = ['Fecha', 'Hora', 'Usuario', 'Modulo', 'Evento', 'Descripcion', 'Severidad', 'IP'];
        const rows = filteredLogs.map(log => [
            new Date(log.createdAt).toLocaleDateString(),
            new Date(log.createdAt).toLocaleTimeString(),
            log.usuario,
            log.modulo,
            log.evento,
            `"${log.descripcion.replace(/"/g, '""')}"`,
            log.severidad,
            log.ip
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `auditoria_${currentEmpresa?.razonSocial.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns: Column<LogAuditoria>[] = [
        {
            header: 'Fecha / Hora',
            cell: (log) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-700">{new Date(log.createdAt).toLocaleDateString()}</span>
                    <span className="text-[10px] font-mono text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
            ),
            sortable: true,
            accessorKey: 'createdAt'
        },
        {
            header: 'Usuario',
            cell: (log) => (
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <User size={14} />
                    </div>
                    <span className="font-medium text-slate-600">{log.usuario}</span>
                </div>
            ),
            sortable: true,
            accessorKey: 'usuario'
        },
        {
            header: 'Módulo / Evento',
            cell: (log) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sri-blue text-[11px] uppercase tracking-wider">{log.modulo}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{log.evento}</span>
                </div>
            ),
            sortable: true,
            accessorKey: 'modulo'
        },
        {
            header: 'Descripción',
            accessorKey: 'descripcion',
            className: 'text-slate-600 max-w-xs'
        },
        {
            header: 'Severidad',
            cell: (log) => (
                <div className="text-center">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-tighter uppercase ${log.severidad === NivelSeveridad.CRITICAL ? 'bg-rose-100 text-rose-700' :
                        log.severidad === NivelSeveridad.WARNING ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                        {log.severidad}
                    </span>
                </div>
            ),
            className: 'text-center'
        },
        {
            header: 'Acciones',
            cell: () => (
                <div className="text-right">
                    <button className="p-2 text-slate-400 hover:text-sri-blue hover:bg-blue-50 rounded-lg transition-all" title="Ver Detalles">
                        <Eye size={18} />
                    </button>
                </div>
            ),
            className: 'text-right'
        }
    ];

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
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Activity size={20} /></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Eventos Hoy</p>
                        <h3 className="text-xl font-black text-slate-800">{stats.hoy}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldCheck size={20} /></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Accesos Exitosos</p>
                        <h3 className="text-xl font-black text-slate-800">{stats.accesos}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><AlertCircle size={20} /></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Advertencias</p>
                        <h3 className="text-xl font-black text-slate-800">{stats.warnings}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><ShieldAlert size={20} /></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Críticos</p>
                        <h3 className="text-xl font-black text-rose-600">{stats.criticals}</h3>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* Custom Filters */}
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-1 max-w-md gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 bg-white"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={moduloFiltro}
                            onChange={(e) => setModuloFiltro(e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 bg-white"
                        >
                            <option value="TODOS">Todos los Módulos</option>
                            <option value="FACTURACION">Facturación</option>
                            <option value="COMPRAS">Compras</option>
                            <option value="INVENTARIO">Inventario</option>
                            <option value="BANCOS">Bancos</option>
                            <option value="CONTABILIDAD">Contabilidad</option>
                            <option value="CARTERA">Cartera</option>
                            <option value="NOMINA">Nómina</option>
                            <option value="AUDITORIA">Auditoría</option>
                            <option value="SISTEMA">Sistema</option>
                        </select>
                        <select
                            value={severidadFiltro}
                            onChange={(e) => setSeveridadFiltro(e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 bg-white"
                        >
                            <option value="TODOS">Todas las Severidades</option>
                            <option value={NivelSeveridad.SUCCESS}>Success</option>
                            <option value={NivelSeveridad.WARNING}>Warning</option>
                            <option value={NivelSeveridad.CRITICAL}>Critical</option>
                        </select>
                    </div>
                </div>

                <DataTable
                    data={filteredLogs}
                    columns={columns}
                    loading={loading}
                    itemsPerPage={5}
                    emptyMessage="No hay registros de auditoría que coincidan con los filtros."
                    actions={
                        <Button onClick={handleExportExcel} variant="secondary" size="sm" className="flex items-center gap-2">
                            <FileSpreadsheet size={16} /> Exportar
                        </Button>
                    }
                />
            </div>
        </div>
    );
}
