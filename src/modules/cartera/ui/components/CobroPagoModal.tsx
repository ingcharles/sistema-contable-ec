'use client';

import { useState } from 'react';
import { DollarSign, Calendar, CreditCard, Save } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { DocumentoPendiente, TipoCartera } from '../../domain/types';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { ContabilidadUseCases, ConfiguracionUseCases, CarteraUseCases, BancosUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { TipoMovimientoBancario } from '@/modules/bancos/domain/types';

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
    const [guardando, setGuardando] = useState(false);

    const handleGuardar = async () => {
        if (monto <= 0) return;
        setGuardando(true);

        try {
            await CarteraUseCases.registrarPago({
                documentoId: documento.id,
                fecha,
                formaPago,
                valorEfectivo: monto,
                referencia
            });

            await BancosUseCases.registrarTransaccion({
                cuentaId: 'cta1',
                fecha,
                tipo: esCobro ? TipoMovimientoBancario.TRANSFERENCIA_RECIBIDA : TipoMovimientoBancario.TRANSFERENCIA_ENVIADA,
                referencia: referencia || 'PAGO/COBRO',
                beneficiario: documento.terceroNombre,
                concepto: `${esCobro ? 'Cobro' : 'Pago'} Factura ${documento.nroComprobante}`,
                monto,
                esEgreso: !esCobro
            });

            const params = await ConfiguracionUseCases.obtenerParametros();
            const ctaBanco = params.cuentaCaja || '1.1.01.01';
            const ctaCartera = esCobro ? params.cuentaCxcClientes || '1.1.02.01' : params.cuentaCxpProveedores || '2.1.01.01';

            const detalles = esCobro ? [
                { cuentaCodigo: ctaBanco, debe: monto, haber: 0 },
                { cuentaCodigo: ctaCartera, debe: 0, haber: monto }
            ] : [
                { cuentaCodigo: ctaCartera, debe: monto, haber: 0 },
                { cuentaCodigo: ctaBanco, debe: 0, haber: monto }
            ];

            await ContabilidadUseCases.registrarAsiento({
                numero: `${esCobro ? 'COB' : 'PAG'}-${crypto.randomUUID().slice(0, 8)}`,
                fecha,
                glosa: `${esCobro ? 'Cobro' : 'Pago'} ${documento.terceroNombre} - Fact. ${documento.nroComprobante}`,
                tipo: esCobro ? 'INGRESO' : 'EGRESO',
                detalles
            });

            onSave();
            onClose();
        } catch (error) {
            console.error('Error al procesar transacción:', error);
            alert('Error al procesar la transacción.');
        } finally {
            setGuardando(false);
        }
    };

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={onClose} disabled={guardando}>
                Cancelar
            </Button>
            <Button
                onClick={handleGuardar}
                disabled={guardando || monto <= 0}
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
