'use client';

import { useState, useEffect } from 'react';
import { FileText, CheckCircle2, RefreshCw, ExternalLink, FileSpreadsheet, Inbox } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { ComprobanteRecibido } from '@/modules/buzon/domain/types';
import { useBuzon } from '@/modules/buzon/hooks/useBuzon';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';

export default function BuzonPage() {
    const { currentEmpresa } = useEmpresa();
    const { comprobantes, loading, importing, cargarComprobantes, sincronizarSRI } = useBuzon();
    const [activeTab, setActiveTab] = useState<'TODOS' | 'RECIBIDO' | 'PROCESADO'>('TODOS');

    useEffect(() => {
        if (currentEmpresa?.id) {
            cargarComprobantes(currentEmpresa.id);
        }
    }, [currentEmpresa?.id, cargarComprobantes]);

    const filteredComprobantes = activeTab === 'TODOS'
        ? comprobantes
        : comprobantes.filter(c => c.estado === activeTab);

    const handleExport = () => {
        if (filteredComprobantes.length === 0) return;

        const headers = ['Fecha Emisión', 'RUC Emisor', 'Razón Social Emisor', 'Tipo', 'Secuencial', 'Monto Total', 'Estado'];
        const rows = filteredComprobantes.map(c => [
            c.fechaEmision,
            c.rucEmisor,
            `"${c.razonSocialEmisor.replace(/"/g, '""')}"`,
            c.tipo,
            c.secuencial,
            c.montoTotal,
            c.estado
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `buzon_xml_${currentEmpresa?.razonSocial.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportar = async () => {
        if (!currentEmpresa) return;
        try {
            await sincronizarSRI(currentEmpresa.id, '2023-10-01', '2023-10-31');
        } catch (error) {
            console.error('Error al importar:', error);
        }
    };

    const columns: Column<ComprobanteRecibido>[] = [
        { header: 'Fecha Emisión', accessorKey: 'fechaEmision', sortable: true },
        {
            header: 'Emisor',
            cell: (comp) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-800">{comp.razonSocialEmisor}</span>
                    <span className="text-xs text-slate-500 font-mono">{comp.rucEmisor}</span>
                </div>
            ),
            sortable: true,
            accessorKey: 'razonSocialEmisor'
        },
        {
            header: 'Documento',
            cell: (comp) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400">FACTURA</span>
                    <span className="font-mono text-slate-600">{comp.secuencial}</span>
                </div>
            )
        },
        {
            header: 'Total',
            cell: (comp) => formatMoney(comp.montoTotal),
            className: 'text-right font-bold',
            sortable: true,
            accessorKey: 'montoTotal'
        },
        {
            header: 'Estado',
            cell: (comp) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${comp.estado === 'PROCESADO' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {comp.estado}
                </span>
            ),
            className: 'text-center'
        },
        {
            header: 'Acciones',
            cell: () => (
                <div className="flex justify-center gap-2">
                    <button className="p-1.5 text-slate-400 hover:text-sri-blue hover:bg-blue-50 rounded" title="Ver XML"><FileText size={16} /></button>
                    <button className="p-1.5 text-slate-400 hover:text-sri-blue hover:bg-blue-50 rounded" title="Asociar a Gasto"><ExternalLink size={16} /></button>
                </div>
            ),
            className: 'text-center'
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Buzón XML (SRI)</h1>
                    <p className="text-slate-500 text-sm mt-1">Recepción automática de facturas y retenciones desde el SRI.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('TODOS')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'TODOS' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Inbox size={16} /> Todos
                    </button>
                    <button onClick={() => setActiveTab('RECIBIDO')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'RECIBIDO' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <RefreshCw size={16} /> Pendientes
                    </button>
                    <button onClick={() => setActiveTab('PROCESADO')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'PROCESADO' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <CheckCircle2 size={16} /> Procesados
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-top-2">
                <Button onClick={handleImportar} disabled={importing} className="flex items-center gap-2 shadow-sm">
                    <RefreshCw size={18} className={importing ? 'animate-spin' : ''} />
                    {importing ? 'Sincronizando...' : 'Sincronizar con SRI'}
                </Button>
                <div className="h-4 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="text-xs font-bold text-slate-500 uppercase">Total: {comprobantes.length}</span>
                    </div>
                </div>
            </div>


            <div className="space-y-4">
                <DataTable
                    data={filteredComprobantes}
                    columns={columns}
                    loading={loading}
                    itemsPerPage={5}
                    searchable
                    searchPlaceholder="Buscar por RUC o Razón Social..."
                    searchKeys={['rucEmisor', 'razonSocialEmisor', 'secuencial']}
                    actions={
                        <Button variant="secondary" size="sm" onClick={handleExport} className="flex items-center gap-2">
                            <FileSpreadsheet size={16} /> Exportar
                        </Button>
                    }
                />
            </div>
        </div>
    );
}
