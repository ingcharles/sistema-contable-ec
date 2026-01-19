'use client';

import { useEffect, useState } from 'react';
import { Plus, Download, ShoppingCart, FileText, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Compra, OrdenCompra } from '@/modules/compras/domain/types';
import { InMemoryCompraRepository } from '@/modules/compras/infrastructure/CompraRepository';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { NuevaCompraModal } from '@/modules/compras/ui/components/NuevaCompraModal';
import { LiquidacionCompraModal } from '@/modules/compras/ui/components/LiquidacionCompraModal';
import { NuevaOrdenModal } from '@/modules/compras/ui/components/NuevaOrdenModal';
import { DataTable, Column } from '@/shared/ui/DataTable';

const RetencionBadge = ({ estado }: { estado: string }) => {
    if (estado === 'EMITIDA') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200"><CheckCircle2 size={10} /> Retenida</span>;
    if (estado === 'PENDIENTE') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse"><AlertCircle size={10} /> Pendiente</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">No Aplica</span>;
};

export default function ComprasPage() {
    const { currentEmpresa } = useEmpresa();
    const [activeTab, setActiveTab] = useState<'facturas' | 'ordenes'>('facturas');

    const [compras, setCompras] = useState<Compra[]>([]);
    const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);

    const [showModalCompra, setShowModalCompra] = useState(false);
    const [showModalLiq, setShowModalLiq] = useState(false);
    const [showModalOrden, setShowModalOrden] = useState(false);
    const [ordenParaFacturar, setOrdenParaFacturar] = useState<OrdenCompra | undefined>(undefined);

    const loadData = async () => {
        if (!currentEmpresa) return;
        const repo = new InMemoryCompraRepository();
        const [dataCompras, dataOrdenes] = await Promise.all([
            repo.getAll(currentEmpresa.id),
            repo.getOrdenes(currentEmpresa.id)
        ]);
        setCompras(dataCompras);
        setOrdenes(dataOrdenes);
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id]);

    const handleFacturarOrden = (orden: OrdenCompra) => {
        setOrdenParaFacturar(orden);
        setShowModalCompra(true);
    };

    const facturasColumns: Column<Compra>[] = [
        { header: 'Fecha', accessorKey: 'fechaEmision', className: 'text-slate-600' },
        {
            header: 'Proveedor',
            cell: (row) => <span className="font-medium">{row.proveedor.razonSocial}</span>
        },
        { header: 'Comprobante', accessorKey: 'secuencial' },
        {
            header: 'Total',
            accessorKey: 'total',
            className: 'text-right font-bold',
            cell: (row) => formatMoney(row.total)
        },
        {
            header: 'Retención',
            accessorKey: 'estadoRetencion',
            className: 'text-center',
            cell: (row) => <RetencionBadge estado={row.estadoRetencion} />
        },
        {
            header: '',
            className: 'text-right',
            cell: () => <button className="text-slate-400 hover:text-red-500"><RotateCcw size={16} /></button>
        }
    ];

    const ordenesColumns: Column<OrdenCompra>[] = [
        { header: 'Orden #', accessorKey: 'secuencial' },
        {
            header: 'Proveedor',
            cell: (row) => <span>{row.proveedor.razonSocial}</span>
        },
        {
            header: 'Total',
            accessorKey: 'total',
            className: 'text-right font-bold',
            cell: (row) => formatMoney(row.total)
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            className: 'text-center',
            cell: (row) => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.estado === 'FACTURADA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {row.estado}
                </span>
            )
        },
        {
            header: 'Acción',
            className: 'text-center',
            cell: (row) => (
                row.estado === 'PENDIENTE' ? (
                    <button onClick={() => handleFacturarOrden(row)} className="text-blue-600 text-xs font-bold hover:underline">Facturar</button>
                ) : null
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Compras y Gastos</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de aprovisionamiento, facturas recibidas y retenciones.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('facturas')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'facturas' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <ShoppingCart size={16} /> Facturas
                        </button>
                        <button onClick={() => setActiveTab('ordenes')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'ordenes' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <FileText size={16} /> Órdenes Compra
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'facturas' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowModalLiq(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                            <FileText size={16} /> Liquidación Compra
                        </button>
                        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"><Download size={16} /> Importar XML</button>
                        <button onClick={() => { setOrdenParaFacturar(undefined); setShowModalCompra(true); }} className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm"><Plus size={16} /> Registrar Compra</button>
                    </div>
                    <DataTable
                        data={compras}
                        columns={facturasColumns}
                        itemsPerPage={10}
                        emptyMessage="No hay compras registradas."
                    />
                </div>
            )}

            {activeTab === 'ordenes' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowModalOrden(true)} className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm transition-all active:scale-95"><Plus size={16} /> Nueva Orden</button>
                    </div>
                    <DataTable
                        data={ordenes}
                        columns={ordenesColumns}
                        itemsPerPage={10}
                        emptyMessage="No hay órdenes de compra."
                    />
                </div>
            )}

            {showModalCompra && (
                <NuevaCompraModal
                    onClose={() => setShowModalCompra(false)}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                    ordenPrevia={ordenParaFacturar}
                />
            )}

            {showModalLiq && (
                <LiquidacionCompraModal
                    onClose={() => setShowModalLiq(false)}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                />
            )}

            {showModalOrden && (
                <NuevaOrdenModal
                    onClose={() => setShowModalOrden(false)}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                />
            )}
        </div>
    );
}
