'use client';

import { useState, useEffect } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { BalanceComprobacionTable } from '@/modules/contabilidad/ui/components/BalanceComprobacionTable';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { FinancialReportFilter } from '@/modules/contabilidad/ui/components/FinancialReportFilter';

export default function BalanceComprobacionPage() {
    const { currentEmpresa } = useEmpresa();
    const [datos, setDatos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fechaInicio, setFechaInicio] = useState<string>(`${new Date().getFullYear()}-01-01`);
    const [fechaFin, setFechaFin] = useState<string>(new Date().toISOString().split('T')[0]);
    const [nivel, setNivel] = useState(4);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const res = await ContabilidadUseCases.obtenerBalanceComprobacion(fechaInicio, fechaFin, nivel);
            setDatos(Array.isArray(res) ? res : []);
        } catch (error) {
            console.error('Error cargando balance comprobacion:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentEmpresa?.id) loadData();
    }, [currentEmpresa?.id, fechaInicio, fechaFin, nivel]);

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Balance de Comprobación</h1>
                    <p className="text-slate-500 text-sm mt-1">Verificación de sumas y saldos de todas las cuentas.</p>
                </div>
            </div>

            <FinancialReportFilter
                showLevel={true}
                initialValues={{ desde: fechaInicio, hasta: fechaFin, nivel }}
                onFilter={(vals) => {
                    setFechaInicio(vals.desde!);
                    setFechaFin(vals.hasta!);
                    setNivel(vals.nivel!);
                }}
                isLoading={loading}
            />

            <BalanceComprobacionTable
                datos={datos}
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
                loading={loading}
                empresa={currentEmpresa}
            />
        </div>
    );
}
