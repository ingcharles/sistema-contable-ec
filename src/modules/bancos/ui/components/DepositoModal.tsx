'use client';

import React, { useState } from 'react';
import { ArrowRightLeft, Save, Calendar, Hash, DollarSign } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { CuentaBancaria, TipoMovimientoBancario } from '../../domain/types';
import { BancosUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';

interface Props {
    cuentas: CuentaBancaria[];
    onClose: () => void;
    onSave: () => void;
}

export const DepositoModal: React.FC<Props> = ({ cuentas, onClose, onSave }) => {
    const [cuentaId, setCuentaId] = useState(cuentas[0]?.id || '');
    const [monto, setMonto] = useState(0);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [referencia, setReferencia] = useState('');
    const [guardando, setGuardando] = useState(false);

    const handleGuardar = async () => {
        if (!cuentaId || monto <= 0) return;
        setGuardando(true);
        try {
            await BancosUseCases.registrarTransaccion({
                cuentaId,
                fecha,
                tipo: TipoMovimientoBancario.DEPOSITO,
                referencia,
                beneficiario: 'EMPRESA (CAJA CENTRAL)',
                concepto: 'Depósito de ventas en efectivo',
                monto,
                esEgreso: false
            });
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al registrar el depósito');
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
                disabled={monto <= 0 || guardando}
                className="flex items-center gap-2 min-w-[160px] justify-center"
            >
                {guardando ? (
                    'Registrando...'
                ) : (
                    <>
                        <Save size={18} /> Registrar Depósito
                    </>
                )}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Depositar Efectivo"
            description="Registre el depósito de valores desde Caja a una cuenta bancaria."
            icon={<ArrowRightLeft size={24} />}
            footer={footer}
            size="md"
        >
            <div className="space-y-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cuenta Bancaria de Destino *</label>
                    <select
                        value={cuentaId}
                        onChange={e => setCuentaId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium"
                    >
                        {cuentas.map(c => <option key={c.id} value={c.id}>{c.banco} - {c.numeroCuenta}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign size={14} className="text-sri-blue" /> Monto ($) *
                        </label>
                        <input
                            type="number"
                            value={monto}
                            onChange={e => setMonto(parseFloat(e.target.value))}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-black text-right text-sri-blue text-lg"
                            step="0.01"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={14} className="text-sri-blue" /> Fecha
                        </label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={e => setFecha(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Hash size={14} className="text-sri-blue" /> Referencia / Papeleta
                    </label>
                    <input
                        type="text"
                        value={referencia}
                        onChange={e => setReferencia(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                        placeholder="Nro de comprobante bancario"
                    />
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
                        <ArrowRightLeft size={18} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-amber-800 uppercase tracking-tight">Movimiento Automático</p>
                        <p className="text-[10px] text-amber-700 font-medium">Esta acción generará una transferencia interna de CAJA ➔ BANCO en la contabilidad.</p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
