'use client';

import {
    Building2,
    Users,
    Settings,
    MoreVertical,
    CheckCircle2,
    XCircle,
    FileText
} from 'lucide-react';

interface UsuarioAsignado {
    id: string;
    nombre: string;
    email: string;
    esPrincipal: boolean;
    activo: boolean;
}

interface PuntoEmision {
    id: string;
    codigo: string;
    nombre: string;
    descripcion: string;
    activo: boolean;
    nombreSucursal: string;
    codigoSucursal: string;
    usuariosAsignadosCount: number;
    usuariosAsignados: UsuarioAsignado[];
}

interface PuntoEmisionCardProps {
    punto: PuntoEmision;
    onEdit: (punto: PuntoEmision) => void;
    onViewUsers: (punto: PuntoEmision) => void;
}

export function PuntoEmisionCard({ punto, onEdit, onViewUsers }: PuntoEmisionCardProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="p-5">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold font-mono text-lg">
                            {punto.codigo}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{punto.nombre}</h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Building2 size={12} />
                                <span>{punto.nombreSucursal} ({punto.codigoSucursal})</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => onEdit(punto)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                    {punto.descripcion || 'Sin descripción disponible.'}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div
                        onClick={() => onViewUsers(punto)}
                        className="p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <Users size={14} />
                            <span className="text-xs font-medium">Usuarios</span>
                        </div>
                        <span className="text-lg font-bold text-slate-900">
                            {punto.usuariosAsignadosCount}
                        </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <FileText size={14} />
                            <span className="text-xs font-medium">Estado</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                            {punto.activo ? (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-xs font-bold text-green-700">Activo</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-xs font-bold text-red-700">Inactivo</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Users Preview */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex -space-x-2">
                        {punto.usuariosAsignados?.slice(0, 3).map((user) => (
                            <div
                                key={user.id}
                                className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600"
                                title={user.nombre}
                            >
                                {user.nombre.charAt(0)}
                            </div>
                        ))}
                        {punto.usuariosAsignadosCount > 3 && (
                            <div className="w-7 h-7 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
                                +{punto.usuariosAsignadosCount - 3}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => onViewUsers(punto)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                        Gestionar accesos
                    </button>
                </div>
            </div>
        </div>
    );
}
