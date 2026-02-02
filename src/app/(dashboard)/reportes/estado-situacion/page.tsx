'use client';

import { useState, useEffect } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { BalanceGeneral } from '@/modules/contabilidad/domain/types';
import { CuentaRow } from '@/modules/contabilidad/ui/components/CuentaRow';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Filter, Printer, Download, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

export default function EstadoSituacionPage() {
    const { currentEmpresa } = useEmpresa();
    const [balance, setBalance] = useState<BalanceGeneral | null>(null);
    const [loading, setLoading] = useState(true);
    const [fechaFin, setFechaFin] = useState<string>('');

    useEffect(() => {
        setFechaFin(new Date().toISOString().split('T')[0]);
    }, []);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const balanceData = await ContabilidadUseCases.obtenerBalanceGeneral(fechaFin);
            setBalance(balanceData);
        } catch (error) {
            console.error('Error cargando balance general:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentEmpresa?.id) loadData();
    }, [currentEmpresa?.id]);

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

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Estado de Situación Financiera</h1>
                    <p className="text-slate-500 text-sm mt-1">Balance General.</p>
                </div>
            </div>

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
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{currentEmpresa.razonSocial}</h2>
                    <p className="text-sm text-slate-600 mt-1">RUC: {currentEmpresa.ruc}</p>
                    <p className="text-sm text-slate-500 mt-1">{currentEmpresa.direccionMatriz}</p>
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
        </div>
    );
}
