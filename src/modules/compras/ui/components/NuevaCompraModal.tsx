'use client';

import React, { useState } from 'react';
import { X, Save, Calculator, Search } from 'lucide-react';
import { Compra, SustentoTributario, OrdenCompra } from '../../domain/types';
import { CodigoRetencion } from '@/modules/configuracion/domain/types';
import { AsientoContable } from '@/modules/contabilidad/domain/types';
import { InMemoryCompraRepository } from '../../infrastructure/CompraRepository';
import { ConfiguracionUseCases, ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { useCentrosCostos } from '@/modules/contabilidad/hooks/useContabilidad';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';

interface Props {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
    ordenPrevia?: OrdenCompra;
}

export const NuevaCompraModal: React.FC<Props> = ({ onClose, onSave, empresaId, ordenPrevia }) => {
    const { centros: centrosCostos, cargarCentros } = useCentrosCostos();
    const [retencionesDisponibles, setRetencionesDisponibles] = React.useState<CodigoRetencion[]>([]);

    const [proveedorNombre, setProveedorNombre] = useState(ordenPrevia?.proveedor.razonSocial || '');
    const [proveedorRuc, setProveedorRuc] = useState(ordenPrevia?.proveedor.ruc || '');
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
    const [secuencial, setSecuencial] = useState('');
    const [autorizacion, setAutorizacion] = useState('');
    const [sustento, setSustento] = useState<SustentoTributario>(SustentoTributario.CREDITO_TRIBUTARIO);

    const [centroCostoId, setCentroCostoId] = useState('');

    const [subtotal15, setSubtotal15] = useState(ordenPrevia ? ordenPrevia.detalles.filter(d => d.grabaIva).reduce((acc, d) => acc + d.subtotal, 0) : 0);
    const [subtotal0, setSubtotal0] = useState(ordenPrevia ? ordenPrevia.detalles.filter(d => !d.grabaIva).reduce((acc, d) => acc + d.subtotal, 0) : 0);

    const [aplicaRetencion, setAplicaRetencion] = useState(true);
    const [codRetRenta, setCodRetRenta] = useState('');
    const [codRetIva, setCodRetIva] = useState('');

    const [guardando, setGuardando] = useState(false);

    React.useEffect(() => {
        ConfiguracionUseCases.listarRetenciones().then(data => {
            setRetencionesDisponibles(data);
            const defaultRenta = data.find((r: any) => r.tipo === 'RENTA' && r.codigo === '312');
            const defaultIva = data.find((r: any) => r.tipo === 'IVA' && r.codigo === '9');
            if (defaultRenta) setCodRetRenta(defaultRenta.codigo);
            if (defaultIva) setCodRetIva(defaultIva.codigo);
        });

        cargarCentros();
    }, [cargarCentros]);

    const montoIva = Number((subtotal15 * 0.15).toFixed(2));
    const totalFactura = subtotal15 + subtotal0 + montoIva;

    const selectedRetRenta = retencionesDisponibles.find(c => c.codigo === codRetRenta && c.tipo === 'RENTA');
    const selectedRetIva = retencionesDisponibles.find(c => c.codigo === codRetIva && c.tipo === 'IVA');

    const baseImponibleRenta = subtotal15 + subtotal0;
    const valorRetRenta = Number((baseImponibleRenta * ((selectedRetRenta?.porcentaje || 0) / 100)).toFixed(2));
    const valorRetIva = Number((montoIva * ((selectedRetIva?.porcentaje || 0) / 100)).toFixed(2));
    const totalRetenido = valorRetRenta + valorRetIva;
    const totalPagar = totalFactura - totalRetenido;

    const handleGuardar = async () => {
        if (!proveedorRuc || !secuencial) return;

        setGuardando(true);
        try {
            const nuevaCompra: Compra = {
                id: crypto.randomUUID(),
                empresaId,
                proveedor: {
                    id: crypto.randomUUID(),
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

            const selectedCentro = centrosCostos.find(c => c.id === centroCostoId);

            const asiento: AsientoContable = {
                id: crypto.randomUUID(),
                empresaId,
                numero: `CC-${Math.floor(Math.random() * 1000)}`,
                fecha: fechaEmision,
                glosa: `P/R Compra Fac/${secuencial} - ${proveedorNombre} ${selectedCentro ? `(${selectedCentro.nombre})` : ''}`,
                tipo: 'EGRESO',
                estado: 'MAYORIZADO',
                totalDebe: totalFactura,
                totalHaber: totalFactura,
                detalles: [
                    {
                        cuentaCodigo: '1.1.03.01',
                        cuentaNombre: 'INVENTARIO DE MERCADERÍAS',
                        debe: subtotal15 + subtotal0,
                        haber: 0,
                        centroCostoId: centroCostoId || undefined
                    },
                    { cuentaCodigo: '1.1.05.01', cuentaNombre: 'IVA COMPRAS', debe: montoIva, haber: 0 },
                    { cuentaCodigo: '2.1.01.01', cuentaNombre: 'CUENTAS POR PAGAR PROVEEDORES', debe: 0, haber: totalPagar },
                    { cuentaCodigo: '2.1.03.01', cuentaNombre: 'RETENCIÓN FUENTE RENTA', debe: 0, haber: valorRetRenta },
                    { cuentaCodigo: '2.1.03.02', cuentaNombre: 'RETENCIÓN IVA', debe: 0, haber: valorRetIva }
                ].filter(d => d.debe > 0 || d.haber > 0),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'system'
            };

            await ContabilidadUseCases.registrarAsiento(asiento);

            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al registrar la compra');
        } finally {
            setGuardando(false);
        }
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
                    <section>
                        <h3 className="text-sm font-bold text-sri-blue uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">1. Datos del Proveedor y Comprobante</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">RUC Proveedor</label>
                                <div className="flex gap-2">
                                    <input type="text" value={proveedorRuc} onChange={e => setProveedorRuc(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                    <button className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200"><Search size={16} /></button>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Razón Social</label>
                                <input type="text" value={proveedorNombre} onChange={e => setProveedorNombre(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nro. Comprobante</label>
                                <input type="text" value={secuencial} onChange={e => setSecuencial(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" placeholder="001-001-..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Fecha Emisión</label>
                                <input type="date" value={fechaEmision} onChange={e => setFechaEmision(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Centro de Costo</label>
                                <select value={centroCostoId} onChange={e => setCentroCostoId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sri-blue/20">
                                    <option value="">-- Asignación General --</option>
                                    {centrosCostos.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Autorización (10 o 49 dígitos)</label>
                                <input type="text" value={autorizacion} onChange={e => setAutorizacion(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" placeholder="0000000000" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Sustento Tributario</label>
                                <select value={sustento} onChange={e => setSustento(e.target.value as SustentoTributario)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                    {Object.values(SustentoTributario).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <h3 className="text-sm font-bold text-sri-blue uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Calculator size={16} /> 2. Bases Imponibles
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Subtotal 15%</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                    <input type="number" value={subtotal15} onChange={e => setSubtotal15(Number(e.target.value))} className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-right font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Subtotal 0%</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                    <input type="number" value={subtotal0} onChange={e => setSubtotal0(Number(e.target.value))} className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-right font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Monto IVA (15%)</label>
                                <div className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-right font-mono text-slate-600">{formatMoney(montoIva)}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-900 mb-1.5">TOTAL FACTURA</label>
                                <div className="w-full px-3 py-2 bg-slate-800 border border-slate-800 rounded-lg text-sm text-right font-mono text-white font-bold shadow-md">{formatMoney(totalFactura)}</div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                            <h3 className="text-sm font-bold text-sri-blue uppercase tracking-wider">3. Emisión de Retención</h3>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-sm text-slate-600">Generar Retención</span>
                                <input type="checkbox" checked={aplicaRetencion} onChange={e => setAplicaRetencion(e.target.checked)} className="h-5 w-5 text-sri-blue rounded" />
                            </label>
                        </div>

                        {aplicaRetencion ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase">Impuesto a la Renta</h4>
                                    <div>
                                        <label className="block text-xs text-slate-600 mb-1">Concepto de Retención</label>
                                        <select value={codRetRenta} onChange={e => setCodRetRenta(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white">
                                            <option value="">Seleccione...</option>
                                            {retencionesDisponibles.filter(r => r.tipo === 'RENTA').map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.concepto} ({c.porcentaje}%)</option>)}
                                        </select>
                                    </div>
                                    <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                        <span className="text-sm text-blue-800 font-medium">Valor a Retener ({selectedRetRenta?.porcentaje || 0}%)</span>
                                        <span className="text-sm font-bold text-blue-900 font-mono">{formatMoney(valorRetRenta)}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase">Impuesto al Valor Agregado (IVA)</h4>
                                    <div>
                                        <label className="block text-xs text-slate-600 mb-1">Porcentaje Retención IVA</label>
                                        <select value={codRetIva} onChange={e => setCodRetIva(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white">
                                            <option value="">Seleccione...</option>
                                            {retencionesDisponibles.filter(r => r.tipo === 'IVA').map(p => <option key={p.codigo} value={p.codigo}>{p.codigo} - {p.concepto}</option>)}
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

                <div className="p-6 bg-slate-900 text-white rounded-b-xl flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-sm opacity-80">
                        {aplicaRetencion ? <span>Se emitirá la retención electrónica automáticamente.</span> : <span>Solo se registrará la compra en el sistema.</span>}
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
                        <Button onClick={handleGuardar} disabled={!proveedorRuc || !secuencial || totalFactura === 0 || guardando} className="ml-4 px-6 py-3 bg-sri-light text-white font-bold rounded-xl hover:bg-white hover:text-sri-blue transition-all disabled:opacity-50 flex items-center gap-2">
                            <Save size={20} /> {guardando ? 'Guardando...' : 'Guardar Compra'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
