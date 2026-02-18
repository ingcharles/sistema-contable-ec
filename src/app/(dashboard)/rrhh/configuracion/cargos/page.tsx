'use client';

import { useState, useEffect, useCallback } from 'react';
import { Briefcase, Plus, Edit, Trash2, Search, Building2, TrendingUp } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { Cargo, Area } from '@/modules/rrhh/domain/types';
import { RRHHUseCases } from '@/modules/rrhh/application/useCases/RRHHUseCases';
import { CargoModal } from '@/modules/rrhh/ui/components/configuracion/CargoModal';
import { formatMoney } from '@/shared/utils/formatearDinero';

export default function CargosPage() {
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedCargo, setSelectedCargo] = useState<Cargo | undefined>();

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [dataCargos, dataAreas] = await Promise.all([
                RRHHUseCases.listarCargos(),
                RRHHUseCases.listarAreas()
            ]);
            setCargos(dataCargos);
            setAreas(dataAreas);
        } catch (error) {
            console.error('Error cargando cargos:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleEdit = (cargo: Cargo) => {
        setSelectedCargo(cargo);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este cargo?')) {
            try {
                const response = await RRHHUseCases.eliminarCargo(id);
                if (response.error) {
                    alert(response.error);
                } else {
                    loadData();
                }
            } catch (error: any) {
                alert(error.message || 'No se pudo eliminar el cargo');
            }
        }
    };

    const columns: Column<Cargo>[] = [
        {
            header: 'Código',
            accessorKey: 'codigo',
            className: 'font-mono font-bold text-sri-blue'
        },
        {
            header: 'Nombre del Cargo',
            cell: (cargo) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{cargo.nombre}</span>
                    <span className="text-[10px] text-slate-400">Nivel {cargo.nivelJerarquico}</span>
                </div>
            )
        },
        {
            header: 'Área',
            cell: (cargo) => cargo.area?.nombre || <span className="text-slate-400 italic">General</span>
        },
        {
            header: 'Rango Salarial',
            cell: (cargo) => (
                <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-700">{formatMoney(cargo.sueldoMinimo || 0)} - {formatMoney(cargo.sueldoMaximo || 0)}</span>
                </div>
            )
        },
        {
            header: 'Estado',
            cell: (cargo) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${cargo.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {cargo.activo ? 'ACTIVO' : 'INACTIVO'}
                </span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (cargo) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => handleEdit(cargo)}
                        className="p-1.5 text-slate-400 hover:text-sri-blue hover:bg-sri-blue/5 rounded-lg transition-all"
                        title="Editar"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(cargo.id)}
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
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Cargos y Posiciones</h1>
                        <p className="text-slate-500 text-xs mt-0.5 font-medium">Gestión del catálogo de puestos y rangos salariales.</p>
                    </div>
                </div>

                <Button
                    onClick={() => { setSelectedCargo(undefined); setShowModal(true); }}
                    className="flex items-center gap-2 shadow-lg shadow-sri-blue/20"
                >
                    <Plus size={18} /> Nuevo Cargo
                </Button>
            </div>

            <DataTable
                data={cargos}
                columns={columns}
                loading={loading}
                searchable
                searchPlaceholder="Buscar cargo..."
                emptyMessage="No se han configurado cargos todavía."
            />

            {showModal && (
                <CargoModal
                    cargo={selectedCargo}
                    areas={areas}
                    onClose={() => setShowModal(false)}
                    onSave={loadData}
                />
            )}
        </div>
    );
}
