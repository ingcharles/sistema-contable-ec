'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Edit2, Trash2, UserPlus, FileSpreadsheet } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Tercero, TipoTercero } from '@/modules/directorio/domain/types';
import { DirectorioUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { TerceroModal } from '@/modules/directorio/ui/components/TerceroModal';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';

export default function DirectorioPage() {
    const { currentEmpresa } = useEmpresa();
    const [terceros, setTerceros] = useState<Tercero[]>([]);
    const [filtroTipo, setFiltroTipo] = useState<TipoTercero | 'TODOS'>('TODOS');

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [terceroEdit, setTerceroEdit] = useState<Tercero | undefined>(undefined);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id?: string }>({ isOpen: false });

    const loadData = async () => {
        if (!currentEmpresa) return;
        try {
            const data = await DirectorioUseCases.listarTerceros(filtroTipo === 'TODOS' ? undefined : filtroTipo);
            setTerceros(data);
        } catch (error) {
            console.error('Error al cargar terceros:', error);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id, filtroTipo]);

    const handleNew = () => {
        setTerceroEdit(undefined);
        setModalOpen(true);
    };

    const handleEdit = (tercero: Tercero) => {
        setTerceroEdit(tercero);
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        setConfirmDelete({ isOpen: true, id });
    };

    const confirmDeleteTercero = async () => {
        if (!confirmDelete.id) return;
        try {
            await DirectorioUseCases.eliminarTercero(confirmDelete.id);
            loadData();
            setConfirmDelete({ isOpen: false });
        } catch (error) {
            console.error('Error al eliminar tercero:', error);
            alert('No se pudo eliminar el tercero');
        }
    };

    const handleExport = () => {
        if (terceros.length === 0) return;

        const headers = ['Identificación', 'Razón Social', 'Nombre Comercial', 'Tipo', 'Email', 'Teléfono', 'Dirección'];
        const rows = terceros.map(t => [
            t.identificacion,
            `"${t.razonSocial.replace(/"/g, '""')}"`,
            t.nombreComercial ? `"${t.nombreComercial.replace(/"/g, '""')}"` : '',
            t.tipo,
            t.email,
            t.telefono || '',
            `"${t.direccion.replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `directorio_${currentEmpresa?.razonSocial.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns: Column<Tercero>[] = [
        {
            header: 'Razón Social / Comercial',
            accessorKey: 'razonSocial',
            sortable: true,
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{row.razonSocial}</span>
                    {row.nombreComercial && <span className="text-xs text-slate-500">{row.nombreComercial}</span>}
                </div>
            )
        },
        {
            header: 'Identificación',
            accessorKey: 'identificacion',
            cell: (row) => (
                <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs">
                    {row.identificacion}
                </span>
            )
        },
        {
            header: 'Contacto',
            cell: (row) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Mail size={12} /> {row.email}
                    </div>
                    {row.telefono && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone size={12} /> {row.telefono}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Dirección',
            accessorKey: 'direccion',
            cell: (row) => (
                <div className="flex items-start gap-2 max-w-[200px] truncate text-slate-500 text-xs">
                    <MapPin size={12} className="shrink-0 mt-0.5" />
                    <span className="truncate" title={row.direccion}>{row.direccion}</span>
                </div>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
                        <Edit2 size={16} className="text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
                        <Trash2 size={16} className="text-red-500" />
                    </Button>
                </div>
            )
        }
    ];

    if (!currentEmpresa) return null;

    const tabs = [
        { id: 'TODOS', label: 'Todos' },
        { id: TipoTercero.CLIENTE, label: 'Clientes' },
        { id: TipoTercero.PROVEEDOR, label: 'Proveedores' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Directorio</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de clientes, proveedores y otros contactos de la empresa.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFiltroTipo(tab.id as any)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${filtroTipo === tab.id ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleExport} className="gap-2">
                        <FileSpreadsheet size={18} /> Exportar
                    </Button>
                    <Button onClick={handleNew} className="gap-2">
                        <UserPlus size={18} /> Nuevo Contacto
                    </Button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <DataTable columns={columns} data={terceros} />
                </div>
            </div>

            {modalOpen && (
                <TerceroModal
                    terceroEditar={terceroEdit}
                    onClose={() => setModalOpen(false)}
                    onSave={() => { setModalOpen(false); loadData(); }}
                    empresaId={currentEmpresa.id}
                />
            )}

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false })}
                onConfirm={confirmDeleteTercero}
                title="Desactivar Contacto"
                message="¿Está seguro de que desea desactivar este contacto? Esta acción ocultará al tercero de las listas activas."
                confirmText="Desactivar"
                type="danger"
            />
        </div>
    );
}
