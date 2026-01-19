'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, Search, Filter, Download, FileText, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { ComprobanteRecibido } from '@/modules/buzon/domain/types';
import { InMemoryBuzonRepository } from '@/modules/buzon/infrastructure/BuzonRepository';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';

export default function BuzonPage() {
    const { currentEmpresa } = useEmpresa();
    const [comprobantes, setComprobantes] = useState<ComprobanteRecibido[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        const repo = new InMemoryBuzonRepository();
        const data = await repo.getComprobantes(currentEmpresa.id);
        setComprobantes(data);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id]);

    const handleImportar = async () => {
        if (!currentEmpresa) return;
        setImporting(true);
        const repo = new InMemoryBuzonRepository();
        await repo.importarDesdeSRI(currentEmpresa.id, '2023-10-01', '2023-10-31');
        await loadData();
        setImporting(false);
    };

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Buzón XML (SRI)</h1>
                    <p className="text-slate-500 text-sm mt-1">Recepción automática de facturas y retenciones desde el SRI.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" className="flex items-center gap-2">
                        <Download size={18} /> Exportar Excel
                    </Button>
                    <Button onClick={handleImportar} disabled={importing} className="flex items-center gap-2 shadow-md">
                        <RefreshCw size={18} className={importing ? 'animate-spin' : ''} />
                        {importing ? 'Sincronizando...' : 'Sincronizar con SRI'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText size={24} /></div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Total Recibidos</p>
                        <p className="text-xl font-bold text-slate-800">{comprobantes.length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={24} /></div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Procesados</p>
                        <p className="text-xl font-bold text-slate-800">{comprobantes.filter(c => c.estado === 'PROCESADO').length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><AlertCircle size={24} /></div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Pendientes</p>
                        <p className="text-xl font-bold text-slate-800">{comprobantes.filter(c => c.estado === 'RECIBIDO').length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Buscar por RUC o Razón Social..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none" />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" className="flex items-center gap-1"><Filter size={14} /> Filtros</Button>
                        <Button variant="secondary" size="sm" className="flex items-center gap-1"><UploadCloud size={14} /> Subir XML</Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Fecha Emisión</th>
                                <th className="px-6 py-4">Emisor</th>
                                <th className="px-6 py-4">Documento</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400">Cargando comprobantes...</td></tr>
                            ) : comprobantes.map((comp) => (
                                <tr key={comp.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-600">{comp.fechaEmision}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-800">{comp.razonSocialEmisor}</span>
                                            <span className="text-xs text-slate-500 font-mono">{comp.rucEmisor}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-400">FACTURA</span>
                                            <span className="font-mono text-slate-600">{comp.secuencial}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900">{formatMoney(comp.montoTotal)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${comp.estado === 'PROCESADO' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {comp.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button className="p-1.5 text-slate-400 hover:text-sri-blue hover:bg-blue-50 rounded" title="Ver XML"><FileText size={16} /></button>
                                            <button className="p-1.5 text-slate-400 hover:text-sri-blue hover:bg-blue-50 rounded" title="Asociar a Gasto"><ExternalLink size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
