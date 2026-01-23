
import { useEffect, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button'; // Keep Button for Export
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { CarteraUseCases } from '@/modules/shared/application/useCases/systemUseCases';

interface AgingReportModalProps {
    tipo: 'CXC' | 'CXP';
    isOpen: boolean;
    onClose: () => void;
}

export const AgingReportModal = ({ tipo, isOpen, onClose }: AgingReportModalProps) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [totales, setTotales] = useState<any>({});

    useEffect(() => {
        if (isOpen) {
            loadReport();
        }
    }, [isOpen, tipo]);

    const loadReport = async () => {
        setLoading(true);
        try {
            const report = await CarteraUseCases.obtenerReporteAging(tipo);
            setData(report.detalles);
            setTotales(report.totales);
        } catch (error) {
            console.error('Error loading aging:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (data.length === 0) return;

        const headers = ["Tercero", "RUC", "Corriente", "31-60 Días", "61-90 Días", "> 90 Días", "Total"];
        const rows = data.map(d => [
            `"${d.tercero_nombre}"`,
            `"${d.tercero_ruc}"`,
            Number(d.corriente),
            Number(d.vencido_30),
            Number(d.vencido_60),
            Number(d.vencido_90),
            Number(d.total)
        ]);

        const csvContent = headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `aging_${tipo}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Reporte de Antigüedad de Saldos (${tipo})`} size="xl">
            <div className="space-y-4">
                <div className="flex justify-end">
                    <Button variant="secondary" size="sm" onClick={handleExport} disabled={loading || data.length === 0} className="flex items-center gap-2">
                        <FileSpreadsheet size={16} /> Exportar CSV
                    </Button>
                </div>

                <div className="overflow-x-auto border rounded-lg shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b">
                            <tr>
                                <th className="px-4 py-3">Tercero</th>
                                <th className="px-4 py-3 text-right">Corriente</th>
                                <th className="px-4 py-3 text-right text-orange-600">31-60 Días</th>
                                <th className="px-4 py-3 text-right text-red-500">61-90 Días</th>
                                <th className="px-4 py-3 text-right text-red-700">&gt; 90 Días</th>
                                <th className="px-4 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-8 text-slate-500">Cargando reporte...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-slate-500">No hay datos pendientes</td></tr>
                            ) : (
                                <>
                                    {data.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-2 font-medium text-slate-800">
                                                {row.tercero_nombre}
                                                <div className="text-xs text-slate-400 font-normal">{row.tercero_ruc}</div>
                                            </td>
                                            <td className="px-4 py-2 text-right">{formatMoney(Number(row.corriente))}</td>
                                            <td className="px-4 py-2 text-right text-orange-600 font-medium">{formatMoney(Number(row.vencido_30))}</td>
                                            <td className="px-4 py-2 text-right text-red-500 font-medium">{formatMoney(Number(row.vencido_60))}</td>
                                            <td className="px-4 py-2 text-right text-red-700 font-bold">{formatMoney(Number(row.vencido_90))}</td>
                                            <td className="px-4 py-2 text-right font-bold bg-slate-50">{formatMoney(Number(row.total))}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-200">
                                        <td className="px-4 py-3 text-right">TOTALES</td>
                                        <td className="px-4 py-3 text-right">{formatMoney(totales.corriente || 0)}</td>
                                        <td className="px-4 py-3 text-right">{formatMoney(totales.vencido_30 || 0)}</td>
                                        <td className="px-4 py-3 text-right">{formatMoney(totales.vencido_60 || 0)}</td>
                                        <td className="px-4 py-3 text-right">{formatMoney(totales.vencido_90 || 0)}</td>
                                        <td className="px-4 py-3 text-right">{formatMoney(totales.total || 0)}</td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <ModalFooter
                    onCancel={onClose}
                    cancelLabel="Cerrar"
                />
            </div>
        </Modal>
    );
};
