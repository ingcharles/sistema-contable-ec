
'use client';

import { useState, useEffect } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { AuditoriaUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { LogDetailsModal } from '@/modules/auditoria/ui/components/LogDetailsModal';
import { LogAuditoria, NivelSeveridad, TipoEvento } from '@/modules/auditoria/domain/types';
import { ShieldAlert, Eye, RefreshCw, Filter } from 'lucide-react';

export default function AuditoriaPage() {
    const { currentEmpresa } = useEmpresa();
    const [logs, setLogs] = useState<LogAuditoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<LogAuditoria | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filtros
    const [filters, setFilters] = useState({
        modulo: '',
        evento: '',
        usuarioId: '',
        severidad: '',
        limit: 50,
        offset: 0
    });



    const loadLogs = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const response: any = await AuditoriaUseCases.consultarLogs({
                ...filters,
                empresaId: currentEmpresa.id
            });
            setLogs(response.data);

        } catch (error) {
            console.error('Error cargando logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentEmpresa, filters.offset, filters.limit]); // Recargar cuando cambie paginación o empresa

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, offset: 0 })); // Reset page
        loadLogs();
    };

    const handleViewDetails = (log: LogAuditoria) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };

    const columns: Column<LogAuditoria>[] = [
        {
            header: 'Fecha / Hora',
            accessorKey: 'created_at' as keyof LogAuditoria, // Mapping raw api response
            cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">
                        {new Date(row.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-500">
                        {new Date(row.created_at).toLocaleTimeString()}
                    </span>
                </div>
            )
        },
        {
            header: 'Usuario',
            accessorKey: 'usuario_nombre',
            cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800">{row.usuario_nombre || 'Sistema'}</span>
                    <span className="text-xs text-slate-500 font-mono">{row.ip_address}</span>
                </div>
            )
        },
        {
            header: 'Módulo',
            accessorKey: 'modulo',
            cell: (row) => (
                <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                    {row.modulo}
                </span>
            )
        },
        {
            header: 'Evento',
            accessorKey: 'evento',
            cell: (row) => (
                <span className={`inline-flex items-center gap-1 font-medium text-sm ${row.evento.includes('ELIMINACION') ? 'text-red-600' :
                    row.evento.includes('CREACION') ? 'text-green-600' : 'text-blue-600'
                    }`}>
                    {row.evento}
                </span>
            )
        },
        {
            header: 'Severidad',
            accessorKey: 'severidad',
            cell: (row) => {
                const colors = {
                    [NivelSeveridad.CRITICAL]: 'bg-red-50 text-red-700 border-red-100',
                    [NivelSeveridad.WARNING]: 'bg-amber-50 text-amber-700 border-amber-100',
                    [NivelSeveridad.SUCCESS]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                };
                // @ts-ignore
                const style = colors[row.severidad] || 'bg-slate-50 text-slate-700';
                return (
                    <span className={`px-2 py-1 rounded-full text-xs border ${style}`}>
                        {row.severidad}
                    </span>
                );
            }
        },
        {
            header: 'Acciones',
            accessorKey: 'id',
            cell: (row) => (
                <button
                    onClick={() => handleViewDetails(row)}
                    className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                    title="Ver Detalles"
                >
                    <Eye size={18} />
                </button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ShieldAlert className="text-sri-blue" />
                        Auditoría del Sistema
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Traza de seguridad y registro de actividades de usuarios.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadLogs}
                        className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-all shadow-sm text-sm"
                    >
                        <RefreshCw size={16} /> Actualizar
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Módulo</label>
                        <select
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                            value={filters.modulo}
                            onChange={(e) => setFilters({ ...filters, modulo: e.target.value })}
                        >
                            <option value="">Todos</option>
                            <option value="FACTURACION">Facturación</option>
                            <option value="CONTABILIDAD">Contabilidad</option>
                            <option value="COMPRAS">Compras</option>
                            <option value="INVENTARIO">Inventario</option>
                            <option value="SEGURIDAD">Seguridad</option>
                            <option value="CONFIGURACION">Configuración</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Evento</label>
                        <select
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                            value={filters.evento}
                            onChange={(e) => setFilters({ ...filters, evento: e.target.value })}
                        >
                            <option value="">Todos</option>
                            {Object.values(TipoEvento).map(evt => (
                                <option key={evt} value={evt}>{evt}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Severidad</label>
                        <select
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                            value={filters.severidad}
                            onChange={(e) => setFilters({ ...filters, severidad: e.target.value })}
                        >
                            <option value="">Todas</option>
                            <option value="SUCCESS">Éxito</option>
                            <option value="WARNING">Advertencia</option>
                            <option value="CRITICAL">Crítico / Error</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Usuario (ID o Nombre)</label>
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                            value={filters.usuarioId}
                            onChange={(e) => setFilters({ ...filters, usuarioId: e.target.value })}
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full px-4 py-2 bg-sri-blue text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            <Filter size={16} /> Filtrar
                        </button>
                    </div>
                </form>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={logs}
                    loading={loading}
                />
            </div>

            <LogDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                log={selectedLog}
            />
        </div>
    );
}
