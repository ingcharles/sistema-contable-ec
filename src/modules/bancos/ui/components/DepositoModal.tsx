'use client';

import React, { useState } from 'react';
import { X, ArrowRightLeft, Save } from 'lucide-react';
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ArrowRightLeft className="text-emerald-600" /> Depositar Efectivo
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Cuenta Destino</label>
                        <select value={cuentaId} onChange={e => setCuentaId(e.target.value)} className="w-full border rounded p-2 text-sm">
                            {cuentas.map(c => <option key={c.id} value={c.id}>{c.banco} - {c.numeroCuenta}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Monto ($)</label>
                            <input type="number" value={monto} onChange={e => setMonto(parseFloat(e.target.value))} className="w-full border rounded p-2 text-sm text-right font-bold" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha</label>
                            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full border rounded p-2 text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Referencia / Papeleta</label>
                        <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Nro de comprobante" />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={guardando}>Cancelar</Button>
                    <Button onClick={handleGuardar} disabled={monto <= 0 || guardando} className="flex items-center gap-2">
                        <Save size={18} /> {guardando ? 'Guardando...' : 'Registrar Depósito'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
