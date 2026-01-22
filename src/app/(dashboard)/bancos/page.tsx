'use client';

import { useEffect, useState } from 'react';
import { Landmark, ArrowUpRight, ArrowDownRight, Plus, MoreVertical, CheckCircle2, FileCheck, ArrowRightLeft, FileSpreadsheet, Banknote } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { CuentaBancaria, MovimientoBancario } from '@/modules/bancos/domain/types';
import { BancosUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { ConciliacionModal } from '@/modules/bancos/ui/components/ConciliacionModal';
import { DepositoModal } from '@/modules/bancos/ui/components/DepositoModal';
import { NuevaTransaccionModal } from '@/modules/bancos/ui/components/NuevaTransaccionModal';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { CuentaBancariaModal } from '@/modules/bancos/ui/components/CuentaBancariaModal';

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
    const [showNuevaCuenta, setShowNuevaCuenta] = useState(false);
    const [editingCuenta, setEditingCuenta] = useState<CuentaBancaria | undefined>(undefined);

    const loadCuentas = async () => {
        if (!currentEmpresa) return;
        try {
            const data = await BancosUseCases.listarCuentas();
            setCuentas(data);
            if (data.length > 0 && !selectedCuenta) setSelectedCuenta(data[0].id);
        } catch (error) {
            console.error('Error cargando cuentas:', error);
        }
    };

    const loadMovimientos = async () => {
        if (selectedCuenta) {
            try {
                const movs = await BancosUseCases.listarMovimientos({
                    cuenta: selectedCuenta,
                    desde: '2020-01-01',
                    hasta: '2030-12-31'
                });
                setMovimientos(movs);
                // TipoMovimientoBancario.CHEQUE no está importado aquí, pero se usaba el string 'CHEQUE' en el repo ficticio
                setCheques(movs.filter((m: any) => m.tipo === 'CHEQUE'));
            } catch (error) {
                console.error('Error cargando movimientos:', error);
            }
        }
    };

    useEffect(() => { loadCuentas(); }, [currentEmpresa?.id]);
    useEffect(() => { loadMovimientos(); }, [selectedCuenta]);

    const movColumns: Column<MovimientoBancario>[] = [
        { header: 'Fecha', accessorKey: 'fecha', className: 'text-slate-600' },
        {
            header: 'Tipo / Referencia',
            cell: (mov) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-800 text-[10px] uppercase">{mov.tipo.replace('_', ' ')}</span>
                    <span className="text-xs text-slate-500 font-mono">{mov.referencia}</span>
                </div>
            )
        },
        {
            header: 'Beneficiario / Concepto',
            cell: (mov) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-800">{mov.beneficiario}</span>
                    <span className="text-[10px] text-slate-500">{mov.concepto}</span>
                </div>
            )
        },
        {
            header: 'Conciliado',
            className: 'text-center',
            cell: (mov) => (
                <div className="flex justify-center">
                    {mov.conciliado ? (
                        <CheckCircle2 size={18} className="text-green-500" />
                    ) : (
                        <span className="h-3 w-3 rounded-full bg-slate-200 border border-slate-300"></span>
                    )}
                </div>
            )
        },
        {
            header: 'Monto',
            className: 'text-right font-bold',
            cell: (mov) => (
                <div className={`flex items-center justify-end gap-1 ${mov.esEgreso ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {mov.esEgreso ? '-' : '+'}{formatMoney(mov.monto)}
                    {mov.esEgreso ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                </div>
            )
        }
    ];

    const chqColumns: Column<MovimientoBancario>[] = [
        { header: 'Fecha Emisión', accessorKey: 'fecha', className: 'text-slate-600' },
        { header: 'Nro. Cheque', accessorKey: 'referencia', className: 'font-mono font-bold' },
        { header: 'Beneficiario', accessorKey: 'beneficiario', className: 'font-medium' },
        {
            header: 'Valor',
            className: 'text-right font-bold',
            cell: (chq) => formatMoney(chq.monto)
        },
        {
            header: 'Estado',
            className: 'text-center',
            cell: (chq) => (
                chq.conciliado ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold border border-green-200">COBRADO</span>
                ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-[10px] font-bold border border-yellow-200">EN TRÁNSITO</span>
                )
            )
        }
    ];

    const handleExport = () => {
        const data = activeTab === 'movimientos' ? movimientos : cheques;
        if (data.length === 0) return;

        const headers = activeTab === 'movimientos'
            ? ["Fecha", "Tipo", "Referencia", "Beneficiario", "Concepto", "Conciliado", "Monto"]
            : ["Fecha", "Nro Cheque", "Beneficiario", "Valor", "Estado"];

        const rows = data.map(m => activeTab === 'movimientos'
            ? [m.fecha, m.tipo, m.referencia, `"${m.beneficiario}"`, `"${m.concepto}"`, m.conciliado ? "SI" : "NO", m.esEgreso ? -m.monto : m.monto]
            : [m.fecha, m.referencia, `"${m.beneficiario}"`, m.monto, m.conciliado ? "COBRADO" : "EN TRÁNSITO"]
        );

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `bancos_${currentCuentaObj?.banco.replace(/\s+/g, '_')}_${activeTab}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!currentEmpresa) return null;

    const currentCuentaObj = cuentas.find(c => c.id === selectedCuenta);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Tesorería y Bancos</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Control de flujo de efectivo, cheques y conciliación bancaria.
                    </p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('movimientos')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'movimientos' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <ArrowRightLeft size={16} /> Movimientos
                    </button>
                    <button onClick={() => setActiveTab('cheques')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'cheques' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Banknote size={16} /> Cheques
                    </button>
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
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCuenta(cuenta);
                                }}
                                className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${selectedCuenta === cuenta.id ? 'text-white' : 'text-slate-400'}`}
                            >
                                <MoreVertical size={20} />
                            </button>
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

            <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-wrap gap-2 items-center animate-in fade-in slide-in-from-top-2">
                <Button variant="secondary" onClick={() => setShowDeposito(true)} className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 flex items-center gap-2">
                    <ArrowRightLeft size={16} /> Depositar
                </Button>
                <Button variant="secondary" onClick={() => setShowConciliacion(true)} disabled={!selectedCuenta} className="flex items-center gap-2">
                    <FileCheck size={16} /> Conciliar
                </Button>
                <Button onClick={() => setShowNuevaCuenta(true)} variant="secondary" className="flex items-center gap-2 border-dashed border-slate-300">
                    <Plus size={16} /> Nueva Cuenta
                </Button>
                <div className="flex-1" />
                <Button onClick={() => setShowNuevaTransaccion(true)} className="flex items-center gap-2 shadow-sm">
                    <Plus size={16} /> Nueva Transacción
                </Button>
            </div>

            {activeTab === 'movimientos' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    <DataTable
                        data={movimientos}
                        columns={movColumns}
                        itemsPerPage={5}
                        searchable
                        searchKeys={['beneficiario', 'concepto', 'referencia']}
                        searchPlaceholder="Buscar movimientos..."
                        actions={
                            <Button variant="secondary" size="sm" onClick={handleExport} className="flex items-center gap-2">
                                <FileSpreadsheet size={16} /> Exportar
                            </Button>
                        }
                    />
                </div>
            )}

            {activeTab === 'cheques' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    <DataTable
                        data={cheques}
                        columns={chqColumns}
                        itemsPerPage={5}
                        emptyMessage="No hay cheques registrados en esta cuenta."
                        searchable
                        searchKeys={['beneficiario', 'referencia']}
                        searchPlaceholder="Buscar cheques..."
                        actions={
                            <Button variant="secondary" size="sm" onClick={handleExport} className="flex items-center gap-2">
                                <FileSpreadsheet size={16} /> Exportar
                            </Button>
                        }
                    />
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
                />
            )}

            {(showNuevaCuenta || editingCuenta) && (
                <CuentaBancariaModal
                    cuenta={editingCuenta}
                    onClose={() => {
                        setShowNuevaCuenta(false);
                        setEditingCuenta(undefined);
                    }}
                    onSave={() => {
                        loadCuentas();
                        setShowNuevaCuenta(false);
                        setEditingCuenta(undefined);
                    }}
                />
            )}
        </div>
    );
}
