'use client';

import { useState, useEffect } from 'react';
import { Save, Truck, MapPin, Package, User, Plus, AlertCircle } from 'lucide-react';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { MotivoTraslado } from '../../domain/guias';
import { useTransportistas } from '../../hooks/useTransportistas';
import { TransportistaModal } from './TransportistaModal';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { SriStandardizer } from '../../domain/services/SriStandardizer';
import { FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { AMBIENTE, TIPO_EMISION } from '../../domain/catalogos';

interface GuiaRemisionModalProps {
    facturaReferencia?: any;
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const GuiaRemisionModal = ({ facturaReferencia, onClose, onSave }: GuiaRemisionModalProps) => {
    const { currentEmpresa } = useEmpresa();
    const { transportistas, cargarTransportistas } = useTransportistas();
    const [transportistaId, setTransportistaId] = useState('');
    const [puntosEmision, setPuntosEmision] = useState<any[]>([]);
    const [puntoEmisionId, setPuntoEmisionId] = useState('');
    const [puntoPartida, setPuntoPartida] = useState('Matriz / Bodega Principal');
    const [puntoDestino, setPuntoDestino] = useState(facturaReferencia?.direccion || '');
    const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
    const [motivo, setMotivo] = useState(MotivoTraslado.VENTA);
    const [showNuevoTransportista, setShowNuevoTransportista] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

    useEffect(() => {
        cargarTransportistas();
        const cargarPuntos = async () => {
            try {
                const puntos = await FacturacionUseCases.listarPuntosEmision();
                setPuntosEmision(puntos);
                if (puntos.length > 0) setPuntoEmisionId(puntos[0].id);
            } catch (e) {
                console.error('Error al cargar puntos de emisión:', e);
            }
        };
        cargarPuntos();
    }, [cargarTransportistas]);

    useEffect(() => {
        if (transportistas.length > 0 && !transportistaId) {
            setTransportistaId(transportistas[0].id);
        }
    }, [transportistas, transportistaId]);

    const handleGuardar = async () => {
        if (!transportistaId || !puntoPartida || !puntoDestino || !puntoEmisionId) {
            setErrorValidacion('Por favor complete los campos obligatorios.');
            return;
        }

        const transportista = transportistas.find(t => t.id === transportistaId);
        const puntoEmi = puntosEmision.find(p => p.id === puntoEmisionId);

        if (!transportista) {
            setErrorValidacion('Seleccione un transportista válido');
            return;
        }

        setGuardando(true);
        setErrorValidacion(null);
        try {
            // 1. Registrar BORRADOR en backend (Obtiene Secuencial y Clave Acceso reales)
            const detalles = facturaReferencia?.items?.map((i: any) => ({
                codigoInterno: i.codigo || i.codigoPrincipal || 'S/N',
                descripcion: i.nombre || i.descripcion,
                cantidad: i.cantidad || 1,
                unidadMedida: i.unidadMedida || 'UND'
            })) || [];

            const savedGuiaResponse = await FacturacionUseCases.guardarGuiaRemision({
                tipoComprobante: '06',
                fechaEmision: new Date().toISOString().split('T')[0],
                clienteId: facturaReferencia?.terceroId || '9999999999999',
                clienteNombre: facturaReferencia?.terceroNombre || 'CONSUMIDOR FINAL',
                clienteIdentificacion: facturaReferencia?.identificacionAdquirente || '9999999999999',
                subtotal: 0,
                iva: 0,
                total: 0,
                puntoEmisionId: puntoEmisionId,
                direccionPartida: puntoPartida,
                direccionDestino: puntoDestino,
                transportistaNombre: transportista.razonSocial,
                transportistaIdentificacion: transportista.identificacion || transportista.ruc,
                placaVehiculo: transportista.placa,
                detalles: detalles.map((d: any) => ({
                    codigoPrincipal: d.codigoInterno,
                    descripcion: d.descripcion,
                    cantidad: d.cantidad,
                    unidadMedida: d.unidadMedida,
                    precioUnitario: 0,
                    total: 0
                }))
            });

            if (!savedGuiaResponse.success) {
                throw new Error(savedGuiaResponse.error || 'Error al guardar el borrador de la guía');
            }

            // 2. Preparar datos para SRI usando el secuencial generado por backend
            const dataGuia = {
                ambiente: currentEmpresa.ambienteSri || AMBIENTE.PRUEBAS,
                tipoEmision: TIPO_EMISION.NORMAL,
                razonSocial: currentEmpresa.razonSocial,
                nombreComercial: currentEmpresa.nombreComercial,
                ruc: currentEmpresa.ruc,
                estab: puntoEmi?.sucursalCodigo || '001',
                ptoEmi: puntoEmi?.codigo || '001',
                secuencial: savedGuiaResponse.secuencial, // USAR SECUENCIAL REAL
                dirMatriz: currentEmpresa.direccionMatriz || 'Quito',
                dirPartida: puntoPartida,
                razonSocialTransportista: transportista.razonSocial,
                tipoIdentificacionTransportista: transportista.tipoIdentificacion || '04',
                rucTransportista: transportista.ruc || transportista.identificacion,
                obligadoContabilidad: currentEmpresa.obligadoContabilidad ? 'SI' : 'NO',
                contribuyenteEspecial: currentEmpresa.contribuyenteEspecial,
                fechaIniTraslado: fechaInicio,
                fechaFinTraslado: fechaFin,
                placa: transportista.placa,
                destinatarios: [
                    {
                        identificacionDestinatario: facturaReferencia?.identificacionAdquirente || '9999999999999',
                        razonSocialDestinatario: facturaReferencia?.razonSocialAdquirente || 'CONSUMIDOR FINAL',
                        dirDestinatario: puntoDestino,
                        motivoTraslado: motivo,
                        codDocSustento: '01',
                        numDocSustento: (facturaReferencia?.secuencial || '001-001-000000001').replace(/-/g, ''),
                        numAutDocSustento: facturaReferencia?.numeroAutorizacion || '1234567890123456789012345678901234567',
                        fechaEmisionDocSustento: facturaReferencia?.fechaEmision || new Date().toISOString().split('T')[0],
                        detalles: detalles
                    }
                ]
            };

            const guiaStandard = SriStandardizer.standardizeGuia(dataGuia);

            // 3. Emitir al SRI
            let resSri;
            try {
                resSri = await FacturacionUseCases.emitirFactura(guiaStandard);
            } catch (e: any) {
                console.error('Error SRI Guía:', e);
                setErrorValidacion(`Guía guardada como BORRADOR, pero falló SRI: ${e.message}`);
                // No cerramos el modal, dejamos que el usuario vea el error.
                // Podría intentar re-enviar desde otra pantalla.
                setGuardando(false);
                return;
            }

            // 4. Actualizar estado si fue autorizado
            if (resSri?.status === 'AUTORIZADO' || resSri?.success) {
                await FacturacionUseCases.actualizarGuia({
                    id: savedGuiaResponse.id,
                    estado: resSri.status || 'AUTORIZADO',
                    numeroAutorizacion: resSri.numeroAutorizacion,
                    fechaAutorizacion: resSri.fechaAutorizacion,
                    claveAcceso: resSri.claveAcceso
                });
                onSave();
                onClose();
            } else {
                setErrorValidacion(`SRI Respondió: ${resSri?.status || 'Error desconocido'}`);
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
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Punto de Emisión y Secuencial</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Plus size={14} className="text-sri-blue" /> Punto de Emisión *
                            </label>
                            <select
                                value={puntoEmisionId}
                                onChange={(e) => setPuntoEmisionId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-bold text-sri-blue"
                            >
                                {puntosEmision.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.sucursalNombre} - {p.codigo.padStart(3, '0')} ({p.sucursalCodigo.padStart(3, '0')})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <AlertCircle size={14} className="text-sri-blue" /> Secuencial Próximo
                            </label>
                            <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-black text-slate-600">
                                {(() => {
                                    const p = puntosEmision.find(p => p.id === puntoEmisionId);
                                    const seq = p?.secuenciales?.find((s: any) => s.tipoComprobante === '06')?.secuencialActual || 1;
                                    return `${p?.sucursalCodigo || '001'}-${p?.codigo || '001'}-${seq.toString().padStart(9, '0')}`;
                                })()}
                            </div>
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
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value as MotivoTraslado)}
                                className="text-sm border border-sri-blue/20 bg-white px-4 py-2 rounded-xl font-bold text-sri-blue outline-none focus:ring-4 focus:ring-sri-blue/10 shadow-sm transition-all"
                            >
                                <option value={MotivoTraslado.VENTA}>Venta de Mercadería</option>
                                <option value={MotivoTraslado.TRASLADO_BODEGAS}>Traslado entre Bodegas</option>
                                <option value={MotivoTraslado.DEVOLUCION}>Devolución de Compra</option>
                                <option value={MotivoTraslado.COMPRA}>Compra de Mercadería</option>
                            </select>
                        </div>
                        <table className="w-full text-xs text-left bg-white rounded-xl overflow-hidden shadow-sm">
                            <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b-2 border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="py-3 px-4">Descripción del Ítem</th>
                                    <th className="py-3 px-4">Unidad</th>
                                    <th className="py-3 px-4 text-right">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {facturaReferencia?.items?.map((item: any, idx: number) => (
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
