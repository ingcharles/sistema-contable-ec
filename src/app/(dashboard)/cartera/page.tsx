'use client';

import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Receipt, Plus, ArrowRightLeft } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { DocumentoPendiente, TipoCartera, Anticipo } from '@/modules/cartera/domain/types';
import { CarteraUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { EstadoCarteraBadge } from '@/modules/cartera/ui/components/EstadoCarteraBadge';
import { RegistroAnticipoModal } from '@/modules/cartera/ui/components/RegistroAnticipoModal';
import { CruceCuentasModal } from '@/modules/cartera/ui/components/CruceCuentasModal';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { CobroPagoModal } from '@/modules/cartera/ui/components/CobroPagoModal';
import { FileSpreadsheet, LayoutList } from 'lucide-react';

export default function CarteraPage() {
    const { currentEmpresa } = useEmpresa();
    const [activeTab, setActiveTab] = useState<'documentos' | 'anticipos'>('documentos');
    const [tipo, setTipo] = useState<TipoCartera>(TipoCartera.CXC);

    const [documentos, setDocumentos] = useState<DocumentoPendiente[]>([]);
    const [anticipos, setAnticipos] = useState<Anticipo[]>([]);

    const [selectedDoc, setSelectedDoc] = useState<DocumentoPendiente | null>(null);
    const [showAnticipoModal, setShowAnticipoModal] = useState(false);
    const [showCruceModal, setShowCruceModal] = useState(false);
    const [showCobroModal, setShowCobroModal] = useState(false);

    const loadData = async () => {
        if (!currentEmpresa) return;
        try {
            const [dataDocs, dataAnt] = await Promise.all([
                CarteraUseCases.listarDocumentosPendientes(tipo),
                CarteraUseCases.listarAnticipos(tipo)
            ]);
            setDocumentos(dataDocs);
            setAnticipos(dataAnt);
        } catch (error) {
            console.error('Error cargando cartera:', error);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id, tipo]);

    const docColumns: Column<DocumentoPendiente>[] = [
        {
            header: 'Tercero',
            accessorKey: 'terceroNombre',
            className: 'font-medium text-slate-800'
        },
        {
            header: 'Documento',
            accessorKey: 'nroComprobante',
            className: 'font-mono text-xs text-slate-500'
        },
        {
            header: 'Vencimiento',
            cell: (doc) => (
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">{doc.fechaVencimiento}</span>
                    <EstadoCarteraBadge diasVencidos={doc.diasVencidos} />
                </div>
            )
        },
        {
            header: 'Saldo',
            accessorKey: 'saldoPendiente',
            className: 'text-right font-bold text-slate-900',
            cell: (doc) => formatMoney(doc.saldoPendiente)
        },
        {
            header: 'Acciones',
            className: 'text-center',
            cell: (doc) => (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 h-8 px-3"
                        onClick={() => { setSelectedDoc(doc); setShowCobroModal(true); }}
                    >
                        {tipo === TipoCartera.CXC ? 'Cobrar' : 'Pagar'}
                    </Button>
                    {anticipos.some(a => a.terceroId === doc.terceroId) && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => { setSelectedDoc(doc); setShowCruceModal(true); }}
                            className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 h-8 px-3"
                        >
                            <ArrowRightLeft size={14} className="mr-1" /> Cruzar
                        </Button>
                    )}
                </div>
            )
        }
    ];

    const antColumns: Column<Anticipo>[] = [
        { header: 'Fecha', accessorKey: 'fecha', className: 'text-slate-600' },
        { header: 'Tercero', accessorKey: 'terceroNombre', className: 'font-medium text-slate-800' },
        { header: 'Referencia', accessorKey: 'referencia', className: 'text-xs text-slate-500' },
        {
            header: 'Monto Original',
            accessorKey: 'montoOriginal',
            className: 'text-right text-slate-500',
            cell: (ant) => formatMoney(ant.montoOriginal)
        },
        {
            header: 'Disponible',
            accessorKey: 'saldoDisponible',
            className: 'text-right font-bold text-emerald-700 bg-emerald-50/20',
            cell: (ant) => formatMoney(ant.saldoDisponible)
        }
    ];

    const handleExport = () => {
        const data = activeTab === 'documentos' ? documentos : anticipos;
        if (data.length === 0) return;
        const csvContent = activeTab === 'documentos'
            ? ["Tercero", "Documento", "Vencimiento", "Saldo"].join(",") + "\n" +
            documentos.map(d => [`"${d.terceroNombre}"`, d.nroComprobante, d.fechaVencimiento, d.saldoPendiente].join(",")).join("\n")
            : ["Fecha", "Tercero", "Referencia", "Disponible"].join(",") + "\n" +
            anticipos.map(a => [a.fecha, `"${a.terceroNombre}"`, `"${a.referencia}"`, a.saldoDisponible].join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cartera_${tipo}_${activeTab}.csv`;
        link.click();
    };

    if (!currentEmpresa) return null;

    const totalPendiente = documentos.reduce((acc, d) => acc + d.saldoPendiente, 0);
    const totalAnticipos = anticipos.reduce((acc, a) => acc + a.saldoDisponible, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Cartera y Tesorería</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de cobros, pagos y anticipos.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setTipo(TipoCartera.CXC)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tipo === TipoCartera.CXC ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <TrendingUp size={16} /> Clientes (CXC)
                    </button>
                    <button onClick={() => setTipo(TipoCartera.CXP)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tipo === TipoCartera.CXP ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <TrendingDown size={16} /> Proveedores (CXP)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Total por {tipo === TipoCartera.CXC ? 'Cobrar' : 'Pagar'}</p>
                        <p className="text-2xl font-bold text-slate-800">{formatMoney(totalPendiente)}</p>
                    </div>
                    <div className="p-2 bg-slate-100 rounded text-slate-500"><Receipt size={20} /></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Anticipos Disponibles</p>
                        <p className="text-2xl font-bold text-blue-600">{formatMoney(totalAnticipos)}</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded text-blue-500"><Wallet size={20} /></div>
                </div>
            </div>

            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                <button onClick={() => setActiveTab('documentos')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'documentos' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <LayoutList size={16} /> Documentos
                </button>
                <button onClick={() => setActiveTab('anticipos')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'anticipos' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Wallet size={16} /> Anticipos
                </button>
            </div>

            {activeTab === 'documentos' ? (
                <DataTable
                    data={documentos}
                    columns={docColumns}
                    itemsPerPage={5}
                    searchable
                    searchPlaceholder="Buscar por cliente/proveedor..."
                    actions={
                        <Button variant="secondary" size="sm" onClick={handleExport} className="flex items-center gap-2">
                            <FileSpreadsheet size={16} /> Exportar
                        </Button>
                    }
                />
            ) : (
                <DataTable
                    data={anticipos}
                    columns={antColumns}
                    itemsPerPage={5}
                    actions={
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={handleExport} className="flex items-center gap-2">
                                <FileSpreadsheet size={16} /> Exportar
                            </Button>
                            <Button onClick={() => setShowAnticipoModal(true)} size="sm" className="flex items-center gap-2 shadow-sm">
                                <Plus size={16} /> Nuevo
                            </Button>
                        </div>
                    }
                />
            )}

            {showAnticipoModal && (
                <RegistroAnticipoModal
                    tipo={tipo}
                    onClose={() => setShowAnticipoModal(false)}
                    onSave={loadData}
                />
            )}

            {showCruceModal && selectedDoc && (
                <CruceCuentasModal
                    documento={selectedDoc}
                    anticipos={anticipos.filter(a => a.terceroId === selectedDoc.terceroId)}
                    onClose={() => { setShowCruceModal(false); setSelectedDoc(null); }}
                    onSave={loadData}
                />
            )}

            {showCobroModal && selectedDoc && (
                <CobroPagoModal
                    documento={selectedDoc}
                    tipo={tipo}
                    onClose={() => { setShowCobroModal(false); setSelectedDoc(null); }}
                    onSave={loadData}
                />
            )}
        </div>
    );
}
