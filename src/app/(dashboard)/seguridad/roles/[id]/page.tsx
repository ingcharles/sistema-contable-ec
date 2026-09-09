'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, ArrowLeft, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { RolesUseCases } from '@/modules/seguridad/application/useCases/RolesUseCases';
import { Rol, Permiso } from '@/modules/seguridad/domain/types';
import { useToast } from '@/shared/context/ToastContext';

export default function RoleFormPage() {
    const router = useRouter();
    const params = useParams();
    const { showToast } = useToast();
    const roleId = params.id === 'nuevo' ? null : params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<Rol>>({ nombre: '', descripcion: '' });
    const [permisos, setPermisos] = useState<Permiso[]>([]);
    const [selectedPermisos, setSelectedPermisos] = useState<Set<string>>(new Set());

    // Group permissions by module
    const permisosPorModulo = permisos.reduce((acc, p) => {
        if (!acc[p.modulo]) acc[p.modulo] = [];
        acc[p.modulo].push(p);
        return acc;
    }, {} as Record<string, Permiso[]>);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const allPermisos = await RolesUseCases.listarPermisos();
            setPermisos(allPermisos);

            if (roleId) {
                const rol = await RolesUseCases.obtenerRol(roleId);
                setFormData({ nombre: rol.nombre, descripcion: rol.descripcion, id: rol.id });
                if (rol.permisos) {
                    setSelectedPermisos(new Set(rol.permisos.map((p: Permiso) => p.id)));
                }
            }
        } catch (error) {
            console.error(error);
            showToast('Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePermiso = (id: string) => {
        const newSet = new Set(selectedPermisos);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedPermisos(newSet);
    };

    const handleSelectModule = (modulo: string, select: boolean) => {
        const newSet = new Set(selectedPermisos);
        permisosPorModulo[modulo].forEach(p => {
            if (select) newSet.add(p.id);
            else newSet.delete(p.id);
        });
        setSelectedPermisos(newSet);
    };

    const handleGuardar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await RolesUseCases.guardarRol({
                ...formData,
                permisosIds: Array.from(selectedPermisos)
            });
            showToast('Rol guardado exitosamente', 'success');
            router.push('/seguridad/roles');
        } catch (error: any) {
            showToast(error.message || 'Error al guardar rol', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando...</div>;

    return (
        <form onSubmit={handleGuardar} className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => router.back()} className="text-slate-400 hover:text-slate-600">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            {roleId ? 'Editar Rol' : 'Nuevo Rol'}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Configuración de permisos y accesos.</p>
                    </div>
                </div>
                <Button type="submit" disabled={saving} className="flex items-center gap-2">
                    <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Datos Básicos */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
                        <h3 className="font-bold text-slate-700 border-b pb-2">Información Básica</h3>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Nombre del Rol</label>
                            <input
                                type="text"
                                required
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full border rounded-lg p-2.5 text-sm uppercase"
                                placeholder="EJ: VENDEDOR"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Descripción</label>
                            <textarea
                                value={formData.descripcion || ''}
                                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                className="w-full border rounded-lg p-2.5 text-sm h-32 resize-none"
                                placeholder="Descripción de las responsabilidades..."
                            />
                        </div>
                    </div>
                </div>

                {/* Permisos */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
                        <h3 className="font-bold text-slate-700 border-b pb-2">Permisos del Sistema</h3>

                        {Object.entries(permisosPorModulo).map(([modulo, listaPermisos]) => {
                            const allSelected = listaPermisos.every(p => selectedPermisos.has(p.id));
                            const someSelected = listaPermisos.some(p => selectedPermisos.has(p.id));

                            return (
                                <div key={modulo} className="border rounded-lg overflow-hidden">
                                    <div className="bg-slate-50 p-3 flex justify-between items-center border-b">
                                        <h4 className="font-bold text-xs text-sri-blue tracking-wider">{modulo}</h4>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectModule(modulo, !allSelected)}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            {allSelected ? 'Desmarcar todo' : 'Marcar todo'}
                                        </button>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {listaPermisos.map(permiso => (
                                            <label key={permiso.id} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded select-none">
                                                <div
                                                    className={`mt-0.5 w-5 h-5 border rounded flex items-center justify-center transition-colors ${selectedPermisos.has(permiso.id)
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'border-slate-300 bg-white text-transparent'
                                                        }`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleTogglePermiso(permiso.id);
                                                    }}
                                                >
                                                    <CheckSquare size={14} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-slate-700">{permiso.nombre}</div>
                                                    {permiso.descripcion && (
                                                        <div className="text-xs text-slate-400">{permiso.descripcion}</div>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </form>
    );
}
