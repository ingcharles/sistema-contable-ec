'use client';

import { useState, useEffect } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { FinancialReportFilter } from '@/modules/contabilidad/ui/components/FinancialReportFilter';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Library, Printer, Download, FileText } from 'lucide-react';
import { usePdfExport } from '@/modules/shared/hooks/usePdfExport';
import { useExcelExport } from '@/modules/shared/hooks/useExcelExport';
import { ReportHeader } from '@/modules/contabilidad/ui/components/ReportHeader';
import { Button } from '@/shared/ui/Button';

export default function LibroMayorPage() {
    const { currentEmpresa } = useEmpresa();
    const [reporte, setReporte] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [desde, setDesde] = useState(`${new Date().getFullYear()}-01-01`);
    const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0]);
    const [cuentaCodigo, setCuentaCodigo] = useState('');

    const loadData = async () => {
        if (!currentEmpresa || !cuentaCodigo) return;
        setLoading(true);
        try {
            const data = await ContabilidadUseCases.obtenerLibroMayor(desde, hasta, cuentaCodigo);
            setReporte(data);
        } catch (error) {
            console.error('Error cargando libro mayor:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentEmpresa?.id && cuentaCodigo) {
            loadData();
        } else {
            setReporte(null);
        }
    }, [currentEmpresa?.id, desde, hasta, cuentaCodigo]);

    const { exportToPdf } = usePdfExport();

    const handleExportPdf = () => {
        if (!reporte) return;

        const columns = ['FECHA', 'ASIENTO', 'GLOSA', 'DEBE', 'HABER', 'SALDO'];
        const data = reporte.movimientos.map((m: any) => [
            new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-EC'),
            m.numero,
            m.asientoGlosa + (m.detalleGlosa && m.detalleGlosa !== m.asientoGlosa ? ` - ${m.detalleGlosa}` : ''),
            formatMoney(m.debe),
            formatMoney(m.haber),
            formatMoney(m.saldo)
        ]);

        // Agregar resumen
        data.push(['', '', 'SALDO INICIAL', '', '', formatMoney(reporte.saldoInicial)]);
        data.push(['', '', 'SALDO FINAL', '', '', formatMoney(reporte.saldoFinal)]);

        exportToPdf({
            title: `Libro Mayor: ${cuentaCodigo}`,
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
            filename: `libro_mayor_${cuentaCodigo}_${desde}_${hasta}.pdf`
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const { exportToExcel } = useExcelExport();

    const handleExportExcel = () => {
        if (!reporte) return;
        const headers = ['FECHA', 'ASIENTO', 'GLOSA ASIENTO', 'GLOSA DETALLE', 'DEBE', 'HABER', 'SALDO'];
        const data = reporte.movimientos.map((m: any) => [
            new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-EC'),
            m.numero,
            m.asientoGlosa,
            m.detalleGlosa || '',
            formatMoney(m.debe),
            formatMoney(m.haber),
            formatMoney(m.saldo)
        ]);

        // Agregar resumen
        data.push(['', '', 'SALDO INICIAL', '', '', '', formatMoney(reporte.saldoInicial)]);
        data.push(['', '', 'SALDO FINAL', '', '', '', formatMoney(reporte.saldoFinal)]);

        exportToExcel({
            title: `Libro Mayor: ${cuentaCodigo}`,
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
            filename: `libro_mayor_${cuentaCodigo}_${desde}_${hasta}.xlsx`
        });
    };

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-8 p-8 max-w-[1400px] mx-auto pb-32">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Libro Mayor</h1>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                        <Library size={16} className="text-indigo-500" />
                        Detalle de movimientos acumulados por cuenta contable.
                    </p>
                </div>
            </div>

            <div className="print:hidden">
                <FinancialReportFilter
                    showAccount={true}
                    initialValues={{ desde, hasta, cuentaCodigo }}
                    onFilter={(vals) => {
                        setDesde(vals.desde!);
                        setHasta(vals.hasta!);
                        setCuentaCodigo(vals.cuentaCodigo!);
                    }}
                    isLoading={loading}
                />
            </div>

            {reporte ? (
                <div id="reporte-contable" className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-700 print:shadow-none print:border-none print:rounded-none">
                    <ReportHeader
                        empresa={currentEmpresa}
                        titulo={`Libro Mayor: ${reporte.cuentaCodigo}`}
                        fechaInicio={desde}
                        fechaFin={hasta}
                    />

                    <div className="p-4 border-b border-slate-100 flex justify-end gap-2 bg-slate-50/50 print:hidden">
                        <Button variant="secondary" size="sm" onClick={handlePrint} className="flex items-center gap-2">
                            <Printer size={16} /> Imprimir
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleExportPdf} className="flex items-center gap-2">
                            <FileText size={16} /> PDF
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleExportExcel} className="flex items-center gap-2">
                            <Download size={16} /> Excel
                        </Button>
                    </div>

                    <div className="p-10 border-b border-slate-100 bg-slate-50/10 flex flex-wrap justify-between items-end gap-6 print:p-4">
                        <div>
                            <span className="text-[10px] uppercase font-black text-indigo-500 tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 print:hidden">Cuenta Seleccionada</span>
                            <h2 className="text-3xl font-black text-slate-800 mt-3 print:text-xl print:mt-1">{reporte.cuentaCodigo}</h2>
                            <p className="text-slate-400 font-bold mt-1 print:text-[10px]">Movimientos detallados del periodo</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-8 print:p-3 print:rounded-xl print:gap-4 print:shadow-none print:border-slate-200">
                            <div className="text-center border-r border-slate-100 pr-8 print:pr-4">
                                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Saldo Inicial</span>
                                <div className="text-lg font-black text-slate-600 mt-1 print:text-sm">{formatMoney(reporte.saldoInicial)}</div>
                            </div>
                            <div className="text-center">
                                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Saldo Final</span>
                                <div className={`text-2xl font-black mt-1 print:text-base ${reporte.saldoFinal >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                    {formatMoney(reporte.saldoFinal)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-50 bg-slate-50/30">
                                <tr>
                                    <th className="px-8 py-5 text-left">Fecha</th>
                                    <th className="px-8 py-5 text-left italic">Asiento</th>
                                    <th className="px-8 py-5 text-left">Descripción / Referencia</th>
                                    <th className="px-8 py-5 text-right bg-emerald-50/30">Debe</th>
                                    <th className="px-8 py-5 text-right bg-rose-50/30">Haber</th>
                                    <th className="px-8 py-5 text-right font-black">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {reporte.movimientos.map((m: any, idx: number) => (
                                    <tr key={idx} className="group hover:bg-slate-50/50 transition-all duration-300">
                                        <td className="px-8 py-5 text-slate-500 font-bold text-sm">
                                            {new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-EC')}
                                        </td>
                                        <td className="px-8 py-5 text-xs font-black text-slate-400 italic">#{m.numero}</td>
                                        <td className="px-8 py-5 overflow-hidden max-w-xs">
                                            <div className="font-black text-slate-700 truncate">{m.asientoGlosa}</div>
                                            {m.detalleGlosa && m.detalleGlosa !== m.asientoGlosa && (
                                                <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{m.detalleGlosa}</div>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right font-black text-emerald-600 bg-emerald-50/10">
                                            {m.debe > 0 ? formatMoney(m.debe) : '-'}
                                        </td>
                                        <td className="px-8 py-5 text-right font-black text-rose-500 bg-rose-50/10">
                                            {m.haber > 0 ? formatMoney(m.haber) : '-'}
                                        </td>
                                        <td className={`px-8 py-5 text-right font-black text-sm ${m.saldo >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                            {formatMoney(m.saldo)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : !loading && (
                <div className="flex flex-col items-center justify-center p-32 bg-white rounded-[40px] border border-slate-100 shadow-sm border-dashed">
                    <div className="h-20 w-20 bg-slate-50 rounded-[24px] flex items-center justify-center text-slate-300 mb-6 group-hover:scale-110 transition-transform">
                        <Library size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Seleccione una cuenta</h3>
                    <p className="text-slate-300 font-bold max-w-[300px] text-center mt-2">Ingrese el código de la cuenta contable para ver su historial completo</p>
                </div>
            )}
        </div>
    );
}
