'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Trash2, Edit2, History, Calculator } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { ActivoFijo, EstadoActivo } from '@/modules/activos/domain/types';
import { InMemoryActivosRepository } from '@/modules/activos/infrastructure/ActivosRepository';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';

import { ActivoFijoModal } from '@/modules/activos/ui/components/ActivoFijoModal';

export default function ActivosPage() {
    const { currentEmpresa } = useEmpresa();
    const [activos, setActivos] = useState<ActivoFijo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    const loadActivos = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        const repo = new InMemoryActivosRepository();
        const data = await repo.getActivos(currentEmpresa.id);
        setActivos(data);
        setLoading(false);
    };

    useEffect(() => { loadActivos(); }, [currentEmpresa?.id]);

    const filteredActivos = activos.filter(a =>
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Control de Activos Fijos</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión, depreciación y control de bienes institucionales.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" className="flex items-center gap-2">
                        <Calculator size={18} /> Depreciar Todo
                    </Button>
                    <Button className="flex items-center gap-2" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> Nuevo Activo
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium">Valor Total en Libros</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                        {formatMoney(activos.reduce((acc, a) => acc + a.valorLibros, 0))}
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium">Depreciación Acumulada</p>
                    <h3 className="text-2xl font-bold text-rose-600 mt-1">
                        {formatMoney(activos.reduce((acc, a) => acc + a.depreciacionAcumulada, 0))}
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium">Total Activos</p>
                    <h3 className="text-2xl font-bold text-sri-blue mt-1">{activos.length}</h3>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/30">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" className="flex items-center gap-2">
                            <Filter size={16} /> Filtros
                        </Button>
                        <Button variant="secondary" size="sm" className="flex items-center gap-2">
                            <Download size={16} /> Exportar
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                            <tr>
                                <th className="px-6 py-4">Código / Nombre</th>
                                <th className="px-6 py-4">Categoría</th>
                                <th className="px-6 py-4 text-right">Valor Adq.</th>
                                <th className="px-6 py-4 text-right">Valor Libros</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400">Cargando activos...</td></tr>
                            ) : filteredActivos.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400">No se encontraron activos.</td></tr>
                            ) : filteredActivos.map(activo => (
                                <tr key={activo.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800">{activo.nombre}</span>
                                            <span className="text-[10px] font-mono text-slate-400">{activo.codigo}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">{activo.categoria}</td>
                                    <td className="px-6 py-4 text-right text-slate-500">{formatMoney(activo.valorAdquisicion)}</td>
                                    <td className="px-6 py-4 text-right font-black text-slate-800">{formatMoney(activo.valorLibros)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${activo.estado === EstadoActivo.OPERATIVO ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {activo.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button className="p-2 text-slate-400 hover:text-sri-blue hover:bg-blue-50 rounded-lg transition-all" title="Editar"><Edit2 size={16} /></button>
                                            <button className="p-2 text-slate-400 hover:text-sri-blue hover:bg-blue-50 rounded-lg transition-all" title="Historial"><History size={16} /></button>
                                            <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Eliminar"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <ActivoFijoModal
                    onClose={() => setShowModal(false)}
                    onSave={loadActivos}
                    empresaId={currentEmpresa.id}
                />
            )}
        </div>
    );
}
