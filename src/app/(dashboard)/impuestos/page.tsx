'use client';

import { useState, useEffect } from 'react';
import { Download, RefreshCw, AlertCircle, Calculator } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { FormularioSRI, AnexoTransaccional } from '@/modules/impuestos/domain/types';
import { InMemoryImpuestosRepository } from '@/modules/impuestos/infrastructure/ImpuestosRepository';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';

import { DeclaracionModal } from '@/modules/impuestos/ui/components/DeclaracionModal';

export default function ImpuestosPage() {
    const { currentEmpresa } = useEmpresa();
    const [activeTab, setActiveTab] = useState<'formularios' | 'ats'>('formularios');
    const [formularios, setFormularios] = useState<FormularioSRI[]>([]);
    const [anexos, setAnexos] = useState<AnexoTransaccional[]>([]);
    const [loading, setLoading] = useState(true);
    const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));
    const [showModal, setShowModal] = useState(false);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        const repo = new InMemoryImpuestosRepository();
        const [dataForm, dataAnexos] = await Promise.all([
            repo.getFormularios(currentEmpresa.id, '104'),
            repo.getAnexos(currentEmpresa.id)
        ]);
        setFormularios(dataForm);
        setAnexos(dataAnexos);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id]);

    const handleGenerarATS = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        const repo = new InMemoryImpuestosRepository();
        await repo.generarATS(currentEmpresa.id, periodo);
        await loadData();
    };

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Impuestos y Obligaciones SRI</h1>
                    <p className="text-slate-500 text-sm mt-1">Declaraciones de IVA, Renta y Anexos Transaccionales.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="month"
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sri-blue/20"
                    />
                    <Button onClick={handleGenerarATS} className="flex items-center gap-2">
                        <RefreshCw size={18} /> Generar ATS
                    </Button>
                </div>
            </div>

            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                <button onClick={() => setActiveTab('formularios')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'formularios' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Formularios (103/104)</button>
                <button onClick={() => setActiveTab('ats')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'ats' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Anexo Transaccional (ATS)</button>
            </div>

            {activeTab === 'formularios' ? (
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-700">Historial de Declaraciones</h3>
                            <Button size="sm" className="flex items-center gap-1" onClick={() => setShowModal(true)}>
                                <Calculator size={14} /> Nueva Declaración
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                                    <tr>
                                        <th className="px-6 py-4">Periodo</th>
                                        <th className="px-6 py-4">Tipo</th>
                                        <th className="px-6 py-4 text-right">Ventas</th>
                                        <th className="px-6 py-4 text-right">Compras</th>
                                        <th className="px-6 py-4 text-right font-bold">Impuesto a Pagar</th>
                                        <th className="px-6 py-4 text-center">Estado</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loading ? (
                                        <tr><td colSpan={7} className="p-12 text-center text-slate-400">Cargando formularios...</td></tr>
                                    ) : formularios.map(form => (
                                        <tr key={form.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-800">{form.periodo}</td>
                                            <td className="px-6 py-4">Formulario {form.tipo}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">{formatMoney(form.totalVentas)}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">{formatMoney(form.totalCompras)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-sri-blue">{formatMoney(form.valorAPagar)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">{form.estado}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-1.5 text-slate-400 hover:text-sri-blue rounded-lg"><Download size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-700">Generación de Anexos XML</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                                <tr>
                                    <th className="px-6 py-4">Periodo Fiscal</th>
                                    <th className="px-6 py-4">Fecha Generación</th>
                                    <th className="px-6 py-4 text-center">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-12 text-center text-slate-400">Cargando anexos...</td></tr>
                                ) : anexos.map(anexo => (
                                    <tr key={anexo.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-800">{anexo.periodo}</td>
                                        <td className="px-6 py-4 text-slate-600">{anexo.createdAt || 'Reciente'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">{anexo.estado}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="p-1.5 text-slate-400 hover:text-sri-blue rounded-lg" title="Descargar XML"><Download size={18} /></button>
                                                <button className="p-1.5 text-slate-400 hover:text-sri-blue rounded-lg" title="Ver Errores"><AlertCircle size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <DeclaracionModal
                    onClose={() => setShowModal(false)}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                />
            )}
        </div>
    );
}
