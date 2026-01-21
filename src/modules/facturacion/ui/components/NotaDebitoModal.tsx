'use client';

import { useState } from 'react';
import { ArrowUpCircle, Plus, Trash2, FileText, Calendar, Hash } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { formatearDinero } from '@/shared/utils/formatearDinero';
import { SriStandardizer } from '../../domain/services/SriStandardizer';
import { FacturacionUseCases, ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { AMBIENTE, TIPO_EMISION, FORMA_PAGO } from '../../domain/catalogos';

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
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
    const [secuencial, setSecuencial] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [motivos, setMotivos] = useState<MotivoNotaDebito[]>([{ razon: '', valor: 0 }]);
    const [formaPago] = useState(FORMA_PAGO.OTROS_CON_SISTEMA_FINANCIERO);

    const agregarMotivo = () => setMotivos([...motivos, { razon: '', valor: 0 }]);
    const eliminarMotivo = (index: number) => setMotivos(motivos.filter((_, i) => i !== index));
    const actualizarMotivo = (index: number, campo: keyof MotivoNotaDebito, valor: any) => {
        const nuevos = [...motivos];
        nuevos[index] = { ...nuevos[index], [campo]: valor };
        setMotivos(nuevos);
    };

    const subtotal = motivos.reduce((acc, m) => acc + (Number(m.valor) || 0), 0);
    const iva = subtotal * 0.15;
    const total = subtotal + iva;

    const handleEmitirND = async () => {
        if (!currentEmpresa) return;
        if (total === 0 || !secuencial || motivos.some(m => !m.razon || m.valor <= 0)) {
            alert("Complete todos los motivos, valores y el secuencial.");
            return;
        }

        setGuardando(true);
        try {
            const dataND = {
                ambiente: AMBIENTE.PRUEBAS,
                tipoEmision: TIPO_EMISION.NORMAL,
                razonSocial: currentEmpresa.razonSocial,
                nombreComercial: currentEmpresa.nombreComercial,
                ruc: currentEmpresa.ruc,
                estab: '001',
                ptoEmi: '001',
                secuencial: secuencial,
                dirMatriz: currentEmpresa.direccionMatriz,
                fechaEmision,
                obligadoContabilidad: 'SI',
                tipoIdentificacionAdquirente: factura.tipoIdentificacionAdquirente,
                razonSocialAdquirente: factura.razonSocialAdquirente,
                identificacionAdquirente: factura.identificacionAdquirente,
                codDocModificado: '01',
                numDocModificado: factura.secuencial,
                fechaEmisionDocSustento: factura.fechaEmision,
                totalSinImpuestos: subtotal,
                codigoIVA: '4',
                valorIVA: iva,
                valorTotal: total,
                pagos: [{ formaPago, total }],
                motivos: motivos
            };

            const jsonSri = SriStandardizer.standardizeNotaDebito(dataND);

            let sriResult = {
                success: false,
                status: 'BORRADOR',
                numeroAutorizacion: null as string | null,
                claveAcceso: null as string | null
            };

            try {
                const emisionRes = await FacturacionUseCases.emitirFactura(jsonSri);
                sriResult = {
                    success: true,
                    status: emisionRes.status || 'AUTORIZADO',
                    numeroAutorizacion: emisionRes.numeroAutorizacion,
                    claveAcceso: emisionRes.claveAcceso
                };
            } catch (sriError: any) {
                console.error('Error SRI:', sriError);
                sriResult.status = 'ERROR SRI';
            }

            await FacturacionUseCases.registrarComprobante({
                tipoComprobante: 'NOTA_DEBITO',
                fechaEmision,
                clienteId: factura.identificacionAdquirente,
                clienteNombre: factura.razonSocialAdquirente,
                clienteIdentificacion: factura.identificacionAdquirente,
                subtotal: subtotal,
                iva: iva,
                total: total,
                detalles: motivos.map(m => ({ descripcion: m.razon, total: m.valor })),
                secuencial: parseInt(secuencial),
                claveAcceso: sriResult.claveAcceso,
                numeroAutorizacion: sriResult.numeroAutorizacion,
                estado: sriResult.status
            });

            await ContabilidadUseCases.registrarAsiento({
                numero: `AS-ND-${secuencial}`,
                fecha: fechaEmision,
                glosa: `P/R Nota de Débito ${secuencial} s/Factura ${factura.secuencial} - ${factura.razonSocialAdquirente}`,
                tipo: 'INGRESO',
                detalles: [
                    { cuentaCodigo: '1.1.02.01', debe: total, haber: 0 },
                    { cuentaCodigo: '4.1.01.01', debe: 0, haber: subtotal },
                    { cuentaCodigo: '2.1.05.01', debe: 0, haber: iva }
                ]
            });

            if (sriResult.success) {
                alert(`Nota de Débito autorizada: ${sriResult.numeroAutorizacion}`);
            } else {
                alert(`Nota de Débito guardada localmente. Estado: ${sriResult.status}`);
            }

            onSave();
            onClose();
        } catch (error: any) {
            console.error('Error ND:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setGuardando(false);
        }
    };

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <Button onClick={onClose} variant="secondary" disabled={guardando}>
                Cancelar
            </Button>
            <Button
                onClick={handleEmitirND}
                disabled={guardando}
                className="flex items-center gap-2 min-w-[200px] justify-center bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20"
            >
                {guardando ? (
                    'Procesando...'
                ) : (
                    <>
                        <ArrowUpCircle size={18} /> Emitir y Autorizar SRI
                    </>
                )}
            </Button>
        </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Hash size={14} className="text-sri-blue" /> Secuencial ND *
                        </label>
                        <input
                            type="text"
                            value={secuencial}
                            onChange={e => setSecuencial(e.target.value.replace(/\D/g, ''))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sri-blue outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            placeholder="000000001"
                            maxLength={9}
                        />
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
                            <span>IVA (15%):</span>
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
