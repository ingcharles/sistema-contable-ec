'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Plus, Edit2, Trash2 } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { useConfiguracion } from '@/modules/configuracion/hooks/useConfiguracion';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { RetencionModal } from '@/modules/configuracion/ui/components/RetencionModal';
import { CodigoRetencion } from '@/modules/configuracion/domain/types';

export default function ImpuestosConfigPage() {
    const { currentEmpresa } = useEmpresa();
    const { retenciones, cargarRetenciones } = useConfiguracion();

    const [showModalRet, setShowModalRet] = useState(false);
    const [selectedRet, setSelectedRet] = useState<CodigoRetencion | undefined>(undefined);

    const loadData = useCallback(async () => {
        if (!currentEmpresa) return;
        await cargarRetenciones();
    }, [currentEmpresa, cargarRetenciones]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const impuestosColumns: Column<CodigoRetencion>[] = [
        { header: 'Código', accessorKey: 'codigo', className: 'font-mono text-slate-700' },
        { header: 'Concepto', accessorKey: 'concepto', className: 'max-w-md truncate' },
        {
            header: 'Porcentaje',
            accessorKey: 'porcentaje',
            className: 'text-right font-bold',
            cell: (row) => `${row.porcentaje}%`
        },
        {
            header: 'Tipo',
            accessorKey: 'tipo',
            cell: (row) => <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.tipo === 'RENTA' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{row.tipo}</span>
        },
        {
            header: 'Acciones',
            className: 'text-center',
            cell: (row) => (
                <div className="flex justify-center gap-2">
                    <button onClick={() => { setSelectedRet(row); setShowModalRet(true); }} className="p-1.5 text-slate-400 hover:text-sri-blue rounded"><Edit2 size={16} /></button>
                    <button className="p-1.5 text-slate-400 hover:text-red-600 rounded"><Trash2 size={16} /></button>
                </div>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="text-sri-blue" /> Impuestos y Retenciones
                </h1>
                <p className="text-slate-500 text-sm mt-1">Configure los códigos de retención y tarifas impositivas.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 min-h-[500px]">
                <div className="space-y-6">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-lg font-bold text-slate-800">Códigos de Retención</h3>
                        <Button size="sm" onClick={() => { setSelectedRet(undefined); setShowModalRet(true); }} className="flex items-center gap-1">
                            <Plus size={16} /> Nuevo Código
                        </Button>
                    </div>
                    <DataTable
                        data={retenciones}
                        columns={impuestosColumns}
                        itemsPerPage={10}
                    />
                </div>
            </div>

            {showModalRet && (
                <RetencionModal
                    onClose={() => setShowModalRet(false)}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                    retencionEditar={selectedRet}
                />
            )}
        </div>
    );
}
