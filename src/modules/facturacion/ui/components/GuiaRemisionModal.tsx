'use client';

import { useState, useEffect } from 'react';
import { Save, Truck, MapPin, Package, User, Plus, AlertCircle, FileText } from 'lucide-react';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { MotivoTraslado } from '../../domain/guias';
import { useTransportistas } from '../../hooks/useTransportistas';
import { TransportistaModal } from './TransportistaModal';
import { usePuntoEmision } from '@/shared/context/PuntoEmisionContext';
import { FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { getLocalDateIso } from '@/shared/utils/dateUtils';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { useCatalogo } from '@/modules/shared/hooks/useCatalogo';

interface GuiaRemisionModalProps {
    facturaReferencia?: any;
    onClose: () => void;
    onSave: () => void;
}

export const GuiaRemisionModal = ({ facturaReferencia, onClose, onSave }: GuiaRemisionModalProps) => {
    const { currentEmpresa } = useEmpresa();
    const { puntoActivo } = usePuntoEmision();
    const { transportistas, cargarTransportistas } = useTransportistas();
    const [transportistaId, setTransportistaId] = useState('');
    const puntoEmisionId = puntoActivo?.puntoEmisionId;
    const [puntoPartida, setPuntoPartida] = useState('Matriz / Bodega Principal');
    const [puntoDestino, setPuntoDestino] = useState(facturaReferencia?.direccion || '');
    const [fechaEmision, setFechaEmision] = useState(getLocalDateIso());
    const [fechaInicio, setFechaInicio] = useState(getLocalDateIso());
    const [fechaFin, setFechaFin] = useState(getLocalDateIso());

    const [motivo, setMotivo] = useState(MotivoTraslado.VENTA);
    const [showNuevoTransportista, setShowNuevoTransportista] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

    const { items: motivosGR, cargando: cargandoMotivos } = useCatalogo('MOTIVO_GR');
    const [motivoPersonalizado, setMotivoPersonalizado] = useState('');
    const [esOtroMotivo, setEsOtroMotivo] = useState(false);
    const [secuencial, setSecuencial] = useState('');
    const [estab, setEstab] = useState(puntoActivo?.codigoEstablecimiento);
    const [ptoEmi, setPtoEmi] = useState(puntoActivo?.codigoPunto);

    // Cargar secuencial automático
    useEffect(() => {
        const cargarSecuencial = async () => {
            if (puntoEmisionId) {
                try {
                    const data = await FacturacionUseCases.obtenerSiguienteSecuencial(puntoEmisionId, '06');
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
        cargarTransportistas();
    }, [cargarTransportistas]);


    useEffect(() => {
        if (transportistas.length > 0 && !transportistaId) {
            setTransportistaId(transportistas[0].id);
        }
    }, [transportistas, transportistaId]);

    const handleGuardar = async () => {
        if (!currentEmpresa) return;
        if (!transportistaId || !puntoPartida || !puntoDestino || !puntoEmisionId) {
            setErrorValidacion('Por favor complete los campos obligatorios.');
            return;
        }

        const transportista = transportistas.find(t => t.id === transportistaId);

        if (!transportista) {
            setErrorValidacion('Seleccione un transportista válido');
            return;
        }
        if (!puntoActivo) {
            setErrorValidacion('Debe seleccionar un punto de emisión válido');
            return;
        }

        setGuardando(true);
        setErrorValidacion(null);
        try {
            const transportista = transportistas.find(t => t.id === transportistaId);

            if (!transportista) throw new Error('Seleccione un transportista válido');
            if (!puntoActivo) throw new Error('Debe seleccionar un punto de emisión válido');

            const payload = {
                puntoEmisionId,
                generarGuia: true,
                transportistaId,
                fechaEmision,
                dirPartida: puntoPartida,
                clienteId: facturaReferencia?.clienteId,
                destinatarios: [
                    {
                        identificacion: facturaReferencia?.identificacionComprador || '9999999999999',
                        nombre: facturaReferencia?.razonSocialComprador || 'CONSUMIDOR FINAL',
                        direccion: puntoDestino,
                        motivo: motivo,
                        numDocSustento: facturaReferencia?.secuencial?.replace(/-/g, ''),
                        fechaEmisionDocSustento: facturaReferencia?.fechaEmision || getLocalDateIso(),
                        detalles: (facturaReferencia?.detalles || facturaReferencia?.items)?.map((i: any) => ({
                            codigoPrincipal: i.codigo || i.codigoPrincipal || 'S/N',
                            descripcion: i.nombre || i.descripcion,
                            cantidad: i.cantidad || 1
                        })) || []
                    }
                ]
            };

            const res = await FacturacionUseCases.emitirGuia(payload);

            if (res.success) {
                if (res.estado === 'AUTORIZADO') {
                    alert(`Guía de Remisión autorizada: ${res.secuencial}`);
                } else {
                    alert(`Guía guardada con estado: ${res.estado}`);
                }
                onSave();
                onClose();
            } else {
                throw new Error(res.error || 'Error al procesar la Guía de Remisión');
            }
        } catch (error: any) {
            console.error('Error al procesar guía:', error);
            setErrorValidacion(error.message || 'Error al procesar la guía de remisión');
        } finally {
            setGuardando(false);
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleGuardar}
            isLoading={guardando}
            submitLabel="Guardar y Emitir"
            submitIcon={<Save size={18} />}
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Generar Guía de Remisión"
            description="Documento de acompañamiento para el traslado de mercadería."
            icon={<Truck size={24} />}
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
                {/* Sección Transportista */}
                <div>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-sri-blue/10">
                        <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                            <Save size={16} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Información del Comprobante</h3>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 font-mono">
                                <FileText size={14} className="text-sri-blue" /> Número de Guía de Remisión (Estab-PtoEmi-Secuencial)
                            </label>
                            <div className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-sri-blue">
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
                                onChange={(e) => setFechaEmision(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-bold text-slate-700"
                                disabled
                            />
                        </div>
                    </div>




                    <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-sri-blue/10">
                        <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                            <User size={16} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Información del Transportista</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Truck size={14} className="text-sri-blue" /> Seleccionar Transportista *
                            </label>
                            <select
                                value={transportistaId}
                                onChange={(e) => setTransportistaId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-medium text-slate-700"
                            >
                                {transportistas.map(t => (
                                    <option key={t.id} value={t.id}>{t.razonSocial} ({t.placa})</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end pb-0.5">
                            <Button
                                variant="secondary"
                                className="w-full flex items-center gap-2 justify-center border-dashed border-2 hover:border-sri-blue hover:text-sri-blue hover:bg-sri-blue/5 transition-all"
                                onClick={() => setShowNuevoTransportista(true)}
                            >
                                <Plus size={16} /> Agregar Transportista
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sección Ruta */}
                <div>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-sri-blue/10">
                        <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                            <MapPin size={16} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Ruta y Cronograma</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Punto de Partida *</label>
                            <input
                                type="text"
                                value={puntoPartida}
                                onChange={(e) => setPuntoPartida(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Punto de Destino *</label>
                            <input
                                type="text"
                                value={puntoDestino}
                                onChange={(e) => setPuntoDestino(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha Inicio Traslado</label>
                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha Fin Traslado</label>
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Sección Mercadería */}
                <div>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-sri-blue/10">
                        <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                            <Package size={16} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Contenido del Envío</h3>
                    </div>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200 overflow-hidden shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Motivo del Traslado</span>
                            <select
                                value={esOtroMotivo ? 'OTROS' : motivo}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === 'OTROS') {
                                        setEsOtroMotivo(true);
                                        setMotivo(motivoPersonalizado);
                                    } else {
                                        setEsOtroMotivo(false);
                                        setMotivo(val);
                                    }
                                }}
                                className="text-sm border border-sri-blue/20 bg-white px-4 py-2 rounded-xl font-bold text-sri-blue outline-none focus:ring-4 focus:ring-sri-blue/10 shadow-sm transition-all"
                                disabled={cargandoMotivos}
                            >
                                <option value="">Seleccione motivo...</option>
                                {motivosGR.map(m => (
                                    <option key={m.id} value={m.valor}>{m.valor}</option>
                                ))}
                                <option value="OTROS">OTROS (Especifique...)</option>
                            </select>
                        </div>

                        {esOtroMotivo && (
                            <div className="mb-4 animate-in fade-in slide-in-from-top-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Especifique el motivo *</label>
                                <input
                                    type="text"
                                    value={motivoPersonalizado}
                                    onChange={e => {
                                        setMotivoPersonalizado(e.target.value);
                                        setMotivo(e.target.value);
                                    }}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-4 focus:ring-sri-blue/10"
                                    placeholder="Ej: Traslado por mantenimiento"
                                />
                            </div>
                        )}
                        <table className="w-full text-xs text-left bg-white rounded-xl overflow-hidden shadow-sm">
                            <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="py-3 px-4">Descripción del Ítem</th>
                                    <th className="py-3 px-4">Unidad</th>
                                    <th className="py-3 px-4 text-right">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(facturaReferencia?.detalles || facturaReferencia?.items)?.map((item: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-sri-blue/5 transition-colors">
                                        <td className="py-3 px-4 font-medium text-slate-700">{item.nombre || item.descripcion}</td>
                                        <td className="py-3 px-4 font-bold text-slate-400">{item.unidadMedida || 'UND'}</td>
                                        <td className="py-3 px-4 text-right font-black text-sri-blue">{item.cantidad || 1}</td>
                                    </tr>
                                )) || (
                                        <tr><td colSpan={3} className="py-8 text-center text-slate-400 italic">No se han cargado productos asociados.</td></tr>
                                    )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showNuevoTransportista && (
                    <TransportistaModal
                        onClose={() => setShowNuevoTransportista(false)}
                        onSave={(nuevo) => {
                            cargarTransportistas();
                            setTransportistaId(nuevo.id);
                            setShowNuevoTransportista(false);
                        }}
                    />
                )}
            </div>
        </Modal>
    );
};
