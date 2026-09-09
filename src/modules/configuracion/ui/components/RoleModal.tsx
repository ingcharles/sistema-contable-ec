'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, Check } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';

interface Permiso {
    id: string;
    codigo: string;
    nombre: string;
    descripcion: string;
}

interface Rol {
    id?: string;
    nombre: string;
    descripcion: string;
    permisos: Permiso[];
}

interface RoleModalProps {
    rol: Rol | null;
    onClose: () => void;
    onSave: () => void;
}

export default function RoleModal({ rol, onClose, onSave }: RoleModalProps) {
    const [nombre, setNombre] = useState(rol?.nombre || '');
    const [descripcion, setDescripcion] = useState(rol?.descripcion || '');
    const [permisosPorModulo, setPermisosPorModulo] = useState<Record<string, Permiso[]>>({});
    const [permisosSeleccionados, setPermisosSeleccionados] = useState<Set<string>>(
        new Set(rol?.permisos.map(p => p.id) || [])
    );
    const [loading, setLoading] = useState(false);
    const [loadingPermisos, setLoadingPermisos] = useState(true);

    useEffect(() => {
        loadPermisos();
    }, []);

    const loadPermisos = async () => {
        try {
            const response = await fetch('/api/configuracion/permisos');
            const data = await response.json();
            setPermisosPorModulo(data.permisosPorModulo || {});
        } catch (error) {
            console.error('Error cargando permisos:', error);
        } finally {
            setLoadingPermisos(false);
        }
    };

    const togglePermiso = (permisoId: string) => {
        const newSet = new Set(permisosSeleccionados);
        if (newSet.has(permisoId)) {
            newSet.delete(permisoId);
        } else {
            newSet.add(permisoId);
        }
        setPermisosSeleccionados(newSet);
    };

    const toggleModulo = (modulo: string) => {
        const permisosDelModulo = permisosPorModulo[modulo] || [];
        const todosSeleccionados = permisosDelModulo.every(p => permisosSeleccionados.has(p.id));

        const newSet = new Set(permisosSeleccionados);
        permisosDelModulo.forEach(p => {
            if (todosSeleccionados) {
                newSet.delete(p.id);
            } else {
                newSet.add(p.id);
            }
        });
        setPermisosSeleccionados(newSet);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = rol?.id
                ? `/api/configuracion/roles/${rol.id}`
                : '/api/configuracion/roles';

            const method = rol?.id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre,
                    descripcion,
                    permisos: Array.from(permisosSeleccionados)
                })
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Error al guardar el rol');
                return;
            }

            onSave();
        } catch (error) {
            console.error('Error guardando rol:', error);
            alert('Error al guardar el rol');
        } finally {
            setLoading(false);
        }
    };

    const modulosOrdenados = ['DASHBOARD', 'COMERCIAL', 'FINANCIERO', 'RRHH', 'SISTEMA', 'GENERAL'];
    const moduloLabels: Record<string, string> = {
        DASHBOARD: 'Dashboard',
        COMERCIAL: 'Módulo Comercial',
        FINANCIERO: 'Módulo Financiero',
        RRHH: 'Recursos Humanos',
        SISTEMA: 'Sistema',
        GENERAL: 'General'
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            size="xl"
            title={rol ? 'Editar Rol' : 'Nuevo Rol'}
            description={rol ? 'Modifica los datos y permisos del rol' : 'Crea un nuevo rol y asigna permisos'}
            icon={<Shield size={24} />}
            footer={
                <>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || !nombre || permisosSeleccionados.size === 0}
                    >
                        {loading ? 'Guardando...' : rol ? 'Actualizar Rol' : 'Crear Rol'}
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                {/* Datos básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nombre del Rol *
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                            placeholder="ej: GERENTE"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Descripción
                        </label>
                        <input
                            type="text"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="ej: Gerente General"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                {/* Permisos */}
                <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <Lock size={16} />
                        Permisos Asignados ({permisosSeleccionados.size})
                    </h3>

                    {loadingPermisos ? (
                        <div className="text-center py-8 text-slate-500">
                            Cargando permisos...
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {modulosOrdenados.map(modulo => {
                                const permisos = permisosPorModulo[modulo] || [];
                                if (permisos.length === 0) return null;

                                const todosSeleccionados = permisos.every(p => permisosSeleccionados.has(p.id));
                                const algunosSeleccionados = permisos.some(p => permisosSeleccionados.has(p.id));

                                return (
                                    <div key={modulo} className="border border-slate-200 rounded-2xl p-4">
                                        <div
                                            className="flex items-center justify-between mb-3 cursor-pointer"
                                            onClick={() => toggleModulo(modulo)}
                                        >
                                            <h4 className="font-bold text-slate-800 uppercase text-xs">
                                                {moduloLabels[modulo] || modulo}
                                            </h4>
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${todosSeleccionados
                                                    ? 'bg-indigo-600 border-indigo-600'
                                                    : algunosSeleccionados
                                                        ? 'bg-indigo-300 border-indigo-300'
                                                        : 'border-slate-300'
                                                }`}>
                                                {(todosSeleccionados || algunosSeleccionados) && (
                                                    <Check size={14} className="text-white" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {permisos.map(permiso => (
                                                <label
                                                    key={permiso.id}
                                                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={permisosSeleccionados.has(permiso.id)}
                                                        onChange={() => togglePermiso(permiso.id)}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="text-xs font-medium text-slate-700">
                                                            {permiso.nombre}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500">
                                                            {permiso.descripcion}
                                                        </p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
