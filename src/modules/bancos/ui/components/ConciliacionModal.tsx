'use client';

import React, { useState, useRef } from 'react';
import { X, Calculator, UploadCloud, CheckCircle2, AlertTriangle, Save } from 'lucide-react';
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Calculator className="text-sri-blue" /> Conciliación Bancaria
                        </h2>
                        <p className="text-sm text-slate-500">
                            {cuenta.banco} • {cuenta.numeroCuenta}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    <div className="w-full md:w-1/3 p-6 bg-slate-50 border-r border-slate-200 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">1. Datos del Extracto</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Fecha de Corte</label>
                                        <input type="date" value={fechaCorte} onChange={e => setFechaCorte(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Saldo Final del Estado de Cuenta ($)</label>
                                        <input type="number" value={saldoExtracto} onChange={e => setSaldoExtracto(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-right" />
                                    </div>

                                    <div className="pt-2 border-t border-slate-100">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".csv,.xls,.xlsx"
                                            onChange={handleImportarExtracto}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 flex items-center justify-center gap-2"
                                        >
                                            <UploadCloud size={14} /> Cargar Extracto (CSV/Excel)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase">2. Resumen de Conciliación</h3>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Saldo Libro (Sistema)</span>
                                    <span className="font-mono font-bold text-slate-800">{formatMoney(saldoLibro)}</span>
                                </div>
                                <div className="border-t border-slate-100 my-2 pt-2 space-y-2">
                                    <p className="text-xs text-slate-400 italic">Partidas no marcadas (En tránsito):</p>
                                    <div className="flex justify-between text-sm text-green-700">
                                        <span>(+) Cheques Girados No Cobrados</span>
                                        <span className="font-mono">{formatMoney(chequesGiradosNoCobrados)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-red-700">
                                        <span>(-) Depósitos en Tránsito</span>
                                        <span className="font-mono">{formatMoney(depositosEnTransito)}</span>
                                    </div>
                                </div>
                                <div className="border-t-2 border-slate-100 pt-2 flex justify-between text-sm font-bold">
                                    <span className="text-slate-800">Saldo Conciliado (Teórico)</span>
                                    <span className="font-mono text-sri-blue">{formatMoney(saldoCalculado)}</span>
                                </div>
                            </div>

                            <div className={`p-4 rounded-lg border ${cuadrado ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-100 border-red-200 text-red-800'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold uppercase">Diferencia</span>
                                    {cuadrado ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                                </div>
                                <div className="text-2xl font-bold text-right font-mono">{formatMoney(diferencia)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-700">Movimientos Pendientes al {fechaCorte}</span>
                            <span className="text-xs text-slate-500">Marque los ítems que aparecen en su Estado de Cuenta</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 w-10 text-center">Ok</th>
                                        <th className="px-6 py-3">Fecha</th>
                                        <th className="px-6 py-3">Referencia</th>
                                        <th className="px-6 py-3">Concepto</th>
                                        <th className="px-6 py-3 text-right">Débito</th>
                                        <th className="px-6 py-3 text-right">Crédito</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {movimientosPendientes.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-400">No hay movimientos pendientes en esta fecha.</td></tr>
                                    ) : movimientosPendientes.map(m => {
                                        const isChecked = marcados.has(m.id);
                                        return (
                                            <tr key={m.id} className={`transition-colors cursor-pointer ${isChecked ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'}`} onClick={() => toggleMovimiento(m.id)}>
                                                <td className="px-6 py-3 text-center">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isChecked ? 'bg-sri-blue border-sri-blue text-white' : 'border-slate-300 bg-white'}`}>
                                                        {isChecked && <CheckCircle2 size={14} />}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-slate-600 whitespace-nowrap">{m.fecha}</td>
                                                <td className="px-6 py-3 font-mono text-xs">{m.referencia}</td>
                                                <td className="px-6 py-3 text-slate-700 truncate max-w-[200px]">{m.concepto}</td>
                                                <td className="px-6 py-3 text-right font-mono text-slate-600">{m.esEgreso ? formatMoney(m.monto) : '-'}</td>
                                                <td className="px-6 py-3 text-right font-mono text-slate-600">{!m.esEgreso ? formatMoney(m.monto) : '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button onClick={onSave} disabled={!cuadrado} className="flex items-center gap-2">
                                <Save size={18} /> Guardar Conciliación
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
