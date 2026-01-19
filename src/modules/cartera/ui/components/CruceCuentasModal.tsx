'use client';

import React, { useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { DocumentoPendiente, Anticipo, TipoCartera } from '../../domain/types';
import { InMemoryCarteraRepository } from '../../infrastructure/CarteraRepository';
import { InMemoryContabilidadRepository } from '@/modules/contabilidad/infrastructure/ContabilidadRepository';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';

interface Props {
    documento: DocumentoPendiente;
    anticipos: Anticipo[];
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const CruceCuentasModal: React.FC<Props> = ({ documento, anticipos, onClose, onSave, empresaId }) => {
    const [selectedAnticipoId, setSelectedAnticipoId] = useState('');
    const [valorCruce, setValorCruce] = useState(0);
    const [fecha] = useState(new Date().toISOString().split('T')[0]);

    const anticipoSeleccionado = anticipos.find(a => a.id === selectedAnticipoId);
    const maxCruce = anticipoSeleccionado ? Math.min(anticipoSeleccionado.saldoDisponible, documento.saldoPendiente) : 0;

    const handleCruce = async () => {
        if (!anticipoSeleccionado || valorCruce <= 0 || valorCruce > maxCruce) return;

        const repoCartera = new InMemoryCarteraRepository();
        await repoCartera.savePago({
            documentoId: documento.id,
            anticipoId: anticipoSeleccionado.id,
            fecha,
            valorEfectivo: 0,
            valorRetencion: 0,
            valorCruce,
            formaPago: 'CRUCE_ANTICIPO',
            referencia: `Cruce con Ant. ${anticipoSeleccionado.referencia}`
        });

        const esCxC = documento.tipo === TipoCartera.CXC;
        const ctaCxC = '1.1.02.01';
        const ctaCxP = '2.1.01.01';
        const ctaAntCli = '2.1.01.05';
        const ctaAntProv = '1.1.02.05';

        const detalles = esCxC ? [
            { cuentaCodigo: ctaAntCli, cuentaNombre: 'ANTICIPO DE CLIENTES', debe: valorCruce, haber: 0 },
            { cuentaCodigo: ctaCxC, cuentaNombre: 'CUENTAS POR COBRAR CLIENTES', debe: 0, haber: valorCruce }
        ] : [
            { cuentaCodigo: ctaCxP, cuentaNombre: 'CUENTAS POR PAGAR PROVEEDORES', debe: valorCruce, haber: 0 },
            { cuentaCodigo: ctaAntProv, cuentaNombre: 'ANTICIPO A PROVEEDORES', debe: 0, haber: valorCruce }
        ];

        const repoCont = new InMemoryContabilidadRepository();
        await repoCont.saveAsiento({
            id: Math.random().toString(36),
            empresaId,
            numero: `CRU-${Math.floor(Math.random() * 1000)}`,
            fecha,
            glosa: `Cruce Fac/${documento.nroComprobante} con Anticipo ${anticipoSeleccionado.referencia}`,
            tipo: 'DIARIO',
            estado: 'MAYORIZADO',
            totalDebe: valorCruce,
            totalHaber: valorCruce,
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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ArrowRightLeft className="text-sri-blue" /> Cruce de Cuentas
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-slate-50 p-3 rounded text-sm mb-4 border border-slate-200">
                        <p><strong>Documento:</strong> {documento.nroComprobante}</p>
                        <p><strong>Saldo Pendiente:</strong> {formatMoney(documento.saldoPendiente)}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Seleccionar Anticipo Disponible</label>
                        <select
                            value={selectedAnticipoId}
                            onChange={e => {
                                setSelectedAnticipoId(e.target.value);
                                const ant = anticipos.find(a => a.id === e.target.value);
                                if (ant) setValorCruce(Math.min(ant.saldoDisponible, documento.saldoPendiente));
                            }}
                            className="w-full border rounded p-2 text-sm"
                        >
                            <option value="">-- Seleccione --</option>
                            {anticipos.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.fecha} - Ref: {a.referencia} - Disp: {formatMoney(a.saldoDisponible)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {anticipoSeleccionado && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Valor a Cruzar</label>
                            <input
                                type="number"
                                value={valorCruce}
                                onChange={e => setValorCruce(parseFloat(e.target.value))}
                                max={maxCruce}
                                className="w-full border rounded p-2 text-sm text-right font-bold"
                            />
                            <p className="text-xs text-slate-400 mt-1 text-right">Máximo posible: {formatMoney(maxCruce)}</p>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleCruce} disabled={!selectedAnticipoId || valorCruce <= 0} className="flex items-center gap-2 disabled:opacity-50">
                        <ArrowRightLeft size={18} /> Procesar Cruce
                    </Button>
                </div>
            </div>
        </div>
    );
};
