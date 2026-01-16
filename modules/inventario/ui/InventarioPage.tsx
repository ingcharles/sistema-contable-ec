
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Empresa } from '../../../types';
import { Producto, MovimientoKardex, CategoriaProducto, Bodega } from '../domain/types';
import { InMemoryInventarioRepository } from '../infrastructure/InventarioRepository';
import { InMemoryConfiguracionRepository } from '../../configuracion/infrastructure/ConfiguracionRepository';
import { Sucursal } from '../../configuracion/domain/types';
import { formatMoney } from '../../../services/sriService';
import { Package, Search, AlertTriangle, Download, Plus, Tag, History, X, ArrowDown, ArrowUp, Warehouse, Settings, Layers } from 'lucide-react';

// --- MODAL KARDEX (Existente) ---
const KardexModal = ({ producto, onClose }: { producto: Producto, onClose: () => void }) => {
    const [movimientos, setMovimientos] = useState<MovimientoKardex[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const repo = new InMemoryInventarioRepository();
        repo.getKardex(producto.id).then(data => {
            setMovimientos(data);
            setLoading(false);
        });
    }, [producto.id]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                             <History size={24} className="text-sri-blue" /> Kardex de Artículo
                        </h2>
                        <div className="mt-2 space-y-1">
                            <p className="text-sm text-slate-600"><span className="font-semibold">Producto:</span> {producto.nombre}</p>
                            <p className="text-sm text-slate-600"><span className="font-semibold">Código:</span> {producto.codigoPrincipal}</p>
                            <p className="text-xs text-slate-400">Método de valoración: PROMEDIO PONDERADO</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-lg transition-colors"><X size={24} /></button>
                </div>

                <div className="overflow-auto flex-1 p-0">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th rowSpan={2} className="px-4 py-2 border-r border-slate-200 w-24">Fecha</th>
                                <th rowSpan={2} className="px-4 py-2 border-r border-slate-200">Detalle / Comprobante</th>
                                <th colSpan={3} className="px-4 py-1 text-center border-b border-r border-slate-200 bg-green-50 text-green-700">ENTRADAS</th>
                                <th colSpan={3} className="px-4 py-1 text-center border-b border-r border-slate-200 bg-red-50 text-red-700">SALIDAS</th>
                                <th colSpan={3} className="px-4 py-1 text-center border-b bg-blue-50 text-blue-700">SALDOS</th>
                            </tr>
                            <tr>
                                {/* Entradas */}
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-green-50/50">Cant.</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-green-50/50">C. Unit</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-green-50/50 font-bold">Total</th>
                                {/* Salidas */}
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-red-50/50">Cant.</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-red-50/50">C. Unit</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-red-50/50 font-bold">Total</th>
                                {/* Saldos */}
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-blue-50/50">Cant.</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-blue-50/50">C. Prom</th>
                                <th className="px-2 py-1 text-right bg-blue-50/50 font-bold">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={11} className="p-8 text-center text-slate-400">Cargando movimientos...</td></tr>
                            ) : movimientos.map((mov) => (
                                <tr key={mov.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2 border-r border-slate-100 whitespace-nowrap">{mov.fecha}</td>
                                    <td className="px-4 py-2 border-r border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-[10px] uppercase text-slate-500">{mov.tipo.replace('_', ' ')}</span>
                                            <span className="font-mono">{mov.referenciaComprobante}</span>
                                        </div>
                                    </td>
                                    
                                    {/* Entradas */}
                                    <td className="px-2 py-2 text-right border-r border-slate-100 text-slate-600">{mov.cantidadEntrada > 0 ? mov.cantidadEntrada : '-'}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 text-slate-500">{mov.cantidadEntrada > 0 ? formatMoney(mov.costoUnitario) : '-'}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 font-medium text-green-700 bg-green-50/10">{mov.valorEntrada > 0 ? formatMoney(mov.valorEntrada) : '-'}</td>

                                    {/* Salidas */}
                                    <td className="px-2 py-2 text-right border-r border-slate-100 text-slate-600">{mov.cantidadSalida > 0 ? mov.cantidadSalida : '-'}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 text-slate-500">{mov.cantidadSalida > 0 ? formatMoney(mov.costoUnitario) : '-'}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 font-medium text-red-700 bg-red-50/10">{mov.valorSalida > 0 ? formatMoney(mov.valorSalida) : '-'}</td>

                                    {/* Saldos */}
                                    <td className="px-2 py-2 text-right border-r border-slate-100 font-bold text-slate-800 bg-blue-50/10">{mov.saldoCantidad}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 text-slate-600 bg-blue-50/10">{formatMoney(mov.costoUnitario)}</td>
                                    <td className="px-2 py-2 text-right font-bold text-blue-800 bg-blue-50/10">{formatMoney(mov.saldoValor)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="p-4 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

// --- MODAL CATEGORIA ---
const CategoriaModal = ({ onClose, onSave, empresaId }: { onClose: () => void, onSave: () => void, empresaId: string }) => {
    const [formData, setFormData] = useState<Partial<CategoriaProducto>>({
        nombre: '',
        cuentaInventario: '',
        cuentaCostoVenta: '',
        cuentaVenta: ''
    });

    const handleSave = async () => {
        if(!formData.nombre) return;
        const repo = new InMemoryInventarioRepository();
        await repo.saveCategoria({
            id: Math.random().toString(36),
            empresaId,
            ...formData as CategoriaProducto,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'admin'
        });
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95">
                <div className="p-5 border-b flex justify-between">
                    <h3 className="font-bold text-slate-800">Nueva Categoría (División Artículo)</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Categoría</label>
                        <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full border rounded p-2 text-sm" placeholder="EJ: LINEA BLANCA" />
                    </div>
                    <div className="bg-slate-50 p-4 rounded border border-slate-100 space-y-3">
                        <h4 className="text-xs font-bold text-sri-blue">Contabilización Automática</h4>
                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Cuenta Inventario (Activo)</label>
                            <input type="text" value={formData.cuentaInventario} onChange={e => setFormData({...formData, cuentaInventario: e.target.value})} className="w-full border rounded p-1.5 text-xs font-mono" placeholder="1.1.03..." />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Cuenta Costo Venta (Gasto)</label>
                            <input type="text" value={formData.cuentaCostoVenta} onChange={e => setFormData({...formData, cuentaCostoVenta: e.target.value})} className="w-full border rounded p-1.5 text-xs font-mono" placeholder="5.1.01..." />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Cuenta Venta (Ingreso)</label>
                            <input type="text" value={formData.cuentaVenta} onChange={e => setFormData({...formData, cuentaVenta: e.target.value})} className="w-full border rounded p-1.5 text-xs font-mono" placeholder="4.1.01..." />
                        </div>
                    </div>
                </div>
                <div className="p-5 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 bg-slate-100 rounded text-sm">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-sri-blue text-white rounded text-sm">Guardar</button>
                </div>
            </div>
        </div>
    );
};

// --- MODAL BODEGA ---
const BodegaModal = ({ onClose, onSave, empresaId }: { onClose: () => void, onSave: () => void, empresaId: string }) => {
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [formData, setFormData] = useState<Partial<Bodega>>({
        nombre: '', codigo: '', responsable: '', ubicacion: '', sucursalId: ''
    });

    useEffect(() => {
        const repo = new InMemoryConfiguracionRepository();
        repo.getSucursales(empresaId).then(setSucursales);
    }, [empresaId]);

    const handleSave = async () => {
        if(!formData.nombre || !formData.sucursalId) return;
        const repo = new InMemoryInventarioRepository();
        await repo.saveBodega({
            id: Math.random().toString(36),
            empresaId,
            ...formData as Bodega,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'admin'
        });
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95">
                <div className="p-5 border-b flex justify-between">
                    <h3 className="font-bold text-slate-800">Nueva Bodega</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sucursal Asociada</label>
                        <select value={formData.sucursalId} onChange={e => setFormData({...formData, sucursalId: e.target.value})} className="w-full border rounded p-2 text-sm bg-white">
                            <option value="">Seleccione Sucursal...</option>
                            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código</label>
                            <input type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} className="w-full border rounded p-2 text-sm" placeholder="B001" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                            <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full border rounded p-2 text-sm" placeholder="Principal" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Responsable</label>
                        <input type="text" value={formData.responsable} onChange={e => setFormData({...formData, responsable: e.target.value})} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ubicación / Dirección</label>
                        <input type="text" value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})} className="w-full border rounded p-2 text-sm" />
                    </div>
                </div>
                <div className="p-5 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 bg-slate-100 rounded text-sm">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-sri-blue text-white rounded text-sm">Guardar</button>
                </div>
            </div>
        </div>
    );
};

export const InventarioPage: React.FC = () => {
    const { currentEmpresa } = useOutletContext<{ currentEmpresa: Empresa }>();
    const [activeTab, setActiveTab] = useState<'kardex' | 'config'>('kardex');
    const [subTabConfig, setSubTabConfig] = useState<'categorias' | 'bodegas'>('categorias');
    
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
    const [bodegas, setBodegas] = useState<Bodega[]>([]);
    
    const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
    const [showModalCat, setShowModalCat] = useState(false);
    const [showModalBod, setShowModalBod] = useState(false);

    useEffect(() => {
        loadData();
    }, [currentEmpresa.id]);

    const loadData = () => {
        const repo = new InMemoryInventarioRepository();
        repo.getProductos(currentEmpresa.id).then(setProductos);
        repo.getCategorias(currentEmpresa.id).then(setCategorias);
        repo.getBodegas(currentEmpresa.id).then(setBodegas);
    };

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
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4">
                         <div className="md:col-span-6 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input type="text" placeholder="Buscar por código, nombre o categoría..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none" />
                        </div>
                        <div className="md:col-span-6 flex justify-end gap-2">
                            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                                <Download size={16} /> Reporte Stock
                            </button>
                            <button className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm">
                                <Plus size={16} /> Nuevo Producto
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Producto</th>
                                    <th className="px-6 py-4">Categoría</th>
                                    <th className="px-6 py-4 text-center">Stock</th>
                                    <th className="px-6 py-4 text-right">Costo Prom.</th>
                                    <th className="px-6 py-4 text-right">P.V.P (sin IVA)</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {productos.map((prod) => (
                                    <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-800">{prod.nombre}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1 rounded">{prod.codigoPrincipal}</span>
                                                    {prod.grabaIva && <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded border border-blue-100">IVA 15%</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                                                <Tag size={10} /> {prod.categoriaNombre}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`font-bold ${prod.stockActual <= prod.stockMinimo ? 'text-red-600' : 'text-slate-800'}`}>
                                                    {prod.stockActual}
                                                </span>
                                                {prod.stockActual <= prod.stockMinimo && (
                                                    <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium animate-pulse">
                                                        <AlertTriangle size={10} /> Stock Bajo
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600 font-mono text-xs">
                                            {formatMoney(prod.costoPromedio)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                                            {formatMoney(prod.precioVenta)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => setSelectedProducto(prod)}
                                                className="text-sri-blue hover:underline text-xs font-medium flex items-center justify-center gap-1 mx-auto"
                                            >
                                                <History size={14} /> Kardex
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'config' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2">
                    {/* Submenu */}
                    <div className="col-span-1 space-y-1">
                        <button onClick={() => setSubTabConfig('categorias')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${subTabConfig === 'categorias' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                            <Layers size={18} /> Categorías / Líneas
                        </button>
                        <button onClick={() => setSubTabConfig('bodegas')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${subTabConfig === 'bodegas' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                            <Warehouse size={18} /> Bodegas y Sucursales
                        </button>
                    </div>

                    {/* Content */}
                    <div className="col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px]">
                        {subTabConfig === 'categorias' && (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="font-bold text-slate-800">División de Artículos (Categorías)</h3>
                                        <p className="text-xs text-slate-500">Definición de cuentas contables por línea de producto.</p>
                                    </div>
                                    <button onClick={() => setShowModalCat(true)} className="text-xs bg-sri-blue text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-sri-light">
                                        <Plus size={14} /> Nueva Categoría
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {categorias.map(cat => (
                                        <div key={cat.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-slate-700">{cat.nombre}</h4>
                                                <button className="text-xs text-sri-blue hover:underline">Editar</button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div className="bg-slate-100 p-2 rounded">
                                                    <span className="block text-slate-400">Inventario</span>
                                                    <span className="font-mono">{cat.cuentaInventario}</span>
                                                </div>
                                                <div className="bg-slate-100 p-2 rounded">
                                                    <span className="block text-slate-400">Costo Venta</span>
                                                    <span className="font-mono">{cat.cuentaCostoVenta}</span>
                                                </div>
                                                <div className="bg-slate-100 p-2 rounded">
                                                    <span className="block text-slate-400">Venta</span>
                                                    <span className="font-mono">{cat.cuentaVenta}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {subTabConfig === 'bodegas' && (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="font-bold text-slate-800">Bodegas y Almacenes</h3>
                                        <p className="text-xs text-slate-500">Gestión de puntos de stock por sucursal.</p>
                                    </div>
                                    <button onClick={() => setShowModalBod(true)} className="text-xs bg-sri-blue text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-sri-light">
                                        <Plus size={14} /> Nueva Bodega
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2">Código</th>
                                                <th className="px-4 py-2">Nombre</th>
                                                <th className="px-4 py-2">Responsable</th>
                                                <th className="px-4 py-2">Ubicación</th>
                                                <th className="px-4 py-2 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {bodegas.map(bod => (
                                                <tr key={bod.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{bod.codigo}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-800">{bod.nombre}</td>
                                                    <td className="px-4 py-3 text-slate-600 text-xs">{bod.responsable}</td>
                                                    <td className="px-4 py-3 text-slate-500 text-xs">{bod.ubicacion}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button className="text-sri-blue hover:underline text-xs">Editar</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {selectedProducto && <KardexModal producto={selectedProducto} onClose={() => setSelectedProducto(null)} />}
            {showModalCat && <CategoriaModal onClose={() => setShowModalCat(false)} onSave={loadData} empresaId={currentEmpresa.id} />}
            {showModalBod && <BodegaModal onClose={() => setShowModalBod(false)} onSave={loadData} empresaId={currentEmpresa.id} />}
        </div>
    );
};
