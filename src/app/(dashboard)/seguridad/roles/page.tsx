'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { RolesUseCases } from '@/modules/seguridad/application/useCases/RolesUseCases';
import { Rol } from '@/modules/seguridad/domain/types';
import { useToast } from '@/shared/context/ToastContext';

export default function RolesPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [roles, setRoles] = useState<Rol[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarRoles();
    }, []);

    const cargarRoles = async () => {
        try {
            setLoading(true);
            const data = await RolesUseCases.listarRoles();
            setRoles(data);
        } catch (error) {
            console.error(error);
            showToast('Error al cargar roles', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (id: string, nombre: string) => {
        if (!confirm(`¿Estás seguro de eliminar el rol "${nombre}"?`)) return;

        try {
            await RolesUseCases.eliminarRol(id);
            showToast('Rol eliminado exitosamente', 'success');
            cargarRoles();
        } catch (error: any) {
            showToast(error.message || 'Error al eliminar rol', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="text-sri-blue" /> Roles y Permisos
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gestione los roles y niveles de acceso del sistema.</p>
                </div>
                <Button onClick={() => router.push('/seguridad/roles/nuevo')}>
                    <Plus size={18} className="mr-2" /> Nuevo Rol
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                        <tr>
                            <th className="p-4">Rol</th>
                            <th className="p-4">Descripción</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={3} className="p-8 text-center text-slate-400">Cargando roles...</td></tr>
                        ) : roles.length === 0 ? (
                            <tr><td colSpan={3} className="p-8 text-center text-slate-400">No hay roles registrados.</td></tr>
                        ) : (
                            roles.map((rol) => (
                                <tr key={rol.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-800">{rol.nombre}</td>
                                    <td className="p-4 text-slate-500">{rol.descripcion}</td>
                                    <td className="p-4 flex justify-center gap-2">
                                        <button
                                            onClick={() => router.push(`/seguridad/roles/${rol.id}`)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar Permisos"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleEliminar(rol.id, rol.nombre)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar Rol"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
