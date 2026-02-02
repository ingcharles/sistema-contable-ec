'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Bodega } from '@/modules/inventario/domain/types';
import { InventarioUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { BodegaModal } from '@/modules/inventario/ui/components/BodegaModal';
import { Column, DataTable } from '@/shared/ui/DataTable';
import { Button } from '@/shared/ui/Button';

export default function BodegasPage() {
    const { currentEmpresa } = useEmpresa();
    const [bodegas, setBodegas] = useState<Bodega[]>([]);
    const [selectedBodega, setSelectedBodega] = useState<Bodega | null>(null);
    const [showModalBod, setShowModalBod] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const dataBodegas = await InventarioUseCases.listarBodegas();
            setBodegas(dataBodegas);
        } catch (error) {
            console.error('Error cargando bodegas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id]);

    const handleDeleteBodega = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar esta bodega?')) {
            try {
                await InventarioUseCases.eliminarBodega(id);
                loadData();
            } catch (error) {
                alert('Error al eliminar bodega');
            }
        }
    };

    const bodegaColumns: Column<Bodega>[] = [
        { header: 'Código', accessorKey: 'codigo', className: 'font-mono font-bold text-slate-700' },
        { header: 'Nombre', accessorKey: 'nombre', className: 'font-medium text-slate-800' },
        { header: 'Responsable', accessorKey: 'responsable', className: 'text-slate-600 text-xs' },
        { header: 'Ubicación', accessorKey: 'ubicacion', className: 'text-slate-500 text-xs' },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => { setSelectedBodega(row); setShowModalBod(true); }}
                        className="text-sri-blue hover:underline text-xs"
                    >
                        Editar
                    </button>
                    <button
                        onClick={() => handleDeleteBodega(row.id)}
                        className="text-red-500 hover:underline text-xs"
                    >
                        Eliminar
                    </button>
                </div>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Bodegas y Sucursales</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de almacenes físicos.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-end mb-4">
                    <Button onClick={() => setShowModalBod(true)} className="text-xs px-3 py-1.5 flex items-center gap-1">
                        <Plus size={14} /> Nueva Bodega
                    </Button>
                </div>
                <DataTable
                    data={bodegas}
                    columns={bodegaColumns}
                    loading={loading}
                    itemsPerPage={10}
                />
            </div>

            {showModalBod && (
                <BodegaModal
                    bodega={selectedBodega || undefined}
                    onClose={() => { setShowModalBod(false); setSelectedBodega(null); }}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                />
            )}
        </div>
    );
}
