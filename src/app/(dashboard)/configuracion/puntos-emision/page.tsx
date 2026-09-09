'use client';

import { useState, useEffect, useCallback } from 'react';
import { Monitor, Plus, Edit2 } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { useConfiguracion } from '@/modules/configuracion/hooks/useConfiguracion';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { PuntoEmisionModal } from '@/modules/configuracion/ui/components/PuntoEmisionModal';
import { PuntoEmision } from '@/modules/configuracion/domain/types';

export default function PuntosEmisionConfigPage() {
    const { currentEmpresa } = useEmpresa();
    const { puntosEmision, sucursales, cargarPuntosEmision, cargarSucursales } = useConfiguracion();

    const [showModalPunto, setShowModalPunto] = useState(false);
    const [selectedPunto, setSelectedPunto] = useState<PuntoEmision | undefined>(undefined);

    const loadData = useCallback(async () => {
        if (!currentEmpresa) return;
        await Promise.all([
            cargarPuntosEmision(),
            cargarSucursales()
        ]);
    }, [currentEmpresa, cargarPuntosEmision, cargarSucursales]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const puntosColumns: Column<PuntoEmision>[] = [
        {
            header: 'Sucursal',
            cell: (row) => {
                const suc = sucursales.find(s => s.id === row.sucursalId);
                return <span className="text-xs text-slate-500">{suc?.nombre || 'N/A'}</span>;
            }
        },
        {
            header: 'Código',
            accessorKey: 'codigo',
            cell: (row) => <span className="font-mono font-bold text-slate-700">{row.codigo}</span>
        },
        { header: 'Nombre Caja', accessorKey: 'nombre' },
        {
            header: 'Secuenciales',
            cell: (row) => (
                <div className="flex flex-col gap-1 text-[10px] text-slate-500">
                    {row.secuenciales.map(s => (
                        <div key={s.tipoComprobante} className="flex justify-between w-32">
                            <span>{s.tipoComprobante}:</span>
                            <span className="font-mono font-bold">{s.secuencialActual}</span>
                        </div>
                    ))}
                </div>
            )
        },
        {
            header: 'Acciones',
            className: 'text-center',
            cell: (row) => (
                <div className="flex justify-center gap-2">
                    <button onClick={() => { setSelectedPunto(row); setShowModalPunto(true); }} className="p-1.5 text-slate-400 hover:text-sri-blue rounded"><Edit2 size={16} /></button>
                </div>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Monitor className="text-sri-blue" /> Puntos de Emisión
                </h1>
                <p className="text-slate-500 text-sm mt-1">Gestione los puntos desde donde se emiten comprobantes.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 min-h-[500px]">
                <div className="space-y-6">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-lg font-bold text-slate-800">Puntos de Emisión</h3>
                        <Button size="sm" onClick={() => { setSelectedPunto(undefined); setShowModalPunto(true); }} className="flex items-center gap-1">
                            <Plus size={16} /> Nuevo Punto
                        </Button>
                    </div>
                    <DataTable
                        data={puntosEmision}
                        columns={puntosColumns}
                        itemsPerPage={10}
                    />
                </div>
            </div>

            {showModalPunto && (
                <PuntoEmisionModal
                    onClose={() => setShowModalPunto(false)}
                    onSave={loadData}
                    sucursales={sucursales}
                    puntoEditar={selectedPunto}
                />
            )}
        </div>
    );
}
