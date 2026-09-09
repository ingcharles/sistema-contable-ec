'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Edit, Trash2, Users, Search } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { Area, Empleado } from '@/modules/rrhh/domain/types';
import { RRHHUseCases } from '@/modules/rrhh/application/useCases/RRHHUseCases';
import { AreaModal } from '@/modules/rrhh/ui/components/configuracion/AreaModal';

export default function AreasPage() {
    const [areas, setAreas] = useState<Area[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedArea, setSelectedArea] = useState<Area | undefined>();

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [dataAreas, dataEmpleados] = await Promise.all([
                RRHHUseCases.listarAreas(),
                RRHHUseCases.listarEmpleados()
            ]);
            setAreas(dataAreas);
            setEmpleados(dataEmpleados);
        } catch (error) {
            console.error('Error cargando áreas:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleEdit = (area: Area) => {
        setSelectedArea(area);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar esta área?')) {
            try {
                const response = await RRHHUseCases.eliminarArea(id);
                // Si la API retorna error 409 (empleados asignados), la validación la hace el backend
                if (response.error) {
                    alert(response.error);
                } else {
                    loadData();
                }
            } catch (error: any) {
                alert(error.message || 'No se pudo eliminar el área');
            }
        }
    };

    const columns: Column<Area>[] = [
        {
            header: 'Código',
            accessorKey: 'codigo',
            className: 'font-mono font-bold text-sri-blue'
        },
        {
            header: 'Nombre del Área',
            cell: (area) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{area.nombre}</span>
                    {area.descripcion && <span className="text-[10px] text-slate-400 truncate max-w-xs">{area.descripcion}</span>}
                </div>
            )
        },
        {
            header: 'Área Superior',
            cell: (area) => area.areaPadre?.nombre || <span className="text-slate-400 italic">Principal</span>
        },
        {
            header: 'Responsable',
            cell: (area) => area.responsable ? (
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                        <Users size={12} className="text-slate-500" />
                    </div>
                    <span className="text-sm font-medium">{area.responsable.nombres}</span>
                </div>
            ) : <span className="text-slate-400 italic">No asignado</span>
        },
        {
            header: 'Estado',
            cell: (area) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${area.activa ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {area.activa ? 'ACTIVA' : 'INACTIVA'}
                </span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (area) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => handleEdit(area)}
                        className="p-1.5 text-slate-400 hover:text-sri-blue hover:bg-sri-blue/5 rounded-lg transition-all"
                        title="Editar"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(area.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Eliminar"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-sri-blue/10 flex items-center justify-center text-sri-blue">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Estructura Organizacional</h1>
                        <p className="text-slate-500 text-xs mt-0.5 font-medium">Gestión de departamentos y jerarquías de la empresa.</p>
                    </div>
                </div>

                <Button
                    onClick={() => { setSelectedArea(undefined); setShowModal(true); }}
                    className="flex items-center gap-2 shadow-lg shadow-sri-blue/20"
                >
                    <Plus size={18} /> Nueva Área
                </Button>
            </div>

            <DataTable
                data={areas}
                columns={columns}
                loading={loading}
                searchable
                searchPlaceholder="Buscar por nombre o código..."
                emptyMessage="No se han configurado áreas todavía."
            />

            {showModal && (
                <AreaModal
                    area={selectedArea}
                    empleados={empleados}
                    areas={areas}
                    onClose={() => setShowModal(false)}
                    onSave={loadData}
                />
            )}
        </div>
    );
}
