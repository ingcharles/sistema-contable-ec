'use client';

import { useState, useEffect } from 'react';
import { FileText, AlertCircle, TrendingUp, Calculator, Truck } from 'lucide-react';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { formatearDinero } from '@/shared/utils/formatearDinero';
import { FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Modal } from '@/shared/ui/Modal';
import { usePuntoEmision } from '@/shared/context/PuntoEmisionContext';
import { getLocalDateIso } from '@/shared/utils/dateUtils';


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
    const { puntoActivo } = usePuntoEmision();

    const parametros = currentEmpresa?.parametros;
    const [generarGuia, setGenerarGuia] = useState(false);

    const puntoEmisionId = puntoActivo?.puntoEmisionId;


    const [motivo, setMotivo] = useState('');
    const [fechaEmision, setFechaEmision] = useState(getLocalDateIso());
    const [guardando, setGuardando] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
    const [secuencial, setSecuencial] = useState('');
    const [estab, setEstab] = useState(puntoActivo?.codigoEstablecimiento);
    const [ptoEmi, setPtoEmi] = useState(puntoActivo?.codigoPunto);

    // Cargar secuencial automático
    useEffect(() => {
        const cargarSecuencial = async () => {
            if (puntoEmisionId) {
                try {
                    const data = await FacturacionUseCases.obtenerSiguienteSecuencial(puntoEmisionId, '05');
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

    const [items, setItems] = useState<ItemNotaDebito[]>(
        factura.detalles?.map((item: any, index: number) => ({
            id: item.id || `item-${index}`,
            codigoPrincipal: item.codigoPrincipal || '',
            nombre: item.descripcion,
            cantidadOriginal: item.cantidad,
            precio: item.precioUnitario,
            valorCargo: 0,
            codigoIVA: parametros?.ivaCodigo || '4',
        })) || []
    );

    const handleCargoChange = (id: string, val: number) => {
        setItems((prev: ItemNotaDebito[]) => prev.map(item =>
            item.id === id ? { ...item, valorCargo: Math.max(0, val) } : item
        ));
        if (errorValidacion) setErrorValidacion(null);
    };

    const ivaRateValue = (parametros?.ivaValor) / 100;

    const subtotalCargo = items.reduce((acc, item) => acc + item.valorCargo, 0);
    const ivaCargo = items.reduce((acc, item) => {
        // Códigos que no graban IVA según SRI: 0 (0%), 6 (Exento), 7 (No Objeto)
        const codigosNoGraban = ['0', '6', '7'];
        const esGravado = !codigosNoGraban.includes(item.codigoIVA);
        const tarifa = esGravado ? ivaRateValue : 0;
        return acc + (item.valorCargo * tarifa);
    }, 0);
    const totalCargo = subtotalCargo + ivaCargo;

    const handleEmitirND = async () => {
        if (!currentEmpresa) return;
        if (!motivo || totalCargo === 0 || !puntoEmisionId) {
            setErrorValidacion("Debe ingresar un motivo y cargar al menos un valor.");
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
                detalles: items.filter(i => i.valorCargo > 0).map(i => {
                    const codigosNoGraban = ['0', '6', '7'];
                    const esGravado = !codigosNoGraban.includes(i.codigoIVA);
                    const tarifaCalculada = esGravado ? ivaRateValue : 0;
                    return {
                        codigoPrincipal: i.codigoPrincipal || 'ND',
                        descripcion: i.nombre,
                        razonModificacion: motivo,
                        cantidad: 1,
                        precioUnitario: i.valorCargo,
                        descuento: 0,
                        baseImponible: i.valorCargo,
                        valorModificacion: i.valorCargo + (i.valorCargo * tarifaCalculada),
                        valorIVA: i.valorCargo * tarifaCalculada,
                        codigoIVA: i.codigoIVA,
                        tarifa: tarifaCalculada * 100
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
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 font-mono">
                                <FileText size={14} className="text-sri-blue" /> Número de Nota de Débito
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
                            <TrendingUp size={16} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Motivo de la Modificación</h3>
                    </div>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Motivo de Modificación *</label>
                            <input
                                type="text"
                                value={motivo}
                                onChange={e => setMotivo(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-medium text-slate-700"
                                placeholder="Ej: Intereses por mora"
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
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-sri-blue/10">
                        <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                            <Calculator size={16} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Detalles de Cargos</h3>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-xs text-left">
                            <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="py-3 px-4">Producto</th>
                                    <th className="py-3 px-4 text-right">Cantidad</th>
                                    <th className="py-3 px-4 text-right">Cargo Unit.</th>
                                    <th className="py-3 px-4 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map(item => (
                                    <tr key={item.id} className="hover:bg-sri-blue/5 transition-colors">
                                        <td className="py-3 px-4 font-medium text-slate-700">{item.nombre}</td>
                                        <td className="py-3 px-4 text-right text-slate-500 font-bold">{item.cantidadOriginal}</td>
                                        <td className="py-3 px-4 text-right">
                                            <input
                                                type="number"
                                                value={item.valorCargo}
                                                onChange={e => handleCargoChange(item.id, parseFloat(e.target.value) || 0)}
                                                step="0.01"
                                                className="w-24 px-3 py-1.5 text-center font-bold bg-slate-50 text-sri-blue border border-slate-200 rounded-lg outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-mono"
                                                min={0}
                                            />
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-slate-700 font-mono">
                                            {formatearDinero(item.valorCargo)}
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
                            <span>Subtotal Cargo:</span>
                            <span className="font-mono text-sm">{formatearDinero(subtotalCargo)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                            <span>IVA ({parametros?.ivaEtiqueta || '15%'}):</span>
                            <span className="font-mono text-sm">{formatearDinero(ivaCargo)}</span>
                        </div>
                        <div className="flex justify-between font-black text-sri-blue pt-2 mt-2 border-t border-slate-200">
                            <span className="text-xs uppercase tracking-widest">Total ND:</span>
                            <span className="text-2xl font-mono">{formatearDinero(totalCargo)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
