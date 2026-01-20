import { useMemo } from 'react';
import { Download, Printer } from 'lucide-react';
import { AsientoContable } from '../../domain/types';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';
import { Empresa, CuentaContable } from '@/shared/types';

interface BalanceComprobacionTableProps {
    asientos: AsientoContable[];
    fechaInicio: string;
    fechaFin: string;
    loading?: boolean;
    empresa?: Empresa;
    planCuentas: CuentaContable[];
}

export const BalanceComprobacionTable = ({ asientos, fechaInicio, fechaFin, loading, empresa, planCuentas }: BalanceComprobacionTableProps) => {

    const datosBalance = useMemo(() => {
        // Filter seats by date range and status
        const asientosPeriodo = asientos.filter(a =>
            a.estado === 'MAYORIZADO' &&
            a.fecha >= fechaInicio &&
            a.fecha <= fechaFin
        );

        // Calculate sums per account
        const movimientos: Record<string, { debe: number, haber: number }> = {};

        asientosPeriodo.forEach(asiento => {
            asiento.detalles.forEach(det => {
                if (!movimientos[det.cuentaCodigo]) {
                    movimientos[det.cuentaCodigo] = { debe: 0, haber: 0 };
                }
                movimientos[det.cuentaCodigo].debe += det.debe;
                movimientos[det.cuentaCodigo].haber += det.haber;
            });
        });

        // Map to Plan de Cuentas to get names and structure
        // Only show accounts with movement or balance
        return planCuentas.map(cuenta => {
            const mov = movimientos[cuenta.codigo] || { debe: 0, haber: 0 };
            const saldoInicial = cuenta.saldo || 0; // Assuming this is initial balance

            // Determine nature
            const esDeudora = ['1', '5', '6'].some(prefix => cuenta.codigo.startsWith(prefix));

            let saldoFinal = 0;
            if (esDeudora) {
                saldoFinal = saldoInicial + mov.debe - mov.haber;
            } else {
                saldoFinal = saldoInicial + mov.haber - mov.debe;
            }

            return {
                ...cuenta,
                debePeriodo: mov.debe,
                haberPeriodo: mov.haber,
                saldoFinal,
                esDeudora
            };
        }).filter(c => c.nivel >= 3 || (c.debePeriodo > 0 || c.haberPeriodo > 0 || c.saldoFinal !== 0)); // Filter empty high-level accounts if needed, or keep all
    }, [asientos, fechaInicio, fechaFin]);

    const totales = useMemo(() => {
        return datosBalance.reduce((acc, curr) => ({
            debe: acc.debe + curr.debePeriodo,
            haber: acc.haber + curr.haberPeriodo,
            saldoDeudor: acc.saldoDeudor + (curr.esDeudora && curr.saldoFinal > 0 ? curr.saldoFinal : 0),
            saldoAcreedor: acc.saldoAcreedor + (!curr.esDeudora && curr.saldoFinal > 0 ? curr.saldoFinal : 0)
        }), { debe: 0, haber: 0, saldoDeudor: 0, saldoAcreedor: 0 });
    }, [datosBalance]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Cabecera con datos de la empresa */}
            {empresa && (
                <div className="text-center p-6 pb-4 border-b-2 border-slate-200 bg-slate-50/30">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{empresa.razonSocial}</h2>
                    <p className="text-xs text-slate-600 mt-1">RUC: {empresa.ruc}</p>
                    <p className="text-xs text-slate-500 mt-1">{empresa.direccionMatriz}</p>
                    <h3 className="text-lg font-bold text-sri-blue uppercase mt-3">Balance de Comprobación de Sumas y Saldos</h3>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Del {new Date(fechaInicio + 'T00:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })} al {new Date(fechaFin + 'T00:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">(Expresado en Dólares de los Estados Unidos de América)</p>
                </div>
            )}

            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-700">{!empresa && 'Balance de Comprobación de Sumas y Saldos'}</h3>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="flex items-center gap-2">
                        <Printer size={16} /> Imprimir
                    </Button>
                    <Button variant="secondary" size="sm" className="flex items-center gap-2">
                        <Download size={16} /> Excel
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">Código</th>
                            <th className="px-6 py-3">Cuenta</th>
                            <th className="px-6 py-3 text-right bg-slate-100/50">Sumas Debe</th>
                            <th className="px-6 py-3 text-right bg-slate-100/50">Sumas Haber</th>
                            <th className="px-6 py-3 text-right">Saldo Deudor</th>
                            <th className="px-6 py-3 text-right">Saldo Acreedor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">Calculando balance...</td></tr>
                        ) : datosBalance.length === 0 ? (
                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">No hay movimientos en el periodo seleccionado.</td></tr>
                        ) : datosBalance.map((row) => (
                            <tr key={row.codigo} className={`hover:bg-slate-50 transition-colors ${row.nivel <= 2 ? 'font-bold bg-slate-50/30' : ''}`}>
                                <td className="px-6 py-3 font-mono text-slate-600">{row.codigo}</td>
                                <td className="px-6 py-3 text-slate-800">{row.nombre}</td>
                                <td className="px-6 py-3 text-right font-mono text-slate-600 bg-slate-50/30">
                                    {row.debePeriodo > 0 ? formatMoney(row.debePeriodo) : '-'}
                                </td>
                                <td className="px-6 py-3 text-right font-mono text-slate-600 bg-slate-50/30">
                                    {row.haberPeriodo > 0 ? formatMoney(row.haberPeriodo) : '-'}
                                </td>
                                <td className="px-6 py-3 text-right font-mono font-medium text-slate-800">
                                    {row.esDeudora && row.saldoFinal > 0 ? formatMoney(row.saldoFinal) : '-'}
                                </td>
                                <td className="px-6 py-3 text-right font-mono font-medium text-slate-800">
                                    {!row.esDeudora && row.saldoFinal > 0 ? formatMoney(row.saldoFinal) : '-'}
                                </td>
                            </tr>
                        ))}
                        {/* Totals Row */}
                        {!loading && datosBalance.length > 0 && (
                            <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                                <td colSpan={2} className="px-6 py-3 text-right">TOTALES:</td>
                                <td className="px-6 py-3 text-right">{formatMoney(totales.debe)}</td>
                                <td className="px-6 py-3 text-right">{formatMoney(totales.haber)}</td>
                                <td className="px-6 py-3 text-right">{formatMoney(totales.saldoDeudor)}</td>
                                <td className="px-6 py-3 text-right">{formatMoney(totales.saldoAcreedor)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
