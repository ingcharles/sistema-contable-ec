'use client';

import { X, Search, UserPlus, Trash2, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

interface UsuarioAsignado {
    id: string;
    nombre: string;
    email: string;
    esPrincipal: boolean;
    activo: boolean;
}

interface UsuariosAsignadosPanelProps {
    punto: {
        id: string;
        nombre: string;
        codigo: string;
        usuariosAsignados: UsuarioAsignado[];
    };
    onClose: () => void;
    onRemoveUser: (usuarioId: string) => void;
}

export function UsuariosAsignadosPanel({ punto, onClose, onRemoveUser }: UsuariosAsignadosPanelProps) {
    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Usuarios Asignados</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Punto de Emisión: <span className="font-mono font-bold text-slate-700">{punto.codigo}</span>
                        </p>
                        <p className="text-sm font-medium text-slate-900">{punto.nombre}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-medium text-slate-500">
                            {punto.usuariosAsignados?.length || 0} usuarios con acceso
                        </span>
                        <Button size="sm" variant="outline" className="gap-2 text-xs">
                            <UserPlus size={14} />
                            Asignar Usuario
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {punto.usuariosAsignados?.map((usuario) => (
                            <div
                                key={usuario.id}
                                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-white group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                        {usuario.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-900">{usuario.nombre}</span>
                                            {usuario.esPrincipal && (
                                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase">
                                                    Principal
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span>{usuario.email}</span>
                                            {usuario.activo && (
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    Activo ahora
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onRemoveUser(usuario.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remover acceso"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}

                        {(!punto.usuariosAsignados || punto.usuariosAsignados.length === 0) && (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <Shield size={32} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-sm font-medium text-slate-600">No hay usuarios asignados</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Este punto de emisión no puede ser utilizado por nadie.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 text-center">
                    Los cambios en asignaciones se reflejan inmediatamente
                </div>
            </div>
        </>
    );
}
