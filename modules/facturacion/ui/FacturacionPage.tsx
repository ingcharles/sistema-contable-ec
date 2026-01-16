
import React, { useEffect, useState } from 'react';
import { Factura, GuiaRemision } from '../domain/types';
import { InMemoryFacturaRepository } from '../infrastructure/FacturaRepository';
import { InMemoryContabilidadRepository } from '../../contabilidad/infrastructure/ContabilidadRepository';
import { InMemoryInventarioRepository } from '../../inventario/infrastructure/InventarioRepository';
import { AsientoContable } from '../../contabilidad/domain/types';
import { TipoMovimientoInventario } from '../../inventario/domain/types';
import { formatMoney } from '../../../services/sriService';
import { EstadoSRI, TipoComprobante, Empresa } from '../../../types';
import { CheckCircle2, XCircle, Clock, FileText, Download, Send, Plus, Search, Filter, Trash2, Save, ShoppingCart, RotateCcw, AlertCircle, Truck, MapPin, Calendar, Receipt, FileInput, Package } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

// --- UTILIDAD: Generador XML Factura Electrónica ---
const generarFacturaXML = (factura: Factura, empresa: Empresa) => {
    // Estructura XSD v2.1.0 (Simplificada para demo)
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="2.1.0">
    <infoTributaria>
        <ambiente>1</ambiente>
        <tipoEmision>1</tipoEmision>
        <razonSocial>${empresa.razonSocial}</razonSocial>
        <nombreComercial>${empresa.nombreComercial}</nombreComercial>
        <ruc>${empresa.ruc}</ruc>
        <claveAcceso>${factura.claveAcceso}</claveAcceso>
        <codDoc>01</codDoc>
        <estab>${factura.secuencial.split('-')[0]}</estab>
        <ptoEmi>${factura.secuencial.split('-')[1]}</ptoEmi>
        <secuencial>${factura.secuencial.split('-')[2]}</secuencial>
        <dirMatriz>${empresa.direccionMatriz}</dirMatriz>
        ${empresa.agenteRetencion ? '<agenteRetencion>1</agenteRetencion>' : ''}
        ${empresa.rimpe ? `<contribuyenteRimpe>${empresa.rimpe}</contribuyenteRimpe>` : ''}
    </infoTributaria>
    <infoFactura>
        <fechaEmision>${factura.fechaEmision.split('-').reverse().join('/')}</fechaEmision>
        <dirEstablecimiento>${empresa.direccionMatriz}</dirEstablecimiento>
        <obligadoContabilidad>${empresa.obligadoContabilidad ? 'SI' : 'NO'}</obligadoContabilidad>
        <tipoIdentificacionComprador>04</tipoIdentificacionComprador> <!-- RUC -->
        <razonSocialComprador>${factura.terceroNombre}</razonSocialComprador>
        <identificacionComprador>${factura.terceroId}</identificacionComprador>
        <totalSinImpuestos>${factura.subtotal.toFixed(2)}</totalSinImpuestos>
        <totalDescuento>0.00</totalDescuento>
        <totalConImpuestos>
            <totalImpuesto>
                <codigo>2</codigo> <!-- IVA -->
                <codigoPorcentaje>4</codigoPorcentaje> <!-- 15% -->
                <baseImponible>${factura.subtotal.toFixed(2)}</baseImponible>
                <valor>${factura.totalImpuestos.toFixed(2)}</valor>
            </totalImpuesto>
        </totalConImpuestos>
        <propina>0.00</propina>
        <importeTotal>${factura.importeTotal.toFixed(2)}</importeTotal>
        <moneda>DOLAR</moneda>
    </infoFactura>
    <detalles>
        <detalle>
            <codigoPrincipal>GEN-001</codigoPrincipal>
            <descripcion>SERVICIO O BIEN GENERADO DESDE SISTEMA</descripcion>
            <cantidad>1.00</cantidad>
            <precioUnitario>${factura.subtotal.toFixed(2)}</precioUnitario>
            <descuento>0.00</descuento>
            <precioTotalSinImpuesto>${factura.subtotal.toFixed(2)}</precioTotalSinImpuesto>
            <impuestos>
                <impuesto>
                    <codigo>2</codigo>
                    <codigoPorcentaje>4</codigoPorcentaje>
                    <tarifa>15.00</tarifa>
                    <baseImponible>${factura.subtotal.toFixed(2)}</baseImponible>
                    <valor>${factura.totalImpuestos.toFixed(2)}</valor>
                </impuesto>
            </impuestos>
        </detalle>
    </detalles>
</factura>`;
    return xml;
};

// --- SUBCOMPONENTE: MODAL LIQUIDACIÓN DE COMPRA ---
const LiquidacionCompraModal = ({ onClose, onSave, empresa }: { onClose: () => void, onSave: () => void, empresa: Empresa }) => {
    // ... (Se mantiene igual) ...
    const [proveedorNombre, setProveedorNombre] = useState('');
    const [proveedorId, setProveedorId] = useState(''); 
    const [direccion, setDireccion] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [valorServicio, setValorServicio] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const subtotal = valorServicio;
    const iva = subtotal * 0.15;
    const totalDocumento = subtotal + iva;
    const retencionIva = iva;
    const retencionRenta = subtotal * 0.02;
    const totalPagar = totalDocumento - retencionIva - retencionRenta;

    const handleGuardar = async () => {
        if (!proveedorId || !proveedorNombre || valorServicio <= 0) return;
        setIsSaving(true);

        const secuencial = '001-001-' + Math.floor(Math.random() * 1000000).toString().padStart(9, '0');
        const fechaEmision = new Date().toISOString().split('T')[0];

        const nuevaLiq: Factura = {
            id: Math.random().toString(36),
            empresaId: empresa.id,
            tipo: TipoComprobante.LIQUIDACION_COMPRA,
            secuencial,
            fechaEmision,
            terceroNombre: proveedorNombre,
            terceroId: proveedorId,
            terceroEmail: 'sin_email@proveedor.com',
            subtotal: subtotal,
            descuento: 0,
            totalImpuestos: iva,
            importeTotal: totalDocumento,
            estado: EstadoSRI.AUTORIZADO,
            claveAcceso: '2510202303' + empresa.ruc + '1' + secuencial.replace(/-/g,'') + '123456781',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user'
        };

        const repoFactura = new InMemoryFacturaRepository();
        await repoFactura.save(nuevaLiq);

        const asiento: AsientoContable = {
            id: Math.random().toString(36),
            empresaId: empresa.id,
            numero: `LC-${secuencial}`,
            fecha: fechaEmision,
            glosa: `Liquidación Compra ${secuencial} - ${proveedorNombre}`,
            tipo: 'EGRESO',
            estado: 'MAYORIZADO',
            totalDebe: totalDocumento,
            totalHaber: totalDocumento,
            detalles: [
                { cuentaCodigo: '5.2.02.01', cuentaNombre: 'GASTOS SERVICIOS OCASIONALES', debe: subtotal, haber: 0 },
                { cuentaCodigo: '1.1.05.01', cuentaNombre: 'IVA COMPRAS', debe: iva, haber: 0 },
                { cuentaCodigo: '2.1.01.01', cuentaNombre: 'CUENTAS POR PAGAR', debe: 0, haber: totalPagar },
                { cuentaCodigo: '2.1.03.01', cuentaNombre: 'RETENCIÓN RENTA POR PAGAR', debe: 0, haber: retencionRenta },
                { cuentaCodigo: '2.1.03.02', cuentaNombre: 'RETENCIÓN IVA POR PAGAR', debe: 0, haber: retencionIva },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        };
        const repoContabilidad = new InMemoryContabilidadRepository();
        await repoContabilidad.saveAsiento(asiento);

        setIsSaving(false);
        alert('Liquidación de Compra emitida y contabilizada correctamente.');
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <FileInput className="text-sri-blue" /> Nueva Liquidación de Compra
                        </h2>
                        <p className="text-xs text-slate-500">Documento Tipo 03 - Para compras a personas sin RUC</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cédula Proveedor</label>
                            <input type="text" value={proveedorId} onChange={e => setProveedorId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="17..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Proveedor</label>
                            <input type="text" value={proveedorNombre} onChange={e => setProveedorNombre(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Nombre completo" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
                        <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Servicio prestado" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor ($)</label>
                        <input type="number" value={valorServicio} onChange={e => setValorServicio(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-lg font-bold text-right" />
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-sm">
                        <div className="flex justify-between font-bold text-slate-900 text-base">
                            <span>Valor a Pagar</span>
                            <span>{formatMoney(totalPagar)}</span>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-white rounded-lg">Cancelar</button>
                    <button onClick={handleGuardar} disabled={isSaving || !proveedorId || valorServicio <= 0} className="px-6 py-2 bg-sri-blue text-white font-medium rounded-lg hover:bg-sri-light flex items-center gap-2">
                        <Save size={18} /> Emitir
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SUBCOMPONENTE: MODAL NUEVA FACTURA ---
interface DetalleFactura {
    productoId: string;
    codigo: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    subtotal: number;
    grabaIva: boolean;
}

const NuevaFacturaModal = ({ onClose, onSave, empresa }: { onClose: () => void, onSave: () => void, empresa: Empresa }) => {
    // ... (Lógica Factura igual, solo actualizando clave de acceso dummy para que sea más realista) ...
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteId, setClienteId] = useState('');
    const [clienteEmail, setClienteEmail] = useState('');
    const [items, setItems] = useState<DetalleFactura[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    
    const subtotal15 = items.filter(i => i.grabaIva).reduce((acc, i) => acc + i.subtotal, 0);
    const subtotal0 = items.filter(i => !i.grabaIva).reduce((acc, i) => acc + i.subtotal, 0);
    const iva = subtotal15 * 0.15;
    const total = subtotal15 + subtotal0 + iva;

    const addItem = () => {
        const newItem: DetalleFactura = {
            productoId: 'prod1', 
            codigo: '78610001',
            descripcion: 'LAPTOP HP PAVILION 15" (Demo)',
            cantidad: 1,
            precioUnitario: 890.00,
            descuento: 0,
            subtotal: 890.00,
            grabaIva: true
        };
        setItems([...items, newItem]);
    };

    const updateItem = (index: number, field: keyof DetalleFactura, value: any) => {
        const newItems = [...items];
        const item = newItems[index];
        (item as any)[field] = value;
        if (field === 'cantidad' || field === 'precioUnitario') item.subtotal = item.cantidad * item.precioUnitario;
        setItems(newItems);
    };

    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const handleGuardar = async () => {
        if (!clienteId || items.length === 0 || total === 0) return;
        setIsSaving(true);

        const secuencial = '001-001-' + Math.floor(Math.random() * 1000000).toString().padStart(9, '0');
        const fechaEmision = new Date().toISOString().split('T')[0];
        
        // Mock Clave Acceso 49 digitos
        const claveAcceso = '2510202301' + empresa.ruc + '1' + secuencial.replace(/-/g,'') + '123456781';

        const nuevaFactura: Factura = {
            id: Math.random().toString(36),
            empresaId: empresa.id,
            tipo: TipoComprobante.FACTURA,
            secuencial,
            fechaEmision,
            terceroNombre: clienteNombre,
            terceroId: clienteId,
            terceroEmail: clienteEmail,
            subtotal: subtotal15 + subtotal0,
            descuento: 0,
            totalImpuestos: iva,
            importeTotal: total,
            estado: EstadoSRI.AUTORIZADO,
            claveAcceso, 
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user'
        };

        const repoFactura = new InMemoryFacturaRepository();
        await repoFactura.save(nuevaFactura);

        // ... (Asiento y Kardex igual) ...
        const asiento: AsientoContable = {
            id: Math.random().toString(36),
            empresaId: empresa.id,
            numero: `CV-${Math.floor(Math.random() * 1000)}`,
            fecha: fechaEmision,
            glosa: `V/R Factura ${secuencial} - ${clienteNombre}`,
            tipo: 'INGRESO',
            estado: 'MAYORIZADO',
            totalDebe: total,
            totalHaber: total,
            detalles: [
                { cuentaCodigo: '1.1.02.01', cuentaNombre: 'CUENTAS POR COBRAR CLIENTES', debe: total, haber: 0 },
                { cuentaCodigo: '4.1.01.01', cuentaNombre: 'VENTAS GRAVADAS 15%', debe: 0, haber: subtotal15 },
                { cuentaCodigo: '4.1.01.02', cuentaNombre: 'VENTAS TARIFA 0%', debe: 0, haber: subtotal0 },
                { cuentaCodigo: '2.1.07.01', cuentaNombre: 'IVA EN VENTAS', debe: 0, haber: iva }
            ].filter(d => d.debe > 0 || d.haber > 0),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        };
        const repoContabilidad = new InMemoryContabilidadRepository();
        await repoContabilidad.saveAsiento(asiento);

        const repoInventario = new InMemoryInventarioRepository();
        for (const item of items) {
             await repoInventario.saveMovimiento({
                 id: Math.random().toString(36),
                 productoId: item.productoId,
                 fecha: fechaEmision,
                 tipo: TipoMovimientoInventario.VENTA,
                 referenciaComprobante: `FAC ${secuencial}`,
                 cantidadEntrada: 0,
                 cantidadSalida: item.cantidad,
                 saldoCantidad: 0,
                 costoUnitario: item.precioUnitario * 0.70,
                 valorEntrada: 0,
                 valorSalida: item.cantidad * (item.precioUnitario * 0.70),
                 saldoValor: 0,
                 createdAt: new Date().toISOString(),
                 updatedAt: new Date().toISOString(),
                 createdBy: 'system'
             });
        }

        setIsSaving(false);
        alert('Factura emitida exitosamente.');
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800">Nueva Factura</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                        <input type="text" value={clienteId} onChange={e => setClienteId(e.target.value)} placeholder="RUC / Cédula" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        <input type="text" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Nombre Cliente" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        <input type="email" value={clienteEmail} onChange={e => setClienteEmail(e.target.value)} placeholder="Email" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-700">Ítems</h3>
                            <button onClick={addItem} className="text-xs bg-sri-blue text-white px-3 py-1.5 rounded-lg">+ Agregar</button>
                        </div>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-2 w-16 text-center">Cant.</th>
                                        <th className="px-4 py-2 text-left">Descripción</th>
                                        <th className="px-4 py-2 w-32 text-right">P. Unit</th>
                                        <th className="px-4 py-2 w-32 text-right">Subtotal</th>
                                        <th className="px-4 py-2 w-10 text-center">IVA</th>
                                        <th className="px-4 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="p-2"><input type="number" value={item.cantidad} onChange={e => updateItem(idx, 'cantidad', parseFloat(e.target.value) || 0)} className="w-full text-center border border-slate-200 rounded p-1" /></td>
                                            <td className="p-2"><input type="text" value={item.descripcion} onChange={e => updateItem(idx, 'descripcion', e.target.value)} className="w-full border border-slate-200 rounded p-1" /></td>
                                            <td className="p-2"><input type="number" value={item.precioUnitario} onChange={e => updateItem(idx, 'precioUnitario', parseFloat(e.target.value) || 0)} className="w-full text-right border border-slate-200 rounded p-1" /></td>
                                            <td className="p-2 text-right">{item.subtotal.toFixed(2)}</td>
                                            <td className="p-2 text-center"><input type="checkbox" checked={item.grabaIva} onChange={e => updateItem(idx, 'grabaIva', e.target.checked)} /></td>
                                            <td className="p-2 text-center"><button onClick={() => removeItem(idx)} className="text-red-500"><Trash2 size={16} /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200 rounded-b-xl flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="w-full text-right">
                        <p className="text-lg font-bold text-slate-900">TOTAL: {formatMoney(total)}</p>
                        <button onClick={handleGuardar} disabled={items.length === 0 || !clienteId} className="mt-4 px-6 py-2 bg-sri-blue text-white font-bold rounded-lg hover:bg-sri-light">Emitir Factura</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MODAL GUIA REMISION ---
// (Se mantiene igual)
const GuiaRemisionModal = ({ onClose, onSave, empresa, facturas }: { onClose: () => void, onSave: () => void, empresa: Empresa, facturas: Factura[] }) => {
    // ... (Código Guia Remisión sin cambios) ...
    const [facturaId, setFacturaId] = useState('');
    const [transportistaNombre, setTransportistaNombre] = useState('');
    const [transportistaRuc, setTransportistaRuc] = useState('');
    const [placa, setPlaca] = useState('');
    const [dirPartida, setDirPartida] = useState(empresa.direccionMatriz);
    const [dirLlegada, setDirLlegada] = useState('');
    const [motivo, setMotivo] = useState('VENTA');
    const [fechaIni, setFechaIni] = useState(new Date().toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if(facturaId) {
            const fac = facturas.find(f => f.id === facturaId);
            if(fac) {
                setDirLlegada('Dirección del Cliente ' + fac.terceroNombre); 
            }
        }
    }, [facturaId, facturas]);

    const handleGuardar = async () => {
        if(!transportistaRuc || !dirLlegada) return;
        const facRef = facturas.find(f => f.id === facturaId);
        const nuevaGuia: GuiaRemision = {
            id: Math.random().toString(36),
            empresaId: empresa.id,
            tipo: TipoComprobante.GUIA_REMISION,
            secuencial: '001-001-' + Math.floor(Math.random() * 1000000).toString().padStart(9, '0'),
            fechaEmision: new Date().toISOString().split('T')[0],
            fechaInicioTransporte: fechaIni,
            fechaFinTransporte: fechaFin,
            facturaId: facRef?.id,
            nroFactura: facRef?.secuencial,
            destinatarioNombre: facRef?.terceroNombre || 'CONSUMIDOR FINAL',
            destinatarioId: facRef?.terceroId || '9999999999999',
            transportista: {
                ruc: transportistaRuc,
                razonSocial: transportistaNombre,
                placa: placa
            },
            direccionPartida: dirPartida,
            direccionLlegada: dirLlegada,
            motivoTraslado: motivo,
            estado: EstadoSRI.AUTORIZADO,
            claveAcceso: 'GUIA_GENERADA_MOCK',
            itemsDescripcion: 'MERCADERÍA VARIA SEGÚN FACTURA',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'bodega'
        };
        const repo = new InMemoryFacturaRepository();
        await repo.saveGuia(nuevaGuia);
        alert('Guía de Remisión generada exitosamente');
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Truck className="text-sri-blue" /> Generar Guía de Remisión
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vincular a Factura (Opcional)</label>
                        <select value={facturaId} onChange={e => setFacturaId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                            <option value="">-- Sin factura relacionada --</option>
                            {facturas.filter(f => f.tipo === TipoComprobante.FACTURA).map(f => (
                                <option key={f.id} value={f.id}>{f.secuencial} - {f.terceroNombre}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="border-t border-slate-100 pt-4">
                        <h3 className="text-sm font-bold text-slate-700 mb-3">Datos del Transporte</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">RUC Transportista</label>
                                <input type="text" value={transportistaRuc} onChange={e => setTransportistaRuc(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs text-slate-500 mb-1">Razón Social Transportista</label>
                                <input type="text" value={transportistaNombre} onChange={e => setTransportistaNombre(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Placa Vehículo</label>
                                <input type="text" value={placa} onChange={e => setPlaca(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm uppercase" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Fecha Inicio</label>
                                <input type="date" value={fechaIni} onChange={e => setFechaIni(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Fecha Fin</label>
                                <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <h3 className="text-sm font-bold text-slate-700 mb-3">Ruta</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Dirección Partida</label>
                                <input type="text" value={dirPartida} onChange={e => setDirPartida(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Dirección Llegada</label>
                                <input type="text" value={dirLlegada} onChange={e => setDirLlegada(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-white rounded-lg">Cancelar</button>
                    <button onClick={handleGuardar} className="px-6 py-2 bg-sri-blue text-white font-medium rounded-lg hover:bg-sri-light flex items-center gap-2">
                        <Save size={18} /> Generar Guía
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MODAL NOTA DE CREDITO ---
const NotaCreditoModal = ({ factura, onClose, onSave, empresa }: { factura: Factura, onClose: () => void, onSave: () => void, empresa: Empresa }) => {
    // ... (Se mantiene igual) ...
    const [motivo, setMotivo] = useState('');
    const [valorDevolucion, setValorDevolucion] = useState(factura.importeTotal); // Default devolución total
    const [isSaving, setIsSaving] = useState(false);

    const factor = valorDevolucion / factura.importeTotal;
    const subtotalNC = Number((factura.subtotal * factor).toFixed(2));
    const ivaNC = Number((factura.totalImpuestos * factor).toFixed(2));

    const handleGuardar = async () => {
        if (!motivo || valorDevolucion <= 0 || valorDevolucion > factura.importeTotal) {
            alert('Revise el monto y el motivo');
            return;
        }
        setIsSaving(true);

        const secuencial = '001-001-' + Math.floor(Math.random() * 1000000).toString().padStart(9, '0');
        const fechaEmision = new Date().toISOString().split('T')[0];

        const nc: Factura = {
            id: Math.random().toString(36),
            empresaId: empresa.id,
            tipo: TipoComprobante.NOTA_CREDITO,
            secuencial,
            fechaEmision,
            terceroNombre: factura.terceroNombre,
            terceroId: factura.terceroId,
            terceroEmail: factura.terceroEmail,
            subtotal: subtotalNC,
            descuento: 0,
            totalImpuestos: ivaNC,
            importeTotal: valorDevolucion,
            estado: EstadoSRI.AUTORIZADO,
            claveAcceso: '2510202304' + empresa.ruc + '1' + secuencial.replace(/-/g,'') + '123456781',
            documentoModificadoId: factura.secuencial,
            motivoModificacion: motivo,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user'
        };

        const repoFactura = new InMemoryFacturaRepository();
        await repoFactura.save(nc);

        const asiento: AsientoContable = {
            id: Math.random().toString(36),
            empresaId: empresa.id,
            numero: `NCV-${secuencial}`,
            fecha: fechaEmision,
            glosa: `Nota Crédito ${secuencial} Ref: ${factura.secuencial} - ${motivo}`,
            tipo: 'EGRESO',
            estado: 'MAYORIZADO',
            totalDebe: valorDevolucion,
            totalHaber: valorDevolucion,
            detalles: [
                { cuentaCodigo: '4.1.01.01', cuentaNombre: 'VENTAS GRAVADAS 15%', debe: subtotalNC, haber: 0 },
                { cuentaCodigo: '2.1.07.01', cuentaNombre: 'IVA EN VENTAS', debe: ivaNC, haber: 0 },
                { cuentaCodigo: '1.1.02.01', cuentaNombre: 'CUENTAS POR COBRAR CLIENTES', debe: 0, haber: valorDevolucion }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        };
        const repoContabilidad = new InMemoryContabilidadRepository();
        await repoContabilidad.saveAsiento(asiento);
        
        setIsSaving(false);
        alert('Nota de Crédito emitida. Se ha reversado la venta y la cuenta por cobrar.');
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-orange-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-orange-800 flex items-center gap-2">
                        <RotateCcw size={20} /> Emitir Nota de Crédito
                    </h2>
                    <button onClick={onClose} className="text-orange-400 hover:text-orange-700"><XCircle size={24} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm">
                        <p><strong>Factura Afectada:</strong> {factura.secuencial}</p>
                        <p><strong>Cliente:</strong> {factura.terceroNombre}</p>
                        <p><strong>Valor Factura:</strong> {formatMoney(factura.importeTotal)}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo de la Modificación</label>
                        <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Ej: Devolución de mercadería, Descuento comercial..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor a Devolver (Total o Parcial)</label>
                        <input type="number" value={valorDevolucion} onChange={e => setValorDevolucion(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-lg font-bold text-right" />
                        <p className="text-xs text-slate-400 mt-1 text-right">Máximo: {formatMoney(factura.importeTotal)}</p>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button onClick={handleGuardar} disabled={isSaving} className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-500 flex items-center gap-2 shadow-sm">
                        <Save size={18} /> Emitir NC
                    </button>
                </div>
            </div>
        </div>
    );
};

const EstadoBadge = ({ estado }: { estado: EstadoSRI }) => {
    switch (estado) {
        case EstadoSRI.AUTORIZADO:
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"><CheckCircle2 size={12}/> {estado}</span>;
        case EstadoSRI.ANULADO:
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"><XCircle size={12}/> {estado}</span>;
        case EstadoSRI.PENDIENTE:
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200"><Clock size={12}/> {estado}</span>;
        default:
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"><XCircle size={12}/> {estado}</span>;
    }
};

export const FacturacionPage: React.FC = () => {
  const { currentEmpresa } = useOutletContext<{ currentEmpresa: Empresa }>();
  const [activeTab, setActiveTab] = useState<'comprobantes' | 'guias'>('comprobantes');
  
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [guias, setGuias] = useState<GuiaRemision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  
  // Modals state
  const [showModalFactura, setShowModalFactura] = useState(false);
  const [showModalGuia, setShowModalGuia] = useState(false);
  const [showModalLiq, setShowModalLiq] = useState(false);
  const [selectedFacturaNC, setSelectedFacturaNC] = useState<Factura | null>(null);

  const loadData = async () => {
      setLoading(true);
      const repo = new InMemoryFacturaRepository();
      const [dataFacturas, dataGuias] = await Promise.all([
          repo.getAll(currentEmpresa.id),
          repo.getGuias(currentEmpresa.id)
      ]);
      setFacturas(dataFacturas);
      setGuias(dataGuias);
      setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentEmpresa.id]);

  const downloadXML = (factura: Factura) => {
      const xmlString = generarFacturaXML(factura, currentEmpresa);
      const blob = new Blob([xmlString], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FACTURA-${factura.claveAcceso}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const filteredFacturas = facturas.filter(f => 
    f.terceroNombre.toLowerCase().includes(filtro.toLowerCase()) || 
    f.secuencial.includes(filtro) ||
    f.terceroId.includes(filtro)
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Comprobantes Electrónicos</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestión de facturación y logística para <span className="font-semibold text-sri-blue">{currentEmpresa.razonSocial}</span>
          </p>
        </div>
        <div className="flex gap-2">
           <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('comprobantes')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'comprobantes' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Receipt size={16} /> Facturas y Notas
                </button>
                <button 
                    onClick={() => setActiveTab('guias')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'guias' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Truck size={16} /> Guías Remisión
                </button>
           </div>
        </div>
      </div>

      {activeTab === 'comprobantes' && (
      <>
        {/* Filters Area */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por cliente, RUC o secuencial..." 
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sri-blue/20 focus:border-sri-blue outline-none transition-all shadow-sm"
                />
            </div>
            <div className="md:col-span-2">
                <select className="w-full h-full px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-sri-blue/20 outline-none cursor-pointer">
                    <option value="">Todos los Estados</option>
                    <option value="AUTORIZADO">Autorizados</option>
                    <option value="PENDIENTE">Pendientes</option>
                    <option value="ANULADO">Anulados</option>
                </select>
            </div>
            <div className="md:col-span-6 flex justify-end gap-2">
                <button 
                    onClick={() => setShowModalLiq(true)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-200 flex items-center gap-2 transition-all"
                >
                    <FileInput size={16} /> Liquidación Compra
                </button>
                <button 
                    onClick={() => setShowModalFactura(true)}
                    className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all transform hover:scale-105"
                >
                    <Plus size={16} /> Emitir Factura
                </button>
            </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {loading ? (
            <div className="p-12 text-center text-slate-400">Cargando comprobantes...</div>
            ) : filteredFacturas.length === 0 ? (
            <div className="p-12 text-center">
                <div className="mx-auto h-12 w-12 text-slate-300 mb-3"><Filter size={48} /></div>
                <p className="text-slate-500 font-medium">No se encontraron documentos</p>
                <p className="text-sm text-slate-400">Intenta ajustar los filtros de búsqueda</p>
            </div>
            ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Emisión</th>
                            <th className="px-6 py-4">Comprobante</th>
                            <th className="px-6 py-4">Cliente / Beneficiario</th>
                            <th className="px-6 py-4 text-right">Base Imp.</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4 text-center">Estado SRI</th>
                            <th className="px-6 py-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredFacturas.map((fac) => (
                            <tr key={fac.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                    {fac.fechaEmision}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700">
                                            {fac.tipo === TipoComprobante.FACTURA ? 'FACTURA' : 
                                             fac.tipo === TipoComprobante.RETENCION ? 'RETENCIÓN' : 
                                             fac.tipo === TipoComprobante.LIQUIDACION_COMPRA ? 'LIQ. COMPRA' : 'N. CRÉDITO'}
                                        </span>
                                        <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded w-fit mt-1">
                                            {fac.secuencial}
                                        </span>
                                        {fac.tipo === TipoComprobante.NOTA_CREDITO && (
                                            <span className="text-[10px] text-blue-500 mt-0.5">Ref: {fac.documentoModificadoId}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-slate-800 font-medium">{fac.terceroNombre}</span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            ID: {fac.terceroId}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right text-slate-500">
                                    {formatMoney(fac.subtotal)}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-slate-900">
                                    {formatMoney(fac.importeTotal)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <EstadoBadge estado={fac.estado} />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-all">
                                        {fac.tipo === TipoComprobante.FACTURA && fac.estado === EstadoSRI.AUTORIZADO && (
                                            <button 
                                                title="Emitir Nota de Crédito" 
                                                onClick={() => setSelectedFacturaNC(fac)}
                                                className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                            >
                                                <RotateCcw size={18} />
                                            </button>
                                        )}
                                        <button title="Descargar RIDE (PDF)" className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <FileText size={18} />
                                        </button>
                                        <button 
                                            title="Descargar XML" 
                                            onClick={() => downloadXML(fac)}
                                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Download size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}
        </div>
      </>
      )}

      {activeTab === 'guias' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-700">Guías de Remisión Emitidas</h3>
                  <button onClick={() => setShowModalGuia(true)} className="px-4 py-2 bg-sri-blue text-white text-sm rounded-lg hover:bg-sri-light flex items-center gap-2">
                      <Plus size={16} /> Nueva Guía
                  </button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                              <th className="px-6 py-3">Fecha</th>
                              <th className="px-6 py-3">Guía #</th>
                              <th className="px-6 py-3">Destinatario</th>
                              <th className="px-6 py-3">Transportista</th>
                              <th className="px-6 py-3">Ruta</th>
                              <th className="px-6 py-3 text-center">Estado</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {guias.map(guia => (
                              <tr key={guia.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-4 text-slate-600">{guia.fechaEmision}</td>
                                  <td className="px-6 py-4 font-mono font-bold text-slate-700">{guia.secuencial}</td>
                                  <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                          <span className="font-medium">{guia.destinatarioNombre}</span>
                                          <span className="text-xs text-slate-500">Ref: {guia.nroFactura || 'S/N'}</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-slate-600 text-xs">{guia.transportista.razonSocial}</td>
                                  <td className="px-6 py-4 text-xs max-w-[200px] truncate" title={`${guia.direccionPartida} -> ${guia.direccionLlegada}`}>
                                      {guia.direccionPartida} -&gt; {guia.direccionLlegada}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <EstadoBadge estado={guia.estado} />
                                  </td>
                              </tr>
                          ))}
                          {guias.length === 0 && (
                              <tr><td colSpan={6} className="p-8 text-center text-slate-400">No hay guías de remisión registradas.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}
      
      {showModalFactura && <NuevaFacturaModal onClose={() => setShowModalFactura(false)} onSave={loadData} empresa={currentEmpresa} />}
      {showModalLiq && <LiquidacionCompraModal onClose={() => setShowModalLiq(false)} onSave={loadData} empresa={currentEmpresa} />}
      {showModalGuia && <GuiaRemisionModal onClose={() => setShowModalGuia(false)} onSave={loadData} empresa={currentEmpresa} facturas={facturas} />}
      {selectedFacturaNC && (
          <NotaCreditoModal 
            factura={selectedFacturaNC} 
            onClose={() => setSelectedFacturaNC(null)} 
            onSave={loadData} 
            empresa={currentEmpresa} 
          />
      )}
    </div>
  );
};
