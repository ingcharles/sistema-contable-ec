
'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Edit2, Trash2, UserPlus, FileSpreadsheet } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Tercero, TipoTercero } from '@/modules/directorio/domain/types';
import { DirectorioUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { TerceroModal } from '@/modules/directorio/ui/components/TerceroModal';

export default function DirectorioPage() {
    const { currentEmpresa } = useEmpresa();
    const [terceros, setTerceros] = useState<Tercero[]>([]);
    const [filtroTipo, setFiltroTipo] = useState<TipoTercero | 'TODOS'>('TODOS');

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [terceroEdit, setTerceroEdit] = useState<Tercero | undefined>(undefined);

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
        if (window.confirm('¿Está seguro de desactivar este contacto?')) {
            try {
                await DirectorioUseCases.eliminarTercero(id);
                loadData();
            } catch (error) {
                console.error('Error al eliminar tercero:', error);
                alert('No se pudo eliminar el tercero');
            }
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
            header: 'Tipo',
            accessorKey: 'tipo',
            sortable: true,
            cell: (row) => (
                <div className="flex gap-1">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${row.tipo === TipoTercero.CLIENTE ? 'bg-blue-100 text-blue-700' :
                        row.tipo === TipoTercero.PROVEEDOR ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                        {row.tipo}
                    </span>
                    {row.esContribuyenteEspecial && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold">
                            ESPECIAL
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Contacto',
            cell: (row) => (
                <div className="flex flex-col gap-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1"><Mail size={12} className="text-slate-400" /> {row.email}</div>
                    {row.telefono && <div className="flex items-center gap-1"><Phone size={12} className="text-slate-400" /> {row.telefono}</div>}
                </div>
            )
        },
        {
            header: 'Ubicación',
            accessorKey: 'direccion',
            cell: (row) => (
                <div className="flex items-center gap-1 text-xs text-slate-600 truncate max-w-[150px]" title={row.direccion}>
                    <MapPin size={12} className="text-slate-400 flex-shrink-0" /> {row.direccion}
                </div>
            )
        },
        {
            header: 'Acciones',
            className: 'text-center',
            cell: (row) => (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(row)} className="p-1.5 text-slate-500 hover:text-sri-blue hover:bg-blue-50 rounded transition-colors" title="Editar">
                        <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(row.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Directorio de Terceros</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestione sus clientes, proveedores y contactos comerciales.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setFiltroTipo('TODOS')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filtroTipo === 'TODOS' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Todos</button>
                    <button onClick={() => setFiltroTipo(TipoTercero.CLIENTE)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filtroTipo === TipoTercero.CLIENTE ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Clientes</button>
                    <button onClick={() => setFiltroTipo(TipoTercero.PROVEEDOR)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filtroTipo === TipoTercero.PROVEEDOR ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Proveedores</button>
                </div>
            </div>


            <DataTable
                data={terceros}
                columns={columns}
                itemsPerPage={5}
                searchPlaceholder="Buscar por Razón Social o RUC..."
                searchable={true}
                actions={
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={handleExport} className="flex items-center gap-2">
                            <FileSpreadsheet size={16} /> Exportar
                        </Button>
                        <Button size="sm" onClick={handleNew} className="flex items-center gap-2 shadow-sm">
                            <UserPlus size={18} /> Nuevo
                        </Button>
                    </div>
                }
            />

            {modalOpen && (
                <TerceroModal
                    onClose={() => setModalOpen(false)}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                    terceroEditar={terceroEdit}
                />
            )}
        </div>
    );
}
