'use client';

import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { TipoCartera, Anticipo } from '../../domain/types';
import { InMemoryCarteraRepository } from '../../infrastructure/CarteraRepository';
import { InMemoryContabilidadRepository } from '@/modules/contabilidad/infrastructure/ContabilidadRepository';
import { InMemoryBancosRepository } from '@/modules/bancos/infrastructure/BancosRepository';
import { TipoMovimientoBancario } from '@/modules/bancos/domain/types';
import { Button } from '@/shared/ui/Button';

interface Props {
    tipo: TipoCartera;
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const RegistroAnticipoModal: React.FC<Props> = ({ tipo, onClose, onSave, empresaId }) => {
    const esCliente = tipo === TipoCartera.CXC;
    const [terceroId, setTerceroId] = useState('');
    const [terceroNombre, setTerceroNombre] = useState('');
    const [monto, setMonto] = useState(0);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [referencia, setReferencia] = useState('');
    const [bancoId] = useState('cta1');

    const handleGuardar = async () => {
        if (!terceroId || monto <= 0) return;

        const anticipo: Anticipo = {
            id: Math.random().toString(36),
            empresaId,
            tipo,
            terceroId,
            terceroNombre,
            fecha,
            referencia,
            montoOriginal: monto,
            montoUsado: 0,
            saldoDisponible: monto,
            estado: 'DISPONIBLE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user'
        };

        const repoCartera = new InMemoryCarteraRepository();
        await repoCartera.saveAnticipo(anticipo);

        const repoBancos = new InMemoryBancosRepository();
        await repoBancos.saveMovimiento({
            id: Math.random().toString(36),
            cuentaId: bancoId,
            fecha,
            tipo: esCliente ? TipoMovimientoBancario.TRANSFERENCIA_RECIBIDA : TipoMovimientoBancario.TRANSFERENCIA_ENVIADA,
            referencia: referencia || 'ANTICIPO',
            beneficiario: terceroNombre,
            concepto: `Anticipo ${esCliente ? 'de Cliente' : 'a Proveedor'} - ${referencia}`,
            monto,
            esEgreso: !esCliente,
            conciliado: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user'
        });

        const repoCont = new InMemoryContabilidadRepository();
        const ctaBanco = '1.1.01.02';
        const ctaAnticipo = esCliente ? '2.1.01.05' : '1.1.02.05';

        const detalles = esCliente ? [
            { cuentaCodigo: ctaBanco, cuentaNombre: 'BANCOS', debe: monto, haber: 0 },
            { cuentaCodigo: ctaAnticipo, cuentaNombre: 'ANTICIPO DE CLIENTES', debe: 0, haber: monto }
        ] : [
            { cuentaCodigo: ctaAnticipo, cuentaNombre: 'ANTICIPO A PROVEEDORES', debe: monto, haber: 0 },
            { cuentaCodigo: ctaBanco, cuentaNombre: 'BANCOS', debe: 0, haber: monto }
        ];

        await repoCont.saveAsiento({
            id: Math.random().toString(36),
            empresaId,
            numero: `ANT-${Math.floor(Math.random() * 1000)}`,
            fecha,
            glosa: `Reg. Anticipo ${esCliente ? 'Cliente' : 'Proveedor'} ${terceroNombre}`,
            tipo: esCliente ? 'INGRESO' : 'EGRESO',
            estado: 'MAYORIZADO',
            totalDebe: monto,
            totalHaber: monto,
            detalles,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        });

        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800">Registrar Anticipo</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800">
                        Este proceso registra un movimiento de dinero (Banco) sin asociarlo a una factura. Se creará un saldo a favor para cruzarlo posteriormente.
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">RUC / Identificación</label>
                        <input type="text" value={terceroId} onChange={e => setTerceroId(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Ej: 179..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nombre {esCliente ? 'Cliente' : 'Proveedor'}</label>
                        <input type="text" value={terceroNombre} onChange={e => setTerceroNombre(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Razón Social" />
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
                        <label className="block text-xs font-bold text-slate-500 mb-1">Referencia</label>
                        <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Nro Transferencia / Cheque" />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleGuardar} disabled={monto <= 0} className="flex items-center gap-2">
                        <Save size={18} /> Guardar Anticipo
                    </Button>
                </div>
            </div>
        </div>
    );
};
