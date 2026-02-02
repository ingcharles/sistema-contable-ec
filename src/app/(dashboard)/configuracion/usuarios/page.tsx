'use client';

import { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { UsuarioSistema } from '@/modules/configuracion/domain/types';

export default function UsuariosConfigPage() {
    const { currentEmpresa } = useEmpresa();
    const [usuarios] = useState<UsuarioSistema[]>([]); // Mock por ahora como estaba en page.tsx

    const userColumns: Column<UsuarioSistema>[] = [
        { header: 'Nombre', accessorKey: 'nombreCompleto', sortable: true },
        { header: 'Email', accessorKey: 'email' },
        {
            header: 'Rol',
            accessorKey: 'rol',
            cell: (row) => <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600">{row.rol}</span>
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            cell: (row) => (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${row.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${row.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {row.estado}
                </span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-center',
            cell: () => <button className="text-sri-blue hover:underline text-xs font-medium">Editar</button>
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Users className="text-sri-blue" /> Usuarios y Roles
                </h1>
                <p className="text-slate-500 text-sm mt-1">Gestione los accesos y permisos de su equipo.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 min-h-[500px]">
                <div className="space-y-6">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-lg font-bold text-slate-800">Gestión de Accesos</h3>
                        <Button size="sm" className="flex items-center gap-1">
                            <Plus size={16} /> Nuevo Usuario
                        </Button>
                    </div>
                    <DataTable
                        data={usuarios}
                        columns={userColumns}
                        itemsPerPage={10}
                    />
                </div>
            </div>
        </div>
    );
}
