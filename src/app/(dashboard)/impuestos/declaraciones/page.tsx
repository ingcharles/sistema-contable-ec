'use client';

import { useState, useEffect } from 'react';
import { Plus, Download } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { FormularioSRI } from '@/modules/impuestos/domain/types';
import { useImpuestos } from '@/modules/impuestos/hooks/useImpuestos';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';
import { DeclaracionModal } from '@/modules/impuestos/ui/components/DeclaracionModal';
import { DataTable, Column } from '@/shared/ui/DataTable';

export default function DeclaracionesPage() {
    const { currentEmpresa } = useEmpresa();
    const { formularios, loading, cargarFormularios } = useImpuestos();
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (currentEmpresa) {
            cargarFormularios('104');
        }
    }, [currentEmpresa?.id, cargarFormularios]);

    const formColumns: Column<FormularioSRI>[] = [
        { header: 'Periodo', accessorKey: 'periodo', className: 'font-bold text-slate-800' },
        {
            header: 'Tipo',
            cell: (row) => <span>Formulario {row.tipo}</span>
        },
        {
            header: 'Ventas',
            accessorKey: 'totalVentas',
            className: 'text-right text-slate-600',
            cell: (row) => formatMoney(row.totalVentas)
        },
        {
            header: 'Compras',
            accessorKey: 'totalCompras',
            className: 'text-right text-slate-600',
            cell: (row) => formatMoney(row.totalCompras)
        },
        {
            header: 'Impuesto a Pagar',
            accessorKey: 'valorAPagar',
            className: 'text-right font-bold text-sri-blue',
            cell: (row) => formatMoney(row.valorAPagar)
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            className: 'text-center',
            cell: (row) => (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">{row.estado}</span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: () => (
                <button className="p-1.5 text-slate-400 hover:text-sri-blue rounded-lg transition-colors">
                    <Download size={18} />
                </button>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Declaraciones de Impuestos</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de formularios 104 (IVA) y 103 (Retenciones).</p>
                </div>
                <Button size="sm" className="flex items-center gap-1 shadow-sm" onClick={() => setShowModal(true)}>
                    <Plus size={14} /> Nueva Declaración
                </Button>
            </div>

            <DataTable
                data={formularios}
                columns={formColumns}
                loading={loading}
                itemsPerPage={5}
                searchable
                searchPlaceholder="Buscar por periodo..."
            />

            {showModal && (
                <DeclaracionModal
                    onClose={() => setShowModal(false)}
                    onSave={() => cargarFormularios('104')}
                    empresaId={currentEmpresa.id}
                />
            )}
        </div>
    );
}
