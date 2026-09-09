'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, ShoppingCart, EyeOff, RefreshCw, Filter } from 'lucide-react';
import { ComprobanteDescargado, FiltroComprobantes, EstadoComprobante } from '@/modules/compras/domain/descargaRobotTypes';
import { Button } from '@/shared/ui/Button';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { DataTable, Column } from '@/shared/ui/DataTable';

interface Props {
    comprobantes: ComprobanteDescargado[];
    loading: boolean;
    onCargar: (filtros: FiltroComprobantes) => void;
    onActualizar: (id: string, estado: string) => Promise<void>;
}

const TIPO_LABELS: Record<string, string> = {
    '01': 'Factura',
    '03': 'Liquidación',
    '04': 'Nota Crédito',
    '05': 'Nota Débito',
    '06': 'Guía Remisión',
    '07': 'Retención'
};

const ESTADO_BADGES: Record<string, { color: string; label: string }> = {
    NUEVO: { color: 'bg-blue-100 text-blue-700', label: 'Nuevo' },
    PROCESADO: { color: 'bg-emerald-100 text-emerald-700', label: 'Procesado' },
    IGNORADO: { color: 'bg-slate-100 text-slate-500', label: 'Ignorado' },
};

export const DocumentosTab: React.FC<Props> = ({ comprobantes, loading, onCargar, onActualizar }) => {
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<EstadoComprobante | ''>('');
    const [xmlPreview, setXmlPreview] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            const filtros: FiltroComprobantes = {};
            if (busqueda) filtros.busqueda = busqueda;
            if (filtroEstado) filtros.estado = filtroEstado;
            onCargar(filtros);
        }, 300);
        return () => clearTimeout(timer);
    }, [busqueda, filtroEstado]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleProcesar = async (comp: ComprobanteDescargado) => {
        await onActualizar(comp.id, 'PROCESADO');
        onCargar({});
    };

    const handleIgnorar = async (comp: ComprobanteDescargado) => {
        await onActualizar(comp.id, 'IGNORADO');
        onCargar({});
    };

    const columns: Column<ComprobanteDescargado>[] = [
        {
            accessorKey: 'fechaEmision',
            header: 'Fecha',
            sortable: true,
            cell: (row) => <span className="text-xs">{row.fechaEmision}</span>
        },
        {
            accessorKey: 'tipoComprobante',
            header: 'Tipo',
            cell: (row) => (
                <span className="text-xs font-medium">{TIPO_LABELS[row.tipoComprobante] || row.tipoComprobante}</span>
            )
        },
        {
            accessorKey: 'rucEmisor',
            header: 'RUC Emisor',
            cell: (row) => <span className="text-xs font-mono">{row.rucEmisor}</span>
        },
        {
            accessorKey: 'razonSocialEmisor',
            header: 'Emisor',
            cell: (row) => (
                <span className="text-xs truncate max-w-[200px] block" title={row.razonSocialEmisor}>
                    {row.razonSocialEmisor}
                </span>
            )
        },
        {
            accessorKey: 'numeroComprobante',
            header: 'Número',
            cell: (row) => <span className="text-xs font-mono">{row.numeroComprobante}</span>
        },
        {
            accessorKey: 'montoTotal',
            header: 'Total',
            sortable: true,
            cell: (row) => <span className="text-xs font-semibold">{formatMoney(row.montoTotal)}</span>
        },
        {
            accessorKey: 'estado',
            header: 'Estado',
            cell: (row) => {
                const badge = ESTADO_BADGES[row.estado] || ESTADO_BADGES.NUEVO;
                return (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.color}`}>
                        {badge.label}
                    </span>
                );
            }
        },
        {
            accessorKey: 'id',
            header: 'Acciones',
            cell: (row) => (
                <div className="flex items-center gap-1">
                    {row.estado === 'NUEVO' && (
                        <>
                            <button
                                onClick={() => handleProcesar(row)}
                                title="Procesar (cargar a compras)"
                                className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors"
                            >
                                <ShoppingCart size={14} />
                            </button>
                            <button
                                onClick={() => handleIgnorar(row)}
                                title="Ignorar"
                                className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
                            >
                                <EyeOff size={14} />
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setXmlPreview(row.claveAcceso)}
                        title="Ver detalle"
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
                    >
                        <Eye size={14} />
                    </button>
                </div>
            )
        }
    ];


    return (
        <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por RUC, emisor o número..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                    />
                </div>
                <div className="relative">
                    <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value as EstadoComprobante | '')}
                        className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all appearance-none"
                    >
                        <option value="">Todos los estados</option>
                        <option value="NUEVO">Nuevos</option>
                        <option value="PROCESADO">Procesados</option>
                        <option value="IGNORADO">Ignorados</option>
                    </select>
                </div>
                <Button
                    onClick={() => onCargar({})}
                    disabled={loading}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin text-slate-400' : 'text-slate-500'} />
                </Button>
            </div>

            {/* Tabla */}
            <DataTable
                data={comprobantes}
                columns={columns}
                loading={loading}
                emptyMessage="No se encontraron comprobantes descargados"
            />

            {/* Modal preview XML (simple) */}
            {xmlPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setXmlPreview(null)}>
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">Clave de Acceso</h3>
                        <p className="text-xs font-mono text-slate-600 bg-slate-50 p-3 rounded-xl break-all">{xmlPreview}</p>
                        <Button onClick={() => setXmlPreview(null)} className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm text-slate-600 transition-all">
                            Cerrar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
