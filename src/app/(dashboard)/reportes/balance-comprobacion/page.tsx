'use client';

import { useState, useEffect } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { BalanceComprobacionTable } from '@/modules/contabilidad/ui/components/BalanceComprobacionTable';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { AsientoContable } from '@/modules/contabilidad/domain/types';
import { CuentaContable } from '@/shared/types';
import { Filter } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

export default function BalanceComprobacionPage() {
    const { currentEmpresa } = useEmpresa();
    const [asientos, setAsientos] = useState<AsientoContable[]>([]);
    const [planCuentas, setPlanCuentas] = useState<CuentaContable[]>([]);
    const [loading, setLoading] = useState(true);
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [fechaFin, setFechaFin] = useState<string>('');

    useEffect(() => {
        setFechaInicio(`${new Date().getFullYear()}-01-01`);
        setFechaFin(new Date().toISOString().split('T')[0]);
    }, []);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const [dataAsientos, dataPC] = await Promise.all([
                ContabilidadUseCases.listarAsientos(),
                ContabilidadUseCases.listarCuentas()
            ]);
            setAsientos(Array.isArray(dataAsientos) ? dataAsientos : []);
            setPlanCuentas(Array.isArray(dataPC) ? dataPC : []);
        } catch (error) {
            console.error('Error cargando balance comprobacion:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentEmpresa?.id) loadData();
    }, [currentEmpresa?.id]);

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Balance de Comprobación</h1>
                    <p className="text-slate-500 text-sm mt-1">Verificación de sumas y saldos de todas las cuentas.</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Desde</label>
                    <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Hasta</label>
                    <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm" />
                </div>
                <Button variant="secondary" className="flex items-center gap-2" onClick={loadData}>
                    <Filter size={16} /> Generar Balance
                </Button>
            </div>

            <BalanceComprobacionTable
                asientos={asientos}
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
                loading={loading}
                empresa={currentEmpresa}
                planCuentas={planCuentas}
            />
        </div>
    );
}
