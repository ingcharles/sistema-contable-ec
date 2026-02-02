'use client';

import { useState, useEffect, useCallback } from 'react';
import { Database, Plus, Edit2, Trash2 } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { useConfiguracion } from '@/modules/configuracion/hooks/useConfiguracion';
import { Button } from '@/shared/ui/Button';
import { SucursalModal } from '@/modules/configuracion/ui/components/SucursalModal';
import { Sucursal } from '@/modules/configuracion/domain/types';

export default function SucursalesConfigPage() {
    const { currentEmpresa } = useEmpresa();
    const { sucursales, cargarSucursales } = useConfiguracion();

    const [showModalSuc, setShowModalSuc] = useState(false);
    const [selectedSuc, setSelectedSuc] = useState<Sucursal | undefined>(undefined);

    const loadData = useCallback(async () => {
        if (!currentEmpresa) return;
        await cargarSucursales();
    }, [currentEmpresa, cargarSucursales]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Database className="text-sri-blue" /> Sucursales
                </h1>
                <p className="text-slate-500 text-sm mt-1">Administre los establecimientos físicos de su empresa.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 min-h-[500px]">
                <div className="space-y-6">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-lg font-bold text-slate-800">Sucursales y Establecimientos</h3>
                        <Button size="sm" onClick={() => { setSelectedSuc(undefined); setShowModalSuc(true); }} className="flex items-center gap-1">
                            <Plus size={16} /> Añadir Sucursal
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {sucursales.map(suc => (
                            <div key={suc.id} className="p-4 border rounded-xl hover:border-sri-blue transition-colors flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800">{suc.codigo} - {suc.nombre}</span>
                                        {suc.esMatriz && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">MATRIZ</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{suc.direccion}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setSelectedSuc(suc); setShowModalSuc(true); }}
                                        className="p-2 text-slate-400 hover:text-sri-blue hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    {!suc.esMatriz && (
                                        <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showModalSuc && (
                <SucursalModal
                    onClose={() => setShowModalSuc(false)}
                    onSave={loadData}
                    sucursalEditar={selectedSuc}
                />
            )}
        </div>
    );
}
