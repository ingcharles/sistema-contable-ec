'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Receipt, Wallet, ArrowRightLeft, History, CheckCircle2, Trash2 } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { ValeCajaChica, CajaChicaInfo } from '@/modules/caja-chica/domain/types';
import { InMemoryCajaChicaRepository } from '@/modules/caja-chica/infrastructure/CajaChicaRepository';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';

import { MovimientoCajaModal } from '@/modules/caja-chica/ui/components/MovimientoCajaModal';

export default function CajaChicaPage() {
    const { currentEmpresa } = useEmpresa();
    const [caja, setCaja] = useState<CajaChicaInfo | null>(null);
    const [vales, setVales] = useState<ValeCajaChica[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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

    const filteredVales = vales.filter(v =>
        v.beneficiario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.numero.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/30">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por beneficiario, concepto o número..."
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
                                <th className="px-6 py-4">Vale / Fecha</th>
                                <th className="px-6 py-4">Beneficiario</th>
                                <th className="px-6 py-4">Concepto</th>
                                <th className="px-6 py-4 text-right">Monto</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400">Cargando vales...</td></tr>
                            ) : filteredVales.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400">No hay movimientos registrados.</td></tr>
                            ) : filteredVales.map(vale => (
                                <tr key={vale.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800">{vale.numero}</span>
                                            <span className="text-[10px] font-mono text-slate-400">{vale.fecha}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">{vale.beneficiario}</td>
                                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{vale.concepto}</td>
                                    <td className="px-6 py-4 text-right font-black text-slate-800">{formatMoney(vale.monto)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${vale.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            {vale.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button className="p-2 text-slate-400 hover:text-sri-blue hover:bg-blue-50 rounded-lg transition-all" title="Ver Comprobante"><Receipt size={16} /></button>
                                            <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Anular"><Trash2 size={16} className="rotate-0" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <MovimientoCajaModal
                    tipo={modalType}
                    onClose={() => setShowModal(false)}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                />
            )}
        </div>
    );
}
