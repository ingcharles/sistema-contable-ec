'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, AlertCircle, Truck, FileText } from 'lucide-react';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { formatearDinero } from '@/shared/utils/formatearDinero';
import { FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Modal } from '@/shared/ui/Modal';
import { usePuntoEmision } from '@/shared/context/PuntoEmisionContext';
import { getLocalDateIso } from '@/shared/utils/dateUtils';
import { useCatalogos } from '@/shared/hooks/useCatalogos';


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
    const { puntoActivo, puntosDisponibles: puntosContext } = usePuntoEmision();

    const parametros = currentEmpresa?.parametros;

    const [puntosEmision, setPuntosEmision] = useState<any[]>([]);
    const [generarGuia, setGenerarGuia] = useState(false);

    useEffect(() => {
        const cargarPuntos = async () => {
            try {
                if (puntosContext && puntosContext.length > 0) {
                    setPuntosEmision(puntosContext);
                } else {
                    const puntos = await FacturacionUseCases.listarPuntosEmision();
                    setPuntosEmision(puntos);
                }
            } catch (e) {
                console.error('Error al cargar puntos de emisión:', e);
            }
        };
        cargarPuntos();
    }, [puntosContext]);

    const puntoEmisionId = puntoActivo?.puntoEmisionId;

    const { getCatalogo } = useCatalogos(['SRI_TIPO_IMPUESTO_IVA']);
    const tarifasIVA = getCatalogo('SRI_TIPO_IMPUESTO_IVA');

    const [motivo, setMotivo] = useState('');
    const [fechaEmision, setFechaEmision] = useState(getLocalDateIso());
    const [guardando, setGuardando] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

    const [items, setItems] = useState<ItemNotaCredito[]>(
        factura.detalles?.map((item: any, index: number) => ({
            id: item.id || `item-${index}`,
            codigoPrincipal: item.codigoPrincipal || item.codigo || '',
            nombre: item.descripcion,
            cantidadOriginal: item.cantidad,
            precio: item.precioUnitario,
            cantidadDevolver: 0,
            codigoIVA: item.codigoIVA || '2' // Default 12%/15%
        })) || []
    );

    const handleCantidadChange = (id: string, val: number) => {
        setItems((prev: ItemNotaCredito[]) => prev.map(item =>
            item.id === id ? { ...item, cantidadDevolver: Math.min(Math.max(0, val), item.cantidadOriginal) } : item
        ));
        if (errorValidacion) setErrorValidacion(null);
    };

    const getTarifaIVA = (codigoIVA: string) => {
        const tarifaSeleccionada = tarifasIVA.find(t => t.codigo === codigoIVA);
        if (tarifaSeleccionada) {
            if (tarifaSeleccionada.valorNumerico !== undefined) {
                return tarifaSeleccionada.valorNumerico / 100;
            }
            const match = tarifaSeleccionada.valor.match(/(\d+)%/);
            if (match) return parseInt(match[1]) / 100;
        }
        // Fallback robusto
        if (codigoIVA === '2') return 0.12;
        if (codigoIVA === '4') return (parametros?.ivaValor || 15) / 100;
        return 0;
    };

    const subtotalDevolucion = items.reduce((acc, item) => acc + (item.cantidadDevolver * item.precio), 0);
    const ivaDevolucion = items.reduce((acc, item) => {
        const tarifa = getTarifaIVA(item.codigoIVA);
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
            const puntoEmi = puntosEmision.find(p => (p.puntoEmisionId || p.id) === puntoEmisionId);
            if (!puntoEmi) throw new Error('Debe seleccionar un punto de emisión válido');

            const fullNumDocModificado = factura.secuencial.includes('-')
                ? factura.secuencial
                : `${factura.estab}-${factura.ptoEmi}-${factura.secuencial}`;

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
                    const tarifa = getTarifaIVA(i.codigoIVA);
                    return {
                        id: i.id,
                        codigoPrincipal: i.codigoPrincipal,
                        descripcion: i.nombre,
                        cantidad: i.cantidadDevolver,
                        precioUnitario: i.precio,
                        descuento: 0,
                        baseImponible: i.cantidadDevolver * i.precio,
                        valorIVA: i.cantidadDevolver * i.precio * tarifa,
                        codigoIVA: i.codigoIVA,
                        tarifa: tarifa * 100
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
            <div className="space-y-6">
                {errorValidacion && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-sm font-medium">{errorValidacion}</p>
                    </div>
                )}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono flex items-center gap-2">
                            <FileText size={14} className="text-sri-blue" /> Punto de Emisión (Estab-PtoEmi-Secuencial)
                        </label>
                        <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-sri-blue">
                            {(() => {
                                const p = puntosEmision.find(p => (p.puntoEmisionId || p.id) === puntoEmisionId);
                                const seq = p?.secuenciales?.find((s: any) => s.tipoComprobante === '04')?.secuencialActual || 1;
                                return `${p?.sucursalCodigo || '001'}-${p?.codigo || '001'}-${seq.toString().padStart(9, '0')}`;
                            })()}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Fecha Emisión</label>
                        <input type="date" value={fechaEmision} onChange={e => setFechaEmision(e.target.value)} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-bold text-slate-700" disabled />
                    </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-4">
                    <Truck className="text-emerald-500" size={20} />
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={generarGuia}
                            onChange={(e) => setGenerarGuia(e.target.checked)}
                            className="w-5 h-5 rounded border-emerald-200 text-emerald-600 focus:ring-emerald-500 transition-all"
                        />
                        <div>
                            <span className="text-sm font-black text-emerald-800 uppercase tracking-wider">Generar Guía de Remisión</span>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase opacity-70">Se generará un documento de traslado automáticamente</p>
                        </div>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Motivo de Modificación *</label>
                        <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-slate-700" placeholder="Ej: Devolución mercadería" />
                    </div>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100/50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="p-4 text-left">Producto</th>
                                <th className="p-4 text-right">Facturado</th>
                                <th className="p-4 text-right">Devolver</th>
                                <th className="p-4 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-white/50 transition-colors">
                                    <td className="p-4 font-medium text-slate-700">{item.nombre}</td>
                                    <td className="p-4 text-right text-slate-500">{item.cantidadOriginal}</td>
                                    <td className="p-4 text-right">
                                        <input
                                            type="number"
                                            value={item.cantidadDevolver}
                                            onChange={e => handleCantidadChange(item.id, parseFloat(e.target.value) || 0)}
                                            step="0.01"
                                            className="w-20 px-3 py-1.5 text-center font-bold bg-white text-sri-blue border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-mono"
                                            min={0}
                                            max={item.cantidadOriginal}
                                        />
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-slate-700">{formatearDinero(item.cantidadDevolver * item.precio)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <div className="w-64 space-y-2 text-right">
                        <div className="flex justify-between text-slate-500 font-medium text-sm">
                            <span>Subtotal Devolución:</span>
                            <span>{formatearDinero(subtotalDevolucion)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium text-sm">
                            <span>IVA Devolución ({parametros?.ivaEtiqueta || '15%'}):</span>
                            <span>{formatearDinero(ivaDevolucion)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl text-sri-blue pt-2 mt-2 border-t border-slate-100">
                            <span>Total NC:</span>
                            <span>{formatearDinero(totalDevolucion)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
