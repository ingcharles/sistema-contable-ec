'use client';

import { useMemo } from 'react';
import { TrendingUp, FileText, CheckCircle2, Clock } from 'lucide-react';
import { DescargaRobot, ComprobanteDescargado } from '@/modules/compras/domain/descargaRobotTypes';

interface Props {
    descargas: DescargaRobot[];
    comprobantes: ComprobanteDescargado[];
}

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const TIPO_LABELS: Record<string, string> = {
    '01': 'Factura',
    '03': 'Liquidación',
    '04': 'Nota Crédito',
    '05': 'Nota Débito',
    '07': 'Retención'
};

export const ConsolidadoTab: React.FC<Props> = ({ descargas, comprobantes }) => {
    const stats = useMemo(() => {
        const totalDescargas = descargas.length;
        const completadas = descargas.filter(d => d.estado === 'COMPLETADO').length;
        const totalComprobantes = comprobantes.length;
        const nuevos = comprobantes.filter(c => c.estado === 'NUEVO').length;
        const procesados = comprobantes.filter(c => c.estado === 'PROCESADO').length;
        const ignorados = comprobantes.filter(c => c.estado === 'IGNORADO').length;
        const montoTotal = comprobantes.reduce((acc, c) => acc + (c.montoTotal || 0), 0);

        // Agrupar comprobantes por tipo
        const porTipo: Record<string, { count: number; monto: number }> = {};
        comprobantes.forEach(c => {
            const key = c.tipoComprobante;
            if (!porTipo[key]) porTipo[key] = { count: 0, monto: 0 };
            porTipo[key].count++;
            porTipo[key].monto += c.montoTotal || 0;
        });

        // Agrupar comprobantes por mes
        const porMes: Record<string, { count: number; monto: number }> = {};
        comprobantes.forEach(c => {
            if (c.fechaEmision) {
                const parts = c.fechaEmision.split('-');
                const mes = parseInt(parts[1]) || 0;
                const key = MESES[mes - 1] || 'Sin fecha';
                if (!porMes[key]) porMes[key] = { count: 0, monto: 0 };
                porMes[key].count++;
                porMes[key].monto += c.montoTotal || 0;
            }
        });

        return { totalDescargas, completadas, totalComprobantes, nuevos, procesados, ignorados, montoTotal, porTipo, porMes };
    }, [descargas, comprobantes]);

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                    icon={<TrendingUp size={18} />}
                    label="Total Comprobantes"
                    value={stats.totalComprobantes.toString()}
                    color="from-teal-500 to-cyan-600"
                />
                <KpiCard
                    icon={<Clock size={18} />}
                    label="Nuevos (sin procesar)"
                    value={stats.nuevos.toString()}
                    color="from-blue-500 to-indigo-600"
                />
                <KpiCard
                    icon={<CheckCircle2 size={18} />}
                    label="Procesados"
                    value={stats.procesados.toString()}
                    color="from-emerald-500 to-green-600"
                />
                <KpiCard
                    icon={<FileText size={18} />}
                    label="Monto Total"
                    value={`$${stats.montoTotal.toFixed(2)}`}
                    color="from-violet-500 to-purple-600"
                />
            </div>

            {/* Desglose por Tipo de Documento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200/60 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <FileText size={16} className="text-teal-500" />
                        Por Tipo de Documento
                    </h3>
                    {Object.keys(stats.porTipo).length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">Sin datos</p>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(stats.porTipo).sort((a, b) => b[1].count - a[1].count).map(([tipo, data]) => {
                                const pct = stats.totalComprobantes > 0 ? (data.count / stats.totalComprobantes) * 100 : 0;
                                return (
                                    <div key={tipo}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-600 font-medium">{TIPO_LABELS[tipo] || tipo}</span>
                                            <span className="text-slate-500">{data.count} doc · ${data.monto.toFixed(2)}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-teal-400 to-cyan-500 h-2 rounded-full transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-white border border-slate-200/60 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-violet-500" />
                        Por Mes
                    </h3>
                    {Object.keys(stats.porMes).length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">Sin datos</p>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(stats.porMes).map(([mes, data]) => {
                                const pct = stats.totalComprobantes > 0 ? (data.count / stats.totalComprobantes) * 100 : 0;
                                return (
                                    <div key={mes}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-600 font-medium">{mes}</span>
                                            <span className="text-slate-500">{data.count} doc · ${data.monto.toFixed(2)}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-violet-400 to-purple-500 h-2 rounded-full transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Resumen de Descargas */}
            <div className="bg-white border border-slate-200/60 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Resumen de Descargas del Robot</h3>
                {descargas.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No hay tareas de descarga registradas</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-slate-500 border-b border-slate-100">
                                    <th className="text-left py-2 font-semibold">Período</th>
                                    <th className="text-left py-2 font-semibold">Tipo</th>
                                    <th className="text-center py-2 font-semibold">Estado</th>
                                    <th className="text-center py-2 font-semibold">Encontrados</th>
                                    <th className="text-center py-2 font-semibold">Descargados</th>
                                    <th className="text-center py-2 font-semibold">Procesados</th>
                                </tr>
                            </thead>
                            <tbody>
                                {descargas.map(d => (
                                    <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                        <td className="py-2 font-medium text-slate-700">{MESES[d.mes - 1]} {d.anio}</td>
                                        <td className="py-2 text-slate-500">{d.tipoDocumento}</td>
                                        <td className="py-2 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold
                                                ${d.estado === 'COMPLETADO' ? 'bg-emerald-100 text-emerald-700'
                                                    : d.estado === 'EN_CURSO' ? 'bg-blue-100 text-blue-700'
                                                        : d.estado === 'ERROR' ? 'bg-red-100 text-red-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                }`}
                                            >
                                                {d.estado}
                                            </span>
                                        </td>
                                        <td className="py-2 text-center text-slate-600">{d.totalEncontrados}</td>
                                        <td className="py-2 text-center text-slate-600">{d.totalDescargados}</td>
                                        <td className="py-2 text-center text-slate-600">{d.totalProcesados}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    return (
        <div className="bg-white border border-slate-200/60 rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} text-white flex items-center justify-center mb-2`}>
                {icon}
            </div>
            <p className="text-xl font-bold text-slate-800">{value}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
        </div>
    );
}
