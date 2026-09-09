'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, DollarSign, Zap } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { formatMoney } from '@/shared/utils/formatearDinero';
import PlanModal from '@/modules/configuracion/ui/components/PlanModal';
import { PlanesUseCases } from '@/modules/shared/application/useCases/PlanesUseCases';

interface Caracteristica {
    id: string;
    clave: string;
    tipoDocumentoId: string | null;
    tipoValor: 'NUMERO' | 'BOOLEANO';
    valorNumero: number;
    valorBooleano: boolean;
}

interface Plan {
    id: string;
    codigo: string;
    nombre: string;
    precioMensual: number;
    caracteristicas: Caracteristica[];
    createdAt: string;
}

export default function PlanesPage() {
    const { currentEmpresa } = useEmpresa();
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await PlanesUseCases.listarPlanes();
            setPlanes(data || []);
        } catch (error) {
            console.error('Error cargando planes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = () => {
        setSelectedPlan(null);
        setModalOpen(true);
    };

    const handleEdit = (plan: Plan) => {
        setSelectedPlan(plan);
        setModalOpen(true);
    };

    const handleDelete = async (plan: Plan) => {
        if (!confirm(`¿Está seguro de eliminar el plan "${plan.nombre}"?`)) return;

        try {
            await PlanesUseCases.eliminarPlan(plan.id);
            await loadData();
        } catch (error) {
            console.error('Error eliminando plan:', error);
            alert('Error al eliminar el plan');
        }
    };

    const handleSave = async () => {
        setModalOpen(false);
        await loadData();
    };

    const columns: Column<Plan>[] = [
        {
            header: 'Plan',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl">
                        <Package className="text-white" size={18} />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 uppercase text-sm">{row.nombre}</p>
                        <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{row.codigo}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Precio Mensual',
            cell: (row) => (
                <div className="flex items-center gap-1.5">
                    <DollarSign size={14} className="text-emerald-500" />
                    <span className="font-bold text-slate-700">{formatMoney(row.precioMensual)}</span>
                </div>
            )
        },
        {
            header: 'Límites / Características',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Zap size={14} className="text-amber-400" />
                    <span className="font-bold text-indigo-600">{row.caracteristicas?.length || 0}</span>
                    <span className="text-xs text-slate-500">configuraciones</span>
                </div>
            )
        },
        {
            header: 'Acciones',
            cell: (row) => (
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => handleEdit(row)}
                        className="h-8 px-3 text-xs"
                    >
                        <Edit size={14} />
                        Editar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleDelete(row)}
                        className="h-8 px-3 text-xs"
                    >
                        <Trash2 size={14} />
                        Eliminar
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                <Package size={32} className="text-emerald-400" />
                                Gestión de Planes
                            </h1>
                            <p className="text-slate-400 text-sm mt-2 font-medium max-w-2xl">
                                Configura los planes comerciales, precios y límites de facturación para los usuarios de la plataforma.
                            </p>
                        </div>
                        <Button
                            onClick={handleCreate}
                            className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-6 h-12 rounded-2xl flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Nuevo Plan
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Total de Planes</p>
                            <p className="text-2xl font-black text-white mt-1">{planes.length}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Plan más Económico</p>
                            <p className="text-2xl font-black text-emerald-400 mt-1">
                                {planes.length > 0 ? formatMoney(Math.min(...planes.map(p => p.precioMensual))) : '$0.00'}
                            </p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Promedio Precio</p>
                            <p className="text-2xl font-black text-sky-400 mt-1">
                                {planes.length > 0 ? formatMoney(planes.reduce((acc, p) => acc + p.precioMensual, 0) / planes.length) : '$0.00'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute -left-20 -top-20 w-80 h-80 bg-slate-500/10 rounded-full blur-[100px]"></div>
            </div>

            {/* Table */}
            <DataTable
                data={planes}
                columns={columns}
                loading={loading}
                searchable
                searchPlaceholder="Buscar planes por nombre o código..."
            />

            {/* Modal */}
            {modalOpen && (
                <PlanModal
                    plan={selectedPlan}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
