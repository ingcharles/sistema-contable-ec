'use client';

import { useState, useEffect } from 'react';
import { Play, Calendar, FileType, Loader2, AlertCircle, CheckCircle2, Clock, XCircle, Search, Building2 } from 'lucide-react';
import { DescargaRobot, FiltroDescarga, TipoDocumentoDescarga } from '@/modules/compras/domain/descargaRobotTypes';
import { DirectorioUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';

interface Proveedor {
    id: string;
    identificacion: string;
    razonSocial: string;
    nombreComercial?: string;
}

interface Props {
    descargas: DescargaRobot[];
    loading: boolean;
    descargando: boolean;
    error: string | null;
    onIniciarDescarga: (filtro: FiltroDescarga) => Promise<any>;
    onRecargar: (filtros?: { anio?: number; razonSocial?: string }) => void;
}

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const TIPOS_DOC: { value: TipoDocumentoDescarga; label: string }[] = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'FACTURA', label: 'Factura' },
    { value: 'NOTA_CREDITO', label: 'Notas de Crédito' },
    { value: 'NOTA_DEBITO', label: 'Notas de Débito' },
    { value: 'RETENCION', label: 'Retenciones' },
];

const RANGOS_DESCARGA = [
    { value: 'AUTO', label: 'AUTO' },
    { value: 'MANUAL', label: 'MANUAL' },
];

const ESTADO_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
    PENDIENTE: { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: <Clock size={16} />, label: 'PENDIENTE' },
    EN_CURSO: { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: <Loader2 size={16} className="animate-spin" />, label: 'EN CURSO' },
    COMPLETADO: { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={16} />, label: 'COMPLETADO' },
    ERROR: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: <XCircle size={16} />, label: 'ERROR' },
};

export const DescargaTab: React.FC<Props> = ({ descargas, loading, descargando, error, onIniciarDescarga, onRecargar }) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Proveedores dropdown
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loadingProveedores, setLoadingProveedores] = useState(false);

    // Section 1: Consultar estado (comprobantes previos)
    const [anioConsulta, setAnioConsulta] = useState(currentYear);
    const [rucProveedor, setRucProveedor] = useState('');

    // Section 2: Iniciar Robot
    const [anioRobot, setAnioRobot] = useState(currentYear);
    const [mesRobot, setMesRobot] = useState(currentMonth);
    const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoDescarga>('TODOS');
    const [rangoDescarga, setRangoDescarga] = useState('AUTO');
    const [registroDesde, setRegistroDesde] = useState(1);
    const [registroHasta, setRegistroHasta] = useState(500);

    // Cargar proveedores al montar
    useEffect(() => {
        const cargarProveedores = async () => {
            setLoadingProveedores(true);
            try {
                const data = await DirectorioUseCases.listarTerceros('PROVEEDOR');
                setProveedores(Array.isArray(data) ? data : []);
            } catch {
                console.error('Error al cargar proveedores');
            } finally {
                setLoadingProveedores(false);
            }
        };
        cargarProveedores();
    }, []);

    const handleConsultar = () => {
        onRecargar({
            anio: anioConsulta,
            razonSocial: rucProveedor || undefined
        });
    };

    const handleIniciar = async () => {
        const filtro: FiltroDescarga = { anio: anioRobot, mes: mesRobot, tipoDocumento };
        if (rangoDescarga === 'MANUAL') {
            filtro.registroDesde = registroDesde;
            filtro.registroHasta = registroHasta;
        }
        await onIniciarDescarga(filtro);
    };

    // Filtrar descargas por año de consulta
    const descargasFiltradas = descargas.filter(d => d.anio === anioConsulta);

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center gap-2.5">
                <AlertCircle size={16} className="text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700">
                    Si tienes más de <strong>1000 documentos</strong> para descargar en el mes, usa <strong>rangos de descarga</strong> para evitar colapsos.
                </p>
            </div>

            {/* Two Sections Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* SECCIÓN 1: Consultar comprobantes obtenidos previamente */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Año</label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select
                                        value={anioConsulta}
                                        onChange={(e) => setAnioConsulta(parseInt(e.target.value))}
                                        className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all appearance-none"
                                    >
                                        {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Razón Social</label>
                                <div className="relative">
                                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select
                                        value={rucProveedor}
                                        onChange={(e) => setRucProveedor(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all appearance-none"
                                        disabled={loadingProveedores}
                                    >
                                        <option value="">Todos los proveedores</option>
                                        {proveedores.map(p => (
                                            <option key={p.id} value={p.identificacion}>
                                                {p.razonSocial} ({p.identificacion})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={handleConsultar}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            Consultar
                        </Button>
                    </div>
                </div>

                {/* SECCIÓN 2: Iniciar Robot */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Año</label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select
                                        value={anioRobot}
                                        onChange={(e) => setAnioRobot(parseInt(e.target.value))}
                                        className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all appearance-none"
                                    >
                                        {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Mes</label>
                                <select
                                    value={mesRobot}
                                    onChange={(e) => setMesRobot(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all appearance-none"
                                >
                                    {MESES.map((nombre, i) => (
                                        <option key={i + 1} value={i + 1}>{nombre.substring(0, 6).toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Documento</label>
                                <div className="relative">
                                    <FileType size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select
                                        value={tipoDocumento}
                                        onChange={(e) => setTipoDocumento(e.target.value as TipoDocumentoDescarga)}
                                        className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all appearance-none"
                                    >
                                        {TIPOS_DOC.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Rango descarga</label>
                                <select
                                    value={rangoDescarga}
                                    onChange={(e) => setRangoDescarga(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all appearance-none"
                                >
                                    {RANGOS_DESCARGA.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {/* Rango manual: Desde / Hasta */}
                        {rangoDescarga === 'MANUAL' && (
                            <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Desde (registro)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={registroDesde}
                                        onChange={(e) => setRegistroDesde(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                                        placeholder="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Hasta (registro)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={registroHasta}
                                        onChange={(e) => setRegistroHasta(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                                        placeholder="500"
                                    />
                                </div>
                            </div>
                        )}
                        <Button
                            onClick={handleIniciar}
                            disabled={descargando}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {descargando ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                            {descargando ? 'Descargando...' : 'Iniciar'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Cards de estado por mes */}
            <div>
                {descargasFiltradas.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                            <Calendar size={24} />
                        </div>
                        <p className="text-sm">No hay descargas registradas para {anioConsulta}</p>
                        <p className="text-xs mt-1">Seleccione un período y presione &quot;Iniciar&quot; para comenzar</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {descargasFiltradas.map(d => {
                            const config = ESTADO_CONFIG[d.estado] || ESTADO_CONFIG.PENDIENTE;
                            return (
                                <div
                                    key={d.id}
                                    className={`border rounded-xl p-3.5 ${config.bg} transition-all hover:shadow-md cursor-default`}
                                >
                                    <div className="mb-2">
                                        <span className="text-sm font-bold text-slate-800 block">
                                            {MESES[d.mes - 1]} {d.anio}
                                        </span>
                                        {d.fechaInicio && (
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(d.fechaInicio).toLocaleDateString('es-EC')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1 mb-2.5">
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-slate-500">Encontrados:</span>
                                            <span className="font-semibold text-slate-700">{d.totalEncontrados}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-slate-500">Descargados:</span>
                                            <span className="font-semibold text-slate-700">{d.totalDescargados}</span>
                                        </div>
                                    </div>
                                    {/* Progress bar when in progress */}
                                    {d.estado === 'EN_CURSO' && d.totalEncontrados > 0 && (
                                        <div className="mb-2">
                                            <div className="w-full bg-white/60 rounded-full h-1">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1 rounded-full transition-all"
                                                    style={{ width: `${Math.min(100, (d.totalDescargados / d.totalEncontrados) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                    {/* Status badge */}
                                    <div className={`flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[11px] font-bold ${config.color} bg-white/60`}>
                                        {config.icon}
                                        {config.label}
                                    </div>
                                    {d.errorDetalle && (
                                        <p className="mt-1.5 text-[9px] text-red-500 line-clamp-2">{d.errorDetalle}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
