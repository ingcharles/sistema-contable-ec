
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Empresa } from '../../../types';
import { Compra, SustentoTributario, OrdenCompra } from '../domain/types';
import { InMemoryCompraRepository } from '../infrastructure/CompraRepository';
import { InMemoryContabilidadRepository } from '../../contabilidad/infrastructure/ContabilidadRepository';
import { InMemoryConfiguracionRepository } from '../../configuracion/infrastructure/ConfiguracionRepository';
import { InMemoryInventarioRepository } from '../../inventario/infrastructure/InventarioRepository';
import { TipoMovimientoInventario } from '../../inventario/domain/types';
import { CodigoRetencion } from '../../configuracion/domain/types';
import { AsientoContable } from '../../contabilidad/domain/types';
import { formatMoney } from '../../../services/sriService';
import { Plus, Download, Search, AlertCircle, CheckCircle2, MoreHorizontal, X, Save, Calculator, ShoppingCart, FileText, ArrowRight, Trash2, RotateCcw } from 'lucide-react';

// --- SUBCOMPONENTE: BADGE DE RETENCIÓN ---
const RetencionBadge = ({ estado }: { estado: string }) => {
    if (estado === 'EMITIDA') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200"><CheckCircle2 size={10} /> Retenida</span>;
    if (estado === 'PENDIENTE') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse"><AlertCircle size={10} /> Pendiente</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">No Aplica</span>;
};

// --- SUBCOMPONENTE: MODAL ORDEN DE COMPRA ---
const OrdenCompraModal = ({ onClose, onSave, empresaId }: { onClose: () => void, onSave: () => void, empresaId: string }) => {
    const [proveedor, setProveedor] = useState('');
    const [ruc, setRuc] = useState('');
    const [fechaEntrega, setFechaEntrega] = useState('');
    const [observacion, setObservacion] = useState('');
    
    // Items
    const [items, setItems] = useState<{producto: string, cantidad: number, precio: number, grabaIva: boolean}[]>([]);
    
    const addItem = () => setItems([...items, {producto: '', cantidad: 1, precio: 0, grabaIva: true}]);
    const updateItem = (idx: number, field: string, val: any) => {
        const newItems = [...items];
        (newItems[idx] as any)[field] = val;
        setItems(newItems);
    };
    const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

    // Totales
    const subtotal = items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);
    const iva = items.reduce((acc, item) => acc + (item.grabaIva ? (item.cantidad * item.precio * 0.15) : 0), 0);
    const total = subtotal + iva;

    const handleGuardar = async () => {
        if (!proveedor || items.length === 0) return;
        
        const nuevaOrden: OrdenCompra = {
            id: Math.random().toString(36),
            empresaId,
            secuencial: `OC-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
            proveedor: { id: 'temp', razonSocial: proveedor, ruc: ruc || '9999999999999', esContribuyenteEspecial: false },
            fechaEmision: new Date().toISOString().split('T')[0],
            fechaEntrega: fechaEntrega || new Date().toISOString().split('T')[0],
            observacion,
            detalles: items.map(i => ({ 
                producto: i.producto, 
                cantidad: i.cantidad, 
                precioUnitario: i.precio, 
                subtotal: i.cantidad * i.precio, 
                grabaIva: i.grabaIva 
            })),
            subtotal,
            iva,
            total,
            estado: 'PENDIENTE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'admin'
        };

        const repo = new InMemoryCompraRepository();
        await repo.saveOrden(nuevaOrden);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800">Nueva Orden de Compra</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Proveedor</label>
                            <input type="text" value={proveedor} onChange={e => setProveedor(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Nombre Comercial" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">RUC (Opcional)</label>
                            <input type="text" value={ruc} onChange={e => setRuc(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Entrega Esperada</label>
                            <input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observación</label>
                            <input type="text" value={observacion} onChange={e => setObservacion(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-slate-700">Ítems</h3>
                            <button onClick={addItem} className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200">+ Agregar</button>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                    <th className="px-2 py-1 text-left">Producto</th>
                                    <th className="px-2 py-1 w-20">Cant.</th>
                                    <th className="px-2 py-1 w-24">Precio</th>
                                    <th className="px-2 py-1 w-10">IVA</th>
                                    <th className="px-2 py-1 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-100">
                                        <td className="p-1"><input type="text" value={item.producto} onChange={e => updateItem(idx, 'producto', e.target.value)} className="w-full border rounded p-1" /></td>
                                        <td className="p-1"><input type="number" value={item.cantidad} onChange={e => updateItem(idx, 'cantidad', Number(e.target.value))} className="w-full border rounded p-1 text-center" /></td>
                                        <td className="p-1"><input type="number" value={item.precio} onChange={e => updateItem(idx, 'precio', Number(e.target.value))} className="w-full border rounded p-1 text-right" /></td>
                                        <td className="p-1 text-center"><input type="checkbox" checked={item.grabaIva} onChange={e => updateItem(idx, 'grabaIva', e.target.checked)} /></td>
                                        <td className="p-1"><button onClick={() => removeItem(idx)} className="text-red-400"><Trash2 size={14} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center rounded-b-xl">
                    <div className="text-sm">
                        <p>Subtotal: <span className="font-mono">{formatMoney(subtotal)}</span></p>
                        <p>IVA: <span className="font-mono">{formatMoney(iva)}</span></p>
                        <p className="font-bold text-lg">Total: {formatMoney(total)}</p>
                    </div>
                    <button onClick={handleGuardar} disabled={total === 0} className="px-6 py-2 bg-sri-blue text-white rounded-lg hover:bg-sri-light disabled:opacity-50">Guardar Orden</button>
                </div>
            </div>
        </div>
    );
};

// --- SUBCOMPONENTE: MODAL NOTA DE CRÉDITO PROVEEDOR ---
const NotaCreditoProveedorModal = ({ compra, onClose, onSave, empresaId }: { compra: Compra, onClose: () => void, onSave: () => void, empresaId: string }) => {
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
    const [secuencial, setSecuencial] = useState('');
    const [autorizacion, setAutorizacion] = useState('');
    const [motivo, setMotivo] = useState('');
    const [tipoDevolucion, setTipoDevolucion] = useState<'DEVOLUCION_MERCADERIA' | 'DESCUENTO'>('DEVOLUCION_MERCADERIA');
    
    // Valores (Por defecto total de factura)
    const [subtotal15, setSubtotal15] = useState(compra.subtotal15);
    const [subtotal0, setSubtotal0] = useState(compra.subtotal0);
    
    // Cálculos
    const iva15 = subtotal15 * 0.15;
    const totalNC = subtotal15 + subtotal0 + iva15;

    const handleGuardar = async () => {
        if (!secuencial || !motivo || totalNC <= 0) return;

        // 1. Guardar Compra Tipo 04
        const ncCompra: Compra = {
            id: Math.random().toString(36),
            empresaId,
            proveedor: compra.proveedor,
            tipoComprobante: '04', // Nota Crédito
            secuencial,
            autorizacion: autorizacion || '9999999999',
            fechaEmision,
            fechaRegistro: new Date().toISOString().split('T')[0],
            sustento: compra.sustento,
            descripcion: `NC Prov. Ref: ${compra.secuencial} - ${motivo}`,
            subtotal15,
            subtotal0,
            montoIva: iva15,
            total: totalNC,
            tieneRetencion: false,
            estadoRetencion: 'NO_APLICA',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'admin'
        };

        const repoCompra = new InMemoryCompraRepository();
        await repoCompra.save(ncCompra);

        // 2. Asiento de Reverso
        // Debe: Proveedores (Disminuye deuda)
        // Haber: Inventario/Gasto (Disminuye activo/gasto)
        // Haber: IVA Compras (Disminuye crédito tributario)
        
        const cuentaCredito = tipoDevolucion === 'DEVOLUCION_MERCADERIA' ? '1.1.03.01' : '5.1.01.01'; // Inventario o Costo
        const nombreCuentaCredito = tipoDevolucion === 'DEVOLUCION_MERCADERIA' ? 'INVENTARIO DE MERCADERÍAS' : 'COSTO DE VENTAS / GASTO';

        const asiento: AsientoContable = {
            id: Math.random().toString(36),
            empresaId,
            numero: `NC-P-${secuencial}`,
            fecha: fechaEmision,
            glosa: `P/R Nota Crédito Proveedor ${secuencial} Ref: ${compra.secuencial}`,
            tipo: 'DIARIO', // Ajuste
            estado: 'MAYORIZADO',
            totalDebe: totalNC,
            totalHaber: totalNC,
            detalles: [
                { cuentaCodigo: '2.1.01.01', cuentaNombre: 'CUENTAS POR PAGAR PROVEEDORES', debe: totalNC, haber: 0 },
                { cuentaCodigo: cuentaCredito, cuentaNombre: nombreCuentaCredito, debe: 0, haber: subtotal15 + subtotal0 },
                { cuentaCodigo: '1.1.05.01', cuentaNombre: 'IVA COMPRAS', debe: 0, haber: iva15 }
            ].filter(d => d.debe > 0 || d.haber > 0),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        };

        const repoContabilidad = new InMemoryContabilidadRepository();
        await repoContabilidad.saveAsiento(asiento);

        // 3. Inventario (Si es devolución física)
        if (tipoDevolucion === 'DEVOLUCION_MERCADERIA') {
            const repoInv = new InMemoryInventarioRepository();
            // Asumimos un producto genérico o iteramos items reales en un sistema completo
            // Aquí generamos un movimiento dummy para demostración
            await repoInv.saveMovimiento({
                id: Math.random().toString(36),
                productoId: 'prod1', // Hardcoded demo
                fecha: fechaEmision,
                tipo: TipoMovimientoInventario.DEVOLUCION_COMPRA,
                referenciaComprobante: `NC ${secuencial}`,
                cantidadEntrada: 0,
                cantidadSalida: 1, // Demo
                saldoCantidad: 0,
                costoUnitario: (subtotal15+subtotal0),
                valorEntrada: 0,
                valorSalida: (subtotal15+subtotal0),
                saldoValor: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'system'
            });
        }

        alert('Nota de Crédito registrada. Se ha ajustado la deuda, el IVA y el inventario/gasto.');
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-orange-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-orange-800 flex items-center gap-2">
                            <RotateCcw size={20} /> Nota de Crédito de Proveedor
                        </h2>
                        <p className="text-xs text-orange-700">Devolución sobre Fac. {compra.secuencial}</p>
                    </div>
                    <button onClick={onClose} className="text-orange-400 hover:text-orange-700"><X size={24} /></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="bg-slate-50 p-3 rounded border border-slate-200 text-sm">
                        <p><strong>Proveedor:</strong> {compra.proveedor.razonSocial}</p>
                        <p><strong>Factura Original:</strong> {formatMoney(compra.total)} ({compra.fechaEmision})</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Nro. Nota Crédito</label>
                            <input type="text" value={secuencial} onChange={e => setSecuencial(e.target.value)} placeholder="001-001-..." className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Emisión</label>
                            <input type="date" value={fechaEmision} onChange={e => setFechaEmision(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Motivo</label>
                        <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej: Devolución mercadería defectuosa" className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tipo de Ajuste</label>
                        <select value={tipoDevolucion} onChange={e => setTipoDevolucion(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                            <option value="DEVOLUCION_MERCADERIA">Devolución de Mercadería (Afecta Kardex)</option>
                            <option value="DESCUENTO">Descuento Comercial (Afecta Gasto/Costo)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Subtotal 15%</label>
                            <input type="number" value={subtotal15} onChange={e => setSubtotal15(Number(e.target.value))} className="w-full px-2 py-1 border rounded text-right text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Subtotal 0%</label>
                            <input type="number" value={subtotal0} onChange={e => setSubtotal0(Number(e.target.value))} className="w-full px-2 py-1 border rounded text-right text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-800 font-bold mb-1">Total NC</label>
                            <div className="w-full px-2 py-1 bg-slate-100 rounded text-right text-sm font-bold">{formatMoney(totalNC)}</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button onClick={handleGuardar} disabled={!secuencial || totalNC <= 0} className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-500 shadow-sm flex items-center gap-2">
                        <Save size={18} /> Registrar NC
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SUBCOMPONENTE: MODAL NUEVA COMPRA (Actualizado con carga dinámica) ---
const NuevaCompraModal = ({ onClose, onSave, empresaId, ordenPrevia }: { onClose: () => void, onSave: () => void, empresaId: string, ordenPrevia?: OrdenCompra }) => {
    // Data Dinámica
    const [retencionesDisponibles, setRetencionesDisponibles] = useState<CodigoRetencion[]>([]);

    // Estados Formulario Cabecera
    const [proveedorNombre, setProveedorNombre] = useState(ordenPrevia?.proveedor.razonSocial || '');
    const [proveedorRuc, setProveedorRuc] = useState(ordenPrevia?.proveedor.ruc || '');
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
    const [secuencial, setSecuencial] = useState('');
    const [autorizacion, setAutorizacion] = useState('');
    const [sustento, setSustento] = useState<SustentoTributario>(SustentoTributario.CREDITO_TRIBUTARIO);

    // Estados Valores
    const [subtotal15, setSubtotal15] = useState(ordenPrevia ? ordenPrevia.detalles.filter(d => d.grabaIva).reduce((acc, d) => acc + d.subtotal, 0) : 0);
    const [subtotal0, setSubtotal0] = useState(ordenPrevia ? ordenPrevia.detalles.filter(d => !d.grabaIva).reduce((acc, d) => acc + d.subtotal, 0) : 0);
    
    // Estados Retención
    const [aplicaRetencion, setAplicaRetencion] = useState(true);
    const [codRetRenta, setCodRetRenta] = useState('');
    const [codRetIva, setCodRetIva] = useState('');

    useEffect(() => {
        const repoConf = new InMemoryConfiguracionRepository();
        repoConf.getCodigosRetencion(empresaId).then(data => {
            setRetencionesDisponibles(data);
            // Sets defaults if available
            const defaultRenta = data.find(r => r.tipo === 'RENTA' && r.codigo === '312');
            const defaultIva = data.find(r => r.tipo === 'IVA' && r.codigo === '9'); // 30%
            if(defaultRenta) setCodRetRenta(defaultRenta.codigo);
            if(defaultIva) setCodRetIva(defaultIva.codigo);
        });
    }, [empresaId]);

    // Cálculos
    const montoIva = Number((subtotal15 * 0.15).toFixed(2));
    const totalFactura = subtotal15 + subtotal0 + montoIva;

    // Cálculos Retención Dinámica
    const selectedRetRenta = retencionesDisponibles.find(c => c.codigo === codRetRenta && c.tipo === 'RENTA');
    const selectedRetIva = retencionesDisponibles.find(c => c.codigo === codRetIva && c.tipo === 'IVA');

    const baseImponibleRenta = subtotal15 + subtotal0;
    const valorRetRenta = Number((baseImponibleRenta * ((selectedRetRenta?.porcentaje || 0) / 100)).toFixed(2));
    const valorRetIva = Number((montoIva * ((selectedRetIva?.porcentaje || 0) / 100)).toFixed(2));
    const totalRetenido = valorRetRenta + valorRetIva;
    const totalPagar = totalFactura - totalRetenido;

    const handleGuardar = async () => {
        if (!proveedorRuc || !secuencial) return;

        // 1. Crear la Compra
        const nuevaCompra: Compra = {
            id: Math.random().toString(36),
            empresaId,
            proveedor: {
                id: Math.random().toString(36),
                razonSocial: proveedorNombre,
                ruc: proveedorRuc,
                esContribuyenteEspecial: false
            },
            tipoComprobante: '01',
            secuencial,
            autorizacion: autorizacion || '0000000000',
            fechaEmision,
            fechaRegistro: new Date().toISOString().split('T')[0],
            sustento,
            descripcion: ordenPrevia ? `Comp. Factura de OC: ${ordenPrevia.secuencial}` : 'COMPRA REGISTRADA MANUALMENTE',
            subtotal15,
            subtotal0,
            montoIva,
            total: totalFactura,
            ordenCompraId: ordenPrevia?.id,
            tieneRetencion: aplicaRetencion,
            estadoRetencion: aplicaRetencion ? 'EMITIDA' : 'NO_APLICA',
            nroRetencion: aplicaRetencion ? `001-001-${Math.floor(Math.random() * 1000000)}` : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user'
        };

        const repoCompra = new InMemoryCompraRepository();
        await repoCompra.save(nuevaCompra);

        if (ordenPrevia) {
            await repoCompra.actualizarEstadoOrden(ordenPrevia.id, 'FACTURADA');
        }

        // 2. Generar Asiento Contable
        const asiento: AsientoContable = {
            id: Math.random().toString(36),
            empresaId,
            numero: `CC-${Math.floor(Math.random() * 1000)}`,
            fecha: fechaEmision,
            glosa: `P/R Compra Fac/${secuencial} - ${proveedorNombre}`,
            tipo: 'EGRESO',
            estado: 'MAYORIZADO',
            totalDebe: totalFactura,
            totalHaber: totalFactura,
            detalles: [
                { cuentaCodigo: '1.1.03.01', cuentaNombre: 'INVENTARIO DE MERCADERÍAS', debe: subtotal15 + subtotal0, haber: 0 },
                { cuentaCodigo: '1.1.05.01', cuentaNombre: 'IVA COMPRAS', debe: montoIva, haber: 0 },
                { cuentaCodigo: '2.1.01.01', cuentaNombre: 'CUENTAS POR PAGAR PROVEEDORES', debe: 0, haber: totalPagar },
                { cuentaCodigo: '2.1.03.01', cuentaNombre: 'RETENCIÓN FUENTE RENTA', debe: 0, haber: valorRetRenta },
                { cuentaCodigo: '2.1.03.02', cuentaNombre: 'RETENCIÓN IVA', debe: 0, haber: valorRetIva }
            ].filter(d => d.debe > 0 || d.haber > 0),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        };

        const repoContabilidad = new InMemoryContabilidadRepository();
        await repoContabilidad.saveAsiento(asiento);

        alert('Compra registrada y contabilizada exitosamente.');
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col animate-in zoom-in-95 duration-200 my-8">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Registrar Compra</h2>
                        <p className="text-xs text-slate-500">
                            {ordenPrevia ? `Facturando Orden: ${ordenPrevia.secuencial}` : 'Ingreso de factura de proveedor y emisión de retención'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                <div className="p-8 space-y-8">
                    {/* SECCIÓN 1: DATOS DEL COMPROBANTE */}
                    <section>
                        <h3 className="text-sm font-bold text-sri-blue uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">1. Datos del Proveedor y Comprobante</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">RUC Proveedor</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={proveedorRuc}
                                        onChange={e => setProveedorRuc(e.target.value)}
                                        placeholder="1799999999001"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                    />
                                    <button className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200"><Search size={16}/></button>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Razón Social</label>
                                <input 
                                    type="text" 
                                    value={proveedorNombre}
                                    onChange={e => setProveedorNombre(e.target.value)}
                                    placeholder="Nombre del Proveedor"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nro. Comprobante</label>
                                <input 
                                    type="text" 
                                    value={secuencial}
                                    onChange={e => setSecuencial(e.target.value)}
                                    placeholder="001-001-123456789"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Fecha Emisión</label>
                                <input 
                                    type="date" 
                                    value={fechaEmision}
                                    onChange={e => setFechaEmision(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Sustento Tributario</label>
                                <select 
                                    value={sustento}
                                    onChange={e => setSustento(e.target.value as SustentoTributario)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                >
                                    <option value={SustentoTributario.CREDITO_TRIBUTARIO}>01 - Crédito Tributario</option>
                                    <option value={SustentoTributario.COSTO_GASTO}>02 - Costo o Gasto</option>
                                    <option value={SustentoTributario.ACTIVO_FIJO}>06 - Activo Fijo</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 2: VALORES Y BASES */}
                    <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <h3 className="text-sm font-bold text-sri-blue uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Calculator size={16} /> 2. Bases Imponibles
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Subtotal 15%</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                    <input 
                                        type="number" 
                                        value={subtotal15}
                                        onChange={e => setSubtotal15(Number(e.target.value))}
                                        className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                    />
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Subtotal 0%</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                    <input 
                                        type="number" 
                                        value={subtotal0}
                                        onChange={e => setSubtotal0(Number(e.target.value))}
                                        className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                    />
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Monto IVA (15%)</label>
                                <div className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-right font-mono text-slate-600">
                                    {formatMoney(montoIva)}
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-900 mb-1.5">TOTAL FACTURA</label>
                                <div className="w-full px-3 py-2 bg-slate-800 border border-slate-800 rounded-lg text-sm text-right font-mono text-white font-bold shadow-md">
                                    {formatMoney(totalFactura)}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 3: RETENCIÓN */}
                    <section>
                         <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                            <h3 className="text-sm font-bold text-sri-blue uppercase tracking-wider">3. Emisión de Retención</h3>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-sm text-slate-600">Generar Retención</span>
                                <input 
                                    type="checkbox" 
                                    checked={aplicaRetencion} 
                                    onChange={e => setAplicaRetencion(e.target.checked)} 
                                    className="h-5 w-5 text-sri-blue rounded focus:ring-sri-blue transition-all" 
                                />
                            </label>
                        </div>

                        {aplicaRetencion ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                {/* Retención Renta */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase">Impuesto a la Renta</h4>
                                    <div>
                                        <label className="block text-xs text-slate-600 mb-1">Concepto de Retención</label>
                                        <select 
                                            value={codRetRenta}
                                            onChange={e => setCodRetRenta(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:border-sri-blue"
                                        >
                                            <option value="">Seleccione...</option>
                                            {retencionesDisponibles.filter(r => r.tipo === 'RENTA').map(c => (
                                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.concepto} ({c.porcentaje}%)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                        <span className="text-sm text-blue-800 font-medium">Valor a Retener ({selectedRetRenta?.porcentaje || 0}%)</span>
                                        <span className="text-sm font-bold text-blue-900 font-mono">{formatMoney(valorRetRenta)}</span>
                                    </div>
                                </div>

                                {/* Retención IVA */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase">Impuesto al Valor Agregado (IVA)</h4>
                                     <div>
                                        <label className="block text-xs text-slate-600 mb-1">Porcentaje Retención IVA</label>
                                        <select 
                                            value={codRetIva}
                                            onChange={e => setCodRetIva(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:border-sri-blue"
                                        >
                                            <option value="">Seleccione...</option>
                                            {retencionesDisponibles.filter(r => r.tipo === 'IVA').map(p => (
                                                <option key={p.codigo} value={p.codigo}>{p.codigo} - {p.concepto}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                        <span className="text-sm text-blue-800 font-medium">Valor a Retener ({selectedRetIva?.porcentaje || 0}%)</span>
                                        <span className="text-sm font-bold text-blue-900 font-mono">{formatMoney(valorRetIva)}</span>
                                    </div>
                                </div>
                             </div>
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-500 text-sm italic">
                                No se generará comprobante de retención para esta compra.
                            </div>
                        )}
                    </section>
                </div>

                {/* FOOTER TOTALES */}
                <div className="p-6 bg-slate-900 text-white rounded-b-xl flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-sm opacity-80">
                        {aplicaRetencion ? (
                            <span>Se emitirá la retención electrónica automáticamente.</span>
                        ) : (
                             <span>Solo se registrará la compra en el sistema.</span>
                        )}
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">Total Retención</p>
                            <p className="text-xl font-mono text-red-400 font-bold">-{formatMoney(aplicaRetencion ? totalRetenido : 0)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">Neto a Pagar</p>
                            <p className="text-3xl font-mono text-emerald-400 font-bold">{formatMoney(aplicaRetencion ? totalPagar : totalFactura)}</p>
                        </div>
                        <button 
                            onClick={handleGuardar}
                            disabled={!proveedorRuc || !secuencial || totalFactura === 0}
                            className="ml-4 px-6 py-3 bg-sri-light text-white font-bold rounded-xl hover:bg-white hover:text-sri-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Save size={20} /> Guardar Compra
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PÁGINA PRINCIPAL ---
export const ComprasPage: React.FC = () => {
    const { currentEmpresa } = useOutletContext<{ currentEmpresa: Empresa }>();
    const [activeTab, setActiveTab] = useState<'facturas' | 'ordenes'>('facturas');
    
    // Data
    const [compras, setCompras] = useState<Compra[]>([]);
    const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modales
    const [showModalCompra, setShowModalCompra] = useState(false);
    const [showModalOrden, setShowModalOrden] = useState(false);
    const [showModalNC, setShowModalNC] = useState(false);
    const [selectedCompraNC, setSelectedCompraNC] = useState<Compra | null>(null);
    
    // Estado para conversión OC -> Compra
    const [ordenParaFacturar, setOrdenParaFacturar] = useState<OrdenCompra | undefined>(undefined);

    const loadData = async () => {
        setLoading(true);
        const repo = new InMemoryCompraRepository();
        const [dataCompras, dataOrdenes] = await Promise.all([
            repo.getAll(currentEmpresa.id),
            repo.getOrdenes(currentEmpresa.id)
        ]);
        setCompras(dataCompras);
        setOrdenes(dataOrdenes);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [currentEmpresa.id]);

    const handleFacturarOrden = (orden: OrdenCompra) => {
        setOrdenParaFacturar(orden);
        setShowModalCompra(true);
    };

    const handleRegistrarNC = (compra: Compra) => {
        setSelectedCompraNC(compra);
        setShowModalNC(true);
    };

    const sustentoLabel = (code: string) => {
        switch(code) {
            case SustentoTributario.CREDITO_TRIBUTARIO: return 'Crédito Tributario';
            case SustentoTributario.COSTO_GASTO: return 'Costo/Gasto';
            case SustentoTributario.ACTIVO_FIJO: return 'Activo Fijo';
            default: return code;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Compras y Gastos</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Gestión de aprovisionamiento, facturas recibidas y retenciones.
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('facturas')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'facturas' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <ShoppingCart size={16} /> Facturas
                        </button>
                        <button 
                            onClick={() => setActiveTab('ordenes')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'ordenes' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <FileText size={16} /> Órdenes Compra
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'facturas' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-end gap-2">
                        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                            <Download size={16} /> Importar XML
                        </button>
                        <button 
                            onClick={() => { setOrdenParaFacturar(undefined); setShowModalCompra(true); }}
                            className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm shadow-blue-900/10"
                        >
                            <Plus size={16} /> Registrar Compra
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-5 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" placeholder="Buscar por proveedor o RUC..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none" />
                            </div>
                            <div className="md:col-span-3">
                                <select className="w-full h-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-600 outline-none">
                                    <option>Todos los Sustentos</option>
                                    <option>Crédito Tributario</option>
                                    <option>Gasto sin Crédito</option>
                                </select>
                            </div>
                            <div className="md:col-span-4 flex justify-end">
                                <div className="inline-flex items-center px-3 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium border border-yellow-100">
                                    <AlertCircle size={14} className="mr-1.5" />
                                    {compras.filter(c => c.estadoRetencion === 'PENDIENTE').length} Retenciones pendientes
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50/70 text-slate-600 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3">Fecha</th>
                                        <th className="px-6 py-3">Proveedor</th>
                                        <th className="px-6 py-3">Comprobante</th>
                                        <th className="px-6 py-3">Sustento</th>
                                        <th className="px-6 py-3 text-right">Subtotal</th>
                                        <th className="px-6 py-3 text-right">IVA</th>
                                        <th className="px-6 py-3 text-right">Total</th>
                                        <th className="px-6 py-3 text-center">Retención</th>
                                        <th className="px-6 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {compras.map((compra) => (
                                        <tr key={compra.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">{compra.fechaEmision}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-800">{compra.proveedor.razonSocial}</span>
                                                    <span className="text-xs text-slate-500">RUC: {compra.proveedor.ruc}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`text-xs px-1.5 py-0.5 rounded w-fit font-mono ${compra.tipoComprobante === '04' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                                                        {compra.tipoComprobante === '04' ? 'NC' : 'FAC'} {compra.secuencial}
                                                    </span>
                                                    {compra.ordenCompraId && (
                                                        <span className="text-[10px] text-blue-500 mt-0.5 flex items-center gap-1">
                                                            <FileText size={8} /> OC Vinculada
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold border border-blue-100">
                                                    {sustentoLabel(compra.sustento)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-600 font-medium">{formatMoney(compra.subtotal15 + compra.subtotal0)}</td>
                                            <td className="px-6 py-4 text-right text-slate-500">{formatMoney(compra.montoIva)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">{formatMoney(compra.total)}</td>
                                            <td className="px-6 py-4 text-center">
                                                {compra.tipoComprobante !== '04' && (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <RetencionBadge estado={compra.estadoRetencion} />
                                                        {compra.nroRetencion && <span className="text-[10px] text-slate-400 font-mono">{compra.nroRetencion}</span>}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    {compra.tipoComprobante === '01' && (
                                                        <button 
                                                            onClick={() => handleRegistrarNC(compra)}
                                                            className="text-slate-500 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                                                            title="Registrar Nota de Crédito (Devolución)"
                                                        >
                                                            <RotateCcw size={16} />
                                                        </button>
                                                    )}
                                                    <button className="text-slate-400 hover:text-sri-blue p-1 rounded-full hover:bg-slate-100 transition-colors">
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'ordenes' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => setShowModalOrden(true)}
                            className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm"
                        >
                            <Plus size={16} /> Nueva Orden
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3">Fecha</th>
                                        <th className="px-6 py-3">Orden #</th>
                                        <th className="px-6 py-3">Proveedor</th>
                                        <th className="px-6 py-3">Detalle</th>
                                        <th className="px-6 py-3 text-right">Total</th>
                                        <th className="px-6 py-3 text-center">Estado</th>
                                        <th className="px-6 py-3 text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {ordenes.map((orden) => (
                                        <tr key={orden.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-slate-600">{orden.fechaEmision}</td>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-700">{orden.secuencial}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-800">{orden.proveedor.razonSocial}</span>
                                                    <span className="text-xs text-slate-500">Entrega: {orden.fechaEntrega}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate">
                                                {orden.observacion}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">{formatMoney(orden.total)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    orden.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                                                    orden.estado === 'FACTURADA' ? 'bg-green-100 text-green-800' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {orden.estado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {orden.estado === 'PENDIENTE' && (
                                                    <button 
                                                        onClick={() => handleFacturarOrden(orden)}
                                                        className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 bg-blue-50 px-2 py-1 rounded flex items-center justify-center gap-1 mx-auto hover:bg-blue-100 transition-colors"
                                                        title="Convertir a Factura"
                                                    >
                                                        Facturar <ArrowRight size={12} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {ordenes.length === 0 && (
                                        <tr><td colSpan={7} className="p-8 text-center text-slate-400">No hay órdenes de compra registradas.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {showModalCompra && (
                <NuevaCompraModal 
                    onClose={() => setShowModalCompra(false)} 
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                    ordenPrevia={ordenParaFacturar}
                />
            )}

            {showModalOrden && (
                <OrdenCompraModal 
                    onClose={() => setShowModalOrden(false)} 
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                />
            )}

            {showModalNC && selectedCompraNC && (
                <NotaCreditoProveedorModal 
                    compra={selectedCompraNC}
                    onClose={() => setShowModalNC(false)}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                />
            )}
        </div>
    );
};
