'use client';

import { useState } from 'react';
import { X, Save, User, Mail, Shield, Lock } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { UsuarioSistema } from '@/modules/configuracion/domain/types';
import { UsuariosUseCases } from '@/modules/shared/application/useCases/systemUseCases';

interface UsuarioModalProps {
    usuario?: UsuarioSistema;
    onClose: () => void;
    onSave: () => void;
}

export function UsuarioModal({ usuario, onClose, onSave }: UsuarioModalProps) {
    const isEdit = !!usuario;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre: usuario?.nombreCompleto || (usuario as any)?.nombre || '',
        email: usuario?.email || '',
        password: '',
        roles: (usuario as any)?.roles || [usuario?.rol || 'CONTADOR'],
        activo: usuario?.estado === 'ACTIVO' || (usuario as any)?.activo !== false
    });

    const rolesDisponibles = ['ADMIN', 'CONTADOR', 'CAJERO', 'AUDITOR', 'SUPERADMIN'];

    const handleToggleRol = (rol: string) => {
        setFormData(prev => ({
            ...prev,
            roles: prev.roles.includes(rol)
                ? prev.roles.filter((r: string) => r !== rol)
                : [...prev.roles, rol]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await UsuariosUseCases.guardarUsuario({
                id: usuario?.id,
                ...formData
            });
            onSave();
        } catch (error: any) {
            alert('Error al guardar usuario: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sri-blue rounded-lg text-white">
                            <User size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <User size={14} /> Nombre Completo
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Mail size={14} /> Correo Electrónico
                            </label>
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="juan@ejemplo.com"
                                disabled={isEdit}
                            />
                        </div>

                        {!isEdit && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Lock size={14} /> Contraseña
                                </label>
                                <input
                                    required={!isEdit}
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Shield size={14} /> Roles / Permisos
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {rolesDisponibles.map(rol => (
                                    <button
                                        key={rol}
                                        type="button"
                                        onClick={() => handleToggleRol(rol)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${formData.roles.includes(rol)
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                                : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'
                                            }`}
                                    >
                                        {rol}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.activo}
                                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                            <span className="text-sm font-bold text-slate-700">Usuario Activo</span>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" loading={loading} className="flex-1 gap-2 shadow-lg shadow-blue-500/30">
                            <Save size={18} />
                            {isEdit ? 'Actualizar' : 'Crear'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
