'use client';

import { useEffect, useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { OrdenCompra } from '@/modules/compras/domain/types';
import { useCompras } from '@/modules/compras/hooks/useCompras';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { NuevaOrdenModal } from '@/modules/compras/ui/components/NuevaOrdenModal';
import { NuevaCompraModal } from '@/modules/compras/ui/components/NuevaCompraModal';
import { DataTable, Column } from '@/shared/ui/DataTable';

export default function OrdenesCompraPage() {
    const { currentEmpresa } = useEmpresa();
    const { ordenes, loading, cargarOrdenes, cargarCompras } = useCompras();
    const [showModalOrden, setShowModalOrden] = useState(false);
    const [showModalCompra, setShowModalCompra] = useState(false);
    const [ordenParaFacturar, setOrdenParaFacturar] = useState<OrdenCompra | undefined>(undefined);

    useEffect(() => {
        if (currentEmpresa) {
            cargarOrdenes();
        }
    }, [currentEmpresa?.id, cargarOrdenes]);

    const handleFacturarOrden = (orden: OrdenCompra) => {
        setOrdenParaFacturar(orden);
        setShowModalCompra(true);
    };

    const columns: Column<OrdenCompra>[] = [
        { header: 'Orden #', accessorKey: 'secuencial' },
        { header: 'Proveedor', cell: (row) => <span>{row.proveedor.razonSocial}</span> },
        { header: 'Total', accessorKey: 'total', className: 'text-right font-bold', cell: (row) => formatMoney(row.total) },
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
                    <h1 className="text-2xl font-bold text-slate-800">Órdenes de Compra</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de pedidos a proveedores antes de su facturación.</p>
                </div>
                <button onClick={() => setShowModalOrden(true)} className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm transition-all active:scale-95"><Plus size={16} /> Nueva Orden</button>
            </div>

            <DataTable
                data={ordenes}
                columns={columns}
                loading={loading}
                itemsPerPage={10}
                emptyMessage="No hay órdenes de compra registradas."
            />

            {showModalOrden && (
                <NuevaOrdenModal
                    onClose={() => setShowModalOrden(false)}
                    onSave={cargarOrdenes}
                />
            )}

            {showModalCompra && (
                <NuevaCompraModal
                    onClose={() => setShowModalCompra(false)}
                    onSave={cargarCompras}
                    ordenPrevia={ordenParaFacturar}
                />
            )}
        </div>
    );
}
