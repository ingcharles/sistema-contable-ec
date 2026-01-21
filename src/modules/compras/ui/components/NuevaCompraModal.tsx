'use client';

import React, { useState } from 'react';
import { Save, Calculator, Search, Receipt } from 'lucide-react';
import { SustentoTributario, OrdenCompra } from '../../domain/types';
import { CodigoRetencion } from '@/modules/configuracion/domain/types';
import { ComprasUseCases, ConfiguracionUseCases, ContabilidadUseCases, FacturacionUseCases, DirectorioUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { useCentrosCostos } from '@/modules/contabilidad/hooks/useContabilidad';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';
import { AMBIENTE, TIPO_EMISION } from '@/modules/facturacion/domain/catalogos';
import { Tercero } from '@/modules/directorio/domain/types';
import { Modal } from '@/shared/ui/Modal';

interface Props {
    onClose: () => void;
    onSave: () => void;
    ordenPrevia?: OrdenCompra;
}

export const NuevaCompraModal: React.FC<Props> = ({ onClose, onSave, ordenPrevia }) => {
    const { currentEmpresa } = useEmpresa();
    const { centros: centrosCostos, cargarCentros } = useCentrosCostos();
    const [proveedorCompleto, setProveedorCompleto] = useState<Tercero | null>(null);
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

    const buscarProveedor = async () => {
        if (!proveedorRuc) return;
        try {
            const terceros = await DirectorioUseCases.listarTerceros('PROVEEDOR', proveedorRuc);
            if (terceros.length > 0) {
                const prov = terceros[0];
                setProveedorCompleto(prov);
                setProveedorNombre(prov.razonSocial);
            }
        } catch (error) {
            console.error('Error buscando proveedor:', error);
        }
    };

    React.useEffect(() => {
        if (ordenPrevia) {
            buscarProveedor();
        }
    }, [ordenPrevia]);

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
            let resSri = null;
            let nroRetencionGenerado = '';

            // 1. Emitir Retención Electrónica si aplica
            if (aplicaRetencion && currentEmpresa && (codRetRenta || codRetIva)) {
                const impuestos = [];
                if (codRetRenta && valorRetRenta > 0) {
                    impuestos.push({
                        codigo: '1', // RENTA
                        codigoRetencion: codRetRenta,
                        baseImponible: baseImponibleRenta,
                        porcentajeRetener: selectedRetRenta?.porcentaje || 0,
                        valorRetenido: valorRetRenta,
                        codDocSustento: secuencial.startsWith('00') ? '01' : '03',
                        numDocSustento: secuencial,
                        fechaEmisionDocSustento: fechaEmision
                    });
                }
                if (codRetIva && valorRetIva > 0) {
                    impuestos.push({
                        codigo: '2', // IVA
                        codigoRetencion: codRetIva,
                        baseImponible: montoIva,
                        porcentajeRetener: selectedRetIva?.porcentaje || 0,
                        valorRetenido: valorRetIva,
                        codDocSustento: secuencial.startsWith('00') ? '01' : '03',
                        numDocSustento: secuencial,
                        fechaEmisionDocSustento: fechaEmision
                    });
                }

                if (impuestos.length > 0) {
                    const dataRetencion = {
                        ambiente: AMBIENTE.PRUEBAS,
                        tipoEmision: TIPO_EMISION.NORMAL,
                        razonSocial: currentEmpresa.razonSocial,
                        nombreComercial: currentEmpresa.nombreComercial,
                        ruc: currentEmpresa.ruc,
                        estab: '001',
                        ptoEmi: '001',
                        secuencial: Math.floor(Math.random() * 999999999).toString().padStart(9, '0'),
                        dirMatriz: currentEmpresa.direccionMatriz || 'Quito',
                        fechaEmision,
                        obligadoContabilidad: currentEmpresa.obligadoContabilidad ? 'SI' : 'NO',
                        tipoIdentificacionSujetoRetenido: proveedorCompleto?.tipoIdentificacion || (proveedorRuc.length === 13 ? '04' : '05'),
                        razonSocialSujetoRetenido: proveedorNombre,
                        identificacionSujetoRetenido: proveedorRuc,
                        periodoFiscal: fechaEmision.substring(5, 7) + '/' + fechaEmision.substring(0, 4),
                        impuestos
                    };

                    const retStandard = SriStandardizer.standardizeRetencion(dataRetencion);
                    try {
                        resSri = await FacturacionUseCases.emitirFactura(retStandard);
                        if (resSri.estado === 'AUTORIZADO') {
                            nroRetencionGenerado = `001-001-${dataRetencion.secuencial}`;
                        }
                    } catch (e) {
                        console.error('Error SRI Retención:', e);
                    }

                    await FacturacionUseCases.registrarComprobante({
                        tipoComprobante: 'COMPROBANTE_RETENCION',
                        fechaEmision,
                        clienteId: proveedorRuc,
                        clienteNombre: proveedorNombre,
                        clienteIdentificacion: proveedorRuc,
                        subtotal: 0,
                        iva: 0,
                        total: totalRetenido,
                        secuencial: dataRetencion.secuencial,
                        claveAcceso: resSri?.claveAcceso,
                        numeroAutorizacion: resSri?.numeroAutorizacion,
                        estado: resSri?.estado || 'ERROR',
                        detalles: impuestos.map(imp => ({
                            codigoPrincipal: imp.codigoRetencion,
                            descripcion: `Retención ${imp.codigo === '1' ? 'Renta' : 'IVA'} ${imp.codigoRetencion}`,
                            cantidad: 1,
                            precioUnitario: imp.valorRetenido,
                            total: imp.valorRetenido
                        }))
                    });
                }
            }

            // 2. Registrar Compra en Backend
            await ComprasUseCases.registrarCompra({
                proveedorId: proveedorRuc,
                tipoComprobante: secuencial.startsWith('00') ? '01' : '03',
                secuencial,
                autorizacion,
                fechaEmision,
                fechaRegistro: new Date().toISOString().split('T')[0],
                sustento,
                descripcion: `Factura ${secuencial} de ${proveedorNombre}`,
                subtotal15,
                subtotal0,
                montoIva,
                total: totalFactura,
                ordenCompraId: ordenPrevia?.id,
                tieneRetencion: aplicaRetencion,
                nroRetencion: nroRetencionGenerado,
                estadoRetencion: resSri?.estado || (aplicaRetencion ? 'PENDIENTE' : 'N/A')
            });

            // 3. Registrar Asiento Contable
            const selectedCentro = centrosCostos.find(c => c.id === centroCostoId);
            const numeroAsiento = `CC-${crypto.randomUUID().slice(0, 8)}`;

            await ContabilidadUseCases.registrarAsiento({
                numero: numeroAsiento,
                fecha: fechaEmision,
                glosa: `P/R Compra Fac/${secuencial} - ${proveedorNombre} ${selectedCentro ? `(${selectedCentro.nombre})` : ''}`,
                tipo: 'EGRESO',
                detalles: [
                    {
                        cuentaCodigo: '1.1.03.01',
                        debe: subtotal15 + subtotal0,
                        haber: 0,
                        centroCostoId: centroCostoId || undefined
                    },
                    { cuentaCodigo: '1.1.05.01', debe: montoIva, haber: 0 },
                    { cuentaCodigo: '2.1.01.01', debe: 0, haber: totalPagar },
                    { cuentaCodigo: '2.1.03.01', debe: 0, haber: valorRetRenta },
                    { cuentaCodigo: '2.1.03.02', debe: 0, haber: valorRetIva }
                ].filter(d => d.debe > 0 || d.haber > 0)
            });

            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al registrar la compra');
        } finally {
            setGuardando(false);
        }
    };

    const footer = (
        <div className="w-full bg-slate-900 -m-6 p-6 text-white flex flex-col md:flex-row justify-between items-center gap-6">
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
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Registrar Compra"
            description={ordenPrevia ? `Facturando Orden: ${ordenPrevia.secuencial}` : 'Ingreso de factura de proveedor y emisión de retención'}
            icon={<Receipt size={24} />}
            footer={footer}
            size="xl"
        >
            <div className="space-y-8">
                <section>
                    <h3 className="text-sm font-bold text-sri-blue uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">1. Datos del Proveedor y Comprobante</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">RUC Proveedor</label>
                            <div className="flex gap-2">
                                <input type="text" value={proveedorRuc} onChange={e => setProveedorRuc(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-sm" />
                                <button
                                    onClick={buscarProveedor}
                                    className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200"
                                >
                                    <Search size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Razón Social</label>
                            <input type="text" value={proveedorNombre} onChange={e => setProveedorNombre(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Nro. Comprobante</label>
                            <input type="text" value={secuencial} onChange={e => setSecuencial(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-sm font-mono" placeholder="001-001-..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Fecha Emisión</label>
                            <input type="date" value={fechaEmision} onChange={e => setFechaEmision(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-sm text-slate-700" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Centro de Costo</label>
                            <select value={centroCostoId} onChange={e => setCentroCostoId(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-sm">
                                <option value="">-- Asignación General --</option>
                                {centrosCostos.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Autorización (10 o 49 dígitos)</label>
                            <input type="text" value={autorizacion} onChange={e => setAutorizacion(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-sm font-mono" placeholder="0000000000" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Sustento Tributario</label>
                            <select value={sustento} onChange={e => setSustento(e.target.value as SustentoTributario)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-sm">
                                {Object.values(SustentoTributario).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h3 className="text-sm font-bold text-sri-blue uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Calculator size={16} /> 2. Bases Imponibles
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Subtotal 15%</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input type="number" value={subtotal15} onChange={e => setSubtotal15(Number(e.target.value))} className="w-full pl-7 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all text-sm text-right font-mono font-bold" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Subtotal 0%</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input type="number" value={subtotal0} onChange={e => setSubtotal0(Number(e.target.value))} className="w-full pl-7 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all text-sm text-right font-mono font-bold" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Monto IVA (15%)</label>
                            <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-right font-mono font-bold text-slate-600">{formatMoney(montoIva)}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-900 mb-1.5">TOTAL FACTURA</label>
                            <div className="w-full px-4 py-2.5 bg-slate-800 border border-slate-800 rounded-xl text-sm text-right font-mono text-white font-bold shadow-md">{formatMoney(totalFactura)}</div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-bold text-sri-blue uppercase tracking-wider">3. Emisión de Retención</h3>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <span className="text-sm text-slate-600 group-hover:text-sri-blue transition-colors">Generar Retención</span>
                            <input type="checkbox" checked={aplicaRetencion} onChange={e => setAplicaRetencion(e.target.checked)} className="h-5 w-5 text-sri-blue rounded-lg border-slate-300 focus:ring-sri-blue/20" />
                        </label>
                    </div>

                    {aplicaRetencion ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Impuesto a la Renta
                                </h4>
                                <div>
                                    <label className="block text-xs text-slate-600 mb-2">Concepto de Retención</label>
                                    <select value={codRetRenta} onChange={e => setCodRetRenta(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20">
                                        <option value="">Seleccione...</option>
                                        {retencionesDisponibles.filter(r => r.tipo === 'RENTA').map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.concepto} ({c.porcentaje}%)</option>)}
                                    </select>
                                </div>
                                <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <span className="text-sm text-blue-800 font-medium">Valor a Retener ({selectedRetRenta?.porcentaje || 0}%)</span>
                                    <span className="text-lg font-bold text-blue-900 font-mono">{formatMoney(valorRetRenta)}</span>
                                </div>
                            </div>
                            <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Impuesto al Valor Agregado (IVA)
                                </h4>
                                <div>
                                    <label className="block text-xs text-slate-600 mb-2">Porcentaje Retención IVA</label>
                                    <select value={codRetIva} onChange={e => setCodRetIva(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500/20">
                                        <option value="">Seleccione...</option>
                                        {retencionesDisponibles.filter(r => r.tipo === 'IVA').map(p => <option key={p.codigo} value={p.codigo}>{p.codigo} - {p.concepto}</option>)}
                                    </select>
                                </div>
                                <div className="flex justify-between items-center bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                    <span className="text-sm text-emerald-800 font-medium">Valor a Retener ({selectedRetIva?.porcentaje || 0}%)</span>
                                    <span className="text-lg font-bold text-emerald-900 font-mono">{formatMoney(valorRetIva)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 bg-slate-50 rounded-2xl text-center text-slate-500 text-sm italic border border-dashed border-slate-300">
                            No se generará comprobante de retención para esta compra.
                        </div>
                    )}
                </section>
            </div>
        </Modal>
    );
};
