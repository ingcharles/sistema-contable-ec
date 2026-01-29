'use client';

import { useState } from 'react';
import {
    MoreVertical,
    Shield,
    Building2,
    CheckCircle2,
    XCircle,
    Edit,
    Settings
} from 'lucide-react';
import { DataTable, Column } from '@/shared/ui/DataTable';

interface Usuario {
    id: string;
    nombre: string;
    email: string;
    roles: string[];
    activo: boolean;
    cantidadPuntos: number;
    puntosAsignados: Array<{
        puntoEmisionId: string;
        codigo: string;
        nombre: string;
        activo: boolean;
        esPrincipal: boolean;
    }>;
}

interface UsuariosTableProps {
    usuarios: Usuario[];
    loading: boolean;
    onEdit: (usuario: Usuario) => void;
    onAssignPoints: (usuario: Usuario) => void;
}

export function UsuariosTable({ usuarios, loading, onEdit, onAssignPoints }: UsuariosTableProps) {
    const columns: Column<Usuario>[] = [
        {
            header: 'Usuario',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {row.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-medium text-slate-900">{row.nombre}</div>
                        <div className="text-xs text-slate-500">{row.email}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Roles',
            cell: (row) => (
                <div className="flex gap-1 flex-wrap">
                    {row.roles.map((rol) => (
                        <span
                            key={rol}
                            className={`
                                px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                ${rol === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700' :
                                    rol === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-600'}
                            `}
                        >
                            {rol}
                        </span>
                    ))}
                </div>
            )
        },
        {
            header: 'Puntos Asignados',
            cell: (row) => (
                <div className="flex flex-col gap-1">
                    {row.puntosAsignados && row.puntosAsignados.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {row.puntosAsignados.slice(0, 2).map((punto) => (
                                <span
                                    key={punto.puntoEmisionId}
                                    className={`
                                        flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border
                                        ${punto.esPrincipal
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                            : 'bg-white border-slate-200 text-slate-600'}
                                    `}
                                    title={punto.nombre}
                                >
                                    <span className="font-mono font-bold">{punto.codigo}</span>
                                    {punto.esPrincipal && <CheckCircle2 size={10} />}
                                </span>
                            ))}
                            {row.puntosAsignados.length > 2 && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500">
                                    +{row.puntosAsignados.length - 2}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-xs text-orange-500 flex items-center gap-1">
                            <Building2 size={12} /> Sin asignar
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Estado',
            accessorKey: 'activo',
            cell: (row) => (
                <span className={`
                    inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                    ${row.activo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}
                `}>
                    {row.activo ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {row.activo ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => onAssignPoints(row)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Asignar Puntos de Emisión"
                    >
                        <Settings size={18} />
                    </button>
                    <button
                        onClick={() => onEdit(row)}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar Usuario"
                    >
                        <Edit size={18} />
                    </button>
                </div>
            )
        }
    ];

    return <DataTable columns={columns} data={usuarios} loading={loading} />;
}
