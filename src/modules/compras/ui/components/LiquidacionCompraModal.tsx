'use client';

import { useState, useEffect } from 'react';
import { Save, FileText, UserPlus, Calculator, Plus, Trash2, CreditCard, CheckCircle2, AlertCircle, User, Truck } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { validarIdentificacion } from '@/shared/utils/validacionesIdentificacion';
import { ComprasUseCases, ConfiguracionUseCases, InventarioUseCases, FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Producto } from '@/modules/inventario/domain/types';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { usePuntoEmision } from '@/shared/context/PuntoEmisionContext';
import { Button } from '@/shared/ui/Button';

interface Props {
    onClose: () => void;
    onSave: () => void;
}

export const LiquidacionCompraModal = ({ onClose, onSave }: Props) => {
    const { currentEmpresa } = useEmpresa();
    const { puntoActivo } = usePuntoEmision();

    const [generarGuia, setGenerarGuia] = useState(false);
    const puntoEmisionId = puntoActivo?.puntoEmisionId;
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
    const [productos, setProductos] = useState<Producto[]>([]);

    const [nombre, setNombre] = useState('');
    const [identificacion, setIdentificacion] = useState('');
    const [direccion] = useState('');
    const [tipoIdentificacion, setTipoIdentificacion] = useState('05');
    const parametros = currentEmpresa?.parametros;
    const [detalles, setDetalles] = useState<any[]>([{
        productoId: '',
        codigoPrincipal: 'SERV-01',
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        descuento: 0,
        codigoIVA: parametros?.ivaCodigo || '4',
        baseImponible: 0,
        valorIVA: 0,
        tarifa: 0,
        total: 0
    }]);

    const [pagos, setPagos] = useState<any[]>([{
        formaPago: '01',
        total: 0
    }]);

    const [catalogoIdentificacion, setCatalogoIdentificacion] = useState<any[]>([]);
    const [catalogoIva, setCatalogoIva] = useState<any[]>([]);
    const [catalogoFormasPago, setCatalogoFormasPago] = useState<any[]>([]);

    const [guardando, setGuardando] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
    const [errorIdentificacion, setErrorIdentificacion] = useState('');
    const [identificacionValida, setIdentificacionValida] = useState(false);
    const [secuencial, setSecuencial] = useState('');
    const [estab, setEstab] = useState(puntoActivo?.codigoEstablecimiento);
    const [ptoEmi, setPtoEmi] = useState(puntoActivo?.codigoPunto);

    // Cargar secuencial automático
    useEffect(() => {
        const cargarSecuencial = async () => {
            if (puntoEmisionId) {
                try {
                    const data = await FacturacionUseCases.obtenerSiguienteSecuencial(puntoEmisionId, '03');
                    if (data.success) {
                        setSecuencial(data.secuencial);
                    }
                } catch (error) {
                    console.error('Error al cargar secuencial:', error);
                }
            }
        };
        cargarSecuencial();
    }, [puntoEmisionId]);

    // Sincronizar estab y ptoEmi
    useEffect(() => {
        if (puntoActivo) {
            setEstab(puntoActivo.codigoEstablecimiento);
            setPtoEmi(puntoActivo.codigoPunto);
        }
    }, [puntoActivo]);

    useEffect(() => {
        const cargarCatalogos = async () => {
            try {
                const [iden, iva, pagosCatalogo] = await Promise.all([
                    ConfiguracionUseCases.obtenerCatalogo('SRI_TIPO_IDENTIFICACION'),
                    ConfiguracionUseCases.obtenerCatalogo('SRI_TIPO_IMPUESTO_IVA'),
                    ConfiguracionUseCases.obtenerCatalogo('SRI_FORMA_PAGO')
                ]);
                setCatalogoIdentificacion(iden);
                setCatalogoIva(iva);
                setCatalogoFormasPago(pagosCatalogo);
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

        const ivaRateValue = (parametros?.ivaValor || 15) / 100;

        detalles.forEach(d => {
            totalSinImpuestos += d.baseImponible;
            const codigosNoGraban = ['0', '6', '7'];
            const esGravado = !codigosNoGraban.includes(d.codigoIVA);
            const tarifaCalculada = esGravado ? ivaRateValue : 0;
            totalIVA += (d.baseImponible * tarifaCalculada);
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
        };
        loadData();
    }, []);


    const handleActualizarDetalle = (index: number, campo: string, valor: any) => {
        const nuevosDetalles = [...detalles];
        const detalle = { ...nuevosDetalles[index], [campo]: valor };

        detalle.baseImponible = (detalle.cantidad * detalle.precioUnitario) - detalle.descuento;
        let porcentaje = 0;
        const codigosNoGraban = ['0', '6', '7'];
        if (!codigosNoGraban.includes(detalle.codigoIVA)) {
            porcentaje = (parametros?.ivaValor || 15) / 100;
        }

        detalle.valorIVA = detalle.baseImponible * porcentaje;
        detalle.tarifa = porcentaje * 100;
        detalle.total = detalle.baseImponible + detalle.valorIVA;

        nuevosDetalles[index] = detalle;
        setDetalles(nuevosDetalles);
        if (errorValidacion) setErrorValidacion(null);
    };

    const handleGuardar = async () => {
        if (!nombre || !identificacion || !puntoActivo || detalles.some(d => !d.descripcion)) {
            setErrorValidacion('Por favor complete todos los campos obligatorios.');
            return;
        }

        setGuardando(true);
        setErrorValidacion(null);
        try {
            const payload = {
                puntoEmisionId,
                generarGuia,
                fechaEmision,
                proveedor: {
                    tipoIdentificacion,
                    identificacion,
                    nombre,
                    direccion
                },
                detalles: detalles.map(d => ({
                    ...d,
                    codigo_iva: d.codigoIVA,
                    porcentaje_iva: d.tarifa
                })),
                pagos
            };

            // @ts-ignore
            const res = await ComprasUseCases.registrarLiquidacion(payload);

            if (res.success) {
                onSave();
                onClose();
            } else {
                throw new Error(res.error || 'Error al procesar la Liquidación');
            }
        } catch (error: any) {
            console.error('Error liquis:', error);
            setErrorValidacion(`Error: ${error.message}`);
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
            className="w-full"
        />
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
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                        <AlertCircle size={18} />
                        {errorValidacion}
                    </div>
                )}

                {/* Sección Información del Comprobante */}
                <div>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-sri-blue/10">
                        <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                            <FileText size={16} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Información del Comprobante</h3>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Número de Liquidación</label>
                            <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-sri-blue">
                                {estab}-{ptoEmi}-{secuencial.padStart(9, '0')}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha de Emisión</label>
                            <input
                                type="date"
                                value={fechaEmision}
                                onChange={(e) => setFechaEmision(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-bold text-slate-700 h-11"
                            />
                        </div>
                    </div>
                </div>

                {/* Sección Beneficiario */}
                <div>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-sri-blue/10">
                        <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                            <User size={16} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Datos del Beneficiario</h3>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo Identificación</label>
                                <select
                                    value={tipoIdentificacion}
                                    onChange={e => setTipoIdentificacion(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all h-11"
                                >
                                    {catalogoIdentificacion.map(item => (
                                        <option key={item.codigo} value={item.codigo}>{item.valor}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Número Identificación *</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={identificacion}
                                        onChange={e => setIdentificacion(e.target.value)}
                                        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-mono pr-10 outline-none transition-all h-11 ${errorIdentificacion ? 'border-red-300 ring-4 ring-red-500/10' : identificacionValida ? 'border-green-300 ring-4 ring-green-500/10' : 'border-slate-200 focus:ring-4 focus:ring-sri-blue/10'}`}
                                        placeholder="17..."
                                    />
                                    {identificacion.length >= 5 && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {identificacionValida ? <CheckCircle2 size={18} className="text-green-500" /> : errorIdentificacion ? <AlertCircle size={18} className="text-red-500" /> : null}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Razón Social / Nombres Completos *</label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 uppercase outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all h-11"
                            />
                        </div>

                        <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                            <Truck className="text-emerald-500" size={20} />
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={generarGuia}
                                    onChange={(e) => setGenerarGuia(e.target.checked)}
                                    className="w-5 h-5 rounded border-emerald-200 text-emerald-600 focus:ring-emerald-500 transition-all"
                                />
                                <div>
                                    <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">Generar Guía de Remisión</span>
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase opacity-70">Documento de traslado automático</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Sección Detalles */}
                <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-sri-blue/10">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                                <Calculator size={16} />
                            </div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Detalles de la Liquidación</h3>
                        </div>
                        <Button
                            type="button"
                            onClick={() => setDetalles([...detalles, { productoId: '', codigoPrincipal: 'SERV-01', descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0, codigoIVA: '0', baseImponible: 0, valorIVA: 0, tarifa: 0, total: 0 }])}
                            variant="secondary"
                            size="sm"
                            className="bg-white border-2 border-sri-blue/20 hover:border-sri-blue text-sri-blue font-black px-4 rounded-xl shadow-sm gap-2"
                        >
                            <Plus size={16} /> Agregar Línea
                        </Button>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-xs text-left">
                            <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="py-3 px-4">Descripción del Bien o Servicio</th>
                                    <th className="py-3 px-4 text-center w-24">Cant.</th>
                                    <th className="py-3 px-4 text-right w-32">P. Unit</th>
                                    <th className="py-3 px-4 text-center w-32">IVA</th>
                                    <th className="py-3 px-4 text-right w-32">Total</th>
                                    <th className="py-3 px-4 w-12 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {detalles.map((d, i) => (
                                    <tr key={i} className="hover:bg-sri-blue/5 transition-colors group">
                                        <td className="py-3 px-4">
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
                                                    <option value="">-- Seleccionar --</option>
                                                    {productos.map(p => (
                                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="text"
                                                    value={d.descripcion}
                                                    onChange={e => handleActualizarDetalle(i, 'descripcion', e.target.value)}
                                                    className="w-full text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded border-none focus:ring-0 outline-none italic"
                                                    placeholder="Detalle adicional..."
                                                />
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <input
                                                type="number"
                                                value={d.cantidad}
                                                onChange={e => handleActualizarDetalle(i, 'cantidad', parseFloat(e.target.value) || 0)}
                                                className="w-full text-center bg-slate-50 border border-slate-200 rounded-lg py-1.5 font-bold outline-none focus:ring-4 focus:ring-sri-blue/10"
                                                step="1"
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <input
                                                type="number"
                                                value={d.precioUnitario}
                                                onChange={e => handleActualizarDetalle(i, 'precioUnitario', parseFloat(e.target.value) || 0)}
                                                className="w-full text-right bg-slate-50 border border-slate-200 rounded-lg py-1.5 font-bold outline-none focus:ring-4 focus:ring-sri-blue/10 font-mono"
                                                step="0.01"
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <select
                                                value={d.codigoIVA}
                                                onChange={e => handleActualizarDetalle(i, 'codigoIVA', e.target.value)}
                                                className="w-full bg-slate-100 border-none rounded-lg py-1.5 text-center text-[10px] font-black text-slate-500 outline-none"
                                            >
                                                {catalogoIva.map(item => (
                                                    <option key={item.codigo} value={item.codigo}>{item.valor}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-3 px-4 text-right font-black text-slate-900 font-mono text-base">
                                            {formatMoney(d.total)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => setDetalles(detalles.filter((_, idx) => idx !== i))}
                                                disabled={detalles.length === 1}
                                                className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-30"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sección Pago y Totales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-sri-blue/10">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                                    <CreditCard size={16} />
                                </div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Métodos de Pago</h3>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {pagos.map((p, i) => (
                                <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Forma de Pago</label>
                                        <select
                                            value={p.formaPago}
                                            onChange={e => { const np = [...pagos]; np[i].formaPago = e.target.value; setPagos(np); }}
                                            className="w-full bg-transparent text-sm font-bold text-slate-700 border-none outline-none p-0 focus:ring-0"
                                        >
                                            {catalogoFormasPago.map(item => (
                                                <option key={item.codigo} value={item.codigo}>{item.valor}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="text-right">
                                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Valor</label>
                                        <span className="text-xl font-black text-sri-blue font-mono">{formatMoney(p.total)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-sri-blue p-8 rounded-3xl text-white shadow-xl shadow-sri-blue/20 space-y-4">
                        <div className="flex justify-between text-blue-100 font-bold text-[10px] uppercase tracking-widest">
                            <span>Subtotal Sin Impuestos:</span>
                            <span className="font-mono text-base text-white">{formatMoney(totales.totalSinImpuestos)}</span>
                        </div>
                        <div className="flex justify-between text-blue-100 font-bold text-[10px] uppercase tracking-widest">
                            <span>IVA ({parametros?.ivaEtiqueta || '15%'}):</span>
                            <span className="font-mono text-base text-white">{formatMoney(totales.totalIVA)}</span>
                        </div>
                        <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest text-blue-100">Total Liquidación:</span>
                            <span className="text-3xl font-black font-mono">{formatMoney(totales.importeTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
