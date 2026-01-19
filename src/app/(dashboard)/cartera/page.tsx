'use client';

import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Receipt, Plus, ArrowRightLeft } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { DocumentoPendiente, TipoCartera, Anticipo } from '@/modules/cartera/domain/types';
import { InMemoryCarteraRepository } from '@/modules/cartera/infrastructure/CarteraRepository';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { EstadoCarteraBadge } from '@/modules/cartera/ui/components/EstadoCarteraBadge';
import { RegistroAnticipoModal } from '@/modules/cartera/ui/components/RegistroAnticipoModal';
import { CruceCuentasModal } from '@/modules/cartera/ui/components/CruceCuentasModal';
import { Button } from '@/shared/ui/Button';

import { CobroPagoModal } from '@/modules/cartera/ui/components/CobroPagoModal';

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
        const repo = new InMemoryCarteraRepository();
        const [dataDocs, dataAnt] = await Promise.all([
            repo.getDocumentosPendientes(currentEmpresa.id, tipo),
            repo.getAnticiposDisponibles(currentEmpresa.id, tipo)
        ]);
        setDocumentos(dataDocs);
        setAnticipos(dataAnt);
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id, tipo]);

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
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setTipo(TipoCartera.CXC)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${tipo === TipoCartera.CXC ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <TrendingUp size={16} /> Clientes (CXC)
                    </button>
                    <button onClick={() => setTipo(TipoCartera.CXP)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${tipo === TipoCartera.CXP ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
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

            <div className="border-b border-slate-200 flex gap-4">
                <button onClick={() => setActiveTab('documentos')} className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'documentos' ? 'text-sri-blue border-b-2 border-sri-blue' : 'text-slate-500 hover:text-slate-700'}`}>
                    Documentos Pendientes
                </button>
                <button onClick={() => setActiveTab('anticipos')} className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'anticipos' ? 'text-sri-blue border-b-2 border-sri-blue' : 'text-slate-500 hover:text-slate-700'}`}>
                    Anticipos y Saldos a Favor
                </button>
            </div>

            {activeTab === 'documentos' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Tercero</th>
                                    <th className="px-6 py-4">Documento</th>
                                    <th className="px-6 py-4">Vencimiento</th>
                                    <th className="px-6 py-4 text-right">Saldo</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {documentos.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-800">{doc.terceroNombre}</td>
                                        <td className="px-6 py-4 font-mono text-slate-600">{doc.nroComprobante}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-slate-500">{doc.fechaVencimiento}</span>
                                                <EstadoCarteraBadge diasVencidos={doc.diasVencidos} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">{formatMoney(doc.saldoPendiente)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                                                    onClick={() => { setSelectedDoc(doc); setShowCobroModal(true); }}
                                                >
                                                    {tipo === TipoCartera.CXC ? 'Cobrar' : 'Pagar'}
                                                </Button>
                                                {anticipos.some(a => a.terceroId === doc.terceroId) && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => { setSelectedDoc(doc); setShowCruceModal(true); }}
                                                        className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100"
                                                    >
                                                        <ArrowRightLeft size={14} className="mr-1" /> Cruzar
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {documentos.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No hay documentos pendientes.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'anticipos' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">Saldos a Favor Disponibles</h3>
                        <Button onClick={() => setShowAnticipoModal(true)} className="flex items-center gap-2 shadow-sm">
                            <Plus size={16} /> Registrar Nuevo Anticipo
                        </Button>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Tercero</th>
                                <th className="px-6 py-4">Referencia</th>
                                <th className="px-6 py-4 text-right">Monto Original</th>
                                <th className="px-6 py-4 text-right text-green-600 font-bold">Disponible</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {anticipos.map(ant => (
                                <tr key={ant.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-slate-600">{ant.fecha}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{ant.terceroNombre}</td>
                                    <td className="px-6 py-4 text-xs text-slate-500">{ant.referencia}</td>
                                    <td className="px-6 py-4 text-right text-slate-500">{formatMoney(ant.montoOriginal)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-green-700 bg-green-50/30">{formatMoney(ant.saldoDisponible)}</td>
                                </tr>
                            ))}
                            {anticipos.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No hay anticipos disponibles.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {showAnticipoModal && (
                <RegistroAnticipoModal
                    tipo={tipo}
                    onClose={() => setShowAnticipoModal(false)}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                />
            )}

            {showCruceModal && selectedDoc && (
                <CruceCuentasModal
                    documento={selectedDoc}
                    anticipos={anticipos.filter(a => a.terceroId === selectedDoc.terceroId)}
                    onClose={() => { setShowCruceModal(false); setSelectedDoc(null); }}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                />
            )}

            {showCobroModal && selectedDoc && (
                <CobroPagoModal
                    documento={selectedDoc}
                    tipo={tipo}
                    onClose={() => { setShowCobroModal(false); setSelectedDoc(null); }}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                />
            )}
        </div>
    );
}
