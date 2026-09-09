'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftRight, Plus, Warehouse, FileText } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { InventarioUseCases } from '@/modules/shared/application/useCases/systemUseCases';

// Modal
import { TransferenciaModal } from '@/modules/inventario/ui/components/TransferenciaModal';

export default function TransferenciasPage() {
    const { currentEmpresa } = useEmpresa();
    const [transferencias, setTransferencias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const res = await InventarioUseCases.listarTransferencias();
            setTransferencias(res || []);
        } catch (error) {
            console.error('Error al cargar transferencias:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentEmpresa]);

    const columns: Column<any>[] = [
        { header: 'Fecha', accessorKey: 'fecha', cell: (row) => new Date(row.fecha).toLocaleDateString() },
        { header: 'Referencia', accessorKey: 'referencia', className: 'font-mono font-bold' },
        {
            header: 'Origen',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Warehouse size={14} className="text-red-500" />
                    <span>{row.bodegaOrigen}</span>
                </div>
            )
        },
        {
            header: 'Destino',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Warehouse size={14} className="text-green-500" />
                    <span>{row.bodegaDestino}</span>
                </div>
            )
        },
        {
            header: 'Items',
            accessorKey: 'cantidadItems',
            className: 'text-center'
        },
        {
            header: 'Estado',
            cell: () => (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
                    Completado
                </span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-center',
            cell: () => (
                <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg">
                    <FileText size={18} />
                </button>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white">
                            <ArrowLeftRight size={24} />
                        </div>
                        Transferencias entre Bodegas
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gestione el movimiento de inventario entre sus diferentes establecimientos.</p>
                </div>
                <Button onClick={() => setModalOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                    <Plus size={18} />
                    Nueva Transferencia
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <DataTable
                    data={transferencias}
                    columns={columns}
                    loading={loading}
                    searchable
                    searchPlaceholder="Buscar por referencia o bodega..."
                />
            </div>

            {modalOpen && (
                <TransferenciaModal
                    onClose={() => setModalOpen(false)}
                    onSave={() => {
                        setModalOpen(false);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}
