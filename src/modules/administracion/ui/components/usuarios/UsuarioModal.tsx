'use client';

import { useState } from 'react';
import { Save, User, Mail, Shield, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { UsuariosUseCases } from '@/modules/shared/application/useCases/systemUseCases';

interface UsuarioModalProps {
    onClose: () => void;
    onSave: () => void;
    usuarioEditar?: any;
}

const ROLES_DISPONIBLES = [
    { id: 'SUPERADMIN', nombre: 'Super Administrador', color: 'text-purple-600 bg-purple-50' },
    { id: 'ADMIN', nombre: 'Administrador', color: 'text-blue-600 bg-blue-50' },
    { id: 'CONTADOR', nombre: 'Contador', color: 'text-emerald-600 bg-emerald-50' },
    { id: 'AUDITOR', nombre: 'Auditor', color: 'text-amber-600 bg-amber-50' },
    { id: 'ASISTENTE', nombre: 'Asistente', color: 'text-slate-600 bg-slate-50' }
];

export const UsuarioModal = ({ onClose, onSave, usuarioEditar }: UsuarioModalProps) => {
    const [formData, setFormData] = useState({
        nombre: usuarioEditar?.nombre || '',
        email: usuarioEditar?.email || '',
        password: '',
        roles: usuarioEditar?.roles || ['ASISTENTE'],
        activo: usuarioEditar ? usuarioEditar.activo : true
    });

    const [guardando, setGuardando] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!formData.nombre || !formData.email || (!usuarioEditar && !formData.password)) {
            setErrorValidacion('Complete los campos obligatorios');
            return;
        }

        setGuardando(true);
        setErrorValidacion(null);
        try {
            await UsuariosUseCases.guardarUsuario({
                ...formData,
                id: usuarioEditar?.id
            });
            onSave();
            onClose();
        } catch (error: any) {
            console.error(error);
            setErrorValidacion(error.message || 'Error al guardar usuario');
        } finally {
            setGuardando(false);
        }
    };

    const toggleRol = (rolId: string) => {
        const currentRoles = [...formData.roles];
        const index = currentRoles.indexOf(rolId);
        if (index > -1) {
            if (currentRoles.length > 1) {
                currentRoles.splice(index, 1);
            }
        } else {
            currentRoles.push(rolId);
        }
        setFormData({ ...formData, roles: currentRoles });
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleSubmit}
            isLoading={guardando}
            submitLabel={usuarioEditar ? 'Actualizar Usuario' : 'Crear Usuario'}
            submitIcon={<Save size={18} />}
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={usuarioEditar ? 'Editar Usuario' : 'Nuevo Usuario'}
            description="Gestione los datos de acceso y roles del usuario."
            icon={<User size={24} />}
            footer={footer}
            size="md"
        >
            <div className="space-y-6">
                {errorValidacion && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center gap-3">
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-sm font-medium">{errorValidacion}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <User size={14} className="text-sri-blue" /> Nombre Completo *
                        </label>
                        <input
                            type="text"
                            value={formData.nombre}
                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all text-sm font-medium"
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Mail size={14} className="text-sri-blue" /> Correo Electrónico *
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all text-sm font-medium"
                            placeholder="juan.perez@ejemplo.com"
                        />
                    </div>

                    {!usuarioEditar && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Shield size={14} className="text-sri-blue" /> Contraseña Temporal *
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all text-sm font-medium"
                                placeholder="Mínimo 8 caracteres"
                            />
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Shield size={14} className="text-sri-blue" /> Roles Asignados *
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {ROLES_DISPONIBLES.map((rol) => {
                                const isSelected = formData.roles.includes(rol.id);
                                return (
                                    <button
                                        key={rol.id}
                                        type="button"
                                        onClick={() => toggleRol(rol.id)}
                                        className={`
                                            flex items-center justify-between p-3 rounded-xl border transition-all
                                            ${isSelected
                                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100'
                                                : 'bg-white border-slate-100 hover:border-slate-200'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${rol.color}`}>
                                                <Shield size={16} />
                                            </div>
                                            <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                                                {rol.nombre}
                                            </span>
                                        </div>
                                        {isSelected && <CheckCircle2 size={18} className="text-blue-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.activo ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${formData.activo ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                    {formData.activo ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                </div>
                                <div className="text-left">
                                    <h4 className={`text-xs font-black uppercase tracking-tight ${formData.activo ? 'text-emerald-800' : 'text-red-800'}`}>
                                        {formData.activo ? 'Usuario Activo' : 'Usuario Inactivo'}
                                    </h4>
                                    <p className="text-[10px] font-medium text-slate-500">
                                        {formData.activo ? 'El usuario puede acceder al sistema' : 'El acceso está bloqueado'}
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
