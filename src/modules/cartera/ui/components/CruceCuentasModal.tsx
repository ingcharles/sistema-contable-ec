'use client';

import React, { useState } from 'react';
import { ArrowRightLeft, Calendar, FileText, DollarSign, Wallet } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { DocumentoPendiente, Anticipo, TipoCartera } from '../../domain/types';
import { ContabilidadUseCases, ConfiguracionUseCases, CarteraUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { ModalFooter } from '@/shared/ui/ModalFooter';

interface Props {
    documento: DocumentoPendiente;
    anticipos: Anticipo[];
    onClose: () => void;
    onSave: () => void;
}

export const CruceCuentasModal: React.FC<Props> = ({ documento, anticipos, onClose, onSave }) => {
    const [selectedAnticipoId, setSelectedAnticipoId] = useState('');
    const [valorCruce, setValorCruce] = useState(0);
    const [fecha] = useState(new Date().toISOString().split('T')[0]);

    const anticipoSeleccionado = anticipos.find(a => a.id === selectedAnticipoId);
    const maxCruce = anticipoSeleccionado ? Math.min(anticipoSeleccionado.saldoDisponible, documento.saldoPendiente) : 0;

    const [guardando, setGuardando] = useState(false);

    const handleCruce = async () => {
        if (!anticipoSeleccionado || valorCruce <= 0 || valorCruce > maxCruce) return;

        setGuardando(true);
        try {
            const params = await ConfiguracionUseCases.obtenerParametros();
            await CarteraUseCases.registrarPago({
                documentoId: documento.id,
                anticipoId: anticipoSeleccionado.id,
                fecha,
                valorEfectivo: 0,
                valorRetencion: 0,
                valorCruce,
                formaPago: 'CRUCE_ANTICIPO'
            });

            const esCxC = documento.tipo === TipoCartera.CXC;
            const ctaCxC = params.cuentaCxcClientes || '1.1.02.01';
            const ctaCxP = params.cuentaCxpProveedores || '2.1.01.01';
            const ctaAntCli = params.cuentaAnticipoClientes || '2.1.04.01';
            const ctaAntProv = params.cuentaAnticipoProveedores || '1.1.04.01';

            const detalles = esCxC ? [
                { cuentaCodigo: ctaAntCli, debe: valorCruce, haber: 0 },
                { cuentaCodigo: ctaCxC, debe: 0, haber: valorCruce }
            ] : [
                { cuentaCodigo: ctaCxP, debe: valorCruce, haber: 0 },
                { cuentaCodigo: ctaAntProv, debe: 0, haber: valorCruce }
            ];

            await ContabilidadUseCases.registrarAsiento({
                numero: `CRU-${crypto.randomUUID().slice(0, 8)}`,
                fecha,
                glosa: `Cruce Fac/${documento.nroComprobante} con Anticipo ${anticipoSeleccionado.referencia}`,
                tipo: 'DIARIO',
                detalles
            });

            onSave();
            onClose();
        } catch (error) {
            console.error('Error al procesar cruce:', error);
            alert('Error al procesar el cruce de cuentas.');
        } finally {
            setGuardando(false);
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleCruce}
            isLoading={guardando}
            isDisabled={!selectedAnticipoId || valorCruce <= 0}
            submitLabel="Procesar Cruce"
            submitIcon={<ArrowRightLeft size={18} />}
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Cruce de Cuentas"
            description="Liquide facturas pendientes utilizando saldos de anticipos existentes."
            icon={<ArrowRightLeft size={24} />}
            footer={footer}
            size="md"
        >
            <div className="space-y-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner flex justify-between items-center transition-all">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Pendiente Doc.</span>
                        <div className="text-xl font-black text-slate-800">{formatMoney(documento.saldoPendiente)}</div>
                        <div className="text-[10px] font-bold text-sri-blue flex items-center gap-1 uppercase">
                            <FileText size={10} /> {documento.nroComprobante}
                        </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                        <Wallet size={24} className="text-sri-blue" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={14} className="text-sri-blue" /> Seleccionar Anticipo Disponible *
                    </label>
                    <select
                        value={selectedAnticipoId}
                        onChange={e => {
                            setSelectedAnticipoId(e.target.value);
                            const ant = anticipos.find(a => a.id === e.target.value);
                            if (ant) setValorCruce(Math.min(ant.saldoDisponible, documento.saldoPendiente));
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-medium text-xs"
                    >
                        <option value="">-- Seleccione un anticipo --</option>
                        {anticipos.map(a => (
                            <option key={a.id} value={a.id}>
                                {a.fecha} | {a.referencia} | Disponible: {formatMoney(a.saldoDisponible)}
                            </option>
                        ))}
                    </select>
                </div>

                {anticipoSeleccionado && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <DollarSign size={14} className="text-sri-blue" /> Valor a Cruzar *
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">$</span>
                                <input
                                    type="number"
                                    value={valorCruce}
                                    onChange={e => setValorCruce(parseFloat(e.target.value))}
                                    max={maxCruce}
                                    className="w-full pl-8 pr-4 py-3 text-2xl font-black text-sri-blue bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-sri-blue/10 outline-none transition-all"
                                    step="0.01"
                                />
                            </div>
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-bold text-slate-400 italic">Máximo a cruzar: {formatMoney(maxCruce)}</span>
                                <button
                                    onClick={() => setValorCruce(maxCruce)}
                                    className="text-[9px] font-black text-sri-blue uppercase hover:underline"
                                >
                                    Usar todo el saldo
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                                <ArrowRightLeft size={18} />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-tight">Efecto en Contabilidad</p>
                                <p className="text-[10px] text-emerald-700 font-medium">Se cruzará el pasivo (Anticipo) con el activo (CxC) o viceversa, sin movimiento de efectivo.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
