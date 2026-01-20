'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Download, Receipt, Wallet, ArrowRightLeft, History, CheckCircle2, Trash2, X, Search } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { ValeCajaChica, CajaChicaInfo } from '@/modules/caja-chica/domain/types';
import { InMemoryCajaChicaRepository } from '@/modules/caja-chica/infrastructure/CajaChicaRepository';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';

import { MovimientoCajaModal } from '@/modules/caja-chica/ui/components/MovimientoCajaModal';

export default function CajaChicaPage() {
    const { currentEmpresa } = useEmpresa();
    const [caja, setCaja] = useState<CajaChicaInfo | null>(null);
    const [vales, setVales] = useState<ValeCajaChica[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVale, setSelectedVale] = useState<ValeCajaChica | null>(null);
    const [showVerModal, setShowVerModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'INGRESO' | 'EGRESO'>('EGRESO');

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        const repo = new InMemoryCajaChicaRepository();
        const [info, data] = await Promise.all([
            repo.getCajaInfo(currentEmpresa.id),
            repo.getVales(currentEmpresa.id)
        ]);
        setCaja(info);
        setVales(data);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id]);

    const handleAnular = async (id: string) => {
        if (window.confirm('¿Está seguro de anular este vale?')) {
            const repo = new InMemoryCajaChicaRepository();
            await repo.anularVale(id);
            loadData();
        }
    };

    const handleVerComprobante = (vale: ValeCajaChica) => {
        setSelectedVale(vale);
        setShowVerModal(true);
    };

    const filteredVales = useMemo(() => {
        return vales.filter(v =>
            v.beneficiario.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.numero.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [vales, searchTerm]);

    const handleExportExcel = () => {
        if (filteredVales.length === 0) return;

        const headers = ['Número', 'Fecha', 'Beneficiario', 'Concepto', 'Monto', 'Estado'];
        const rows = filteredVales.map(v => [
            v.numero,
            v.fecha,
            `"${v.beneficiario.replace(/"/g, '""')}"`,
            `"${v.concepto.replace(/"/g, '""')}"`,
            v.monto,
            v.estado
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `caja_chica_${currentEmpresa?.razonSocial.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns: Column<ValeCajaChica>[] = [
        {
            header: 'Vale / Fecha',
            cell: (vale) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{vale.numero}</span>
                    <span className="text-[10px] font-mono text-slate-400">{vale.fecha}</span>
                </div>
            ),
            sortable: true,
            accessorKey: 'numero'
        },
        { header: 'Beneficiario', accessorKey: 'beneficiario', className: 'font-medium', sortable: true },
        { header: 'Concepto', accessorKey: 'concepto', className: 'max-w-xs truncate' },
        {
            header: 'Monto',
            accessorKey: 'monto',
            className: 'text-right font-black',
            cell: (vale) => formatMoney(vale.monto),
            sortable: true
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            className: 'text-center',
            cell: (vale) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${vale.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' :
                    vale.estado === 'ANULADO' ? 'bg-rose-100 text-rose-700' :
                        'bg-emerald-100 text-emerald-700'
                    }`}>
                    {vale.estado}
                </span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (vale) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => handleVerComprobante(vale)}
                        className="p-2 text-slate-400 hover:text-sri-blue hover:bg-blue-50 rounded-lg transition-all"
                        title="Ver Comprobante"
                    >
                        <Receipt size={16} />
                    </button>
                    {vale.estado !== 'ANULADO' && (
                        <button
                            onClick={() => handleAnular(vale.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Anular"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Control de Caja Chica</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de gastos menores, vales provisionales y reposiciones.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" className="flex items-center gap-2" onClick={() => { setModalType('INGRESO'); setShowModal(true); }}>
                        <ArrowRightLeft size={18} /> Reposición
                    </Button>
                    <Button className="flex items-center gap-2" onClick={() => { setModalType('EGRESO'); setShowModal(true); }}>
                        <Plus size={18} /> Nuevo Vale
                    </Button>
                </div>
            </div>

            {caja && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-sm text-slate-500 font-medium">Saldo Disponible</p>
                            <h3 className="text-3xl font-black text-emerald-600 mt-1">{formatMoney(caja.saldoActual)}</h3>
                            <div className="mt-4 flex items-center gap-2">
                                <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${(caja.saldoActual / caja.montoAsignado) * 100}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">{Math.round((caja.saldoActual / caja.montoAsignado) * 100)}%</span>
                            </div>
                        </div>
                        <Wallet className="absolute -right-4 -bottom-4 text-emerald-50 opacity-50 group-hover:scale-110 transition-transform" size={120} />
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-sm text-slate-500 font-medium">Monto Asignado</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatMoney(caja.montoAsignado)}</h3>
                        <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 uppercase font-bold tracking-wider">
                            <CheckCircle2 size={12} className="text-emerald-500" /> Responsable: {caja.responsable}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-sm text-slate-500 font-medium">Vales Pendientes</p>
                        <h3 className="text-2xl font-bold text-amber-600 mt-1">
                            {formatMoney(vales.filter(v => v.estado === 'PENDIENTE').reduce((acc, v) => acc + v.monto, 0))}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 uppercase font-bold tracking-wider">
                            <History size={12} /> Última Reposición: {caja.ultimaReposicion}
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por beneficiario, concepto o número..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 bg-white"
                        />
                    </div>
                </div>

                <DataTable
                    data={filteredVales}
                    columns={columns}
                    loading={loading}
                    itemsPerPage={5}
                    actions={
                        <Button variant="secondary" size="sm" onClick={handleExportExcel} className="flex items-center gap-2">
                            <Download size={16} /> Exportar Excel
                        </Button>
                    }
                />
            </div>

            {showModal && (
                <MovimientoCajaModal
                    tipo={modalType}
                    onClose={() => setShowModal(false)}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                />
            )}

            {showVerModal && selectedVale && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Receipt size={20} className="text-sri-blue" />
                                Detalle del Comprobante
                            </h2>
                            <button onClick={() => setShowVerModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500 text-sm">Número:</span>
                                <span className="font-bold text-slate-800">{selectedVale.numero}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500 text-sm">Fecha:</span>
                                <span className="text-slate-800">{selectedVale.fecha}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500 text-sm">Beneficiario:</span>
                                <span className="text-slate-800 font-medium">{selectedVale.beneficiario}</span>
                            </div>
                            <div className="border-b pb-2">
                                <span className="text-slate-500 text-sm block mb-1">Concepto:</span>
                                <p className="text-slate-800 text-sm italic">"{selectedVale.concepto}"</p>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-slate-500 font-bold">TOTAL:</span>
                                <span className="text-2xl font-black text-sri-blue">{formatMoney(selectedVale.monto)}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
                            <Button onClick={() => setShowVerModal(false)}>Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
