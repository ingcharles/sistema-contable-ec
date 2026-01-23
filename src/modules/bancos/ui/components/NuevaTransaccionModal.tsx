'use client';

import React, { useState } from 'react';
import { Save, Plus, Calendar, User, FileText, Hash, DollarSign } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { CuentaBancaria, TipoMovimientoBancario } from '../../domain/types';
import { useBancosMutations } from '../../hooks/useBancos';
import { Button } from '@/shared/ui/Button';

interface Props {
    cuentas: CuentaBancaria[];
    onClose: () => void;
    onSave: () => void;
}

export const NuevaTransaccionModal: React.FC<Props> = ({ cuentas, onClose, onSave }) => {
    const [cuentaId, setCuentaId] = useState(cuentas[0]?.id || '');
    const [tipo, setTipo] = useState<TipoMovimientoBancario>(TipoMovimientoBancario.TRANSFERENCIA_ENVIADA);
    const [monto, setMonto] = useState(0);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [beneficiario, setBeneficiario] = useState('');
    const [concepto, setConcepto] = useState('');
    const [referencia, setReferencia] = useState('');

    const { registrarTransaccion, guardando } = useBancosMutations();

    const handleGuardar = async () => {
        if (!cuentaId || monto <= 0) return;

        const esEgreso = [TipoMovimientoBancario.TRANSFERENCIA_ENVIADA, TipoMovimientoBancario.CHEQUE, TipoMovimientoBancario.NOTA_DEBITO].includes(tipo);

        try {
            await registrarTransaccion({
                cuentaId,
                fecha,
                tipo,
                referencia,
                beneficiario,
                concepto,
                monto,
                esEgreso
            });
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            // El hook ya maneja el error en consola, pero podemos mostrar un alert si deseamos, 
            // aunque idealmente deberíamos usar un sistema de notificaciones.
            // Por ahora mantenemos la alerta simple o dejamos que la UI reaccione al error del hook si lo expusiéramos.
            alert('Error al registrar la transacción');
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
                        <Save size={18} /> Guardar Transacción
                    </>
                )}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Nueva Transacción"
            description="Registre un movimiento bancario manual (cheque, transferencia, nota de débito/crédito)."
            icon={<Plus size={24} />}
            footer={footer}
            size="md"
        >
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cuenta Bancaria *</label>
                        <select
                            value={cuentaId}
                            onChange={e => setCuentaId(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-xs"
                        >
                            {cuentas.map(c => <option key={c.id} value={c.id}>{c.banco} - {c.numeroCuenta}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Movimiento *</label>
                        <select
                            value={tipo}
                            onChange={e => setTipo(e.target.value as TipoMovimientoBancario)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-xs"
                        >
                            {Object.values(TipoMovimientoBancario).map(t => (
                                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
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
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-xs"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <User size={14} className="text-sri-blue" /> Beneficiario / Girado a
                    </label>
                    <input
                        type="text"
                        value={beneficiario}
                        onChange={e => setBeneficiario(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all text-sm"
                        placeholder="Nombre de la persona o empresa"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={14} className="text-sri-blue" /> Concepto / Glosa
                    </label>
                    <textarea
                        value={concepto}
                        onChange={e => setConcepto(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all text-sm h-24 resize-none"
                        placeholder="Descripción detallada del movimiento"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Hash size={14} className="text-sri-blue" /> Referencia (Nro. Cheque o Comprobante)
                    </label>
                    <input
                        type="text"
                        value={referencia}
                        onChange={e => setReferencia(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all text-sm"
                        placeholder="Ej: 000123"
                    />
                </div>
            </div>
        </Modal>
    );
};
