'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Building2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { PuntoEmisionCard } from '@/modules/administracion/ui/components/puntos-emision/PuntoEmisionCard';
import { UsuariosAsignadosPanel } from '@/modules/administracion/ui/components/puntos-emision/UsuariosAsignadosPanel';
import { PuntoEmisionForm } from '@/modules/administracion/ui/components/puntos-emision/PuntoEmisionForm';
import { Modal } from '@/shared/ui/Modal';
import { ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Sucursal } from '@/modules/configuracion/domain/types';
import { Monitor } from 'lucide-react';

export default function PuntosEmisionPage() {
    const [puntos, setPuntos] = useState<any[]>([]);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPunto, setSelectedPunto] = useState<any>(null);
    const [showUsersPanel, setShowUsersPanel] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [puntoAEditar, setPuntoAEditar] = useState<any>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [puntosData, sucursalesData] = await Promise.all([
                ConfiguracionUseCases.listarPuntosEmision(),
                ConfiguracionUseCases.listarSucursales()
            ]);
            setPuntos(puntosData || []);
            setSucursales(sucursalesData || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleViewUsers = (punto: any) => {
        setSelectedPunto(punto);
        setShowUsersPanel(true);
    };

    const handleCreate = () => {
        setPuntoAEditar(null);
        setShowFormModal(true);
    };

    const handleEdit = (punto: any) => {
        setPuntoAEditar(punto);
        setShowFormModal(true);
    };

    const filteredPuntos = puntos.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo.includes(searchTerm) ||
        p.nombreSucursal.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Puntos de Emisión</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Gestiona los puntos de emisión y sus asignaciones
                    </p>
                </div>
                <Button onClick={handleCreate} className="gap-2">
                    <Plus size={18} />
                    Nuevo Punto
                </Button>
            </div>

            {/* Filtros */}
            <div className="flex gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por código, nombre o sucursal..."
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

            {/* Grid de Puntos */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filteredPuntos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPuntos.map(punto => (
                        <PuntoEmisionCard
                            key={punto.id}
                            punto={punto}
                            onEdit={handleEdit}
                            onViewUsers={handleViewUsers}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                    <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No se encontraron puntos de emisión</h3>
                    <p className="text-slate-500 mt-1">Intenta ajustar los filtros de búsqueda</p>
                </div>
            )}

            {/* Panel Lateral */}
            {showUsersPanel && selectedPunto && (
                <UsuariosAsignadosPanel
                    punto={selectedPunto}
                    onClose={() => {
                        setShowUsersPanel(false);
                        setSelectedPunto(null);
                    }}
                    onRemoveUser={(userId) => {
                        console.log('Remove user', userId);
                    }}
                />
            )}

            {/* Modal de Formulario */}
            {showFormModal && (
                <Modal
                    isOpen={true}
                    onClose={() => setShowFormModal(false)}
                    title={puntoAEditar ? 'Editar Punto de Emisión' : 'Nuevo Punto de Emisión'}
                    description="Configure los parámetros y secuenciales del punto de emisión."
                    icon={<Monitor size={24} />}
                    size="lg"
                >
                    <PuntoEmisionForm
                        sucursales={sucursales}
                        puntoEditar={puntoAEditar}
                        onClose={() => setShowFormModal(false)}
                        onSave={loadData}
                    />
                </Modal>
            )}
        </div>
    );
}
