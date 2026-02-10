'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Key, CheckCircle, XCircle } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { UsuarioSistema } from '@/modules/configuracion/domain/types';
import { UsuariosUseCases } from '@/modules/shared/application/useCases/UsuariosUseCases';
import { RolesUseCases } from '@/modules/seguridad/application/useCases/RolesUseCases';
import { Rol } from '@/modules/seguridad/domain/types';
import { useToast } from '@/shared/context/ToastContext';
import { Modal } from '@/shared/ui/Modal';

interface Usuario extends UsuarioSistema {
    roles: string[]; // Nombres de roles
}

export default function UsuariosPage() {
    const { currentEmpresa } = useEmpresa();
    const { showToast } = useToast();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<Usuario> | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (currentEmpresa) {
            cargarDatos();
        }
    }, [currentEmpresa?.id]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [usersData, rolesData] = await Promise.all([
                UsuariosUseCases.listarUsuarios(),
                RolesUseCases.listarRoles()
            ]);
            setUsuarios(usersData.usuarios || []);
            setRoles(rolesData || []);
        } catch (error) {
            console.error(error);
            showToast('Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGuardar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            // Si es edición o creación
            // Nota: La API actual de guardarUsuario soporta `roles` como array de nombres de roles
            // Deberíamos adaptar la API si queremos usar IDs, pero el frontend envía lo que la API espera.
            // administracion/usuarios/route.ts espera `roles` (array string names).

            // Mapear ID de rol seleccionado a Nombre para la API actual
            const rolId = currentUser?.rol; // Aquí usamos el state 'rol' para guardar el ID seleccionado
            const selectedRole = roles.find(r => r.nombre === rolId); // Ojo: currentUser.rol en el form guardará el NOMBRE si el value es nombre

            // For now, let's use the role NAME as the value in the select to match API expectation

            await UsuariosUseCases.guardarUsuario({
                ...currentUser,
                roles: currentUser?.roles || [] // Array de roles
            });

            showToast('Usuario guardado exitosamente', 'success');
            setModalOpen(false);
            cargarDatos();
        } catch (error: any) {
            showToast(error.message || 'Error al guardar usuario', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEliminar = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await UsuariosUseCases.eliminarUsuario(id);
            showToast('Usuario eliminado', 'success');
            cargarDatos();
        } catch (error: any) {
            showToast(error.message, 'error');
        }
    };

    const openModal = (user?: Usuario) => {
        if (user) {
            // Edición
            setCurrentUser({
                ...user,
                // Si la API devuelve roles como array de strings, tomamos el primero para el select simple
                // O soportamos múltiples. Por simplicidad UI, asumimos 1 rol principal.
                rol: user.roles && user.roles.length > 0 ? user.roles[0] : (user as any).rol // Fallback
            } as any);
        } else {
            // Nuevo
            setCurrentUser({
                nombre: '',
                email: '',
                password: '',
                activo: true,
                roles: ['CONTADOR'] // Default
            } as any);
        }
        setModalOpen(true);
    };

    const userColumns: Column<Usuario>[] = [
        { header: 'Nombre', accessorKey: 'nombre', sortable: true },
        { header: 'Email', accessorKey: 'email' },
        {
            header: 'Roles',
            accessorKey: 'roles',
            cell: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.roles && row.roles.map((rol, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">
                            {rol}
                        </span>
                    ))}
                </div>
            )
        },
        {
            header: 'Estado',
            accessorKey: 'activo',
            cell: (row) => (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${row.activo ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {row.activo ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {row.activo ? 'ACTIVO' : 'INACTIVO'}
                </span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-center',
            cell: (row) => (
                <div className="flex justify-center gap-2">
                    <button onClick={() => openModal(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                        <Edit size={16} />
                    </button>
                    {/* Eliminar (deshabilitado para uno mismo o lógica extra) */}
                    <button onClick={() => handleEliminar(row.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-sri-blue" /> Gestión de Usuarios
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Administre los usuarios y sus roles asignados.</p>
                </div>
                <Button onClick={() => openModal()} className="flex items-center gap-2">
                    <Plus size={18} /> Nuevo Usuario
                </Button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <DataTable
                    data={usuarios}
                    columns={userColumns}
                    itemsPerPage={10}
                    loading={loading}
                />
            </div>

            {/* Modal Crear/Editar */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={currentUser?.id ? 'Editar Usuario' : 'Nuevo Usuario'}
                width="max-w-md"
            >
                <form onSubmit={handleGuardar} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                        <input
                            type="text"
                            required
                            value={currentUser?.nombre || ''}
                            onChange={e => setCurrentUser({ ...currentUser, nombre: e.target.value })}
                            className="w-full border rounded-lg p-2.5 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            disabled={!!currentUser?.id} // No editar email
                            value={currentUser?.email || ''}
                            onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })}
                            className="w-full border rounded-lg p-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                        />
                    </div>

                    {!currentUser?.id && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                            <input
                                type="password"
                                required={!currentUser?.id}
                                value={currentUser?.password || ''} // @ts-ignore
                                onChange={e => setCurrentUser({ ...currentUser, password: e.target.value })}
                                className="w-full border rounded-lg p-2.5 text-sm"
                                placeholder="******"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                        <select
                            value={currentUser?.roles?.[0] || ''}
                            onChange={e => setCurrentUser({ ...currentUser, roles: [e.target.value] })}
                            className="w-full border rounded-lg p-2.5 text-sm"
                        >
                            {roles.map(rol => (
                                <option key={rol.id} value={rol.nombre}>
                                    {rol.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="activo"
                            checked={currentUser?.activo ?? true}
                            onChange={e => setCurrentUser({ ...currentUser, activo: e.target.checked })}
                            className="rounded text-sri-blue focus:ring-sri-blue"
                        />
                        <label htmlFor="activo" className="text-sm text-slate-700 cursor-pointer">Usuario Activo</label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
