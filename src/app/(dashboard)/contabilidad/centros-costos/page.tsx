'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { CentroCosto } from '@/modules/contabilidad/domain/types';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { CentroCostoModal } from '@/modules/contabilidad/ui/components/CentroCostoModal';
import { Button } from '@/shared/ui/Button';
import { DataTable } from '@/shared/ui/DataTable';

export default function CentrosCostosPage() {
    const { currentEmpresa } = useEmpresa();
    const [centros, setCentros] = useState<CentroCosto[]>([]);
    const [showModalCentro, setShowModalCentro] = useState(false);
    const [centroSeleccionado, setCentroSeleccionado] = useState<CentroCosto | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const dataCentros = await ContabilidadUseCases.listarCentrosCostos();
            setCentros(dataCentros);
        } catch (error) {
            console.error('Error cargando centros costos:', error);
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
                    <h1 className="text-2xl font-bold text-slate-800">Centros de Costos</h1>
                    <p className="text-slate-500 text-sm mt-1">Estructura para distribución de gastos e ingresos por proyecto o departamento.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-end items-center bg-slate-50">
                    <Button onClick={() => {
                        setCentroSeleccionado(null);
                        setShowModalCentro(true);
                    }} className="flex items-center gap-2">
                        <Plus size={16} /> Nuevo Centro
                    </Button>
                </div>
                <DataTable
                    data={centros}
                    loading={loading}
                    columns={[
                        {
                            header: 'Código',
                            accessorKey: 'codigo',
                            sortable: true,
                            className: 'font-mono font-bold text-slate-700'
                        },
                        {
                            header: 'Nombre del Centro / Proyecto',
                            accessorKey: 'nombre',
                            sortable: true,
                            cell: (row) => (
                                <div className="flex items-center gap-2">
                                    {row.nivel > 1 && <div className="w-4 border-l-2 border-b-2 border-slate-300 h-4 rounded-bl-md ml-2"></div>}
                                    <span className={row.nivel === 1 ? 'font-bold text-slate-800' : 'text-slate-600'}>{row.nombre}</span>
                                </div>
                            )
                        },
                        {
                            header: 'Nivel',
                            accessorKey: 'nivel',
                            sortable: true,
                            className: 'text-center',
                            cell: (row) => <span className="text-xs bg-slate-50 rounded-lg px-2 py-1">{row.nivel}</span>
                        },
                        {
                            header: 'Estado',
                            accessorKey: 'activo',
                            className: 'text-center',
                            cell: (row) => (
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {row.activo ? 'ACTIVO' : 'INACTIVO'}
                                </span>
                            )
                        },
                        {
                            header: 'Acciones',
                            className: 'text-center',
                            cell: (row) => (
                                <div className="flex justify-center gap-2">
                                    <button
                                        onClick={() => {
                                            setCentroSeleccionado(row);
                                            setShowModalCentro(true);
                                        }}
                                        className="p-1.5 text-slate-500 hover:text-sri-blue hover:bg-blue-50 rounded transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (confirm('¿Está seguro de eliminar este centro de costo?')) {
                                                try {
                                                    await ContabilidadUseCases.eliminarCentroCosto(row.id);
                                                    loadData();
                                                } catch (error) {
                                                    console.error('Error al eliminar:', error);
                                                    alert('No se pudo eliminar el centro de costo');
                                                }
                                            }
                                        }}
                                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )
                        }
                    ]}
                    itemsPerPage={20}
                    searchable={true}
                    searchKeys={['codigo', 'nombre']}
                    searchPlaceholder="Buscar por código o nombre..."
                />
            </div>

            {showModalCentro && currentEmpresa && (
                <CentroCostoModal
                    onClose={() => setShowModalCentro(false)}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                    centroCosto={centroSeleccionado}
                />
            )}
        </div>
    );
}
