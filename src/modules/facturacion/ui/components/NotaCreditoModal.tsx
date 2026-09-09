'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, AlertCircle, Truck, FileText, Calculator } from 'lucide-react';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { formatearDinero } from '@/shared/utils/formatearDinero';
import { FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Modal } from '@/shared/ui/Modal';
import { usePuntoEmision } from '@/shared/context/PuntoEmisionContext';
import { getLocalDateIso } from '@/shared/utils/dateUtils';
import { useCatalogo } from '@/modules/shared/hooks/useCatalogo';


interface ItemNotaCredito {
    id: string;
    codigoPrincipal: string;
    nombre: string;
    cantidadOriginal: number;
    precio: number;
    cantidadDevolver: number;
    codigoIVA: string;
}

interface NotaCreditoModalProps {
    factura: any; // Factura original a la que se aplica la NC
    onClose: () => void;
    onSave: () => void;
}

export function NotaCreditoModal({ factura, onClose, onSave }: NotaCreditoModalProps) {
    const { currentEmpresa } = useEmpresa();
    const { puntoActivo } = usePuntoEmision();
    const parametros = currentEmpresa?.parametros;
    const [generarGuia, setGenerarGuia] = useState(false);

    const puntoEmisionId = puntoActivo?.puntoEmisionId;

    const [motivo, setMotivo] = useState('');
    const [fechaEmision, setFechaEmision] = useState(getLocalDateIso());
    const [secuencial, setSecuencial] = useState('');
    const [estab, setEstab] = useState(puntoActivo?.codigoEstablecimiento);
    const [ptoEmi, setPtoEmi] = useState(puntoActivo?.codigoPunto);
    const [guardando, setGuardando] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

    const { items: motivosNC, cargando: cargandoMotivos } = useCatalogo('MOTIVO_NC');
    const [motivoPersonalizado, setMotivoPersonalizado] = useState('');
    const [esOtroMotivo, setEsOtroMotivo] = useState(false);

    // Cargar secuencial automático
    useEffect(() => {
        const cargarSecuencial = async () => {
            if (puntoEmisionId) {
                try {
                    const data = await FacturacionUseCases.obtenerSiguienteSecuencial(puntoEmisionId, '04');
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

    const [items, setItems] = useState<ItemNotaCredito[]>(
        factura.detalles?.map((item: any, index: number) => ({
            id: item.id || `item-${index}`,
            codigoPrincipal: item.codigoPrincipal || item.codigo || '',
            nombre: item.descripcion,
            cantidadOriginal: item.cantidad,
            precio: item.precioUnitario,
            cantidadDevolver: 0,
            codigoIVA: item.codigoIVA || parametros?.ivaCodigo || '4'
        })) || []
    );

    const handleCantidadChange = (id: string, val: number) => {
        setItems((prev: ItemNotaCredito[]) => prev.map(item =>
            item.id === id ? { ...item, cantidadDevolver: Math.min(Math.max(0, val), item.cantidadOriginal) } : item
        ));
        if (errorValidacion) setErrorValidacion(null);
    };

    const ivaRateValue = (parametros?.ivaValor || 15) / 100;

    const subtotalDevolucion = items.reduce((acc, item) => acc + (item.cantidadDevolver * item.precio), 0);
    const ivaDevolucion = items.reduce((acc, item) => {
        // Códigos que no graban IVA según SRI: 0 (0%), 6 (Exento), 7 (No Objeto)
        const codigosNoGraban = ['0', '6', '7'];
        const esGravado = !codigosNoGraban.includes(item.codigoIVA);
        const tarifa = esGravado ? ivaRateValue : 0;
        return acc + (item.cantidadDevolver * item.precio * tarifa);
    }, 0);
    const totalDevolucion = subtotalDevolucion + ivaDevolucion;

    const handleEmitirNC = async () => {
        if (!currentEmpresa) return;
        if (!motivo || totalDevolucion === 0 || !puntoEmisionId) {
            setErrorValidacion("Debe ingresar un motivo y devolver al menos un ítem.");
            return;
        }

        setGuardando(true);
        setErrorValidacion(null);
        try {
            if (!puntoActivo) throw new Error('Debe seleccionar un punto de emisión válido');

            const fullNumDocModificado = factura.secuencial.includes('-')
                ? factura.secuencial
                : `${factura.estab || '001'}-${factura.ptoEmi || '001'}-${factura.secuencial}`;

            const payload = {
                puntoEmisionId,
                fechaEmision,
                clienteId: factura.clienteId,
                motivo,
                codDocModificado: '01', // Factura
                numDocModificado: fullNumDocModificado,
                fechaEmisionDocSustento: factura.fechaEmision,
                generarGuia,
                detalles: items.filter(i => i.cantidadDevolver > 0).map(i => {
                    const codigosNoGraban = ['0', '6', '7'];
                    const esGravado = !codigosNoGraban.includes(i.codigoIVA);
                    const tarifaCalculada = esGravado ? ivaRateValue : 0;
                    return {
                        id: i.id,
                        codigoPrincipal: i.codigoPrincipal,
                        descripcion: i.nombre,
                        cantidad: i.cantidadDevolver,
                        precioUnitario: i.precio,
                        descuento: 0,
                        baseImponible: i.cantidadDevolver * i.precio,
                        valorIVA: i.cantidadDevolver * i.precio * tarifaCalculada,
                        codigoIVA: i.codigoIVA,
                        tarifa: tarifaCalculada * 100
                    };
                })
            };

            const res = await FacturacionUseCases.emitirNotaCredito(payload);

            if (res.success) {
                if (res.estadoSri === 'AUTORIZADO') {
                    alert(`Nota de Crédito autorizada: ${res.secuencial}`);
                } else {
                    alert(`Nota de Crédito guardada con estado: ${res.estadoSri}`);
                }
                onSave();
                onClose();
            } else {
                throw new Error(res.error || 'Error al procesar la Nota de Crédito');
            }
        } catch (error: any) {
            console.error('Error al emitir NC:', error);
            setErrorValidacion(`Error: ${error.message}`);
        } finally {
            setGuardando(false);
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleEmitirNC}
            isLoading={guardando}
            submitLabel="Emitir y Autorizar SRI"
            submitIcon={<RotateCcw size={18} />}
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Emisión de Nota de Crédito"
            description={`Sobre Factura: ${factura.secuencial}`}
            icon={<RotateCcw size={24} />}
            footer={footer}
            size="lg"
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
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 font-mono">
                                <FileText size={14} className="text-sri-blue" /> Número de Nota de Crédito
                            </label>
                            <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-sri-blue">
                                {estab}-{ptoEmi}-{secuencial.padStart(9, '0')}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <AlertCircle size={14} className="text-sri-blue" /> Fecha de Emisión
                            </label>
                            <input
                                type="date"
                                value={fechaEmision}
                                onChange={e => setFechaEmision(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-bold text-slate-700"
                                disabled
                            />
                        </div>
                    </div>
                </div>

                {/* Sección Modificación */}
                <div>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-sri-blue/10">
                        <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                            <RotateCcw size={16} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Motivo de la Modificación</h3>
                    </div>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Motivo de Modificación *</label>
                            <select
                                value={esOtroMotivo ? 'OTRO' : motivo}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === 'OTRO') {
                                        setEsOtroMotivo(true);
                                        setMotivo(motivoPersonalizado);
                                    } else {
                                        setEsOtroMotivo(false);
                                        setMotivo(val);
                                    }
                                }}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-medium text-slate-700"
                                disabled={cargandoMotivos}
                            >
                                <option value="">Seleccione un motivo...</option>
                                {motivosNC.map(m => (
                                    <option key={m.id} value={m.valor}>{m.valor}</option>
                                ))}
                                <option value="OTRO">OTRO (Especificar...)</option>
                            </select>

                            {esOtroMotivo && (
                                <input
                                    type="text"
                                    value={motivoPersonalizado}
                                    onChange={e => {
                                        setMotivoPersonalizado(e.target.value);
                                        setMotivo(e.target.value);
                                    }}
                                    className="w-full mt-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-medium text-slate-700 animate-in fade-in slide-in-from-top-1"
                                    placeholder="Escriba el motivo personalizado..."
                                />
                            )}
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
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-sri-blue/10">
                        <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                            <Calculator size={16} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Detalle de Devolución</h3>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-xs text-left">
                            <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="py-3 px-4">Producto</th>
                                    <th className="py-3 px-4 text-right">Facturado</th>
                                    <th className="py-3 px-4 text-right">Devolver</th>
                                    <th className="py-3 px-4 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map(item => (
                                    <tr key={item.id} className="hover:bg-sri-blue/5 transition-colors">
                                        <td className="py-3 px-4 font-medium text-slate-700">{item.nombre}</td>
                                        <td className="py-3 px-4 text-right font-bold text-slate-400">{item.cantidadOriginal}</td>
                                        <td className="py-3 px-4 text-right">
                                            <input
                                                type="number"
                                                value={item.cantidadDevolver}
                                                onChange={e => handleCantidadChange(item.id, parseFloat(e.target.value) || 0)}
                                                step="0.01"
                                                className="w-20 px-3 py-1.5 text-center font-bold bg-slate-50 text-sri-blue border border-slate-200 rounded-lg outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-mono"
                                                min={0}
                                                max={item.cantidadOriginal}
                                            />
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-slate-700 font-mono">
                                            {formatearDinero(item.cantidadDevolver * item.precio)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totales */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <div className="w-64 space-y-2 text-right">
                        <div className="flex justify-between text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                            <span>Subtotal:</span>
                            <span className="font-mono text-sm">{formatearDinero(subtotalDevolucion)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                            <span>IVA ({parametros?.ivaEtiqueta || '15%'}):</span>
                            <span className="font-mono text-sm">{formatearDinero(ivaDevolucion)}</span>
                        </div>
                        <div className="flex justify-between font-black text-sri-blue pt-2 mt-2 border-t border-slate-200">
                            <span className="text-xs uppercase tracking-widest">Total NC:</span>
                            <span className="text-2xl font-mono">{formatearDinero(totalDevolucion)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
