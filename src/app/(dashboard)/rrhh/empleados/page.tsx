'use client';

import { useState, useEffect } from 'react';
import { UserPlus, FileText, Trash2 } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Empleado } from '@/modules/nomina/domain/types';
import { NominaUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { EmpleadoModal } from '@/modules/nomina/ui/components/EmpleadoModal';

export default function EmpleadosPage() {
    const { currentEmpresa } = useEmpresa();
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmpleadoEdit, setSelectedEmpleadoEdit] = useState<Empleado | null>(null);
    const [showEmpleadoModal, setShowEmpleadoModal] = useState(false);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const dataEmp = await NominaUseCases.listarEmpleados();
            setEmpleados(dataEmp);
        } catch (error) {
            console.error('Error cargando empleados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id]);

    const handleDeleteEmpleado = async (id: string) => {
        if (window.confirm('¿Está seguro de anular este empleado?')) {
            try {
                await NominaUseCases.eliminarEmpleado(id);
                loadData();
            } catch (error) {
                alert('Error al eliminar empleado');
            }
        }
    };

    const empleadoColumns: Column<Empleado>[] = [
        {
            header: 'Empleado',
            cell: (emp) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{emp.apellidos} {emp.nombres}</span>
                    <span className="text-xs text-slate-500">{emp.identificacion}</span>
                </div>
            ),
            sortable: true,
            accessorKey: 'apellidos'
        },
        { header: 'Cargo', accessorKey: 'cargo', sortable: true },
        { header: 'Fecha Ingreso', accessorKey: 'fechaIngreso' },
        {
            header: 'Sueldo Base',
            accessorKey: 'sueldoBase',
            className: 'text-right font-medium',
            cell: (emp) => formatMoney(emp.sueldoBase)
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            className: 'text-center',
            cell: (emp) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${emp.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {emp.estado}
                </span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (emp) => (
                <div className="flex justify-end gap-1">
                    <button
                        className="p-1.5 text-slate-400 hover:text-sri-blue rounded-lg transition-colors"
                        title="Editar"
                        onClick={() => { setSelectedEmpleadoEdit(emp); setShowEmpleadoModal(true); }}
                    >
                        <FileText size={18} />
                    </button>
                    <button
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Anular"
                        onClick={() => handleDeleteEmpleado(emp.id)}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Ficha de Empleados</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de datos personales, laborales y contractuales.</p>
                </div>
            </div>

            <DataTable
                data={empleados}
                columns={empleadoColumns}
                loading={loading}
                itemsPerPage={10}
                searchable
                searchPlaceholder="Buscar empleado por nombre..."
                actions={
                    <Button onClick={() => { setSelectedEmpleadoEdit(null); setShowEmpleadoModal(true); }} className="flex items-center gap-2 shadow-sm">
                        <UserPlus size={18} /> Nuevo Empleado
                    </Button>
                }
            />

            {showEmpleadoModal && (
                <EmpleadoModal
                    empleado={selectedEmpleadoEdit || undefined}
                    onClose={() => { setShowEmpleadoModal(false); setSelectedEmpleadoEdit(null); }}
                    onSave={loadData}
                />
            )}
        </div>
    );
}
