'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Calculator, UploadCloud, CheckCircle2, AlertTriangle, Save, FileText, History, Loader2, X } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { CuentaBancaria, MovimientoBancario, EstadoConciliacion } from '../../domain/types';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { useConciliaciones } from '../hooks/useConciliaciones';
import { parseExtractoBancario, emparejarMovimientos, MovimientoExtracto } from '../../utils/extractoParser';
import { useEmpresa } from '@/shared/context/EmpresaContext';

interface Props {
    cuenta: CuentaBancaria;
    movimientos: MovimientoBancario[];
    onClose: () => void;
    onSave: () => void;
}

export const ConciliacionModal: React.FC<Props> = ({ cuenta, movimientos, onClose, onSave }) => {
    const { currentEmpresa } = useEmpresa();
    const { createConciliacion, fetchConciliaciones, conciliaciones, loading } = useConciliaciones(cuenta.id);

    const [fechaCorte, setFechaCorte] = useState(new Date().toISOString().split('T')[0]);
    const [saldoExtracto, setSaldoExtracto] = useState<number>(0);
    const [marcados, setMarcados] = useState<Set<string>>(new Set());
    const [observaciones, setObservaciones] = useState('');
    const [showHistorial, setShowHistorial] = useState(false);
    const [extractoImportado, setExtractoImportado] = useState<MovimientoExtracto[]>([]);
    const [erroresImportacion, setErroresImportacion] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cargar historial de conciliaciones al montar
    useEffect(() => {
        fetchConciliaciones();
    }, [fetchConciliaciones]);

    // Filtrar movimientos pendientes hasta la fecha de corte
    const movimientosPendientes = useMemo(() =>
        movimientos.filter(m => !m.conciliado && m.fecha <= fechaCorte),
        [movimientos, fechaCorte]
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

    const toggleTodos = () => {
        if (marcados.size === movimientosPendientes.length) {
            setMarcados(new Set());
        } else {
            setMarcados(new Set(movimientosPendientes.map(m => m.id)));
        }
    };

    const handleImportarExtracto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const contenido = await file.text();
            const resultado = parseExtractoBancario(contenido, cuenta.banco);

            setExtractoImportado(resultado.movimientos);
            setErroresImportacion(resultado.errores);

            // Si hay saldo final en el extracto, establecerlo
            if (resultado.saldoFinal !== undefined) {
                setSaldoExtracto(resultado.saldoFinal);
            }

            // Emparejar automáticamente movimientos
            if (resultado.movimientos.length > 0) {
                const emparejamientos = emparejarMovimientos(
                    resultado.movimientos,
                    movimientosPendientes.map(m => ({
                        id: m.id,
                        fecha: m.fecha,
                        monto: m.monto,
                        esEgreso: m.esEgreso,
                        referencia: m.referencia
                    }))
                );

                // Marcar los movimientos emparejados
                const nuevosIds = new Set<string>();
                emparejamientos.forEach((sistemaId) => {
                    nuevosIds.add(sistemaId);
                });
                setMarcados(nuevosIds);

                // Notificar al usuario
                const totalEmparejados = emparejamientos.size;
                alert(`✓ Importación exitosa\n\n• ${resultado.movimientos.length} movimientos leídos del extracto\n• ${totalEmparejados} movimientos conciliados automáticamente\n\nRevise los movimientos marcados y ajuste manualmente si es necesario.`);
            }
        } catch (error) {
            setErroresImportacion(['Error al leer el archivo. Asegúrese de que sea un CSV válido.']);
            console.error('Error importando extracto:', error);
        }

        // Resetear el input para permitir reimportar
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Cálculos de conciliación
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

    const handleGuardar = async () => {
        if (!currentEmpresa) return;

        setSaving(true);

        try {
            const resultado = await createConciliacion({
                empresaId: currentEmpresa.id,
                cuentaId: cuenta.id,
                fechaCorte,
                saldoLibro,
                saldoExtracto,
                chequesNoCobrados: chequesGiradosNoCobrados,
                depositosEnTransito,
                diferencia,
                estado: cuadrado ? EstadoConciliacion.CUADRADO : EstadoConciliacion.PENDIENTE,
                observaciones: observaciones || undefined,
                movimientosIds: Array.from(marcados)
            });

            if (resultado) {
                onSave();
            } else {
                alert('Error al guardar la conciliación');
            }
        } catch (error) {
            console.error('Error guardando conciliación:', error);
            alert('Error al guardar la conciliación');
        } finally {
            setSaving(false);
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleGuardar}
            isLoading={saving}
            isDisabled={marcados.size === 0}
            submitLabel="Guardar Conciliación"
            submitIcon={<Save size={18} />}
            className="w-full"
        >
            <div className="flex items-center gap-4">
                <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 border ${cuadrado ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {cuadrado ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span className="text-xs font-black uppercase tracking-wider">Diferencia: {formatMoney(diferencia)}</span>
                </div>
                <button
                    onClick={() => setShowHistorial(!showHistorial)}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-sri-blue transition-colors"
                >
                    <History size={14} />
                    <span className="font-medium">Ver historial</span>
                </button>
            </div>
        </ModalFooter>
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
            {/* Panel de historial expandible */}
            {showHistorial && (
                <div className="mb-6 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden animate-in slide-in-from-top-2">
                    <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Historial de Conciliaciones</span>
                        <button onClick={() => setShowHistorial(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-slate-400">
                                <Loader2 className="animate-spin mx-auto" size={24} />
                            </div>
                        ) : conciliaciones.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-sm">
                                No hay conciliaciones previas
                            </div>
                        ) : (
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-bold text-slate-500">Fecha Corte</th>
                                        <th className="px-4 py-2 text-right font-bold text-slate-500">Saldo Libro</th>
                                        <th className="px-4 py-2 text-right font-bold text-slate-500">Saldo Extracto</th>
                                        <th className="px-4 py-2 text-right font-bold text-slate-500">Diferencia</th>
                                        <th className="px-4 py-2 text-center font-bold text-slate-500">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {conciliaciones.map(c => (
                                        <tr key={c.id} className="hover:bg-white">
                                            <td className="px-4 py-2 text-slate-600">{new Date(c.fechaCorte).toLocaleDateString('es-EC')}</td>
                                            <td className="px-4 py-2 text-right font-mono">{formatMoney(c.saldoLibro)}</td>
                                            <td className="px-4 py-2 text-right font-mono">{formatMoney(c.saldoExtracto)}</td>
                                            <td className={`px-4 py-2 text-right font-mono ${Math.abs(c.diferencia) < 0.01 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {formatMoney(c.diferencia)}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.estado === EstadoConciliacion.CUADRADO
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {c.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

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
                                    step="0.01"
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
                                    accept=".csv,.txt"
                                    onChange={handleImportarExtracto}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-2.5 bg-sri-blue/5 text-sri-blue border border-sri-blue/20 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-sri-blue/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <UploadCloud size={16} /> Importar Extracto CSV
                                </button>
                                {extractoImportado.length > 0 && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600">
                                        <FileText size={14} />
                                        <span>{extractoImportado.length} movimientos importados</span>
                                    </div>
                                )}
                                {erroresImportacion.length > 0 && (
                                    <div className="mt-2 text-xs text-red-500">
                                        {erroresImportacion.map((err, i) => (
                                            <div key={i}>⚠ {err}</div>
                                        ))}
                                    </div>
                                )}
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

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">3. Observaciones</h3>
                        <textarea
                            value={observaciones}
                            onChange={e => setObservaciones(e.target.value)}
                            placeholder="Notas adicionales sobre esta conciliación..."
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs resize-none h-20 outline-none focus:ring-2 focus:ring-sri-blue/20"
                        />
                    </div>
                </div>

                {/* Panel Derecho: Tabla de Movimientos */}
                <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Movimientos al {fechaCorte}</span>
                            <button
                                onClick={toggleTodos}
                                className="text-[10px] font-bold text-sri-blue hover:underline"
                            >
                                {marcados.size === movimientosPendientes.length ? 'Desmarcar todos' : 'Marcar todos'}
                            </button>
                        </div>
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
