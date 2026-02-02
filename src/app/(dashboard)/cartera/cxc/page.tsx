'use client';

import { useEffect, useState } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { DocumentoPendiente, TipoCartera } from '@/modules/cartera/domain/types';
import { CarteraUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { EstadoCarteraBadge } from '@/modules/cartera/ui/components/EstadoCarteraBadge';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { CobroPagoModal } from '@/modules/cartera/ui/components/CobroPagoModal';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { generateEstadoCuentaPDF } from '@/shared/utils/pdfGenerator';

export default function CarteraClientesPage() {
    const { currentEmpresa } = useEmpresa();
    const [documentos, setDocumentos] = useState<DocumentoPendiente[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<DocumentoPendiente | null>(null);
    const [showCobroModal, setShowCobroModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const dataDocs = await CarteraUseCases.listarDocumentosPendientes(TipoCartera.CXC);
            setDocumentos(dataDocs);
        } catch (error) {
            console.error('Error cargando cartera clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id]);

    const handleGenerateEstadoCuenta = async (doc: DocumentoPendiente) => {
        try {
            const docsCliente = await CarteraUseCases.listarDocumentosPendientes(TipoCartera.CXC, doc.terceroId);
            const cliente = {
                identificacion: doc.terceroRuc || doc.terceroId,
                razon_social: doc.terceroNombre,
                direccion: doc.terceroDireccion || doc.terceroAddress || '',
                email: doc.terceroEmail || '',
                telefono: doc.terceroTelefono || ''
            };
            generateEstadoCuentaPDF(currentEmpresa, cliente, docsCliente, TipoCartera.CXC);
        } catch (error) {
            console.error('Error generando estado de cuenta:', error);
            alert('Error al generar el estado de cuenta');
        }
    };

    const handleExport = () => {
        if (documentos.length === 0) return;
        const csvContent = ["Tercero", "Documento", "Vencimiento", "Saldo"].join(",") + "\n" +
            documentos.map(d => [`"${d.terceroNombre}"`, d.nroComprobante, d.fechaVencimiento, d.saldoPendiente].join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cartera_clientes_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const docColumns: Column<DocumentoPendiente>[] = [
        { header: 'Cliente', accessorKey: 'terceroNombre', className: 'font-medium text-slate-800' },
        { header: 'Documento', accessorKey: 'nroComprobante', className: 'font-mono text-xs text-slate-500' },
        {
            header: 'Vencimiento',
            cell: (doc) => (
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">{doc.fechaVencimiento}</span>
                    <EstadoCarteraBadge diasVencidos={doc.diasVencidos} />
                </div>
            )
        },
        {
            header: 'Saldo',
            accessorKey: 'saldoPendiente',
            className: 'text-right font-bold text-slate-900',
            cell: (doc) => formatMoney(doc.saldoPendiente)
        },
        {
            header: 'Acciones',
            className: 'text-center',
            cell: (doc) => (
                <div className="flex justify-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleGenerateEstadoCuenta(doc)} className="h-8 w-8 p-0" title="Estado de Cuenta">
                        <FileText size={14} />
                    </Button>
                    <Button
                        variant="secondary" size="sm" onClick={() => { setSelectedDoc(doc); setShowCobroModal(true); }}
                        className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 h-8 px-3"
                    >
                        Cobrar
                    </Button>
                </div>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Cuentas por Cobrar (Clientes)</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de cobros pendientes.</p>
                </div>
            </div>

            <DataTable
                data={documentos}
                columns={docColumns}
                loading={loading}
                itemsPerPage={10}
                searchable
                searchPlaceholder="Buscar cliente..."
                actions={
                    <Button variant="secondary" size="sm" onClick={handleExport} className="flex items-center gap-2">
                        <FileSpreadsheet size={16} /> Exportar Excel
                    </Button>
                }
            />

            {showCobroModal && selectedDoc && (
                <CobroPagoModal
                    documento={selectedDoc}
                    tipo={TipoCartera.CXC}
                    onClose={() => { setShowCobroModal(false); setSelectedDoc(null); }}
                    onSave={loadData}
                />
            )}
        </div>
    );
}
