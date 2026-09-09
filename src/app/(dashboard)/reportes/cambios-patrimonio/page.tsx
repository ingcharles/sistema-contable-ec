'use client';

import { useState, useEffect } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { FinancialReportFilter } from '@/modules/contabilidad/ui/components/FinancialReportFilter';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Sparkles, Printer, Download, FileText } from 'lucide-react';
import { usePdfExport } from '@/modules/shared/hooks/usePdfExport';
import { useExcelExport } from '@/modules/shared/hooks/useExcelExport';
import { ReportHeader } from '@/modules/contabilidad/ui/components/ReportHeader';
import { Button } from '@/shared/ui/Button';

export default function CambiosPatrimonioPage() {
    const { currentEmpresa } = useEmpresa();
    const [datos, setDatos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [desde, setDesde] = useState(`${new Date().getFullYear()}-01-01`);
    const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0]);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const data = await ContabilidadUseCases.obtenerCambiosPatrimonio(desde, hasta);
            setDatos(data);
        } catch (error) {
            console.error('Error cargando cambios patrimonio:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentEmpresa?.id) loadData();
    }, [currentEmpresa?.id, desde, hasta]);

    if (!currentEmpresa) return null;

    const { exportToPdf } = usePdfExport();

    const handleExportPdf = () => {
        const columns = ['CONCEPTO', 'SALDO INICIAL', 'AUMENTOS/DISMINUCIONES', 'SALDO FINAL'];
        const data = datos.map(row => [
            row.concepto,
            formatMoney(row.saldos.inicial),
            formatMoney(row.capital + row.reservas + row.resultadosAcumulados),
            formatMoney(row.total)
        ]);

        exportToPdf({
            title: 'Estado de Cambios en el Patrimonio',
            empresa: currentEmpresa ? {
                razonSocial: currentEmpresa.razonSocial,
                ruc: currentEmpresa.ruc,
                direccion: (currentEmpresa as any).direccion || ''
            } : { razonSocial: 'Empresa', ruc: '9999999999001' },
            periodo: {
                inicio: new Date(desde),
                fin: new Date(hasta)
            },
            columns,
            data,
            orientation: 'landscape',
            filename: `cambios_patrimonio_${desde}_${hasta}.pdf`
        });
    };

    const { exportToExcel } = useExcelExport();

    const handleExportExcel = () => {
        const headers = ['CONCEPTO', 'SALDO INICIAL', 'AUMENTOS / DISMINUCIONES', 'SALDO FINAL'];
        const data = datos.map(row => [
            row.concepto,
            formatMoney(row.saldos.inicial),
            formatMoney(row.capital + row.reservas + row.resultadosAcumulados),
            formatMoney(row.total)
        ]);

        exportToExcel({
            title: 'Estado de Cambios en el Patrimonio',
            empresa: currentEmpresa ? {
                razonSocial: currentEmpresa.razonSocial,
                ruc: currentEmpresa.ruc,
                direccion: (currentEmpresa as any).direccion || ''
            } : { razonSocial: 'Empresa', ruc: '9999999999001' },
            periodo: {
                inicio: new Date(desde),
                fin: new Date(hasta)
            },
            headers,
            data,
            filename: `cambios_patrimonio_${desde}_${hasta}.xlsx`
        });
    };

    return (
        <div className="space-y-8 p-8 max-w-[1400px] mx-auto pb-32">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Estado de Cambios en el Patrimonio</h1>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                        <Sparkles size={16} className="text-indigo-500" />
                        Evolución del capital, reservas y resultados acumulados.
                    </p>
                </div>
            </div>

            <FinancialReportFilter
                initialValues={{ desde, hasta }}
                onFilter={(vals) => {
                    setDesde(vals.desde!);
                    setHasta(vals.hasta!);
                }}
                isLoading={loading}
            />

            <div id="reporte-contable" className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-700 print:shadow-none print:border-none print:rounded-none">
                <ReportHeader
                    empresa={currentEmpresa}
                    titulo="Estado de Cambios en el Patrimonio"
                    fechaInicio={desde}
                    fechaFin={hasta}
                />

                <div className="p-4 border-b border-slate-100 flex justify-end gap-2 bg-slate-50/50 print:hidden">
                    <Button variant="secondary" size="sm" onClick={() => window.print()} className="flex items-center gap-2">
                        <Printer size={16} /> Imprimir
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleExportPdf} className="flex items-center gap-2">
                        <FileText size={16} /> PDF
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleExportExcel} className="flex items-center gap-2">
                        <Download size={16} /> Excel
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-50 bg-slate-50/30">
                            <tr>
                                <th className="px-8 py-5 text-left">Concepto</th>
                                <th className="px-8 py-5 text-right">Saldo Inicial</th>
                                <th className="px-8 py-5 text-right">Aumentos / Disminuciones</th>
                                <th className="px-8 py-5 text-right bg-indigo-50/30 font-black">Saldo Final</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">Analizando patrimonio...</td></tr>
                            ) : datos.length === 0 ? (
                                <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-bold">No se detectaron cambios en el patrimonio en este periodo.</td></tr>
                            ) : datos.map((row, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50/50 transition-all">
                                    <td className="px-8 py-6 font-black text-slate-700">{row.concepto}</td>
                                    <td className="px-8 py-6 text-right font-bold text-slate-400">{formatMoney(row.saldos.inicial)}</td>
                                    <td className={`px-8 py-6 text-right font-black ${row.capital + row.reservas + row.resultadosAcumulados >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {formatMoney(row.capital + row.reservas + row.resultadosAcumulados)}
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-slate-800 bg-indigo-50/5 text-lg">
                                        {formatMoney(row.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
