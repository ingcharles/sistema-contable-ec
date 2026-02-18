'use client';

import { useState, useEffect } from 'react';
import { Bot, Download, Upload, FileText, BarChart3 } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { useDescargaRobot } from '@/modules/compras/hooks/useDescargaRobot';
import { DescargaTab } from '@/modules/compras/ui/components/descarga-robot/DescargaTab';
import { CargaMasivaTab } from '@/modules/compras/ui/components/descarga-robot/CargaMasivaTab';
import { DocumentosTab } from '@/modules/compras/ui/components/descarga-robot/DocumentosTab';
import { ConsolidadoTab } from '@/modules/compras/ui/components/descarga-robot/ConsolidadoTab';

type TabId = 'descarga' | 'carga-masiva' | 'documentos' | 'consolidado';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'descarga', label: 'Descarga', icon: <Download size={16} /> },
    { id: 'carga-masiva', label: 'Carga Masiva', icon: <Upload size={16} /> },
    { id: 'documentos', label: 'Documentos', icon: <FileText size={16} /> },
    { id: 'consolidado', label: 'Consolidado', icon: <BarChart3 size={16} /> },
];

export default function DescargaRobotPage() {
    const { currentEmpresa } = useEmpresa();
    const [activeTab, setActiveTab] = useState<TabId>('descarga');
    const hook = useDescargaRobot();

    useEffect(() => {
        if (currentEmpresa?.id) {
            hook.cargarDescargas({ anio: new Date().getFullYear() });
            hook.cargarComprobantes({ anio: new Date().getFullYear() });
        }
    }, [currentEmpresa?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg">
                    <Bot size={22} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Descarga por Robot</h1>
                    <p className="text-sm text-slate-500">Descarga automatizada de comprobantes electrónicos del SRI</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="flex border-b border-slate-200/80">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-all relative
                                ${activeTab === tab.id
                                    ? 'text-teal-600 bg-teal-50/50'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {activeTab === tab.id && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-cyan-500" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'descarga' && (
                        <DescargaTab
                            descargas={hook.descargas}
                            loading={hook.loading}
                            descargando={hook.descargando}
                            error={hook.error}
                            onIniciarDescarga={hook.iniciarDescarga}
                            onRecargar={(filtros) => hook.cargarDescargas(filtros)}
                        />
                    )}
                    {activeTab === 'carga-masiva' && (
                        <CargaMasivaTab
                            onParsearXml={hook.parsearXml}
                            error={hook.error}
                        />
                    )}
                    {activeTab === 'documentos' && (
                        <DocumentosTab
                            comprobantes={hook.comprobantes}
                            loading={hook.loading}
                            onCargar={(filtros) => hook.cargarComprobantes(filtros)}
                            onActualizar={hook.actualizarComprobante}
                        />
                    )}
                    {activeTab === 'consolidado' && (
                        <ConsolidadoTab
                            descargas={hook.descargas}
                            comprobantes={hook.comprobantes}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
