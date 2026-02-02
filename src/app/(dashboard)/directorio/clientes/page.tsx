'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, Edit2, Trash2, UserPlus, FileSpreadsheet } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Tercero, TipoTercero } from '@/modules/directorio/domain/types';
import { useTerceros, useDirectorioMutations } from '@/modules/directorio/hooks/useDirectorio';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { TerceroModal } from '@/modules/directorio/ui/components/TerceroModal';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';


export default function DirectorioClientesPage() {
    const { currentEmpresa } = useEmpresa();
    const { terceros, cargarTerceros } = useTerceros();
    const { eliminarTercero } = useDirectorioMutations();

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [terceroEdit, setTerceroEdit] = useState<Tercero | undefined>(undefined);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id?: string }>({ isOpen: false });

    // Cargar solo clientes
    useEffect(() => {
        if (currentEmpresa) {
            cargarTerceros(TipoTercero.CLIENTE);
        }
    }, [currentEmpresa?.id]);

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
            await eliminarTercero(confirmDelete.id);
            cargarTerceros(TipoTercero.CLIENTE);
            setConfirmDelete({ isOpen: false });
        } catch (error) {
            console.error('Error al eliminar tercero:', error);
            alert('No se pudo eliminar el cliente');
        }
    };

    const handleExport = () => {
        if (terceros.length === 0) return;
        const headers = ['Identificación', 'Razón Social', 'Email', 'Teléfono', 'Dirección'];
        const rows = terceros.map((t: Tercero) => [
            t.identificacion,
            `"${t.razonSocial.replace(/"/g, '""')}"`,
            t.email,
            t.telefono || '',
            `"${t.direccion.replace(/"/g, '""')}"`
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `clientes_${currentEmpresa?.razonSocial.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns: Column<Tercero>[] = [
        {
            header: 'Razón Social',
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
                <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs">{row.identificacion}</span>
            )
        },
        {
            header: 'Contacto',
            cell: (row) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500"><Mail size={12} /> {row.email}</div>
                    {row.telefono && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone size={12} /> {row.telefono}</div>}
                </div>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}><Edit2 size={16} className="text-blue-500" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}><Trash2 size={16} className="text-red-500" /></Button>
                </div>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
                    <p className="text-slate-500 text-sm mt-1">Directorio de clientes.</p>
                </div>
            </div>

            <div className="space-y-4">
                <DataTable
                    columns={columns}
                    data={terceros}
                    searchable
                    searchPlaceholder="Buscar cliente..."
                    actions={
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleExport} className="gap-2">
                                <FileSpreadsheet size={18} /> Exportar
                            </Button>
                            <Button onClick={handleNew} className="gap-2">
                                <UserPlus size={18} /> Nuevo Cliente
                            </Button>
                        </div>
                    }
                />
            </div>
            {modalOpen && (
                <TerceroModal
                    terceroEditar={terceroEdit}
                    onClose={() => setModalOpen(false)}
                    onSave={() => { setModalOpen(false); cargarTerceros(TipoTercero.CLIENTE); }}
                    empresaId={currentEmpresa.id}
                    prefixedType={TipoTercero.CLIENTE}
                />
            )}
            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false })}
                onConfirm={confirmDeleteTercero}
                title="Desactivar Cliente"
                message="¿Está seguro de desactivar este cliente?"
                confirmText="Desactivar"
                type="danger"
            />
        </div>
    );
}
