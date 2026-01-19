'use client';

import React, { useState } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { CuentaBancaria, TipoMovimientoBancario } from '../../domain/types';
import { InMemoryBancosRepository } from '../../infrastructure/BancosRepository';
import { Button } from '@/shared/ui/Button';

interface Props {
    cuentas: CuentaBancaria[];
    empresaId: string;
    onClose: () => void;
    onSave: () => void;
}

export const NuevaTransaccionModal: React.FC<Props> = ({ cuentas, empresaId: _empresaId, onClose, onSave }) => {
    const [cuentaId, setCuentaId] = useState(cuentas[0]?.id || '');
    const [tipo, setTipo] = useState<TipoMovimientoBancario>(TipoMovimientoBancario.TRANSFERENCIA_ENVIADA);
    const [monto, setMonto] = useState(0);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [beneficiario, setBeneficiario] = useState('');
    const [concepto, setConcepto] = useState('');
    const [referencia, setReferencia] = useState('');

    const handleGuardar = async () => {
        if (!cuentaId || monto <= 0) return;
        const repo = new InMemoryBancosRepository();
        const esEgreso = [TipoMovimientoBancario.TRANSFERENCIA_ENVIADA, TipoMovimientoBancario.CHEQUE, TipoMovimientoBancario.NOTA_DEBITO].includes(tipo);

        await repo.saveMovimiento({
            id: Math.random().toString(36),
            cuentaId,
            fecha,
            tipo,
            referencia,
            beneficiario,
            concepto,
            monto,
            esEgreso,
            conciliado: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user'
        });
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Plus className="text-sri-blue" /> Nueva Transacción
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Cuenta Bancaria</label>
                        <select value={cuentaId} onChange={e => setCuentaId(e.target.value)} className="w-full border rounded p-2 text-sm">
                            {cuentas.map(c => <option key={c.id} value={c.id}>{c.banco} - {c.numeroCuenta}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tipo de Movimiento</label>
                        <select value={tipo} onChange={e => setTipo(e.target.value as TipoMovimientoBancario)} className="w-full border rounded p-2 text-sm">
                            {Object.values(TipoMovimientoBancario).map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
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
                        <label className="block text-xs font-bold text-slate-500 mb-1">Beneficiario / Girado a</label>
                        <input type="text" value={beneficiario} onChange={e => setBeneficiario(e.target.value)} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Concepto / Glosa</label>
                        <textarea value={concepto} onChange={e => setConcepto(e.target.value)} className="w-full border rounded p-2 text-sm h-20" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Referencia (Nro Cheque/Transf)</label>
                        <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} className="w-full border rounded p-2 text-sm" />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleGuardar} disabled={monto <= 0} className="flex items-center gap-2">
                        <Save size={18} /> Guardar Transacción
                    </Button>
                </div>
            </div>
        </div>
    );
};
