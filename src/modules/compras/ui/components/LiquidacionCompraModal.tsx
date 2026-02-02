'use client';

import { useState, useEffect } from 'react';
import { Save, FileText, UserPlus, Calculator, Plus, Trash2, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { validarIdentificacion } from '@/shared/utils/validacionesIdentificacion';
import { ComprasUseCases, ContabilidadUseCases, ConfiguracionUseCases, FacturacionUseCases, InventarioUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';
import { useConfiguracion } from '@/modules/configuracion/hooks/useConfiguracion';
import { Producto } from '@/modules/inventario/domain/types';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { usePuntoEmision } from '@/shared/context/PuntoEmisionContext';

interface Props {
    onClose: () => void;
    onSave: () => void;
}

export const LiquidacionCompraModal = ({ onClose, onSave }: Props) => {
    const { currentEmpresa } = useEmpresa();
    const { puntoActivo } = usePuntoEmision();

    const [estab, setEstab] = useState(puntoActivo?.codigoEstablecimiento || '001');
    const [ptoEmi, setPtoEmi] = useState(puntoActivo?.codigoPunto || '001');
    const [secuencial, setSecuencial] = useState('');
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [bodegas, setBodegas] = useState<any[]>([]);

    const [nombre, setNombre] = useState('');
    const [identificacion, setIdentificacion] = useState('');
    const [direccion] = useState('');
    const [tipoIdentificacion, setTipoIdentificacion] = useState('05');

    const [detalles, setDetalles] = useState<any[]>([{
        productoId: '',
        codigoPrincipal: 'SERV-01',
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        descuento: 0,
        codigoIVA: '0',
        baseImponible: 0,
        valorIVA: 0,
        total: 0
    }]);

    const [pagos, setPagos] = useState<any[]>([{
        formaPago: '01', // SIN UTILIZACION DEL SISTEMA FINANCIERO
        total: 0
    }]);

    const [catalogoIdentificacion, setCatalogoIdentificacion] = useState<any[]>([]);
    const [catalogoIva, setCatalogoIva] = useState<any[]>([]);
    const [catalogoFormasPago, setCatalogoFormasPago] = useState<any[]>([]);
    const [catalogoCodigoImpuesto, setCatalogoCodigoImpuesto] = useState<any[]>([]);
    const [catalogoTipoEmision, setCatalogoTipoEmision] = useState<any[]>([]);
    const [catalogoTipoComprobante, setCatalogoTipoComprobante] = useState<any[]>([]);
    const [catalogoAmbiente, setCatalogoAmbiente] = useState<any[]>([]);

    const [guardando, setGuardando] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
    const [errorIdentificacion, setErrorIdentificacion] = useState('');
    const [identificacionValida, setIdentificacionValida] = useState(false);

    useEffect(() => {
        const cargarCatalogos = async () => {
            try {
                const [iden, iva, pagos, codImp, tEmi, tComp, ambRes] = await Promise.all([
                    ConfiguracionUseCases.obtenerCatalogo('SRI_TIPO_IDENTIFICACION'),
                    ConfiguracionUseCases.obtenerCatalogo('SRI_TIPO_IMPUESTO_IVA'),
                    ConfiguracionUseCases.obtenerCatalogo('SRI_FORMA_PAGO'),
                    ConfiguracionUseCases.obtenerCatalogo('SRI_CODIGO_IMPUESTO'),
                    ConfiguracionUseCases.obtenerCatalogo('SRI_TIPO_EMISION'),
                    ConfiguracionUseCases.obtenerCatalogo('SRI_TIPO_COMPROBANTE'),
                    ConfiguracionUseCases.obtenerAmbientesSRI()
                ]);
                setCatalogoIdentificacion(iden);
                setCatalogoIva(iva);
                setCatalogoFormasPago(pagos);
                setCatalogoCodigoImpuesto(codImp);
                setCatalogoTipoEmision(tEmi);
                setCatalogoTipoComprobante(tComp);
                setCatalogoAmbiente(ambRes.ambientes || []);
            } catch (error) {
                console.error('Error al cargar catálogos:', error);
            }
        };
        cargarCatalogos();
    }, []);

    const calcularTotales = () => {
        let totalSinImpuestos = 0;
        let totalIVA = 0;
        let totalDescuento = 0;

        detalles.forEach(d => {
            totalSinImpuestos += d.baseImponible;
            totalIVA += d.valorIVA;
            totalDescuento += d.descuento;
        });

        const importeTotal = totalSinImpuestos + totalIVA;
        return { totalSinImpuestos, totalIVA, totalDescuento, importeTotal };
    };

    const totales = calcularTotales();

    useEffect(() => {
        if (pagos.length === 1) {
            const nuevosPagos = [...pagos];
            nuevosPagos[0].total = totales.importeTotal;
            setPagos(nuevosPagos);
        }
    }, [totales.importeTotal]);

    // Sincronizar con punto activo si cambia
    useEffect(() => {
        if (puntoActivo) {
            setEstab(puntoActivo.codigoEstablecimiento);
            setPtoEmi(puntoActivo.codigoPunto);
        }
    }, [puntoActivo]);

    const { parametros, cargarParametros } = useConfiguracion();

    useEffect(() => {
        cargarParametros();
    }, [cargarParametros]);

    useEffect(() => {
        if (!identificacion || tipoIdentificacion === '07') {
            setErrorIdentificacion('');
            setIdentificacionValida(tipoIdentificacion === '07');
            return;
        }

        if (identificacion.length >= 5) {
            const resultado = validarIdentificacion(
                tipoIdentificacion as '04' | '05' | '06' | '07' | '08',
                identificacion
            );

            if (!resultado.isValid) {
                setErrorIdentificacion(resultado.error || 'Identificación inválida');
                setIdentificacionValida(false);
            } else {
                setErrorIdentificacion('');
                setIdentificacionValida(true);
            }
        } else {
            setErrorIdentificacion('');
            setIdentificacionValida(false);
        }
    }, [identificacion, tipoIdentificacion]);

    useEffect(() => {
        const loadData = async () => {
            const prodRes = await InventarioUseCases.listarProductos('?limit=1000');
            setProductos(prodRes.data || []);
            const bodRes = await InventarioUseCases.listarBodegas();
            setBodegas(bodRes || []);
        };
        loadData();
    }, []);

    const ivaPorcentaje = (parametros?.iva || 15) / 100;

    const handleActualizarDetalle = (index: number, campo: string, valor: any) => {
        const nuevosDetalles = [...detalles];
        const detalle = { ...nuevosDetalles[index], [campo]: valor };

        detalle.baseImponible = (detalle.cantidad * detalle.precioUnitario) - detalle.descuento;
        let porcentaje = 0;
        if (detalle.codigoIVA === '4') porcentaje = ivaPorcentaje;
        else if (detalle.codigoIVA === '2') porcentaje = 0.12;

        detalle.valorIVA = detalle.baseImponible * porcentaje;
        detalle.total = detalle.baseImponible + detalle.valorIVA;

        nuevosDetalles[index] = detalle;
        setDetalles(nuevosDetalles);
        if (errorValidacion) setErrorValidacion(null);
    };

    const handleGuardar = async () => {
        if (!nombre || !identificacion || !secuencial || detalles.some(d => !d.descripcion)) {
            setErrorValidacion('Por favor complete todos los campos obligatorios.');
            return;
        }

        setGuardando(true);
        setErrorValidacion(null);
        try {
            const fullSecuencial = `${estab}-${ptoEmi}-${secuencial.padStart(9, '0')}`;

            const dataSri = SriStandardizer.standardizeLiquidacion({
                ambiente: catalogoAmbiente.find(a => a.codigo === 'PRUEBAS')?.valor.toString() || '1',
                tipoEmision: catalogoTipoEmision.find(e => e.valor === 'NORMAL')?.codigo || '1',
                razonSocial: currentEmpresa?.razonSocial || '',
                nombreComercial: currentEmpresa?.nombreComercial || '',
                ruc: currentEmpresa?.ruc || '',
                estab,
                ptoEmi,
                secuencial: secuencial.padStart(9, '0'),
                codDoc: catalogoTipoComprobante.find(c => c.valor === 'LIQUIDACIÓN DE COMPRA')?.codigo || '03',
                codigoImpuestoIva: catalogoCodigoImpuesto.find(i => i.valor === 'IVA')?.codigo || '2',
                dirMatriz: currentEmpresa?.direccionMatriz || '',
                fechaEmision,
                tipoIdentificacionProveedor: tipoIdentificacion,
                razonSocialProveedor: nombre,
                identificacionProveedor: identificacion,
                direccionProveedor: direccion,
                obligadoContabilidad: currentEmpresa?.obligadoContabilidad || 'NO',
                totalSinImpuestos: totales.totalSinImpuestos,
                totalDescuento: totales.totalDescuento,
                importeTotal: totales.importeTotal,
                detalles: detalles.map(d => ({
                    ...d,
                    codigoImpuesto: catalogoCodigoImpuesto.find(i => i.valor === 'IVA')?.codigo || '2',
                    baseImponible: d.baseImponible,
                    valorIVA: d.valorIVA
                })),
                pagos
            });

            let sriResult = {
                success: false,
                status: 'FALLIDO',
                numeroAutorizacion: null as string | null,
                claveAcceso: null as string | null,
                mensaje: ''
            };

            try {
                const emisionRes = await FacturacionUseCases.emitirFactura(dataSri);
                sriResult = {
                    success: emisionRes.status === 'AUTORIZADO',
                    status: emisionRes.status || 'AUTORIZADO',
                    numeroAutorizacion: emisionRes.numeroAutorizacion,
                    claveAcceso: emisionRes.claveAcceso,
                    mensaje: emisionRes.mensaje || ''
                };
            } catch (sriError: any) {
                console.error('Error SRI:', sriError);
                sriResult.status = 'DEVUELTA';
                sriResult.mensaje = sriError.message || 'Error desconocido';
            }

            await ComprasUseCases.registrarLiquidacion({
                tipoIdentificacionProveedor: tipoIdentificacion,
                identificacionProveedor: identificacion,
                razonSocialProveedor: nombre,
                secuencial: fullSecuencial,
                fechaEmision,
                totalSinImpuestos: totales.totalSinImpuestos,
                totalIVA: totales.totalIVA,
                importeTotal: totales.importeTotal,
                detalles: detalles.map(d => ({
                    descripcion: d.descripcion,
                    cantidad: d.cantidad,
                    precioUnitario: d.precioUnitario,
                    total: d.total,
                    codigoIVA: d.codigoIVA
                })),
                claveAcceso: sriResult.claveAcceso,
                numeroAutorizacion: sriResult.numeroAutorizacion,
                estadoSri: sriResult.status
            });

            const params = await ConfiguracionUseCases.obtenerParametros();
            const ctaGasto = '5.1.01.01';
            const ctaIva = params.cuentaIvaCompras || '1.1.05.01';
            const ctaCxp = params.cuentaCxpProveedores || '2.1.01.01';

            await ContabilidadUseCases.registrarAsiento({
                numero: `LIQ-${secuencial}`,
                fecha: fechaEmision,
                glosa: `P/R Liquidación de Compra ${fullSecuencial} - ${nombre}`,
                tipo: 'DIARIO',
                detalles: [
                    { cuentaCodigo: ctaGasto, debe: totales.totalSinImpuestos, haber: 0 },
                    { cuentaCodigo: ctaIva, debe: totales.totalIVA, haber: 0 },
                    { cuentaCodigo: ctaCxp, debe: 0, haber: totales.importeTotal }
                ].filter(d => d.debe > 0 || d.haber > 0)
            });

            for (const d of detalles) {
                if (d.productoId && bodegas.length > 0) {
                    try {
                        await InventarioUseCases.ajustarStock({
                            productoId: d.productoId,
                            bodegaId: bodegas[0].id,
                            tipo: 'ENTRADA',
                            cantidad: d.cantidad,
                            costoUnitario: d.precioUnitario,
                            referencia: `LIQ ${fullSecuencial}`,
                            observaciones: `Registro automático desde Liquidación de Compra`
                        });
                    } catch (invError) {
                        console.error('Error al actualizar inventario:', invError);
                    }
                }
            }

            if (sriResult.success) {
                alert(`Liquidación guardada y autorizada por SRI: ${sriResult.numeroAutorizacion}`);
            } else {
                alert(`Liquidación guardada localmente, pero no pudo ser autorizada (Estado: ${sriResult.status}).\nDetalle: ${sriResult.mensaje}`);
            }

            onSave();
            onClose();
        } catch (error: any) {
            console.error('Error al procesar liquidación:', error);
            setErrorValidacion(`Error crítico: ${error.message}`);
        } finally {
            setGuardando(false);
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleGuardar}
            isLoading={guardando}
            submitLabel="Guardar Liquidación"
            submitIcon={<Save size={18} />}
            className="w-full bg-sri-blue -m-6 p-6 text-white rounded-b-2xl border-none flex-row-reverse"
        >
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <p className="text-[10px] text-blue-100 uppercase font-black opacity-60">Subtotal</p>
                    <p className="text-lg font-black text-white">{formatMoney(totales.totalSinImpuestos)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-blue-100 uppercase font-black opacity-60">IVA ({parametros?.iva || 15}%)</p>
                    <p className="text-lg font-black text-white">{formatMoney(totales.totalIVA)}</p>
                </div>
                <div className="pl-6 border-l border-white/20 text-right">
                    <p className="text-[10px] text-emerald-300 uppercase font-black">Importe Total</p>
                    <p className="text-3xl font-black text-emerald-400">{formatMoney(totales.importeTotal)}</p>
                </div>
            </div>
        </ModalFooter>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Nueva Liquidación de Compra"
            description="Documento Electrónico 03 - Liquidación de Compras a Sujetos No Obligados"
            icon={<FileText size={24} />}
            footer={footer}
            size="2xl"
        >
            <div className="space-y-8">
                {errorValidacion && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-sm font-medium">{errorValidacion}</p>
                    </div>
                )}
                {/* Encabezado Documento */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Información del Documento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Establecimiento</label>
                            <input type="text" value={estab} onChange={e => setEstab(e.target.value)} maxLength={3} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Punto Emisión</label>
                            <input type="text" value={ptoEmi} onChange={e => setPtoEmi(e.target.value)} maxLength={3} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Secuencial</label>
                            <input type="text" value={secuencial} onChange={e => setSecuencial(e.target.value)} maxLength={9} placeholder="000000001" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-mono text-sri-blue font-bold" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Emisión</label>
                            <input type="date" value={fechaEmision} onChange={e => setFechaEmision(e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all" />
                        </div>
                    </div>
                </div>

                {/* Beneficiario */}
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
                        <UserPlus size={18} className="text-sri-blue" /> Datos del Beneficiario
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Tipo Identificación</label>
                            <select value={tipoIdentificacion} onChange={e => setTipoIdentificacion(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all">
                                {catalogoIdentificacion.map(item => (
                                    <option key={item.codigo} value={item.codigo}>{item.valor}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Número Identificación *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={identificacion}
                                    onChange={e => setIdentificacion(e.target.value)}
                                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-mono pr-10 outline-none transition-all ${errorIdentificacion ? 'border-red-300 ring-4 ring-red-500/10' :
                                        identificacionValida ? 'border-green-300 ring-4 ring-green-500/10' :
                                            'border-slate-200 focus:ring-2 focus:ring-sri-blue/20'
                                        }`}
                                    placeholder="17..."
                                />
                                {identificacion.length >= 5 && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {identificacionValida ? (
                                            <CheckCircle2 size={18} className="text-green-500" />
                                        ) : errorIdentificacion ? (
                                            <AlertCircle size={18} className="text-red-500" />
                                        ) : null}
                                    </div>
                                )}
                            </div>
                            {errorIdentificacion && <p className="text-[10px] text-red-600 mt-1 font-bold flex items-center gap-1 uppercase tracking-tighter"><AlertCircle size={10} />{errorIdentificacion}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Razón Social / Nombres Completos *</label>
                            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 uppercase outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all" />
                        </div>
                    </div>
                </div>

                {/* Detalles */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Calculator size={18} className="text-sri-blue" /> Detalles de la Liquidación
                        </h3>
                        <button onClick={() => setDetalles([...detalles, { codigoPrincipal: 'GEN-01', descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0, codigoIVA: '0', baseImponible: 0, valorIVA: 0, total: 0 }])} className="px-4 py-2 bg-sri-blue/10 text-sri-blue rounded-xl text-xs font-black flex items-center gap-2 hover:bg-sri-blue hover:text-white transition-all">
                            <Plus size={16} /> Añadir Ítem
                        </button>
                    </div>
                    <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Descripción del Bien o Servicio</th>
                                    <th className="px-4 py-4 w-24 text-center">Cantidad</th>
                                    <th className="px-4 py-4 w-32 text-right">P. Unitario</th>
                                    <th className="px-4 py-4 w-24 text-center">IVA</th>
                                    <th className="px-6 py-4 w-32 text-right">Subtotal</th>
                                    <th className="px-4 py-4 w-12 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {detalles.map((d, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <select
                                                    value={d.productoId}
                                                    onChange={e => {
                                                        const p = productos.find(x => x.id === e.target.value);
                                                        handleActualizarDetalle(i, 'productoId', e.target.value);
                                                        if (p) {
                                                            handleActualizarDetalle(i, 'descripcion', p.nombre);
                                                            handleActualizarDetalle(i, 'codigoPrincipal', p.codigoPrincipal);
                                                        }
                                                    }}
                                                    className="w-full text-sm font-bold text-slate-700 bg-transparent border-none focus:ring-0 outline-none"
                                                >
                                                    <option value="">-- Seleccionar Producto/Servicio --</option>
                                                    {productos.map(p => (
                                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="text"
                                                    value={d.descripcion}
                                                    onChange={e => handleActualizarDetalle(i, 'descripcion', e.target.value)}
                                                    className="w-full text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border-none focus:ring-0 outline-none italic"
                                                    placeholder="Añadir detalle adicional..."
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <input type="number" value={d.cantidad} onChange={e => handleActualizarDetalle(i, 'cantidad', Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-center font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <input type="number" value={d.precioUnitario} onChange={e => handleActualizarDetalle(i, 'precioUnitario', Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-right font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-mono" />
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <select value={d.codigoIVA} onChange={e => handleActualizarDetalle(i, 'codigoIVA', e.target.value)} className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-black text-sri-blue outline-none border-none">
                                                {catalogoIva.map(item => (
                                                    <option key={item.codigo} value={item.codigo}>{item.valor}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-800 text-lg font-mono">
                                            {formatMoney(d.total)}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button onClick={() => setDetalles(detalles.filter((_, idx) => idx !== i))} disabled={detalles.length === 1} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Formas de Pago */}
                <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-6">
                        <CreditCard size={18} className="text-emerald-500" /> Métodos de Pago
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pagos.map((p, i) => (
                            <div key={i} className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Forma de Pago</label>
                                    <select value={p.formaPago} onChange={e => { const np = [...pagos]; np[i].formaPago = e.target.value; setPagos(np); }} className="w-full bg-transparent text-sm font-bold text-slate-700 border-none outline-none p-0 focus:ring-0">
                                        {catalogoFormasPago.map(item => (
                                            <option key={item.codigo} value={item.codigo}>{item.valor}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="text-right">
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Valor</label>
                                    <span className="text-lg font-black text-sri-blue font-mono">{formatMoney(p.total)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
