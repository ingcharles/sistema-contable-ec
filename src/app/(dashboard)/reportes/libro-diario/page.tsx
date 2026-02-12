'use client';

import { useState, useEffect } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { FinancialReportFilter } from '@/modules/contabilidad/ui/components/FinancialReportFilter';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Printer, Download, BookOpen, FileText } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { usePdfExport } from '@/modules/shared/hooks/usePdfExport';
import { useExcelExport } from '@/modules/shared/hooks/useExcelExport';
import { ReportHeader } from '@/modules/contabilidad/ui/components/ReportHeader';
import { getBrandColor } from '@/shared/utils/brandColors';

export default function LibroDiarioPage() {
    const { currentEmpresa } = useEmpresa();
    const { exportToExcel } = useExcelExport();
    const { exportToPdf } = usePdfExport();
    const [asientos, setAsientos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [desde, setDesde] = useState(`${new Date().getFullYear()}-01-01`);
    const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0]);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const data = await ContabilidadUseCases.obtenerLibroDiario(desde, hasta);
            setAsientos(data);
        } catch (error) {
            console.error('Error cargando libro diario:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentEmpresa?.id) loadData();
    }, [currentEmpresa?.id, desde, hasta]);

    const handleExportExcel = () => {
        const headers = ['FECHA', 'ASIENTO', 'TIPO', 'GLOSA', 'CUENTA', 'NOMBRE', 'GLOSA DETALLE', 'DEBE', 'HABER'];
        const data: any[] = [];

        asientos.forEach(asiento => {
            asiento.detalles.forEach((det: any) => {
                data.push([
                    new Date(asiento.fecha + 'T00:00:00').toLocaleDateString('es-EC'),
                    asiento.numero,
                    asiento.tipo,
                    asiento.glosa,
                    det.cuentaCodigo,
                    det.cuentaNombre,
                    det.glosa || '',
                    formatMoney(det.debe),
                    formatMoney(det.haber)
                ]);
            });
            // Empty row separator
            data.push([]);
        });

        exportToExcel({
            title: 'Libro Diario General',
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
            filename: `libro_diario_${desde}_${hasta}.xlsx`
        });
    };

    const handleExportPdf = () => {
        const columns = ['FECHA', 'NUM', 'TIPO', 'GLOSA', 'CUENTA', 'DETALLE', 'DEBE', 'HABER'];
        const data: any[] = [];

        asientos.forEach(asiento => {
            asiento.detalles.forEach((det: any) => {
                data.push([
                    new Date(asiento.fecha + 'T00:00:00').toLocaleDateString('es-EC'),
                    asiento.numero,
                    asiento.tipo,
                    asiento.glosa ? asiento.glosa.substring(0, 30) : '',
                    det.cuentaCodigo,
                    det.cuentaNombre,
                    formatMoney(det.debe),
                    formatMoney(det.haber)
                ]);
            });
        });

        exportToPdf({
            title: 'Libro Diario General',
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
            headerColor: getBrandColor(currentEmpresa),
            filename: `libro_diario_${desde}_${hasta}.pdf`
        });
    };

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-8 p-8 max-w-[1400px] mx-auto pb-32">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Libro Diario</h1>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                        <BookOpen size={16} className="text-indigo-500" />
                        Registro cronológico de todas las transacciones contables.
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
                    titulo="Libro Diario General"
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

                <div className="space-y-6 p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-[32px] border border-slate-100 shadow-sm gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
                            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Cargando Asientos...</p>
                        </div>
                    ) : asientos.length === 0 ? (
                        <div className="p-20 text-center bg-white rounded-[32px] border border-slate-100 shadow-sm">
                            <p className="text-slate-400 font-bold">No se encontraron asientos en el rango seleccionado.</p>
                        </div>
                    ) : (
                        asientos.map((asiento) => (
                            <div key={asiento.id} className="bg-slate-50/30 rounded-[32px] border border-slate-100 overflow-hidden">
                                <div className="bg-white p-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-100">
                                            #{asiento.numero}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-sm md:text-base">{asiento.glosa}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">{asiento.tipo}</span>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {new Date(asiento.fecha + 'T00:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead
                                            className="text-[10px] uppercase font-black text-white tracking-widest border-b border-slate-100"
                                            style={{ backgroundColor: getBrandColor(currentEmpresa) }}
                                        >
                                            <tr>
                                                <th className="px-6 py-3 text-left w-32">Código</th>
                                                <th className="px-6 py-3 text-left">Cuenta / Detalle</th>
                                                <th className="px-6 py-3 text-right w-32">Debe</th>
                                                <th className="px-6 py-3 text-right w-32">Haber</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 bg-white">
                                            {asiento.detalles.map((det: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-indigo-50/10 transition-colors">
                                                    <td className="px-6 py-3 font-bold text-slate-500 text-xs">{det.cuentaCodigo}</td>
                                                    <td className="px-6 py-3">
                                                        <div className="font-bold text-slate-700 text-sm">{det.cuentaNombre}</div>
                                                        {det.glosa && <div className="text-[10px] text-slate-400 font-medium italic mt-0.5">{det.glosa}</div>}
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-black text-emerald-600 text-xs">
                                                        {det.debe > 0 ? formatMoney(det.debe) : '-'}
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-black text-rose-500 text-xs">
                                                        {det.haber > 0 ? formatMoney(det.haber) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-slate-50/50 border-t border-slate-100">
                                                <td colSpan={2} className="px-6 py-2 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Asiento</td>
                                                <td className="px-6 py-2 text-right font-black text-emerald-700 text-xs">
                                                    {formatMoney(asiento.detalles.reduce((acc: any, d: any) => acc + d.debe, 0))}
                                                </td>
                                                <td className="px-6 py-2 text-right font-black text-rose-700 text-xs">
                                                    {formatMoney(asiento.detalles.reduce((acc: any, d: any) => acc + d.haber, 0))}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
