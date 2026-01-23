'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Filter, Layers, FileText, BookOpen, TrendingUp, List, Edit2, Trash2, Download, Printer, Sparkles } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { AsientoContable, CentroCosto, BalanceGeneral, EstadoResultados } from '@/modules/contabilidad/domain/types';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { CentroCostoModal } from '@/modules/contabilidad/ui/components/CentroCostoModal';
import { PlanCuentasTree } from '@/modules/contabilidad/ui/components/PlanCuentasTree';
import { LibroDiarioTable } from '@/modules/contabilidad/ui/components/LibroDiarioTable';
import { BalanceComprobacionTable } from '@/modules/contabilidad/ui/components/BalanceComprobacionTable';
import { CuentaRow } from '@/modules/contabilidad/ui/components/CuentaRow';
import { Button } from '@/shared/ui/Button';
import { CuentaContable } from '@/shared/types';

export default function ContabilidadPage() {
    const { currentEmpresa } = useEmpresa();
    const [activeTab, setActiveTab] = useState<'plan' | 'diario' | 'mayor' | 'comprobacion' | 'balance' | 'resultados' | 'costos'>('diario');
    const [asientos, setAsientos] = useState<AsientoContable[]>([]);
    const [centros, setCentros] = useState<CentroCosto[]>([]);
    const [showModalCentro, setShowModalCentro] = useState(false);
    const [planCuentas, setPlanCuentas] = useState<CuentaContable[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [fechaFin, setFechaFin] = useState<string>('');
    const [cuentaMayorSeleccionada, setCuentaMayorSeleccionada] = useState<string>('1.1.01.02');

    useEffect(() => {
        setMounted(true);
        setFechaInicio(`${new Date().getFullYear()}-01-01`);
        setFechaFin(new Date().toISOString().split('T')[0]);
    }, []);

    // Estados Financieros
    const [balance, setBalance] = useState<BalanceGeneral | null>(null);
    const [estadoResultados, setEstadoResultados] = useState<EstadoResultados | null>(null);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const [dataAsientos, dataCentros, balanceData, resultadosData, dataPC] = await Promise.all([
                ContabilidadUseCases.listarAsientos(),
                ContabilidadUseCases.listarCentrosCostos(),
                ContabilidadUseCases.obtenerBalanceGeneral(fechaFin),
                ContabilidadUseCases.obtenerEstadoResultados(fechaInicio, fechaFin),
                ContabilidadUseCases.listarCuentas()
            ]);
            setAsientos(Array.isArray(dataAsientos) ? dataAsientos : []);
            setCentros(dataCentros);
            setBalance(balanceData);
            setEstadoResultados(resultadosData);
            setPlanCuentas(Array.isArray(dataPC) ? dataPC : []);
        } catch (error) {
            console.error('Error al cargar datos contables:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted && currentEmpresa?.id) {
            loadData();
        }
    }, [currentEmpresa?.id, mounted]);

    const datosMayor = useMemo(() => {
        if (!Array.isArray(planCuentas)) return { movimientos: [], saldoInicial: 0, saldoFinal: 0, naturaleza: '' };
        const cuenta = planCuentas.find(c => c.codigo === cuentaMayorSeleccionada);
        if (!cuenta) return { movimientos: [], saldoInicial: 0, saldoFinal: 0, naturaleza: '' };

        let saldoInicial = (cuenta as any).saldo || 0;
        const naturaleza = ['1', '5', '6'].some(prefix => cuenta.codigo.startsWith(prefix)) ? 'DEUDORA' : 'ACREEDORA';

        const safeAsientos = Array.isArray(asientos) ? asientos : [];
        const movimientosPeriodo = safeAsientos
            .filter(a => a.estado === 'MAYORIZADO' && a.fecha >= fechaInicio && a.fecha <= fechaFin)
            .flatMap(a => a.detalles.map(d => ({ ...d, asiento: a })))
            .filter(d => d.cuentaCodigo === cuentaMayorSeleccionada)
            .sort((a, b) => new Date(a.asiento.fecha).getTime() - new Date(b.asiento.fecha).getTime());

        const totalDebePeriodo = movimientosPeriodo.reduce((acc, m) => acc + m.debe, 0);
        const totalHaberPeriodo = movimientosPeriodo.reduce((acc, m) => acc + m.haber, 0);

        if (naturaleza === 'DEUDORA') {
            saldoInicial = ((cuenta as any).saldo || 0) - (totalDebePeriodo - totalHaberPeriodo);
        } else {
            saldoInicial = ((cuenta as any).saldo || 0) - (totalHaberPeriodo - totalDebePeriodo);
        }

        let saldoAcumulado = saldoInicial;
        const filas = movimientosPeriodo.map(mov => {
            if (naturaleza === 'DEUDORA') saldoAcumulado += (mov.debe - mov.haber);
            else saldoAcumulado += (mov.haber - mov.debe);
            return {
                fecha: mov.asiento.fecha,
                asiento: mov.asiento.numero,
                glosa: mov.asiento.glosa,
                debe: mov.debe,
                haber: mov.haber,
                saldo: saldoAcumulado
            };
        });
        return { movimientos: filas, saldoInicial, saldoFinal: saldoAcumulado, naturaleza };
    }, [asientos, cuentaMayorSeleccionada, fechaInicio, fechaFin]);

    const handleExportBalance = () => {
        if (!balance) return;

        const headers = ['Código', 'Cuenta', 'Saldo'];
        const rows: any[] = [];

        const addCuenta = (c: any) => {
            rows.push([c.codigo, `"${c.nombre}"`, c.saldo]);
            if (c.subcuentas) c.subcuentas.forEach(addCuenta);
        };

        addCuenta(balance.activos);
        rows.push(['', 'TOTAL ACTIVOS', balance.totalActivos]);
        addCuenta(balance.pasivos);
        rows.push(['', 'TOTAL PASIVOS', balance.totalPasivos]);
        addCuenta(balance.patrimonio);
        rows.push(['', 'TOTAL PATRIMONIO', balance.totalPatrimonio]);
        rows.push(['', 'TOTAL PASIVO + PATRIMONIO', balance.totalPasivos + balance.totalPatrimonio]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `balance_general_${currentEmpresa?.razonSocial.replace(/\s+/g, '_')}_${fechaFin}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportResultados = () => {
        if (!estadoResultados) return;

        const headers = ['Código', 'Cuenta', 'Saldo'];
        const rows: any[] = [];

        const addCuenta = (c: any) => {
            rows.push([c.codigo, `"${c.nombre}"`, c.saldo]);
            if (c.subcuentas) c.subcuentas.forEach(addCuenta);
        };

        addCuenta(estadoResultados.ingresos);
        addCuenta(estadoResultados.gastos);
        rows.push(['', 'UTILIDAD OPERATIVA', estadoResultados.utilidadOperativa]);
        rows.push(['', 'UTILIDAD NETA', estadoResultados.utilidadNeta]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `estado_resultados_${currentEmpresa?.razonSocial.replace(/\s+/g, '_')}_${fechaInicio}_${fechaFin}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!currentEmpresa || !mounted) return null;

    const empresaId = currentEmpresa.id;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Contabilidad General</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión del ciclo contable, libros oficiales y control de costos.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto">
                    <button onClick={() => setActiveTab('diario')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'diario' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <BookOpen size={16} /> Libro Diario
                    </button>
                    <button onClick={() => setActiveTab('mayor')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'mayor' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Layers size={16} /> Libro Mayor
                    </button>
                    <button onClick={() => setActiveTab('comprobacion')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'comprobacion' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <FileText size={16} /> Bal. Comprobación
                    </button>
                    <button onClick={() => setActiveTab('balance')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'balance' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <FileText size={16} /> Balance General
                    </button>
                    <button onClick={() => setActiveTab('resultados')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'resultados' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <TrendingUp size={16} /> Estado Resultados
                    </button>
                    <button onClick={() => setActiveTab('costos')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'costos' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <TrendingUp size={16} /> Centros Costos
                    </button>
                    <button onClick={() => setActiveTab('plan')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'plan' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <List size={16} /> Plan Cuentas
                    </button>
                </div>
            </div>

            {(activeTab === 'mayor' || activeTab === 'comprobacion' || activeTab === 'diario') && (
                <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Desde</label>
                        <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Hasta</label>
                        <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm" />
                    </div>

                    {activeTab === 'mayor' && (
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Cuenta Contable</label>
                            <select
                                value={cuentaMayorSeleccionada}
                                onChange={e => setCuentaMayorSeleccionada(e.target.value)}
                                className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
                            >
                                {planCuentas.filter(c => c.nivel >= 4).map(c => (
                                    <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <Button variant="secondary" className="flex items-center gap-2" onClick={loadData}>
                        <Filter size={16} /> Actualizar
                    </Button>
                </div>
            )}

            {activeTab === 'mayor' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
                    {/* Cabecera con datos de la empresa */}
                    <div className="text-center p-6 pb-4 border-b-2 border-slate-200 bg-slate-50/30">
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{currentEmpresa?.razonSocial}</h2>
                        <p className="text-xs text-slate-600 mt-1">RUC: {currentEmpresa?.ruc}</p>
                        <p className="text-xs text-slate-500 mt-1">{currentEmpresa?.direccionMatriz}</p>
                        <h3 className="text-lg font-bold text-sri-blue uppercase mt-3">Libro Mayor General</h3>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            Del {new Date(fechaInicio + 'T00:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })} al {new Date(fechaFin + 'T00:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">(Expresado en Dólares de los Estados Unidos de América)</p>
                    </div>

                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">Cuenta: {planCuentas.find(c => c.codigo === cuentaMayorSeleccionada)?.nombre}</h3>
                        <span className="text-xs bg-white border px-2 py-1 rounded">Naturaleza: {datosMayor.naturaleza}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 w-32">Fecha</th>
                                    <th className="px-6 py-3 w-32">Asiento</th>
                                    <th className="px-6 py-3">Detalle / Glosa</th>
                                    <th className="px-6 py-3 text-right">Debe</th>
                                    <th className="px-6 py-3 text-right">Haber</th>
                                    <th className="px-6 py-3 text-right">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr className="bg-yellow-50/50 font-medium text-slate-600">
                                    <td className="px-6 py-3 text-xs">{fechaInicio}</td>
                                    <td className="px-6 py-3">-</td>
                                    <td className="px-6 py-3">SALDO INICIAL</td>
                                    <td className="px-6 py-3 text-right">-</td>
                                    <td className="px-6 py-3 text-right">-</td>
                                    <td className="px-6 py-3 text-right">{formatMoney(datosMayor.saldoInicial)}</td>
                                </tr>
                                {datosMayor.movimientos.map((mov, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-6 py-3 text-slate-600 whitespace-nowrap">{mov.fecha}</td>
                                        <td className="px-6 py-3 text-sri-blue hover:underline cursor-pointer">{mov.asiento}</td>
                                        <td className="px-6 py-3 text-slate-700">{mov.glosa}</td>
                                        <td className="px-6 py-3 text-right font-mono text-slate-600">{mov.debe > 0 ? formatMoney(mov.debe) : '-'}</td>
                                        <td className="px-6 py-3 text-right font-mono text-slate-600">{mov.haber > 0 ? formatMoney(mov.haber) : '-'}</td>
                                        <td className="px-6 py-3 text-right font-bold text-slate-800">{formatMoney(mov.saldo)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'comprobacion' && (
                <BalanceComprobacionTable
                    asientos={asientos}
                    fechaInicio={fechaInicio}
                    fechaFin={fechaFin}
                    loading={loading}
                    empresa={currentEmpresa}
                    planCuentas={planCuentas}
                />
            )}

            {activeTab === 'diario' && (
                <LibroDiarioTable
                    asientos={asientos}
                    loading={loading}
                    empresa={currentEmpresa}
                    fechaInicio={fechaInicio}
                    fechaFin={fechaFin}
                />
            )}

            {activeTab === 'costos' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <div>
                            <h3 className="font-bold text-slate-800">Centros de Costos y Proyectos</h3>
                            <p className="text-xs text-slate-500">Estructura para distribución de gastos e ingresos.</p>
                        </div>
                        <Button onClick={() => setShowModalCentro(true)} className="flex items-center gap-2">
                            <Plus size={16} /> Nuevo Centro
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 w-32">Código</th>
                                    <th className="px-6 py-3">Nombre del Centro / Proyecto</th>
                                    <th className="px-6 py-3 text-center">Nivel</th>
                                    <th className="px-6 py-3 text-center">Estado</th>
                                    <th className="px-6 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {centros.map((centro) => (
                                    <tr key={centro.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-3 font-mono font-bold text-slate-700">{centro.codigo}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                {centro.nivel > 1 && <div className="w-4 border-l-2 border-b-2 border-slate-300 h-4 rounded-bl-md ml-2"></div>}
                                                <span className={centro.nivel === 1 ? 'font-bold text-slate-800' : 'text-slate-600'}>{centro.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-center text-xs bg-slate-50 rounded-lg">{centro.nivel}</td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${centro.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {centro.activo ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button className="p-1.5 text-slate-500 hover:text-sri-blue hover:bg-blue-50 rounded transition-colors"><Edit2 size={16} /></button>
                                                <button className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'plan' && (
                <PlanCuentasTree />
            )}

            {activeTab === 'balance' && (
                <>
                    {/* Filtros para Balance General */}
                    <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha de Corte</label>
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={e => setFechaFin(e.target.value)}
                                className="border border-slate-200 rounded px-3 py-1.5 text-sm"
                            />
                        </div>
                        <Button variant="secondary" className="flex items-center gap-2" onClick={loadData}>
                            <Filter size={16} /> Actualizar
                        </Button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
                        {/* Cabecera con datos de la empresa */}
                        <div className="text-center p-8 pb-6 border-b-2 border-slate-200 bg-slate-50/30">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{currentEmpresa?.razonSocial}</h2>
                            <p className="text-sm text-slate-600 mt-1">RUC: {currentEmpresa?.ruc}</p>
                            <p className="text-sm text-slate-500 mt-1">{currentEmpresa?.direccionMatriz}</p>
                            <h3 className="text-xl font-bold text-sri-blue uppercase mt-4">Estado de Situación Financiera</h3>
                            <p className="text-slate-500 font-medium mt-1">Al {new Date(fechaFin + 'T00:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            <p className="text-sm text-slate-400 mt-1">(Expresado en Dólares de los Estados Unidos de América)</p>
                        </div>

                        {/* Botones de exportación */}
                        <div className="p-4 border-b border-slate-100 flex justify-end gap-2 bg-white">
                            <Button variant="secondary" className="flex items-center gap-2">
                                <Printer size={18} /> Imprimir
                            </Button>
                            <Button variant="secondary" onClick={handleExportBalance} className="flex items-center gap-2">
                                <Download size={18} /> Exportar Excel
                            </Button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sri-blue"></div>
                            </div>
                        ) : balance ? (
                            <div className="p-8">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-y border-slate-200">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Código</th>
                                            <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Cuenta</th>
                                            <th className="py-3 px-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-40">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <CuentaRow cuenta={balance.activos} />
                                        <CuentaRow cuenta={balance.pasivos} />
                                        <CuentaRow cuenta={balance.patrimonio} />
                                    </tbody>
                                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                        <tr>
                                            <td colSpan={2} className="py-4 px-4 text-right font-black text-slate-800 uppercase text-sm">Total Activos</td>
                                            <td className="py-4 px-4 text-right font-black text-sri-blue text-sm">{formatMoney(balance.totalActivos)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={2} className="py-4 px-4 text-right font-black text-slate-800 uppercase text-sm">Total Pasivos + Patrimonio</td>
                                            <td className="py-4 px-4 text-right font-black text-sri-blue text-sm">{formatMoney(balance.totalPasivos + balance.totalPatrimonio)}</td>
                                        </tr>
                                    </tfoot>
                                </table>

                                {balance.ecuacionContable ? (
                                    <div className="mt-8 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center gap-2 text-emerald-700 font-bold text-sm">
                                        <Sparkles size={18} /> La ecuación contable está cuadrada correctamente.
                                    </div>
                                ) : (
                                    <div className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center gap-2 text-rose-700 font-bold text-sm">
                                        <TrendingUp size={18} /> Advertencia: La ecuación contable no cuadra.
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </>
            )}


            {activeTab === 'resultados' && (
                <>
                    {/* Filtros para Estado de Resultados */}
                    <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Desde</label>
                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={e => setFechaInicio(e.target.value)}
                                className="border border-slate-200 rounded px-3 py-1.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Hasta</label>
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={e => setFechaFin(e.target.value)}
                                className="border border-slate-200 rounded px-3 py-1.5 text-sm"
                            />
                        </div>
                        <Button variant="secondary" className="flex items-center gap-2" onClick={loadData}>
                            <Filter size={16} /> Actualizar
                        </Button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
                        {/* Cabecera con datos de la empresa */}
                        <div className="text-center p-8 pb-6 border-b-2 border-slate-200 bg-slate-50/30">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{currentEmpresa?.razonSocial}</h2>
                            <p className="text-sm text-slate-600 mt-1">RUC: {currentEmpresa?.ruc}</p>
                            <p className="text-sm text-slate-500 mt-1">{currentEmpresa?.direccionMatriz}</p>
                            <h3 className="text-xl font-bold text-sri-blue uppercase mt-4">Estado de Resultados Integral</h3>
                            <p className="text-slate-500 font-medium mt-1">
                                Del {new Date(fechaInicio + 'T00:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })} al {new Date(fechaFin + 'T00:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-sm text-slate-400 mt-1">(Expresado en Dólares de los Estados Unidos de América)</p>
                        </div>

                        {/* Botones de exportación */}
                        <div className="p-4 border-b border-slate-100 flex justify-end gap-2 bg-white">
                            <Button variant="secondary" className="flex items-center gap-2">
                                <Printer size={18} /> Imprimir
                            </Button>
                            <Button variant="secondary" onClick={handleExportResultados} className="flex items-center gap-2">
                                <Download size={18} /> Exportar Excel
                            </Button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sri-blue"></div>
                            </div>
                        ) : estadoResultados ? (
                            <div className="p-8">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-y border-slate-200">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Código</th>
                                            <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Cuenta</th>
                                            <th className="py-3 px-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-40">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <CuentaRow cuenta={estadoResultados.ingresos} />
                                        <CuentaRow cuenta={estadoResultados.gastos} />
                                    </tbody>
                                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                        <tr>
                                            <td colSpan={2} className="py-4 px-4 text-right font-black text-slate-800 uppercase text-sm">Utilidad Operativa</td>
                                            <td className={`py-4 px-4 text-right font-black text-sm ${estadoResultados.utilidadOperativa >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {formatMoney(estadoResultados.utilidadOperativa)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan={2} className="py-4 px-4 text-right font-black text-slate-900 uppercase text-lg border-t border-slate-300">Utilidad Neta del Ejercicio</td>
                                            <td className={`py-4 px-4 text-right font-black text-lg border-t border-slate-300 ${estadoResultados.utilidadNeta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {formatMoney(estadoResultados.utilidadNeta)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : null}
                    </div>
                </>
            )}

            {showModalCentro && (
                <CentroCostoModal
                    onClose={() => setShowModalCentro(false)}
                    onSave={loadData}
                    empresaId={empresaId}
                />
            )}
        </div>
    );
}
