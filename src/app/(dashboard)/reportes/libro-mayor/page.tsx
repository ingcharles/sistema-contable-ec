'use client';

import { useState, useEffect, useMemo } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { AsientoContable } from '@/modules/contabilidad/domain/types';
import { CuentaContable } from '@/shared/types';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Filter } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

export default function LibroMayorPage() {
    const { currentEmpresa } = useEmpresa();
    const [asientos, setAsientos] = useState<AsientoContable[]>([]);
    const [planCuentas, setPlanCuentas] = useState<CuentaContable[]>([]);
    const [loading, setLoading] = useState(true);
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [fechaFin, setFechaFin] = useState<string>('');
    const [cuentaMayorSeleccionada, setCuentaMayorSeleccionada] = useState<string>('1.1.01.02');

    useEffect(() => {
        setFechaInicio(`${new Date().getFullYear()}-01-01`);
        setFechaFin(new Date().toISOString().split('T')[0]);
    }, []);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const [dataAsientos, dataPC] = await Promise.all([
                ContabilidadUseCases.listarAsientos(),
                ContabilidadUseCases.listarCuentas()
            ]);
            setAsientos(Array.isArray(dataAsientos) ? dataAsientos : []);
            setPlanCuentas(Array.isArray(dataPC) ? dataPC : []);
        } catch (error) {
            console.error('Error cargando libro mayor:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentEmpresa?.id) loadData();
    }, [currentEmpresa?.id]);

    const datosMayor = useMemo(() => {
        if (!Array.isArray(planCuentas)) return { movimientos: [], saldoInicial: 0, saldoFinal: 0, naturaleza: '' };
        const cuenta = planCuentas.find(c => c.codigo === cuentaMayorSeleccionada);
        if (!cuenta) return { movimientos: [], saldoInicial: 0, saldoFinal: 0, naturaleza: '' };

        let saldoInicial = (cuenta as any).saldo || 0;
        const naturaleza = ['1', '5', '6'].some(prefix => cuenta.codigo.startsWith(prefix)) ? 'DEUDORA' : 'ACREEDORA';

        const safeAsientos = Array.isArray(asientos) ? asientos : [];
        // Calcular saldo inicial real restando movimientos del periodo actual al saldo actual (Simulacion simple para frontend)
        // En un sistema real esto vendría del backend con cortes por fecha
        const movimientosPeriodo = safeAsientos
            .filter(a => a.estado === 'MAYORIZADO' && a.fecha >= fechaInicio && a.fecha <= fechaFin)
            .flatMap(a => a.detalles.map(d => ({ ...d, asiento: a })))
            .filter(d => d.cuentaCodigo === cuentaMayorSeleccionada)
            .sort((a, b) => new Date(a.asiento.fecha).getTime() - new Date(b.asiento.fecha).getTime());

        const totalDebePeriodo = movimientosPeriodo.reduce((acc, m) => acc + m.debe, 0);
        const totalHaberPeriodo = movimientosPeriodo.reduce((acc, m) => acc + m.haber, 0);

        // Retroceder saldo actual para encontrar saldo inicial del periodo seleccionado
        // Nota: Esto asume que el saldo en cuenta es el saldo "AL DÍA".
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
    }, [asientos, cuentaMayorSeleccionada, fechaInicio, fechaFin, planCuentas]);

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Libro Mayor</h1>
                    <p className="text-slate-500 text-sm mt-1">Movimientos y saldos detallados por cuenta contable.</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Desde</label>
                    <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Hasta</label>
                    <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm" />
                </div>
                <div className="flex-1 min-w-[300px]">
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
                <Button variant="secondary" className="flex items-center gap-2" onClick={loadData}>
                    <Filter size={16} /> Consultar
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
                <div className="text-center p-6 pb-4 border-b-2 border-slate-200 bg-slate-50/30">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{currentEmpresa.razonSocial}</h2>
                    <p className="text-xs text-slate-600 mt-1">RUC: {currentEmpresa.ruc}</p>
                    <h3 className="text-lg font-bold text-sri-blue uppercase mt-3">Libro Mayor General</h3>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Del {new Date(fechaInicio + 'T00:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })} al {new Date(fechaFin + 'T00:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
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
        </div>
    );
}
