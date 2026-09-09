'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { CategoriaProducto } from '@/modules/inventario/domain/types';
import { InventarioUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { CategoriaModal } from '@/modules/inventario/ui/components/CategoriaModal';
import { DataTable } from '@/shared/ui/DataTable';
import { Button } from '@/shared/ui/Button';

export default function CategoriasPage() {
    const { currentEmpresa } = useEmpresa();
    const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
    const [selectedCategoria, setSelectedCategoria] = useState<CategoriaProducto | null>(null);
    const [showModalCat, setShowModalCat] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const response = await InventarioUseCases.listarCategorias();
            setCategorias(response.data || []);
        } catch (error) {
            console.error('Error cargando categorias:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id]);

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Categorías de Productos</h1>
                    <p className="text-slate-500 text-sm mt-1">Clasificación y cuentas contables por línea.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <DataTable
                    data={categorias}
                    loading={loading}
                    columns={[
                        {
                            header: 'Nombre',
                            accessorKey: 'nombre',
                            cell: (row) => (
                                <div>
                                    <div className="font-bold text-slate-700">{row.nombre}</div>
                                    {(row as any).descripcion && (
                                        <div className="text-xs text-slate-500">{(row as any).descripcion}</div>
                                    )}
                                </div>
                            )
                        },
                        {
                            header: 'Cuenta Inventario',
                            accessorKey: 'cuentaInventario',
                            cell: (row) => (
                                <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                                    {row.cuentaInventario}
                                </span>
                            )
                        },
                        {
                            header: 'Cuenta Costo Venta',
                            accessorKey: 'cuentaCostoVenta',
                            cell: (row) => (
                                <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                                    {row.cuentaCostoVenta}
                                </span>
                            )
                        },
                        {
                            header: 'Cuenta Venta',
                            accessorKey: 'cuentaVenta',
                            cell: (row) => (
                                <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                                    {row.cuentaVenta}
                                </span>
                            )
                        },
                        {
                            header: 'Acciones',
                            className: 'text-right',
                            cell: (row) => (
                                <button
                                    onClick={() => { setSelectedCategoria(row); setShowModalCat(true); }}
                                    className="text-xs text-sri-blue hover:underline"
                                >
                                    Editar
                                </button>
                            )
                        }
                    ]}
                    itemsPerPage={10}
                    searchable
                    searchKeys={['nombre']}
                    searchPlaceholder="Buscar categoría..."
                    actions={
                        <Button onClick={() => setShowModalCat(true)} className="text-xs px-3 py-1.5 flex items-center gap-1">
                            <Plus size={14} /> Nueva Categoría
                        </Button>
                    }
                />
            </div>

            {showModalCat && (
                <CategoriaModal
                    onClose={() => { setShowModalCat(false); setSelectedCategoria(null); }}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                    categoriaEditar={selectedCategoria}
                />
            )}
        </div>
    );
}
