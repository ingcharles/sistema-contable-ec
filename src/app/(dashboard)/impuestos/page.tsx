'use client';

import { useState, useEffect } from 'react';
import { Download, RefreshCw, AlertCircle, Plus, FileSpreadsheet, FileText } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { FormularioSRI, AnexoTransaccional } from '@/modules/impuestos/domain/types';
import { useImpuestos } from '@/modules/impuestos/hooks/useImpuestos';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';

import { DeclaracionModal } from '@/modules/impuestos/ui/components/DeclaracionModal';
import { DataTable, Column } from '@/shared/ui/DataTable';

export default function ImpuestosPage() {
    const { currentEmpresa } = useEmpresa();
    const [activeTab, setActiveTab] = useState<'formularios' | 'ats'>('formularios');
    const { formularios, anexos, loading, cargarFormularios, cargarAnexos, generarATS } = useImpuestos();
    const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (currentEmpresa) {
            cargarFormularios('104');
            cargarAnexos();
        }
    }, [currentEmpresa?.id, cargarFormularios, cargarAnexos]);

    const handleGenerarATS = async () => {
        if (!currentEmpresa) return;
        await generarATS(periodo);
    };

    const formColumns: Column<FormularioSRI>[] = [
        { header: 'Periodo', accessorKey: 'periodo', className: 'font-bold text-slate-800' },
        {
            header: 'Tipo',
            cell: (row) => <span>Formulario {row.tipo}</span>
        },
        {
            header: 'Ventas',
            accessorKey: 'totalVentas',
            className: 'text-right text-slate-600',
            cell: (row) => formatMoney(row.totalVentas)
        },
        {
            header: 'Compras',
            accessorKey: 'totalCompras',
            className: 'text-right text-slate-600',
            cell: (row) => formatMoney(row.totalCompras)
        },
        {
            header: 'Impuesto a Pagar',
            accessorKey: 'valorAPagar',
            className: 'text-right font-bold text-sri-blue',
            cell: (row) => formatMoney(row.valorAPagar)
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            className: 'text-center',
            cell: (row) => (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">{row.estado}</span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: () => (
                <button className="p-1.5 text-slate-400 hover:text-sri-blue rounded-lg transition-colors">
                    <Download size={18} />
                </button>
            )
        }
    ];

    const anexoColumns: Column<AnexoTransaccional>[] = [
        { header: 'Periodo Fiscal', accessorKey: 'periodo', className: 'font-bold text-slate-800' },
        { header: 'Fecha Generación', accessorKey: 'createdAt', className: 'text-slate-600' },
        {
            header: 'Estado',
            accessorKey: 'estado',
            className: 'text-center',
            cell: (row) => (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">{row.estado}</span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: () => (
                <div className="flex justify-end gap-2">
                    <button className="p-1.5 text-slate-400 hover:text-sri-blue rounded-lg" title="Descargar XML"><Download size={18} /></button>
                    <button className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg" title="Ver Errores"><AlertCircle size={18} /></button>
                </div>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Impuestos y Obligaciones SRI</h1>
                    <p className="text-slate-500 text-sm mt-1">Declaraciones de IVA, Renta y Anexos Transaccionales.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('formularios')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'formularios' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <FileText size={16} /> Formularios
                    </button>
                    <button onClick={() => setActiveTab('ats')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'ats' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <RefreshCw size={16} /> Anexo ATS
                    </button>
                </div>
            </div>

            {activeTab === 'ats' && (
                <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Periodo Fiscal</label>
                        <input
                            type="month"
                            value={periodo}
                            onChange={(e) => setPeriodo(e.target.value)}
                            className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-sri-blue/20 bg-white"
                        />
                    </div>
                    <Button onClick={handleGenerarATS} className="flex items-center gap-2 shadow-sm">
                        <RefreshCw size={18} /> Generar ATS XML
                    </Button>
                </div>
            )}

            {activeTab === 'formularios' ? (
                <DataTable
                    data={formularios}
                    columns={formColumns}
                    loading={loading}
                    itemsPerPage={5}
                    actions={
                        <Button size="sm" className="flex items-center gap-1 shadow-sm" onClick={() => setShowModal(true)}>
                            <Plus size={14} /> Nueva Declaración
                        </Button>
                    }
                />
            ) : (
                <DataTable
                    data={anexos}
                    columns={anexoColumns}
                    loading={loading}
                    itemsPerPage={5}
                    actions={
                        <Button variant="secondary" size="sm" className="flex items-center gap-2">
                            <FileSpreadsheet size={16} /> Exportar
                        </Button>
                    }
                />
            )}

            {showModal && (
                <DeclaracionModal
                    onClose={() => setShowModal(false)}
                    onSave={() => cargarFormularios('104')}
                    empresaId={currentEmpresa.id}
                />
            )}
        </div>
    );
}
