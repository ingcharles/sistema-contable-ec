'use client';

import { useEffect, useState } from 'react';
import { Landmark, ArrowUpRight, ArrowDownRight, Plus, MoreVertical, CheckCircle2, FileCheck, ArrowRightLeft, Banknote, ScrollText } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { CuentaBancaria, MovimientoBancario, TipoMovimientoBancario } from '@/modules/bancos/domain/types';
import { InMemoryBancosRepository } from '@/modules/bancos/infrastructure/BancosRepository';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { ConciliacionModal } from '@/modules/bancos/ui/components/ConciliacionModal';
import { DepositoModal } from '@/modules/bancos/ui/components/DepositoModal';
import { NuevaTransaccionModal } from '@/modules/bancos/ui/components/NuevaTransaccionModal';
import { Button } from '@/shared/ui/Button';

export default function BancosPage() {
    const { currentEmpresa } = useEmpresa();
    const [activeTab, setActiveTab] = useState<'movimientos' | 'cheques'>('movimientos');
    const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
    const [movimientos, setMovimientos] = useState<MovimientoBancario[]>([]);
    const [cheques, setCheques] = useState<MovimientoBancario[]>([]);
    const [selectedCuenta, setSelectedCuenta] = useState<string | null>(null);
    const [showConciliacion, setShowConciliacion] = useState(false);
    const [showNuevaTransaccion, setShowNuevaTransaccion] = useState(false);
    const [showDeposito, setShowDeposito] = useState(false);

    const loadCuentas = async () => {
        if (!currentEmpresa) return;
        const repo = new InMemoryBancosRepository();
        const data = await repo.getCuentas(currentEmpresa.id);
        setCuentas(data);
        if (data.length > 0 && !selectedCuenta) setSelectedCuenta(data[0].id);
    };

    const loadMovimientos = async () => {
        if (selectedCuenta) {
            const repo = new InMemoryBancosRepository();
            const movs = await repo.getMovimientos(selectedCuenta, '2020-01-01', '2030-12-31');
            setMovimientos(movs);
            setCheques(movs.filter(m => m.tipo === TipoMovimientoBancario.CHEQUE));
        }
    };

    useEffect(() => { loadCuentas(); }, [currentEmpresa?.id]);
    useEffect(() => { loadMovimientos(); }, [selectedCuenta]);

    if (!currentEmpresa) return null;

    const currentCuentaObj = cuentas.find(c => c.id === selectedCuenta);
    const empresaId = currentEmpresa.id;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Tesorería y Bancos</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Control de flujo de efectivo, cheques y conciliación bancaria.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeposito(true)}
                        className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 flex items-center gap-2"
                    >
                        <ArrowRightLeft size={16} /> Depositar
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => setShowConciliacion(true)}
                        disabled={!selectedCuenta}
                        className="flex items-center gap-2"
                    >
                        <FileCheck size={16} /> Conciliar
                    </Button>
                    <Button
                        onClick={() => setShowNuevaTransaccion(true)}
                        className="flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={16} /> Nueva Transacción
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cuentas.map(cuenta => (
                    <div
                        key={cuenta.id}
                        onClick={() => setSelectedCuenta(cuenta.id)}
                        className={`cursor-pointer p-6 rounded-xl border transition-all ${selectedCuenta === cuenta.id
                            ? 'bg-slate-800 text-white shadow-lg ring-2 ring-slate-800 ring-offset-2'
                            : 'bg-white text-slate-800 border-slate-200 hover:shadow-md'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-lg ${selectedCuenta === cuenta.id ? 'bg-white/10' : 'bg-slate-100'}`}>
                                <Landmark size={24} className={selectedCuenta === cuenta.id ? 'text-white' : 'text-sri-blue'} />
                            </div>
                            <MoreVertical size={20} className="opacity-50" />
                        </div>
                        <h3 className="font-bold text-lg mb-1">{cuenta.banco}</h3>
                        <p className={`text-sm mb-4 ${selectedCuenta === cuenta.id ? 'text-slate-300' : 'text-slate-500'}`}>
                            {cuenta.tipo} • {cuenta.numeroCuenta}
                        </p>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className={`text-xs ${selectedCuenta === cuenta.id ? 'text-slate-400' : 'text-slate-400'}`}>Saldo Contable</p>
                                <p className="text-2xl font-bold">{formatMoney(cuenta.saldoContable)}</p>
                            </div>
                            {selectedCuenta === cuenta.id && (
                                <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">Activa</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('movimientos')}
                    className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'movimientos' ? 'text-sri-blue border-b-2 border-sri-blue' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Libro Banco (Movimientos)
                </button>
                <button
                    onClick={() => setActiveTab('cheques')}
                    className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'cheques' ? 'text-sri-blue border-b-2 border-sri-blue' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Control de Cheques
                </button>
            </div>

            {activeTab === 'movimientos' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-700">Movimientos Recientes</h3>
                        <div className="flex gap-2 text-xs text-slate-500">
                            <span>Mostrando últimos movimientos</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Tipo / Referencia</th>
                                    <th className="px-6 py-4">Beneficiario / Concepto</th>
                                    <th className="px-6 py-4 text-center">Conciliado</th>
                                    <th className="px-6 py-4 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {movimientos.map((mov) => (
                                    <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{mov.fecha}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-800 text-xs uppercase">{mov.tipo.replace('_', ' ')}</span>
                                                <span className="text-xs text-slate-500 font-mono">{mov.referencia}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-800">{mov.beneficiario}</span>
                                                <span className="text-xs text-slate-500">{mov.concepto}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                {mov.conciliado ? (
                                                    <CheckCircle2 size={18} className="text-green-500" />
                                                ) : (
                                                    <span className="h-3 w-3 rounded-full bg-slate-200 border border-slate-300"></span>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${mov.esEgreso ? 'text-red-600' : 'text-green-600'}`}>
                                            <div className="flex items-center justify-end gap-1">
                                                {mov.esEgreso ? '-' : '+'}{formatMoney(mov.monto)}
                                                {mov.esEgreso ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'cheques' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Banknote size={18} /> Cheques Girados
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Fecha Emisión</th>
                                    <th className="px-6 py-4">Nro. Cheque</th>
                                    <th className="px-6 py-4">Beneficiario</th>
                                    <th className="px-6 py-4 text-right">Valor</th>
                                    <th className="px-6 py-4 text-center">Estado</th>
                                    <th className="px-6 py-4 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cheques.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-400">No hay cheques registrados en esta cuenta.</td></tr>
                                ) : cheques.map((chq) => (
                                    <tr key={chq.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600">{chq.fecha}</td>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-800">{chq.referencia}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{chq.beneficiario}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">{formatMoney(chq.monto)}</td>
                                        <td className="px-6 py-4 text-center">
                                            {chq.conciliado ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold border border-green-200">COBRADO</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold border border-yellow-200">EN TRÁNSITO</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="text-xs text-sri-blue hover:underline flex items-center gap-1 mx-auto">
                                                <ScrollText size={14} /> Detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showConciliacion && currentCuentaObj && (
                <ConciliacionModal
                    cuenta={currentCuentaObj}
                    movimientos={movimientos}
                    onClose={() => setShowConciliacion(false)}
                    onSave={() => {
                        setShowConciliacion(false);
                        loadMovimientos();
                    }}
                    empresaId={empresaId}
                />
            )}

            {showNuevaTransaccion && (
                <NuevaTransaccionModal
                    cuentas={cuentas}
                    onClose={() => setShowNuevaTransaccion(false)}
                    onSave={() => {
                        loadMovimientos();
                        setShowNuevaTransaccion(false);
                    }}
                    empresaId={empresaId}
                />
            )}

            {showDeposito && (
                <DepositoModal
                    cuentas={cuentas}
                    onClose={() => setShowDeposito(false)}
                    onSave={() => {
                        loadMovimientos();
                        setShowDeposito(false);
                    }}
                    empresaId={empresaId}
                />
            )}
        </div>
    );
}
