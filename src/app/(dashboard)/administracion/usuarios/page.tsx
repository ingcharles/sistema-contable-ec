'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { UsuariosTable } from '@/modules/administracion/ui/components/usuarios/UsuariosTable';
import { AsignarPuntosModal } from '@/modules/administracion/ui/components/usuarios/AsignarPuntosModal';
import { Button } from '@/shared/ui/Button';

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para modales
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedUsuario, setSelectedUsuario] = useState<any>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);

    const loadUsuarios = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('buscar', searchTerm);

            const response = await fetch(`/api/administracion/usuarios?${params.toString()}`);
            if (!response.ok) throw new Error('Error al cargar usuarios');

            const data = await response.json();
            setUsuarios(data.usuarios || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadUsuarios();
        }, 500); // Debounce search

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleAssignPoints = (usuario: any) => {
        setSelectedUsuario(usuario);
        setShowAssignModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Administra el acceso y asignación de puntos de emisión
                    </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus size={18} />
                    Nuevo Usuario
                </Button>
            </div>

            {/* Filtros */}
            <div className="flex gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <button className="px-4 py-2 flex items-center gap-2 text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                    <Filter size={18} />
                    <span className="hidden sm:inline">Filtros</span>
                </button>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <UsuariosTable
                    usuarios={usuarios}
                    loading={loading}
                    onEdit={(u) => console.log('Edit', u)}
                    onAssignPoints={handleAssignPoints}
                />
            </div>

            {/* Modales */}
            {showAssignModal && selectedUsuario && (
                <AsignarPuntosModal
                    usuario={selectedUsuario}
                    onClose={() => {
                        setShowAssignModal(false);
                        setSelectedUsuario(null);
                    }}
                    onSave={() => {
                        loadUsuarios();
                        setShowAssignModal(false);
                        setSelectedUsuario(null);
                    }}
                />
            )}
        </div>
    );
}
