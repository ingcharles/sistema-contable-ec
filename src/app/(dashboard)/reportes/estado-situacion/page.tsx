'use client';

import { useState, useEffect } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { BalanceGeneral } from '@/modules/contabilidad/domain/types';
import { CuentaRow } from '@/modules/contabilidad/ui/components/CuentaRow';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Printer, Download, Sparkles, TrendingUp, FileText } from 'lucide-react';
import { usePdfExport } from '@/modules/shared/hooks/usePdfExport';
import { useExcelExport } from '@/modules/shared/hooks/useExcelExport';
import { Button } from '@/shared/ui/Button';
import { FinancialReportFilter } from '@/modules/contabilidad/ui/components/FinancialReportFilter';
import { ReportHeader } from '@/modules/contabilidad/ui/components/ReportHeader';
import { getBrandColor } from '@/shared/utils/brandColors';

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
    }, [currentEmpresa?.id, fechaFin]);

    const { exportToPdf } = usePdfExport();

    const handleExportPdf = () => {
        if (!balance) return;

        const columns = ['CÓDIGO', 'CUENTA', 'SALDO'];
        const data: any[] = [];

        const addCuenta = (c: any) => {
            data.push([c.codigo, c.nombre, formatMoney(c.saldo)]);
            if (c.subcuentas) c.subcuentas.forEach(addCuenta);
        };

        if (balance.activos) addCuenta(balance.activos);
        if (balance.pasivos) addCuenta(balance.pasivos);
        if (balance.patrimonio) addCuenta(balance.patrimonio);

        data.push(['', 'TOTAL ACTIVOS', formatMoney(balance.totalActivos)]);
        data.push(['', 'TOTAL PASIVOS', formatMoney(balance.totalPasivos)]);
        data.push(['', 'TOTAL PATRIMONIO', formatMoney(balance.totalPatrimonio)]);
        data.push(['', 'TOTAL PASIVO + PATRIMONIO', formatMoney(balance.totalPasivos + balance.totalPatrimonio)]);

        exportToPdf({
            title: 'Estado de Situación Financiera',
            empresa: currentEmpresa ? {
                razonSocial: currentEmpresa.razonSocial,
                ruc: currentEmpresa.ruc,
                direccion: (currentEmpresa as any).direccion || ''
            } : { razonSocial: 'Empresa', ruc: '9999999999001' },
            periodo: {
                inicio: new Date(fechaFin), // Estado de situacion es 'al', pero usaremos fechaFin como inicio y fin para simplificar o solo fin
                fin: new Date(fechaFin)
            },
            columns,
            data,
            headerColor: getBrandColor(currentEmpresa),
            filename: `estado_situacion_${fechaFin}.pdf`
        });
    };

    const { exportToExcel } = useExcelExport();

    const handleExportBalance = () => {
        if (!balance) return;

        const headers = ['CÓDIGO', 'CUENTA', 'SALDO'];
        const data: any[] = [];

        const addCuenta = (c: any) => {
            data.push([c.codigo, c.nombre, formatMoney(c.saldo)]);
            if (c.subcuentas) c.subcuentas.forEach(addCuenta);
        };

        if (balance.activos) addCuenta(balance.activos);
        if (balance.pasivos) addCuenta(balance.pasivos);
        if (balance.patrimonio) addCuenta(balance.patrimonio);

        data.push(['', 'TOTAL ACTIVOS', formatMoney(balance.totalActivos)]);
        data.push(['', 'TOTAL PASIVOS', formatMoney(balance.totalPasivos)]);
        data.push(['', 'TOTAL PATRIMONIO', formatMoney(balance.totalPatrimonio)]);
        data.push(['', 'TOTAL PASIVO + PATRIMONIO', formatMoney(balance.totalPasivos + balance.totalPatrimonio)]);

        exportToExcel({
            title: 'Estado de Situación Financiera',
            empresa: currentEmpresa ? {
                razonSocial: currentEmpresa.razonSocial,
                ruc: currentEmpresa.ruc,
                direccion: (currentEmpresa as any).direccion || ''
            } : { razonSocial: 'Empresa', ruc: '9999999999001' },
            periodo: {
                corte: new Date(fechaFin),
                inicio: new Date(fechaFin),
                fin: new Date(fechaFin)
            },
            headers,
            data,
            filename: `estado_situacion_${fechaFin}.xlsx`
        });
    };

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Estado de Situación Financiera</h1>
                    <p className="text-slate-500 text-sm mt-1">Estructura de activos, pasivos y patrimonio a una fecha de corte.</p>
                </div>
            </div>

            <FinancialReportFilter
                showRange={false}
                showCutoff={true}
                initialValues={{ fechaCorte: fechaFin }}
                onFilter={(vals) => setFechaFin(vals.fechaCorte!)}
                isLoading={loading}
            />

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in print:shadow-none print:border-none">
                {/* Cabecera con datos de la empresa */}
                <ReportHeader
                    empresa={currentEmpresa}
                    titulo="Estado de Situación Financiera"
                    fechaCorte={fechaFin}
                />

                {/* Botones de exportación */}
                <div className="p-4 border-b border-slate-100 flex justify-end gap-2 bg-white print:hidden">
                    <Button variant="secondary" onClick={() => window.print()} className="flex items-center gap-2">
                        <Printer size={18} /> Imprimir
                    </Button>
                    <Button variant="secondary" onClick={handleExportPdf} className="flex items-center gap-2">
                        <FileText size={18} /> PDF
                    </Button>
                    <Button variant="secondary" onClick={handleExportBalance} className="flex items-center gap-2">
                        <Download size={18} /> Excel
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
