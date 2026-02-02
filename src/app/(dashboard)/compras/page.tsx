'use client';

import { useEffect, useState } from 'react';
import { Plus, Download, ShoppingCart, RotateCcw } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Compra } from '@/modules/compras/domain/types';
import { useCompras, useComprasMutations } from '@/modules/compras/hooks/useCompras';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { NuevaCompraModal } from '@/modules/compras/ui/components/NuevaCompraModal';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { EstadoBadge } from '@/shared/ui/EstadoBadge';

export default function FacturasCompraPage() {
    const { currentEmpresa } = useEmpresa();
    const { compras, loading, cargarCompras } = useCompras();
    const { } = useComprasMutations();
    const [showModalCompra, setShowModalCompra] = useState(false);

    useEffect(() => {
        if (currentEmpresa) {
            cargarCompras();
        }
    }, [currentEmpresa?.id, cargarCompras]);

    const facturasColumns: Column<Compra>[] = [
        { header: 'Fecha', accessorKey: 'fechaEmision', className: 'text-slate-600' },
        {
            header: 'Proveedor',
            cell: (row) => <span className="font-medium">{row.proveedor?.razonSocial}</span>
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
            cell: (row) => row.estadoRetencion && row.estadoRetencion !== 'NO_APLICA' ? <EstadoBadge estado={row.estadoRetencion} /> : <span className="text-xs text-slate-400">N/A</span>
        },
        {
            header: '',
            className: 'text-right',
            cell: () => <button className="text-slate-400 hover:text-red-500"><RotateCcw size={16} /></button>
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Facturas de Compra</h1>
                    <p className="text-slate-500 text-sm mt-1">Registro y control de facturas recibidas de proveedores.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"><Download size={16} /> Importar XML</button>
                    <button onClick={() => setShowModalCompra(true)} className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm"><Plus size={16} /> Registrar Compra</button>
                </div>
            </div>

            <DataTable
                data={compras}
                columns={facturasColumns}
                loading={loading}
                itemsPerPage={10}
                emptyMessage="No hay compras registradas."
                searchable
                searchPlaceholder="Buscar por proveedor o secuencial..."
            />

            {showModalCompra && (
                <NuevaCompraModal
                    onClose={() => setShowModalCompra(false)}
                    onSave={cargarCompras}
                />
            )}
        </div>
    );
}
