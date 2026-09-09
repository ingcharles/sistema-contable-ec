'use client';

import { useEffect, useState } from 'react';
import { Landmark, FileCheck, CheckCircle2 } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { CuentaBancaria, MovimientoBancario } from '@/modules/bancos/domain/types';
import { BancosUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { ConciliacionModal } from '@/modules/bancos/ui/components/ConciliacionModal';
import { Button } from '@/shared/ui/Button';

export default function ConciliacionBancariaPage() {
    const { currentEmpresa } = useEmpresa();
    const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
    const [movimientos, setMovimientos] = useState<MovimientoBancario[]>([]);
    const [selectedCuenta, setSelectedCuenta] = useState<string | null>(null);
    const [showConciliacion, setShowConciliacion] = useState(false);

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
            } catch (error) {
                console.error('Error cargando movimientos:', error);
            }
        }
    };

    useEffect(() => { loadCuentas(); }, [currentEmpresa?.id]);
    useEffect(() => { loadMovimientos(); }, [selectedCuenta]);

    if (!currentEmpresa) return null;

    const currentCuentaObj = cuentas.find(c => c.id === selectedCuenta);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Conciliación Bancaria</h1>
                    <p className="text-slate-500 text-sm mt-1">Sincronice sus saldos contables con sus estados de cuenta.</p>
                </div>
                <Button
                    onClick={() => setShowConciliacion(true)}
                    disabled={!selectedCuenta}
                    className="flex items-center gap-2 shadow-lg shadow-sri-blue/20"
                >
                    <FileCheck size={18} /> Iniciar Conciliación
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cuentas.map(cuenta => (
                    <div
                        key={cuenta.id}
                        onClick={() => setSelectedCuenta(cuenta.id)}
                        className={`cursor-pointer p-6 rounded-2xl border transition-all duration-300 ${selectedCuenta === cuenta.id
                            ? 'bg-sri-blue text-white shadow-xl shadow-sri-blue/30 scale-[1.02] border-transparent'
                            : 'bg-white text-slate-800 border-slate-100 hover:border-sri-blue/30 hover:shadow-md'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-3 rounded-xl ${selectedCuenta === cuenta.id ? 'bg-white/20' : 'bg-blue-50'}`}>
                                <Landmark size={24} className={selectedCuenta === cuenta.id ? 'text-white' : 'text-sri-blue'} />
                            </div>
                            {selectedCuenta === cuenta.id && (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Seleccionada
                                </span>
                            )}
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-black text-xl leading-tight">{cuenta.banco}</h3>
                            <p className={`text-sm font-medium ${selectedCuenta === cuenta.id ? 'text-white/70' : 'text-slate-500'}`}>
                                {cuenta.tipo} • {cuenta.numeroCuenta}
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end">
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${selectedCuenta === cuenta.id ? 'text-white/50' : 'text-slate-400'}`}>Saldo Contable</p>
                                <p className="text-2xl font-black">{formatMoney(cuenta.saldoContable)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-blue-50 border border-blue-100 p-8 rounded-3xl flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <CheckCircle2 size={32} className="text-sri-blue" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Seleccione una cuenta para conciliar</h3>
                    <p className="text-slate-500 text-sm max-w-sm">
                        Podrá contrastar los movimientos registrados en el sistema contra su extracto bancario real.
                    </p>
                </div>
            </div>

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
        </div>
    );
}
