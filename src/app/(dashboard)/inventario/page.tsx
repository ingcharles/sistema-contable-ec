'use client';

import { useEffect, useState } from 'react';
import { Package, AlertTriangle, Download, Plus, Tag, History, Warehouse, Settings, Layers } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Producto, CategoriaProducto, Bodega } from '@/modules/inventario/domain/types';
import { InventarioUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { KardexModal } from '@/modules/inventario/ui/components/KardexModal';
import { CategoriaModal } from '@/modules/inventario/ui/components/CategoriaModal';
import { BodegaModal } from '@/modules/inventario/ui/components/BodegaModal';
import { ProductoModal } from '@/modules/inventario/ui/components/ProductoModal';
import { Column, DataTable } from '@/shared/ui/DataTable';
import { Button } from '@/shared/ui/Button';

export default function InventarioPage() {
    const { currentEmpresa } = useEmpresa();
    const [activeTab, setActiveTab] = useState<'kardex' | 'config'>('kardex');
    const [subTabConfig, setSubTabConfig] = useState<'categorias' | 'bodegas'>('categorias');

    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
    const [bodegas, setBodegas] = useState<Bodega[]>([]);

    const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
    const [productoEditar, setProductoEditar] = useState<Producto | null>(null);
    const [selectedCategoria, setSelectedCategoria] = useState<CategoriaProducto | null>(null);
    const [selectedBodega, setSelectedBodega] = useState<Bodega | null>(null);
    const [showModalProd, setShowModalProd] = useState(false);
    const [showModalCat, setShowModalCat] = useState(false);
    const [showModalBod, setShowModalBod] = useState(false);

    const loadData = async () => {
        if (!currentEmpresa) return;
        try {
            const [dataProductos, responseCategorias, dataBodegas] = await Promise.all([
                InventarioUseCases.listarProductos(),
                InventarioUseCases.listarCategorias(),
                InventarioUseCases.listarBodegas()
            ]);
            
            setProductos(dataProductos.data || []);
            setCategorias(responseCategorias.data || []);
            setBodegas(dataBodegas);
        } catch (error) {
            console.error('Error cargando inventario:', error);
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

    const empresaId = currentEmpresa.id;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Inventario y Logística</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Control de kardex, múltiples bodegas y categorización.
                    </p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('kardex')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'kardex' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Package size={16} /> Kardex & Productos
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'config' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Settings size={16} /> Configuración
                    </button>
                </div>
            </div>

            {activeTab === 'kardex' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-end gap-2">
                    </div>

                    <DataTable
                        data={productos}
                        columns={productoColumns}
                        itemsPerPage={5}
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
            )}

            {activeTab === 'config' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="col-span-1 space-y-1">
                        <button onClick={() => setSubTabConfig('categorias')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${subTabConfig === 'categorias' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                            <Layers size={18} /> Categorías / Líneas
                        </button>
                        <button onClick={() => setSubTabConfig('bodegas')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${subTabConfig === 'bodegas' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                            <Warehouse size={18} /> Bodegas y Sucursales
                        </button>
                    </div>

                    <div className="col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px]">
                        {subTabConfig === 'categorias' && (
                            <DataTable
                                data={categorias}
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
                                itemsPerPage={5}
                                searchable
                                searchKeys={['nombre']}
                                searchPlaceholder="Buscar categoría..."
                                actions={
                                    <Button onClick={() => setShowModalCat(true)} className="text-xs px-3 py-1.5 flex items-center gap-1">
                                        <Plus size={14} /> Nueva Categoría
                                    </Button>
                                }
                            />
                        )}

                        {subTabConfig === 'bodegas' && (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="font-bold text-slate-800">Bodegas y Almacenes</h3>
                                        <p className="text-xs text-slate-500">Gestión de puntos de stock por sucursal.</p>
                                    </div>
                                    <Button onClick={() => setShowModalBod(true)} className="text-xs px-3 py-1.5 flex items-center gap-1">
                                        <Plus size={14} /> Nueva Bodega
                                    </Button>
                                </div>
                                <DataTable
                                    data={bodegas}
                                    columns={bodegaColumns}
                                    itemsPerPage={5}
                                />
                            </>
                        )}
                    </div>
                </div>
            )}

            {selectedProducto && (
                <KardexModal
                    producto={selectedProducto}
                    onClose={() => setSelectedProducto(null)}
                    empresaId={empresaId}
                    onRefresh={loadData}
                />
            )}
            {showModalProd && (
                <ProductoModal
                    producto={productoEditar || undefined}
                    onClose={() => { setShowModalProd(false); setProductoEditar(null); }}
                    onSave={loadData}
                    empresaId={empresaId}
                />
            )}
            {showModalCat && (
                <CategoriaModal
                    onClose={() => { setShowModalCat(false); setSelectedCategoria(null); }}
                    onSave={loadData}
                    empresaId={empresaId}
                    categoriaEditar={selectedCategoria}
                />
            )}
            {showModalBod && (
                <BodegaModal
                    bodega={selectedBodega || undefined}
                    onClose={() => { setShowModalBod(false); setSelectedBodega(null); }}
                    onSave={loadData}
                    empresaId={empresaId}
                />
            )}
        </div>
    );
}

