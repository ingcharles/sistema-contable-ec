import { useState, useEffect } from 'react';
import { DollarSign, Calendar, CreditCard, Save, Landmark } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { DocumentoPendiente, TipoCartera } from '../../domain/types';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { CarteraUseCases, BancosUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { generateReceiptPDF } from '@/shared/utils/pdfGenerator';
import { CheckCircle2, Download } from 'lucide-react';

interface CobroPagoModalProps {
    documento: DocumentoPendiente;
    tipo: TipoCartera;
    onClose: () => void;
    onSave: () => void;
}

export const CobroPagoModal = ({ documento, tipo, onClose, onSave }: CobroPagoModalProps) => {
    const esCobro = tipo === TipoCartera.CXC;
    const [monto, setMonto] = useState(documento.saldoPendiente);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [formaPago, setFormaPago] = useState('TRANSFERENCIA');
    const [referencia, setReferencia] = useState('');
    const [cuentaBancoId, setCuentaBancoId] = useState('');
    const [cuentasBancarias, setCuentasBancarias] = useState<any[]>([]);
    const [guardando, setGuardando] = useState(false);
    const [exito, setExito] = useState(false);
    const [transactionData, setTransactionData] = useState<any>(null);
    const { currentEmpresa } = useEmpresa();

    useEffect(() => {
        const cargarCuentas = async () => {
            try {
                const data = await BancosUseCases.listarCuentas();
                setCuentasBancarias(data);
                if (data.length > 0) setCuentaBancoId(data[0].id);
            } catch (error) {
                console.error('Error cargando cuentas bancarias:', error);
            }
        };
        cargarCuentas();
    }, []);

    const handleGuardar = async () => {
        if (monto <= 0 || !cuentaBancoId) {
            alert('Debe ingresar un monto válido y seleccionar una cuenta.');
            return;
        }
        setGuardando(true);

        try {
            const response = await CarteraUseCases.registrarPago({
                documentoId: documento.id,
                fecha,
                formaPago,
                valorEfectivo: monto,
                referencia,
                cuentaBancoId
            });

            setTransactionData(response);
            setExito(true);
            onSave();
        } catch (error: any) {
            console.error('Error al procesar transacción:', error);
            alert(error.message || 'Error al procesar la transacción.');
        } finally {
            setGuardando(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!currentEmpresa) return;

        generateReceiptPDF({
            tipo: esCobro ? 'INGRESO' : 'EGRESO',
            numero: transactionData?.asientoNumero || `REC-${Date.now().toString().slice(-6)}`,
            fecha,
            beneficiario: documento.terceroNombre,
            monto,
            concepto: `${esCobro ? 'Cobro' : 'Pago'} de Factura ${documento.nroComprobante}`,
            referencia,
            empresa: {
                nombre: currentEmpresa.razonSocial,
                ruc: currentEmpresa.ruc,
                direccion: currentEmpresa.direccionMatriz
            }
        });
    };

    if (exito) {
        return (
            <Modal
                isOpen={true}
                onClose={onClose}
                title="Transacción Exitosa"
                icon={<CheckCircle2 size={24} className="text-white" />}
                footer={
                    <div className="flex gap-3 w-full justify-end">
                        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
                        <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
                            <Download size={18} /> Descargar Comprobante
                        </Button>
                    </div>
                }
            >
                <div className="text-center space-y-4 py-8">
                    <div className="inline-flex p-4 bg-emerald-50 rounded-full text-emerald-600 mb-4">
                        <CheckCircle2 size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">¡Registro Completado!</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">
                        Se ha registrado el {esCobro ? 'cobro' : 'pago'} de <strong>{formatMoney(monto)}</strong> y se ha generado el asiento contable correspondiente.
                    </p>
                </div>
            </Modal>
        );
    }

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={onClose} disabled={guardando}>
                Cancelar
            </Button>
            <Button
                onClick={handleGuardar}
                disabled={guardando || monto <= 0 || !cuentaBancoId}
                className="flex items-center gap-2 min-w-[180px] justify-center"
            >
                {guardando ? (
                    'Procesando...'
                ) : (
                    <>
                        <Save size={18} /> Confirmar {esCobro ? 'Cobro' : 'Pago'}
                    </>
                )}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={esCobro ? 'Registrar Cobro' : 'Registrar Pago'}
            description={`${documento.terceroNombre} - Comprobante: ${documento.nroComprobante}`}
            icon={<DollarSign size={24} />}
            footer={footer}
            size="md"
        >
            <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex justify-between items-center shadow-inner">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Pendiente</span>
                        <div className="text-2xl font-black text-slate-800">{formatMoney(documento.saldoPendiente)}</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                        <DollarSign size={24} className="text-sri-blue" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                        Monto a {esCobro ? 'Cobrar' : 'Pagar'} *
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">$</span>
                        <input
                            type="number"
                            value={monto}
                            onChange={(e) => setMonto(Number(e.target.value))}
                            className="w-full pl-8 pr-4 py-3 text-2xl font-black text-sri-blue bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-sri-blue/10 outline-none transition-all"
                            max={documento.saldoPendiente}
                            step="0.01"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Calendar size={14} className="text-sri-blue" /> Fecha
                        </label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sri-blue/20 outline-none transition-all font-medium"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                            <CreditCard size={14} className="text-sri-blue" /> Forma de Pago
                        </label>
                        <select
                            value={formaPago}
                            onChange={(e) => setFormaPago(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sri-blue/20 outline-none appearance-none transition-all font-medium"
                        >
                            <option value="EFECTIVO">Efectivo (Caja)</option>
                            <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                            <option value="CHEQUE">Cheque</option>
                            <option value="TARJETA">Tarjeta Crédito/Débito</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                        <Landmark size={14} className="text-sri-blue" /> Cuenta Origen/Destino *
                    </label>
                    <select
                        value={cuentaBancoId}
                        onChange={(e) => setCuentaBancoId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sri-blue/20 outline-none appearance-none transition-all font-medium"
                    >
                        <option value="">Seleccione una cuenta...</option>
                        {cuentasBancarias.map((cta) => (
                            <option key={cta.id} value={cta.id}>
                                {cta.banco} - {cta.nombre} ({formatMoney(cta.saldo_actual)})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Referencia / Observaciones</label>
                    <input
                        type="text"
                        value={referencia}
                        onChange={(e) => setReferencia(e.target.value)}
                        placeholder="Ej: Transferencia #123456 o Banco Pichincha"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sri-blue/20 outline-none transition-all"
                    />
                </div>
            </div>
        </Modal>
    );
};
