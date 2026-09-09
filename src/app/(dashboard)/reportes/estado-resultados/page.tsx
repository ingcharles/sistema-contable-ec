'use client';

import { useState, useEffect } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { EstadoResultados } from '@/modules/contabilidad/domain/types';
import { CuentaRow } from '@/modules/contabilidad/ui/components/CuentaRow';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Printer, Download, FileText } from 'lucide-react';
import { usePdfExport } from '@/modules/shared/hooks/usePdfExport';
import { useExcelExport } from '@/modules/shared/hooks/useExcelExport';
import { Button } from '@/shared/ui/Button';
import { FinancialReportFilter } from '@/modules/contabilidad/ui/components/FinancialReportFilter';
import { ReportHeader } from '@/modules/contabilidad/ui/components/ReportHeader';
import { getBrandColor } from '@/shared/utils/brandColors';

export default function EstadoResultadosPage() {
    const { currentEmpresa } = useEmpresa();
    const [estadoResultados, setEstadoResultados] = useState<EstadoResultados | null>(null);
    const [loading, setLoading] = useState(true);
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [fechaFin, setFechaFin] = useState<string>('');

    useEffect(() => {
        setFechaInicio(`${new Date().getFullYear()}-01-01`);
        setFechaFin(new Date().toISOString().split('T')[0]);
    }, []);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const resultadosData = await ContabilidadUseCases.obtenerEstadoResultados(fechaInicio, fechaFin);
            setEstadoResultados(resultadosData);
        } catch (error) {
            console.error('Error cargando estado resultados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentEmpresa?.id && fechaInicio && fechaFin) loadData();
    }, [currentEmpresa?.id, fechaInicio, fechaFin]);

    const { exportToPdf } = usePdfExport();

    const handleExportPdf = () => {
        if (!estadoResultados) return;

        const columns = ['CÓDIGO', 'CUENTA', 'SALDO'];
        const data: any[] = [];

        const addCuenta = (c: any) => {
            data.push([c.codigo, c.nombre, formatMoney(c.saldo)]);
            if (c.subcuentas) c.subcuentas.forEach(addCuenta);
        };

        if (estadoResultados.ingresos) addCuenta(estadoResultados.ingresos);
        if (estadoResultados.gastos) addCuenta(estadoResultados.gastos);

        data.push(['', 'UTILIDAD OPERATIVA', formatMoney(estadoResultados.utilidadOperativa)]);
        data.push(['', 'UTILIDAD NETA', formatMoney(estadoResultados.utilidadNeta)]);

        exportToPdf({
            title: 'Estado de Resultados Integral',
            empresa: currentEmpresa ? {
                razonSocial: currentEmpresa.razonSocial,
                ruc: currentEmpresa.ruc,
                direccion: (currentEmpresa as any).direccion || ''
            } : { razonSocial: 'Empresa', ruc: '9999999999001' },
            periodo: {
                inicio: new Date(fechaInicio),
                fin: new Date(fechaFin)
            },
            columns,
            data,
            headerColor: getBrandColor(currentEmpresa),
            filename: `estado_resultados_${fechaInicio}_${fechaFin}.pdf`
        });
    };

    const { exportToExcel } = useExcelExport();

    const handleExportResultados = () => {
        if (!estadoResultados) return;

        const headers = ['CÓDIGO', 'CUENTA', 'SALDO'];
        const data: any[] = [];

        const addCuenta = (c: any) => {
            data.push([c.codigo, c.nombre, formatMoney(c.saldo)]);
            if (c.subcuentas) c.subcuentas.forEach(addCuenta);
        };

        if (estadoResultados.ingresos) addCuenta(estadoResultados.ingresos);
        if (estadoResultados.gastos) addCuenta(estadoResultados.gastos);

        data.push(['', 'UTILIDAD OPERATIVA', formatMoney(estadoResultados.utilidadOperativa)]);
        data.push(['', 'UTILIDAD NETA', formatMoney(estadoResultados.utilidadNeta)]);

        exportToExcel({
            title: 'Estado de Resultados Integral',
            empresa: currentEmpresa ? {
                razonSocial: currentEmpresa.razonSocial,
                ruc: currentEmpresa.ruc,
                direccion: (currentEmpresa as any).direccion || ''
            } : { razonSocial: 'Empresa', ruc: '9999999999001' },
            periodo: {
                inicio: new Date(fechaInicio),
                fin: new Date(fechaFin)
            },
            headers,
            data,
            headerColor: getBrandColor(currentEmpresa),
            filename: `estado_resultados_${fechaInicio}_${fechaFin}.xlsx`
        });
    };

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Estado de Resultados Integral</h1>
                    <p className="text-slate-500 text-sm mt-1">Reporte detallado de ingresos, costos y gastos del periodo.</p>
                </div>
            </div>

            <FinancialReportFilter
                initialValues={{ desde: fechaInicio, hasta: fechaFin }}
                onFilter={(vals) => {
                    setFechaInicio(vals.desde!);
                    setFechaFin(vals.hasta!);
                }}
                isLoading={loading}
            />

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in print:shadow-none print:border-none">
                {/* Cabecera con datos de la empresa */}
                <ReportHeader
                    empresa={currentEmpresa}
                    titulo="Estado de Resultados Integral"
                    fechaInicio={fechaInicio}
                    fechaFin={fechaFin}
                />

                {/* Botones de exportación */}
                <div className="p-4 border-b border-slate-100 flex justify-end gap-2 bg-white print:hidden">
                    <Button variant="secondary" onClick={() => window.print()} className="flex items-center gap-2">
                        <Printer size={18} /> Imprimir
                    </Button>
                    <Button variant="secondary" onClick={handleExportPdf} className="flex items-center gap-2">
                        <FileText size={18} /> PDF
                    </Button>
                    <Button variant="secondary" onClick={handleExportResultados} className="flex items-center gap-2">
                        <Download size={18} /> Excel
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
        </div>
    );
}
