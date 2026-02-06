'use client';

import { useState, useEffect } from 'react';
import { ArrowUpCircle, AlertCircle, Hash, Calendar, FileText, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { Button } from '@/shared/ui/Button';
import { formatearDinero } from '@/shared/utils/formatearDinero';
import { FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { usePuntoEmision } from '@/shared/context/PuntoEmisionContext';
import { useConfiguracion } from '@/modules/configuracion/hooks/useConfiguracion';
import { getLocalDateIso } from '@/shared/utils/dateUtils';

interface MotivoNotaDebito {
    razon: string;
    valor: number;
}

interface NotaDebitoModalProps {
    factura: any;
    onClose: () => void;
    onSave: () => void;
}

export function NotaDebitoModal({ factura, onClose, onSave }: NotaDebitoModalProps) {
    const { currentEmpresa } = useEmpresa();
    const { parametros, cargarParametros } = useConfiguracion();
    const { puntoActivo, puntosDisponibles: puntosContext } = usePuntoEmision();
    const [puntosEmision, setPuntosEmision] = useState<any[]>([]);
    const [puntoEmisionId, setPuntoEmisionId] = useState(puntoActivo?.puntoEmisionId || '');
    const [fechaEmision, setFechaEmision] = useState(getLocalDateIso());
    const [guardando, setGuardando] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
    const [motivos, setMotivos] = useState<MotivoNotaDebito[]>([{ razon: '', valor: 0 }]);

    useEffect(() => {
        cargarParametros();
        const cargarPuntos = async () => {
            try {
                if (puntosContext && puntosContext.length > 0) {
                    setPuntosEmision(puntosContext);
                    if (!puntoEmisionId) setPuntoEmisionId(puntosContext[0].puntoEmisionId || puntosContext[0].id);
                } else {
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

    const agregarMotivo = () => setMotivos([...motivos, { razon: '', valor: 0 }]);
    const eliminarMotivo = (index: number) => setMotivos(motivos.filter((_, i) => i !== index));
    const actualizarMotivo = (index: number, campo: keyof MotivoNotaDebito, valor: any) => {
        const nuevos = [...motivos];
        nuevos[index] = { ...nuevos[index], [campo]: valor };
        setMotivos(nuevos);
        if (errorValidacion) setErrorValidacion(null);
    };

    const subtotal = motivos.reduce((acc, m) => acc + (Number(m.valor) || 0), 0);
    const ivaPorcentaje = (parametros?.iva || 15) / 100;
    const iva = subtotal * ivaPorcentaje;
    const total = subtotal + iva;

    const handleEmitirND = async () => {
        if (!currentEmpresa) return;
        if (total === 0 || !puntoEmisionId || motivos.some(m => !m.razon || m.valor <= 0)) {
            setErrorValidacion("Complete todos los motivos, valores y seleccione punto de emisión.");
            return;
        }

        setGuardando(true);
        setErrorValidacion(null);
        try {
            const puntoEmi = puntosEmision.find(p => (p.puntoEmisionId || p.id) === puntoEmisionId);
            if (!puntoEmi) throw new Error('Debe seleccionar un punto de emisión válido');

            const payload = {
                puntoEmisionId,
                fechaEmision,
                clienteId: factura.clienteId,
                motivo: motivos.map(m => m.razon).join(' / '),
                codDocModificado: '01',
                numDocModificado: factura.secuencial,
                fechaEmisionDocSustento: factura.fechaEmision,
                detalles: motivos.map(m => ({
                    razon: m.razon,
                    baseImponible: m.valor,
                    valorIVA: m.valor * ivaPorcentaje,
                    codigoIVA: '4' // SRI 15% (ajustar según params si es dinámico)
                }))
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
            console.error('Error ND:', error);
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
            submitIcon={<ArrowUpCircle size={18} />}
            submitVariant="primary"
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Emisión de Nota de Débito"
            description={`Aumenta valor de Factura: ${factura.secuencial}`}
            icon={<ArrowUpCircle size={24} className="text-blue-500" />}
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
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-1">
                            <Hash size={14} className="text-sri-blue" /> Punto de Emisión *
                        </label>
                        <select
                            value={puntoEmisionId}
                            onChange={(e) => setPuntoEmisionId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-bold text-sri-blue"
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

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={14} className="text-sri-blue" /> Fecha Emisión
                    </label>
                    <input
                        type="date"
                        value={fechaEmision}
                        onChange={e => setFechaEmision(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/20">
                                <FileText size={16} />
                            </div>
                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Motivos del Débito</h4>
                        </div>
                        <Button onClick={agregarMotivo} size="sm" variant="secondary" className="h-8 py-0 flex items-center gap-1">
                            <Plus size={14} /> Agregar
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {motivos.map((m, idx) => (
                            <div key={idx} className="flex gap-4 items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-sri-blue/30 transition-colors">
                                <div className="flex-1">
                                    <input
                                        value={m.razon}
                                        onChange={e => actualizarMotivo(idx, 'razon', e.target.value)}
                                        placeholder="Ej: Intereses por mora"
                                        className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="w-32">
                                    <input
                                        type="number"
                                        value={m.valor}
                                        onChange={e => actualizarMotivo(idx, 'valor', Number(e.target.value))}
                                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-mono font-bold text-sm text-blue-600 outline-none focus:ring-2 focus:ring-blue-500/20"
                                        step="0.01"
                                    />
                                </div>
                                <button
                                    onClick={() => eliminarMotivo(idx)}
                                    disabled={motivos.length === 1}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t-2 border-slate-100 flex justify-end">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm font-medium text-slate-600">
                            <span>Subtotal:</span>
                            <span className="font-mono">{formatearDinero(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium text-slate-600">
                            <span>IVA ({parametros?.iva || 15}%):</span>
                            <span className="font-mono">{formatearDinero(iva)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-black text-blue-600 border-t-2 border-blue-100 pt-2">
                            <span>Total ND:</span>
                            <span className="font-mono">{formatearDinero(total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
