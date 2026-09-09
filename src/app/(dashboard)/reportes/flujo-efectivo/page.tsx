'use client';

import { useState, useEffect } from 'react';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';
import { Download, Printer, ArrowUpRight, ArrowDownRight, Wallet, FileText } from 'lucide-react';
import { usePdfExport } from '@/modules/shared/hooks/usePdfExport';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { useExcelExport } from '@/modules/shared/hooks/useExcelExport';
import { FinancialReportFilter } from '@/modules/contabilidad/ui/components/FinancialReportFilter';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { ReportHeader } from '@/modules/contabilidad/ui/components/ReportHeader';

export default function FlujoEfectivoPage() {
    const { currentEmpresa } = useEmpresa();
    const { exportToExcel } = useExcelExport();
    const { exportToPdf } = usePdfExport();

    const [desde, setDesde] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
    const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await ContabilidadUseCases.obtenerFlujoEfectivo(desde, hasta);
            setData(res);
        } catch (error) {
            console.error('Error al cargar flujo de efectivo:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [desde, hasta]);

    if (!data && loading) return <div className="p-12 text-center text-slate-500">Cargando reporte...</div>;

    const renderSection = (title: string, items: any[], color: string) => (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
            <div className={`px-8 py-5 flex items-center justify-between border-b border-slate-50 ${color}`}>
                <h3 className="text-sm font-black uppercase tracking-widest text-white">{title}</h3>
                <span className="text-white/80 font-bold text-xs">Subtotal Actividad</span>
            </div>
            <div className="divide-y divide-slate-50">
                {items.map((item: any, idx: number) => (
                    <div key={idx} className="px-8 py-4 flex justify-between items-center group hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl ${item.monto >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {item.monto >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                            </div>
                            <span className="font-bold text-slate-700">{item.concepto}</span>
                        </div>
                        <span className={`font-black text-lg ${item.monto >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {formatMoney(item.monto)}
                        </span>
                    </div>
                ))}
            </div>
            <div className="bg-slate-50/50 px-8 py-4 flex justify-between items-center">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Neto Sección</span>
                <span className="text-xl font-black text-slate-800">
                    {formatMoney(items.reduce((acc: any, i: any) => acc + i.monto, 0))}
                </span>
            </div>
        </div>
    );

    const handleExportPdf = () => {
        const columns = ['CONCEPTO', 'MONTO'];
        const rows: any[] = [];

        if (data) {
            rows.push(['SALDO INICIAL', formatMoney(data.saldoInicial)]);

            const addSection = (title: string, items: any[]) => {
                rows.push(['', '']);
                rows.push([title.toUpperCase(), '']);
                items.forEach(i => rows.push([i.concepto, formatMoney(i.monto)]));
                rows.push(['SUBTOTAL', formatMoney(items.reduce((acc: any, i: any) => acc + i.monto, 0))]);
            };

            addSection('Actividades de Operación', data.actividadesOperacion);
            addSection('Actividades de Inversión', data.actividadesInversion);
            addSection('Actividades de Financiación', data.actividadesFinanciacion);

            rows.push(['', '']);
            rows.push(['SALDO FINAL', formatMoney(data.saldoFinal)]);
            rows.push(['MOVIMIENTO NETO', formatMoney(data.saldoFinal - data.saldoInicial)]);
        }

        exportToPdf({
            title: 'Estado de Flujo de Efectivo',
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
            data: rows,
            filename: `flujo_efectivo_${desde}_${hasta}.pdf`
        });
    };

    const handleExportExcel = () => {
        const headers = ['CONCEPTO', 'MONTO'];
        const excelData: any[] = [];

        if (data) {
            excelData.push(['SALDO INICIAL', formatMoney(data.saldoInicial)]);
            excelData.push(['', '']);

            const addSection = (title: string, items: any[]) => {
                excelData.push([title.toUpperCase(), '']);
                items.forEach(i => excelData.push([i.concepto, formatMoney(i.monto)]));
                excelData.push(['SUBTOTAL', formatMoney(items.reduce((acc: any, i: any) => acc + i.monto, 0))]);
                excelData.push(['', '']);
            };

            addSection('Actividades de Operación', data.actividadesOperacion);
            addSection('Actividades de Inversión', data.actividadesInversion);
            addSection('Actividades de Financiación', data.actividadesFinanciacion);

            excelData.push(['SALDO FINAL', formatMoney(data.saldoFinal)]);
            excelData.push(['MOVIMIENTO NETO', formatMoney(data.saldoFinal - data.saldoInicial)]);
        }

        exportToExcel({
            title: 'Estado de Flujo de Efectivo',
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
            data: excelData,
            filename: `flujo_efectivo_${desde}_${hasta}.xlsx`
        });
    };

    return (
        <div className="space-y-8 p-8 pb-32">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Flujo de Efectivo</h1>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                        <Wallet size={16} className="text-indigo-500" />
                        Análisis detallado de la procedencia y uso del efectivo.
                    </p>
                </div>
            </div>

            <div className="print:hidden">
                <FinancialReportFilter
                    initialValues={{ desde, hasta }}
                    onFilter={(vals) => {
                        setDesde(vals.desde!);
                        setHasta(vals.hasta!);
                    }}
                    isLoading={loading}
                />
            </div>

            <div id="reporte-contable" className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-700 print:shadow-none print:border-none print:rounded-none">
                {currentEmpresa && (
                    <ReportHeader
                        empresa={currentEmpresa}
                        titulo="Estado de Flujo de Efectivo"
                        fechaInicio={desde}
                        fechaFin={hasta}
                    />
                )}

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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[40px] text-white shadow-2xl shadow-indigo-200">
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-200">Saldo Inicial</span>
                        <h2 className="text-4xl font-black mt-2">{formatMoney(data?.saldoInicial || 0)}</h2>
                    </div>
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-center">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Movimiento Neto</span>
                        <h2 className={`text-4xl font-black mt-2 ${(data?.saldoFinal - data?.saldoInicial) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatMoney((data?.saldoFinal || 0) - (data?.saldoInicial || 0))}
                        </h2>
                    </div>
                    <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl shadow-slate-200">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Saldo Final</span>
                        <h2 className="text-4xl font-black mt-2 text-indigo-400">{formatMoney(data?.saldoFinal || 0)}</h2>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto">
                    {renderSection('Actividades de Operación', data?.actividadesOperacion || [], 'bg-indigo-600')}
                    {renderSection('Actividades de Inversión', data?.actividadesInversion || [], 'bg-slate-800')}
                    {renderSection('Actividades de Financiación', data?.actividadesFinanciacion || [], 'bg-indigo-900')}
                </div>

            </div>
        </div>
    );
}
