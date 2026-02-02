'use client';

import { useEffect, useState } from 'react';
import { Package, AlertTriangle, Download, Plus, History, Tag } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Producto } from '@/modules/inventario/domain/types';
import { InventarioUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { KardexModal } from '@/modules/inventario/ui/components/KardexModal';
import { ProductoModal } from '@/modules/inventario/ui/components/ProductoModal';
import { Column, DataTable } from '@/shared/ui/DataTable';
import { Button } from '@/shared/ui/Button';

export default function KardexPage() {
    const { currentEmpresa } = useEmpresa();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
    const [productoEditar, setProductoEditar] = useState<Producto | null>(null);
    const [showModalProd, setShowModalProd] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const dataProductos = await InventarioUseCases.listarProductos();
            setProductos(dataProductos.data || []);
        } catch (error) {
            console.error('Error cargando productos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id]);

    const handleExport = () => {
        if (productos.length === 0) return;

        const headers = ['Código', 'Producto', 'Categoría', 'Stock', 'Stock Mínimo', 'Costo Promedio', 'Precio Venta'];
        const rows = productos.map(p => [
            p.codigoPrincipal,
            `"${p.nombre.replace(/"/g, '""')}"`,
            `"${(p.categoriaNombre || '').replace(/"/g, '""')}"`,
            p.stockActual,
            p.stockMinimo,
            p.costoPromedio,
            p.precioVenta
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `inventario_${currentEmpresa?.razonSocial.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const productoColumns: Column<Producto>[] = [
        {
            header: 'Producto',
            accessorKey: 'nombre',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-800">{row.nombre}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1 rounded">{row.codigoPrincipal}</span>
                        {row.grabaIva && <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded border border-blue-100">IVA 15%</span>}
                    </div>
                </div>
            )
        },
        {
            header: 'Categoría',
            accessorKey: 'categoriaNombre',
            cell: (row) => (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                    <Tag size={10} /> {row.categoriaNombre}
                </span>
            )
        },
        {
            header: 'Stock',
            accessorKey: 'stockActual',
            className: 'text-center',
            cell: (row) => (
                <div className="flex flex-col items-center">
                    <span className={`font-bold ${row.stockActual <= row.stockMinimo ? 'text-red-600' : 'text-slate-800'}`}>
                        {row.stockActual}
                    </span>
                    {row.stockActual <= row.stockMinimo && (
                        <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium animate-pulse">
                            <AlertTriangle size={10} /> Stock Bajo
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Costo Prom.',
            accessorKey: 'costoPromedio',
            className: 'text-right font-mono text-xs text-slate-600',
            cell: (row) => formatMoney(row.costoPromedio)
        },
        {
            header: 'P.V.P (sin IVA)',
            accessorKey: 'precioVenta',
            className: 'text-right font-bold text-slate-900',
            cell: (row) => formatMoney(row.precioVenta)
        },
        {
            header: 'Acciones',
            className: 'text-center',
            cell: (row) => (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => { setProductoEditar(row); setShowModalProd(true); }}
                        className="text-amber-600 hover:underline text-xs font-medium flex items-center gap-1"
                    >
                        <Package size={14} /> Editar
                    </button>
                    <button
                        onClick={() => setSelectedProducto(row)}
                        className="text-sri-blue hover:underline text-xs font-medium flex items-center gap-1"
                    >
                        <History size={14} /> Kardex
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
                    <h1 className="text-2xl font-bold text-slate-800">Kardex de Productos</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de inventario y movimiento de mercancías.</p>
                </div>
            </div>

            <div className="space-y-4">
                <DataTable
                    data={productos}
                    columns={productoColumns}
                    itemsPerPage={10}
                    loading={loading}
                    searchable
                    searchKeys={['nombre', 'codigoPrincipal', 'categoriaNombre']}
                    searchPlaceholder="Buscar por código, nombre o categoría..."
                    actions={
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={handleExport} className="flex items-center gap-2">
                                <Download size={16} /> Exportar Excel
                            </Button>
                            <Button size="sm" onClick={() => setShowModalProd(true)} className="flex items-center gap-1 shadow-sm">
                                <Plus size={14} /> Nuevo
                            </Button>
                        </div>
                    }
                />
            </div>

            {selectedProducto && (
                <KardexModal
                    producto={selectedProducto}
                    onClose={() => setSelectedProducto(null)}
                    empresaId={currentEmpresa.id}
                    onRefresh={loadData}
                />
            )}
            {showModalProd && (
                <ProductoModal
                    producto={productoEditar || undefined}
                    onClose={() => { setShowModalProd(false); setProductoEditar(null); }}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                />
            )}
        </div>
    );
}
