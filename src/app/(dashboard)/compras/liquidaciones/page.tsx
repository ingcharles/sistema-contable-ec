'use client';

import { useEffect, useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Compra } from '@/modules/compras/domain/types';
import { useCompras } from '@/modules/compras/hooks/useCompras';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { LiquidacionCompraModal } from '@/modules/compras/ui/components/LiquidacionCompraModal';
import { DataTable, Column } from '@/shared/ui/DataTable';

export default function LiquidacionesCompraPage() {
    const { currentEmpresa } = useEmpresa();
    const { compras, loading, cargarCompras } = useCompras();
    const [showModalLiq, setShowModalLiq] = useState(false);

    useEffect(() => {
        if (currentEmpresa) {
            cargarCompras();
        }
    }, [currentEmpresa?.id, cargarCompras]);

    const liquidaciones = compras.filter(c => c.tipoComprobante === '03'); // ISO para Liquidación de Compra

    const columns: Column<Compra>[] = [
        { header: 'Fecha', accessorKey: 'fechaEmision', className: 'text-slate-600' },
        { header: 'Proveedor', cell: (row) => <span className="font-medium">{row.proveedor?.razonSocial}</span> },
        { header: 'Secuencial', accessorKey: 'secuencial' },
        { header: 'Total', accessorKey: 'total', className: 'text-right font-bold', cell: (row) => formatMoney(row.total) },
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Liquidaciones de Compra</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de adquisiciones a personas no obligadas a facturar.</p>
                </div>
                <button onClick={() => setShowModalLiq(true)} className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm"><Plus size={16} /> Nueva Liquidación</button>
            </div>

            <DataTable
                data={liquidaciones}
                columns={columns}
                loading={loading}
                emptyMessage="No hay liquidaciones de compra registradas."
            />

            {showModalLiq && (
                <LiquidacionCompraModal
                    onClose={() => setShowModalLiq(false)}
                    onSave={cargarCompras}
                />
            )}
        </div>
    );
}
