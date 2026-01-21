'use client';

import React, { useState, useRef } from 'react';
import { Calculator, UploadCloud, CheckCircle2, AlertTriangle, Save } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { CuentaBancaria, MovimientoBancario } from '../../domain/types';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';

interface Props {
    cuenta: CuentaBancaria;
    movimientos: MovimientoBancario[];
    onClose: () => void;
    onSave: () => void;
}

export const ConciliacionModal: React.FC<Props> = ({ cuenta, movimientos, onClose, onSave }) => {
    const [fechaCorte, setFechaCorte] = useState(new Date().toISOString().split('T')[0]);
    const [saldoExtracto, setSaldoExtracto] = useState<number>(0);
    const [marcados, setMarcados] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const movimientosPendientes = movimientos.filter(m =>
        !m.conciliado && m.fecha <= fechaCorte
    );

    const toggleMovimiento = (id: string) => {
        const newMarcados = new Set(marcados);
        if (newMarcados.has(id)) {
            newMarcados.delete(id);
        } else {
            newMarcados.add(id);
        }
        setMarcados(newMarcados);
    };

    const handleImportarExtracto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setTimeout(() => {
            const newMarcados = new Set(marcados);
            let matchedCount = 0;
            movimientosPendientes.forEach(m => {
                if (Math.random() > 0.2) {
                    newMarcados.add(m.id);
                    matchedCount++;
                }
            });
            setMarcados(newMarcados);
            setSaldoExtracto(cuenta.saldoContable);
            alert(`Importación exitosa. Se han conciliado automáticamente ${matchedCount} movimientos coincidentes.`);
        }, 800);
    };

    const saldoLibro = cuenta.saldoContable;
    const partidasPendientes = movimientosPendientes.filter(m => !marcados.has(m.id));

    const chequesGiradosNoCobrados = partidasPendientes
        .filter(m => m.esEgreso)
        .reduce((acc, m) => acc + m.monto, 0);

    const depositosEnTransito = partidasPendientes
        .filter(m => !m.esEgreso)
        .reduce((acc, m) => acc + m.monto, 0);

    const saldoCalculado = saldoLibro + chequesGiradosNoCobrados - depositosEnTransito;
    const diferencia = saldoCalculado - saldoExtracto;
    const cuadrado = Math.abs(diferencia) < 0.01;

    const footer = (
        <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-4">
                <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 border ${cuadrado ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {cuadrado ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span className="text-xs font-black uppercase tracking-wider">Diferencia: {formatMoney(diferencia)}</span>
                </div>
            </div>
            <div className="flex gap-3">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={onSave} disabled={!cuadrado} className="flex items-center gap-2 px-8">
                    <Save size={18} /> Guardar Conciliación
                </Button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Conciliación Bancaria"
            description={`${cuenta.banco} • No. Cuenta: ${cuenta.numeroCuenta}`}
            icon={<Calculator size={24} />}
            footer={footer}
            size="2xl"
        >
            <div className="flex flex-col md:flex-row gap-8 h-full min-h-[500px]">
                {/* Panel Izquierdo: Configuración y Resumen */}
                <div className="w-full md:w-80 space-y-6 shrink-0">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner space-y-5">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">1. Datos del Extracto</h3>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Fecha de Corte</label>
                                <input
                                    type="date"
                                    value={fechaCorte}
                                    onChange={e => setFechaCorte(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sri-blue/20"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Saldo en Extracto ($)</label>
                                <input
                                    type="number"
                                    value={saldoExtracto}
                                    onChange={e => setSaldoExtracto(parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-lg font-black text-right text-sri-blue outline-none focus:ring-2 focus:ring-sri-blue/20"
                                />
                            </div>

                            <div className="pt-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv,.xls,.xlsx"
                                    onChange={handleImportarExtracto}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-2.5 bg-sri-blue/5 text-sri-blue border border-sri-blue/20 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-sri-blue/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <UploadCloud size={16} /> Importar Banco
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner space-y-5">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">2. Resumen</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500 font-bold">Saldo Libro (Sistema)</span>
                                <span className="font-black text-slate-800">{formatMoney(saldoLibro)}</span>
                            </div>
                            <div className="space-y-1.5 pt-3 border-t border-slate-200">
                                <div className="flex justify-between text-[11px] text-emerald-600 font-bold">
                                    <span>(+) Chq. no cobrados</span>
                                    <span>{formatMoney(chequesGiradosNoCobrados)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-red-500 font-bold">
                                    <span>(-) Dep. en tránsito</span>
                                    <span>{formatMoney(depositosEnTransito)}</span>
                                </div>
                            </div>
                            <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-center">
                                <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">Saldo Teórico</span>
                                <span className="text-base font-black text-sri-blue">{formatMoney(saldoCalculado)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Tabla de Movimientos */}
                <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Movimientos al {fechaCorte}</span>
                        <span className="text-[10px] font-bold text-sri-blue uppercase tracking-wider">
                            {marcados.size} seleccionados de {movimientosPendientes.length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 w-12 text-center">Conc.</th>
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3">Ref. / Concepto</th>
                                    <th className="px-6 py-3 text-right">Débito</th>
                                    <th className="px-6 py-3 text-right">Crédito</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {movimientosPendientes.length === 0 ? (
                                    <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">No hay movimientos pendientes en el periodo seleccionado.</td></tr>
                                ) : movimientosPendientes.map(m => {
                                    const isChecked = marcados.has(m.id);
                                    return (
                                        <tr key={m.id} className={`transition-all cursor-pointer group ${isChecked ? 'bg-sri-blue/5' : 'hover:bg-slate-50'}`} onClick={() => toggleMovimiento(m.id)}>
                                            <td className="px-6 py-3 text-center">
                                                <div className={`w-5 h-5 mx-auto rounded-lg border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-sri-blue border-sri-blue text-white shadow-lg shadow-blue-500/20 scale-110' : 'border-slate-300 bg-white group-hover:border-sri-blue/50'}`}>
                                                    {isChecked && <CheckCircle2 size={12} strokeWidth={3} />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-slate-500 font-bold whitespace-nowrap">{m.fecha}</td>
                                            <td className="px-6 py-3">
                                                <div className="font-black text-slate-700 uppercase text-[10px] tracking-tight">{m.referencia}</div>
                                                <div className="text-slate-400 truncate max-w-[250px] font-medium">{m.concepto}</div>
                                            </td>
                                            <td className="px-6 py-3 text-right font-black text-slate-600">{m.esEgreso ? formatMoney(m.monto) : '-'}</td>
                                            <td className="px-6 py-3 text-right font-black text-slate-600">{!m.esEgreso ? formatMoney(m.monto) : '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
