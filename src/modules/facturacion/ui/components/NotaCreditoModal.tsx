'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, AlertCircle, Hash } from 'lucide-react';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { formatearDinero } from '@/shared/utils/formatearDinero';
import { FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Modal } from '@/shared/ui/Modal';
import { useConfiguracion } from '@/modules/configuracion/hooks/useConfiguracion';
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
    const { parametros, cargarParametros } = useConfiguracion();
    const { puntoActivo, puntosDisponibles: puntosContext } = usePuntoEmision();
    const [puntosEmision, setPuntosEmision] = useState<any[]>([]);
    const [puntoEmisionId, setPuntoEmisionId] = useState(puntoActivo?.puntoEmisionId || '');

    useEffect(() => {
        cargarParametros();
        const cargarPuntos = async () => {
            try {
                // Si tenemos puntos en el contexto (asignados), usamos esos
                if (puntosContext && puntosContext.length > 0) {
                    setPuntosEmision(puntosContext);
                    if (!puntoEmisionId) setPuntoEmisionId(puntosContext[0].puntoEmisionId || puntosContext[0].id);
                } else {
                    // Fallback a listar todos si no hay contexto (ej: admin o no cargado aún)
                    const puntos = await FacturacionUseCases.listarPuntosEmision();
                    setPuntosEmision(puntos);
                    if (!puntoEmisionId && puntos.length > 0) setPuntoEmisionId(puntos[0].id);
                }
            } catch (e) {
                console.error('Error al cargar puntos de emisión:', e);
            }
        };
        cargarPuntos();
    }, [puntosContext, puntoActivo]);

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
        if (codigoIVA === '2') return (parametros?.iva || 15) / 100;
        if (codigoIVA === '4') return 0.15;
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
            setErrorValidacion("Debe ingresar un motivo, seleccionar punto de emisión y devolver al menos un ítem.");
            return;
        }

        setGuardando(true);
        setErrorValidacion(null);
        try {
            const puntoEmi = puntosEmision.find(p => (p.puntoEmisionId || p.id) === puntoEmisionId);
            if (!puntoEmi) throw new Error('Debe seleccionar un punto de emisión válido');

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                            <Hash size={16} className="text-sri-blue" /> Punto de Emisión *
                        </label>
                        <select
                            value={puntoEmisionId}
                            onChange={(e) => setPuntoEmisionId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-bold text-sri-blue"
                        >
                            {puntosEmision.length === 0 && <option value="">No hay puntos disponibles</option>}
                            {puntosEmision.map(p => (
                                <option key={p.puntoEmisionId || p.id} value={p.puntoEmisionId || p.id}>
                                    {p.nombrePunto || p.nombre || 'Punto'} ({p.codigoPunto || p.codigo}) - {p.nombreSucursal || p.sucursalNombre || 'Sucursal'}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Fecha Emisión *</label>
                        <input type="date" value={fechaEmision} onChange={e => setFechaEmision(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Motivo *</label>
                        <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all" placeholder="Ej: Devolución mercadería" />
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
                                            min="0"
                                            max={item.cantidadOriginal}
                                            value={item.cantidadDevolver}
                                            onChange={e => handleCantidadChange(item.id, Number(e.target.value))}
                                            className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-center font-bold bg-white text-sri-blue focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                            step="0.01"
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
                            <span>IVA Devolución ({parametros?.iva || 15}%):</span>
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
