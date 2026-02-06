'use client';

import { useState, useEffect } from 'react';
import { Gift, Calendar, Download, Calculator, FileCheck, Info, Star } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Empleado } from '@/modules/nomina/domain/types';
import { NominaUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';

export default function BeneficiosPage() {
    const { currentEmpresa } = useEmpresa();
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [loading, setLoading] = useState(true);
    const [anio, setAnio] = useState(new Date().getFullYear().toString());

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const dataEmp = await NominaUseCases.listarEmpleados();
            setEmpleados(dataEmp);
        } catch (error) {
            console.error('Error cargando beneficios:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id]);

    const columns: Column<Empleado>[] = [
        {
            header: 'Empleado',
            cell: (row) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-slate-800 uppercase text-xs">{row.apellidos} {row.nombres}</span>
                </div>
            )
        },
        {
            header: 'Sueldo Base',
            accessorKey: 'sueldoBase',
            className: 'text-right font-medium',
            cell: (row) => formatMoney(row.sueldoBase)
        },
        {
            header: 'Décimo Tercero (Acumulado)',
            className: 'text-right font-bold text-emerald-600',
            cell: (row) => formatMoney(row.sueldoBase * 0.5) // Simulación para UI
        },
        {
            header: 'Décimo Cuarto (Acumulado)',
            className: 'text-right font-bold text-blue-600',
            cell: (row) => formatMoney(460 / 12 * 6) // Simulación para UI
        },
        {
            header: 'Fondos de Reserva',
            cell: (row) => (
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">MENSUALIZADO</span>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                <Gift className="text-amber-400" size={32} /> Beneficios Sociales
                            </h1>
                            <p className="text-slate-400 text-sm mt-2 font-medium max-w-md">
                                Control y provisión de décimos, fondos de reserva y utilidades según la normativa legal vigente.
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Periodo Fiscal</label>
                            <select
                                value={anio}
                                onChange={(e) => setAnio(e.target.value)}
                                className="bg-transparent text-xl font-black outline-none cursor-pointer"
                            >
                                <option value="2024" className="text-slate-900">2024</option>
                                <option value="2023" className="text-slate-900">2023</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Décimo Tercero</p>
                            <p className="text-2xl font-black text-amber-400 mt-1">$ 12,450.00</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Décimo Cuarto</p>
                            <p className="text-2xl font-black text-blue-400 mt-1">$ 8,920.00</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Fondos Reserva</p>
                            <p className="text-2xl font-black text-emerald-400 mt-1">$ 4,105.00</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Utilidades Est.</p>
                            <div className="flex items-center gap-2 text-white/40 mt-1">
                                <Info size={14} />
                                <span className="text-xs font-bold">No calculado</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute -left-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="flex gap-4">
                <Button variant="secondary" className="flex-1 h-14 rounded-2xl border-2 border-slate-100 bg-white hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-3 transition-all">
                    <Calculator size={20} className="text-sri-blue" /> Recalcular Provisiones Proyectadas
                </Button>
                <Button variant="secondary" className="flex-1 h-14 rounded-2xl border-2 border-slate-100 bg-white hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-3 transition-all">
                    <Download size={20} className="text-emerald-500" /> Exportar Planilla de Beneficios
                </Button>
            </div>

            <DataTable
                data={empleados}
                columns={columns}
                loading={loading}
                searchable
                searchPlaceholder="Filtrar empleados por nombre o cargo..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-5">
                    <div className="bg-amber-100 p-3 rounded-2xl"><Star className="text-amber-600" size={24} /></div>
                    <div>
                        <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Décimo Tercero (Bono Navideño)</h4>
                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                            Acumulado desde Diciembre del año anterior hasta Noviembre del año actual. Fecha máxima de pago: 24 de Diciembre.
                        </p>
                    </div>
                </div>
                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-5">
                    <div className="bg-blue-100 p-3 rounded-2xl"><FileCheck className="text-blue-600" size={24} /></div>
                    <div>
                        <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Décimo Cuarto (Bono Escolar)</h4>
                        <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                            Cálculo basado en el Salario Básico Unificado (SBU). Periodo Costa/Insular: Marzo a Febrero. Periodo Sierra/Amazonía: Agosto a Julio.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
