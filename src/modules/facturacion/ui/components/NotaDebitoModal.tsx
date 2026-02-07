'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Hash } from 'lucide-react';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { formatearDinero } from '@/shared/utils/formatearDinero';
import { FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Modal } from '@/shared/ui/Modal';
import { usePuntoEmision } from '@/shared/context/PuntoEmisionContext';
import { getLocalDateIso } from '@/shared/utils/dateUtils';
import { useCatalogos } from '@/shared/hooks/useCatalogos';

interface ItemNotaDebito {
    id: string;
    codigoPrincipal: string;
    nombre: string;
    cantidadOriginal: number;
    precio: number;
    valorCargo: number;
    codigoIVA: string;
}

interface NotaDebitoModalProps {
    factura: any; // Factura original a la que se aplica la ND
    onClose: () => void;
    onSave: () => void;
}

export function NotaDebitoModal({ factura, onClose, onSave }: NotaDebitoModalProps) {
    const { currentEmpresa } = useEmpresa();
    const { puntoActivo, puntosDisponibles: puntosContext } = usePuntoEmision();

    const parametros = currentEmpresa?.parametros;

    const [puntosEmision, setPuntosEmision] = useState<any[]>([]);
    const [puntoEmisionId, setPuntoEmisionId] = useState(puntoActivo?.puntoEmisionId || '');

    useEffect(() => {
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

    const [items, setItems] = useState<ItemNotaDebito[]>(
        factura.detalles?.map((item: any, index: number) => ({
            id: item.id || `item-${index}`,
            codigoPrincipal: item.codigoPrincipal || item.codigo || '',
            nombre: item.descripcion,
            cantidadOriginal: item.cantidad,
            precio: item.precioUnitario,
            valorCargo: 0,
            codigoIVA: item.codigoIVA || '4' // Default 15%
        })) || []
    );

    const handleCargoChange = (id: string, val: number) => {
        setItems((prev: ItemNotaDebito[]) => prev.map(item =>
            item.id === id ? { ...item, valorCargo: Math.max(0, val) } : item
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

    const subtotalCargo = items.reduce((acc, item) => acc + item.valorCargo, 0);
    const ivaCargo = items.reduce((acc, item) => {
        const tarifa = getTarifaIVA(item.codigoIVA);
        return acc + (item.valorCargo * tarifa);
    }, 0);
    const totalCargo = subtotalCargo + ivaCargo;

    const handleEmitirND = async () => {
        if (!currentEmpresa) return;
        if (!motivo || totalCargo === 0 || !puntoEmisionId) {
            setErrorValidacion("Debe ingresar un motivo, seleccionar punto de emisión y cargar al menos un valor.");
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
                detalles: items.filter(i => i.valorCargo > 0).map(i => {
                    const tarifa = getTarifaIVA(i.codigoIVA);
                    return {
                        codigoPrincipal: i.codigoPrincipal || 'ND',
                        descripcion: i.nombre,
                        razonModificacion: motivo,
                        cantidad: 1,
                        precioUnitario: i.valorCargo,
                        descuento: 0,
                        baseImponible: i.valorCargo,
                        valorModificacion: i.valorCargo + (i.valorCargo * tarifa),
                        valorIVA: i.valorCargo * tarifa,
                        codigoIVA: i.codigoIVA,
                        tarifa: tarifa * 100
                    };
                }),
                pagos: [{
                    formaPago: '20', // OTROS CON UTILIZACION DEL SISTEMA FINANCIERO
                    total: totalCargo,
                    plazo: 0,
                    unidadTiempo: 'DIAS'
                }]
            };

            const res = await FacturacionUseCases.emitirNotaDebito(payload);

            if (res.success) {
                if (res.estado === 'AUTORIZADO') {
                    alert(`Nota de Débito autorizada: ${res.secuencial}`);
                } else {
                    alert(`Nota de Débito guardada con estado: ${res.estado}`);
                }
                onSave();
                onClose();
            } else {
                throw new Error(res.error || 'Error al procesar la Nota de Débito');
            }
        } catch (error: any) {
            console.error('Error al emitir ND:', error);
            setErrorValidacion(`Error: ${error.message}`);
        } finally {
            setGuardando(false);
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleEmitirND}
            isLoading={guardando}
            submitLabel="Emitir y Autorizar SRI"
            submitIcon={<TrendingUp size={18} />}
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Emisión de Nota de Débito"
            description={`Sobre Factura: ${factura.secuencial}`}
            icon={<TrendingUp size={24} />}
            footer={footer}
            size="xl"
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
                        <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all" placeholder="Ej: Intereses por mora" />
                    </div>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100/50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="p-4 text-left">Producto</th>
                                <th className="p-4 text-right">Cantidad</th>
                                <th className="p-4 text-right">Cargo</th>
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
                                            value={item.valorCargo}
                                            onChange={e => handleCargoChange(item.id, Number(e.target.value))}
                                            className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-center font-bold bg-white text-sri-blue focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                            step="0.01"
                                        />
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-slate-700">{formatearDinero(item.valorCargo)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <div className="w-64 space-y-2 text-right">
                        <div className="flex justify-between text-slate-500 font-medium text-sm">
                            <span>Subtotal Cargo:</span>
                            <span>{formatearDinero(subtotalCargo)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium text-sm">
                            <span>IVA Cargo ({parametros?.ivaEtiqueta || '15%'}):</span>
                            <span>{formatearDinero(ivaCargo)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl text-sri-blue pt-2 mt-2 border-t border-slate-100">
                            <span>Total ND:</span>
                            <span>{formatearDinero(totalCargo)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
