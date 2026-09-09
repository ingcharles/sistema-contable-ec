'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Edit, Trash2, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { TipoContratoEntity } from '@/modules/rrhh/domain/types';
import { RRHHUseCases } from '@/modules/rrhh/application/useCases/RRHHUseCases';
import { TipoContratoModal } from '@/modules/rrhh/ui/components/configuracion/TipoContratoModal';

export default function ContratosPage() {
    const [tipos, setTipos] = useState<TipoContratoEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedTipo, setSelectedTipo] = useState<TipoContratoEntity | undefined>();

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await RRHHUseCases.listarTiposContrato();
            setTipos(data);
        } catch (error) {
            console.error('Error cargando tipos de contrato:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleEdit = (tipo: TipoContratoEntity) => {
        setSelectedTipo(tipo);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este tipo de contrato?')) {
            try {
                const response = await RRHHUseCases.eliminarTipoContrato(id);
                if (response.error) {
                    alert(response.error);
                } else {
                    loadData();
                }
            } catch (error: any) {
                alert(error.message || 'No se pudo eliminar el tipo de contrato');
            }
        }
    };

    const columns: Column<TipoContratoEntity>[] = [
        {
            header: 'Código',
            accessorKey: 'codigo',
            className: 'font-mono font-bold text-sri-blue'
        },
        {
            header: 'Tipo de Contrato',
            cell: (tipo) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{tipo.nombre}</span>
                    {tipo.descripcion && <span className="text-[10px] text-slate-400 truncate max-w-xs">{tipo.descripcion}</span>}
                </div>
            )
        },
        {
            header: 'Req. Fecha Fin',
            cell: (tipo) => (
                <div className="flex items-center gap-2">
                    {tipo.requiereFechaFin ? (
                        <CheckCircle2 size={16} className="text-amber-500" />
                    ) : (
                        <XCircle size={16} className="text-slate-300" />
                    )}
                    <span className="text-xs">{tipo.requiereFechaFin ? 'Sí' : 'No'}</span>
                </div>
            )
        },
        {
            header: 'Estado',
            cell: (tipo) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${tipo.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {tipo.activo ? 'ACTIVO' : 'INACTIVO'}
                </span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (tipo) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => handleEdit(tipo)}
                        className="p-1.5 text-slate-400 hover:text-sri-blue hover:bg-sri-blue/5 rounded-lg transition-all"
                        title="Editar"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(tipo.id)}
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
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tipos de Contrato</h1>
                        <p className="text-slate-500 text-xs mt-0.5 font-medium">Configuración de modalidades contractuales por empresa.</p>
                    </div>
                </div>

                <Button
                    onClick={() => { setSelectedTipo(undefined); setShowModal(true); }}
                    className="flex items-center gap-2 shadow-lg shadow-sri-blue/20"
                >
                    <Plus size={18} /> Nuevo Tipo
                </Button>
            </div>

            <DataTable
                data={tipos}
                columns={columns}
                loading={loading}
                searchable
                searchPlaceholder="Buscar modalidad..."
                emptyMessage="No se han configurado modalidades de contrato todavía."
            />

            {showModal && (
                <TipoContratoModal
                    tipo={selectedTipo}
                    onClose={() => setShowModal(false)}
                    onSave={loadData}
                />
            )}
        </div>
    );
}
