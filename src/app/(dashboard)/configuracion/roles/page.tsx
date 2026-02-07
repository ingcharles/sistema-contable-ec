'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, Lock } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import RoleModal from '@/modules/configuracion/ui/components/RoleModal';

interface Permiso {
    id: string;
    codigo: string;
    nombre: string;
    descripcion: string;
}

interface Rol {
    id: string;
    nombre: string;
    descripcion: string;
    permisos: Permiso[];
    createdAt: string;
}

export default function RolesPage() {
    const { currentEmpresa } = useEmpresa();
    const [roles, setRoles] = useState<Rol[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRol, setSelectedRol] = useState<Rol | null>(null);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const response = await fetch('/api/configuracion/roles');
            const data = await response.json();
            setRoles(data.roles || []);
        } catch (error) {
            console.error('Error cargando roles:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentEmpresa?.id]);

    const handleCreate = () => {
        setSelectedRol(null);
        setModalOpen(true);
    };

    const handleEdit = (rol: Rol) => {
        setSelectedRol(rol);
        setModalOpen(true);
    };

    const handleDelete = async (rol: Rol) => {
        if (!confirm(`¿Está seguro de eliminar el rol "${rol.nombre}"?`)) return;

        try {
            const response = await fetch(`/api/configuracion/roles/${rol.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Error al eliminar el rol');
                return;
            }

            await loadData();
        } catch (error) {
            console.error('Error eliminando rol:', error);
            alert('Error al eliminar el rol');
        }
    };

    const handleSave = async () => {
        setModalOpen(false);
        await loadData();
    };

    const columns: Column<Rol>[] = [
        {
            header: 'Rol',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
                        <Shield className="text-white" size={18} />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 uppercase text-sm">{row.nombre}</p>
                        <p className="text-xs text-slate-500">{row.descripcion || 'Sin descripción'}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Permisos Asignados',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Lock size={14} className="text-slate-400" />
                    <span className="font-bold text-indigo-600">{row.permisos?.length || 0}</span>
                    <span className="text-xs text-slate-500">permisos</span>
                </div>
            )
        },
        {
            header: 'Acciones',
            cell: (row) => (
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => handleEdit(row)}
                        className="h-8 px-3 text-xs"
                    >
                        <Edit size={14} />
                        Editar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleDelete(row)}
                        className="h-8 px-3 text-xs"
                    >
                        <Trash2 size={14} />
                        Eliminar
                    </Button>
                </div>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                <Shield size={32} className="text-purple-300" />
                                Gestión de Roles
                            </h1>
                            <p className="text-indigo-200 text-sm mt-2 font-medium max-w-2xl">
                                Administra los roles del sistema y sus permisos asociados. Define qué funcionalidades puede acceder cada tipo de usuario.
                            </p>
                        </div>
                        <Button
                            onClick={handleCreate}
                            className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold px-6 h-12 rounded-2xl flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Nuevo Rol
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-bold text-indigo-200 uppercase">Total Roles</p>
                            <p className="text-2xl font-black text-white mt-1">{roles.length}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-bold text-indigo-200 uppercase">Roles del Sistema</p>
                            <p className="text-2xl font-black text-purple-300 mt-1">
                                {roles.filter(r => ['SUPERADMIN', 'ADMIN', 'CONTADOR'].includes(r.nombre)).length}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-bold text-indigo-200 uppercase">Roles Personalizados</p>
                            <p className="text-2xl font-black text-emerald-300 mt-1">
                                {roles.filter(r => !['SUPERADMIN', 'ADMIN', 'CONTADOR', 'AUDITOR', 'ASISTENTE', 'VENDEDOR', 'BODEGUERO'].includes(r.nombre)).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute -left-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]"></div>
            </div>

            {/* Table */}
            <DataTable
                data={roles}
                columns={columns}
                loading={loading}
                searchable
                searchPlaceholder="Buscar roles..."
            />

            {/* Modal */}
            {modalOpen && (
                <RoleModal
                    rol={selectedRol}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
