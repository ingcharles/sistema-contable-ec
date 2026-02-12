import { useMemo } from 'react';
import { Download, Printer, FileText } from 'lucide-react';
import { usePdfExport } from '@/modules/shared/hooks/usePdfExport';
import { useExcelExport } from '@/modules/shared/hooks/useExcelExport';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';
import { Empresa } from '@/shared/types';
import { ReportHeader } from './ReportHeader';
import { getBrandColor } from '@/shared/utils/brandColors';

interface BalanceComprobacionTableProps {
    datos: any[];
    fechaInicio: string;
    fechaFin: string;
    loading?: boolean;
    empresa?: Empresa;
}

export const BalanceComprobacionTable = ({ datos, fechaInicio, fechaFin, loading, empresa }: BalanceComprobacionTableProps) => {

    const totales = useMemo(() => {
        return datos.reduce((acc, curr) => ({
            debe: acc.debe + curr.debe,
            haber: acc.haber + curr.haber,
            saldoDeudor: acc.saldoDeudor + (curr.final > 0 ? curr.final : 0),
            saldoAcreedor: acc.saldoAcreedor + (curr.final < 0 ? Math.abs(curr.final) : 0)
        }), { debe: 0, haber: 0, saldoDeudor: 0, saldoAcreedor: 0 });
    }, [datos]);

    const { exportToPdf } = usePdfExport();
    const brandColor = getBrandColor(empresa);

    const handlePdfExport = () => {
        const columns = ['CÓDIGO', 'CUENTA', 'SUMAS DEBE', 'SUMAS HABER', 'SALDOS DEUDOR', 'SALDOS ACREEDOR'];
        const data = datos.map(row => [
            row.codigo,
            row.nombre,
            formatMoney(row.debe),
            formatMoney(row.haber),
            formatMoney(row.final > 0 ? row.final : 0),
            formatMoney(row.final < 0 ? Math.abs(row.final) : 0)
        ]);

        // Agregar totales
        data.push(['', 'TOTALES', formatMoney(totales.debe), formatMoney(totales.haber), formatMoney(totales.saldoDeudor), formatMoney(totales.saldoAcreedor)]);

        exportToPdf({
            title: 'Balance de Comprobación',
            empresa: empresa ? {
                razonSocial: empresa.razonSocial,
                ruc: empresa.ruc,
                direccion: (empresa as any).direccion || ''
            } : { razonSocial: 'Empresa', ruc: '9999999999001' },
            periodo: {
                inicio: new Date(fechaInicio),
                fin: new Date(fechaFin)
            },
            columns,
            data,
            orientation: 'landscape',
            headerColor: brandColor,
            filename: `balance_comprobacion_${fechaInicio}_${fechaFin}.pdf`
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const { exportToExcel } = useExcelExport();

    const handleExportExcel = () => {
        const headers = ['CÓDIGO', 'CUENTA', 'SUMAS DEBE', 'SUMAS HABER', 'SALDO DEUDOR', 'SALDO ACREEDOR'];
        const data = datos.map(row => [
            row.codigo,
            row.nombre,
            formatMoney(row.debe),
            formatMoney(row.haber),
            formatMoney(row.final > 0 ? row.final : 0),
            formatMoney(row.final < 0 ? Math.abs(row.final) : 0)
        ]);

        // Agregar totales
        data.push(['', 'TOTALES CONSOLIDADOS', formatMoney(totales.debe), formatMoney(totales.haber), formatMoney(totales.saldoDeudor), formatMoney(totales.saldoAcreedor)]);

        exportToExcel({
            title: 'Balance de Comprobación',
            empresa: empresa ? {
                razonSocial: empresa.razonSocial,
                ruc: empresa.ruc,
                direccion: (empresa as any).direccion || ''
            } : { razonSocial: 'Empresa', ruc: '9999999999001' },
            periodo: {
                inicio: new Date(fechaInicio),
                fin: new Date(fechaFin)
            },
            headers,
            data,
            headerColor: brandColor,
            filename: `balance_comprobacion_${fechaInicio}_${fechaFin}.xlsx`
        });
    };

    return (
        <div id="reporte-contable" className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-700 print:shadow-none print:border-none print:rounded-none">
            {/* Cabecera con datos de la empresa */}
            {empresa && (
                <ReportHeader
                    empresa={empresa}
                    titulo="Balance de Comprobación de Sumas y Saldos"
                    fechaInicio={fechaInicio}
                    fechaFin={fechaFin}
                />
            )}

            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 print:hidden">
                <h3 className="font-bold text-slate-700">{!empresa && 'Balance de Comprobación de Sumas y Saldos'}</h3>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handlePrint} className="flex items-center gap-2">
                        <Printer size={16} /> Imprimir
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handlePdfExport} className="flex items-center gap-2">
                        <FileText size={16} /> PDF
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleExportExcel} className="flex items-center gap-2">
                        <Download size={16} /> Excel
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead
                        className="text-[10px] uppercase font-black text-white tracking-widest border-b border-slate-100"
                        style={{ backgroundColor: brandColor }}
                    >
                        <tr>
                            <th className="px-8 py-5 text-left">Código</th>
                            <th className="px-8 py-5 text-left">Cuenta Contable</th>
                            <th className="px-8 py-5 text-right">Sumas Debe</th>
                            <th className="px-8 py-5 text-right">Sumas Haber</th>
                            <th className="px-8 py-5 text-right">Saldo Deudor</th>
                            <th className="px-8 py-5 text-right">Saldo Acreedor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">Calculando balance...</td></tr>
                        ) : datos.length === 0 ? (
                            <tr><td colSpan={6} className="p-12 text-center text-slate-400">No hay movimientos en el periodo seleccionado.</td></tr>
                        ) : datos.map((row) => (
                            <tr key={row.codigo} className={`hover:bg-slate-50 transition-colors ${row.codigo.length <= 2 ? 'font-bold bg-slate-50/30' : ''}`}>
                                <td className="px-6 py-3 font-mono text-slate-600">{row.codigo}</td>
                                <td className="px-6 py-3 text-slate-800">{row.nombre}</td>
                                <td className="px-6 py-3 text-right font-mono text-slate-600 bg-slate-50/30">
                                    {formatMoney(row.debe)}
                                </td>
                                <td className="px-6 py-3 text-right font-mono text-slate-600 bg-slate-50/30">
                                    {formatMoney(row.haber)}
                                </td>
                                <td className="px-6 py-3 text-right font-mono text-emerald-600">
                                    {row.final > 0 ? formatMoney(row.final) : '-'}
                                </td>
                                <td className="px-6 py-3 text-right font-mono text-rose-600">
                                    {row.final < 0 ? formatMoney(Math.abs(row.final)) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50/50 border-t-2 border-slate-200">
                        <tr className="font-black text-slate-800 uppercase text-xs">
                            <td colSpan={2} className="px-6 py-4 text-right">TOTALES CONSOLIDADOS</td>
                            <td className="px-6 py-4 text-right">{formatMoney(totales.debe)}</td>
                            <td className="px-6 py-4 text-right">{formatMoney(totales.haber)}</td>
                            <td className="px-6 py-4 text-right text-emerald-700">{formatMoney(totales.saldoDeudor)}</td>
                            <td className="px-6 py-4 text-right text-rose-700">{formatMoney(totales.saldoAcreedor)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};
