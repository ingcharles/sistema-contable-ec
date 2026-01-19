
'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Edit2, Trash2, UserPlus, FileSpreadsheet } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Tercero, TipoTercero } from '@/modules/directorio/domain/types';
import { InMemoryDirectorioRepository } from '@/modules/directorio/infrastructure/DirectorioRepository';
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
        const repo = new InMemoryDirectorioRepository();
        const data = await repo.getTerceros(currentEmpresa.id, filtroTipo === 'TODOS' ? undefined : filtroTipo);
        setTerceros(data);
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
        if (window.confirm('¿Está seguro de eliminar este contacto?')) {
            const repo = new InMemoryDirectorioRepository();
            await repo.deleteTercero(id);
            loadData();
        }
    };

    const handleExport = () => {
        alert('Generando archivo Excel de contactos...');
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
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleExport} className="flex items-center gap-2">
                        <FileSpreadsheet size={18} /> Exportar Excel
                    </Button>
                    <Button onClick={handleNew} className="flex items-center gap-2 shadow-md">
                        <UserPlus size={18} /> Nuevo Tercero
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                <button onClick={() => setFiltroTipo('TODOS')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filtroTipo === 'TODOS' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Todos</button>
                <button onClick={() => setFiltroTipo(TipoTercero.CLIENTE)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filtroTipo === TipoTercero.CLIENTE ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Clientes</button>
                <button onClick={() => setFiltroTipo(TipoTercero.PROVEEDOR)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filtroTipo === TipoTercero.PROVEEDOR ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Proveedores</button>
            </div>

            <DataTable
                data={terceros}
                columns={columns}
                itemsPerPage={8}
                searchPlaceholder="Buscar por Razón Social o RUC..."
                searchable={true}
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
