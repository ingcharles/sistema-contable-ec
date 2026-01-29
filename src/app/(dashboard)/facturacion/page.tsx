'use client';

import { useState, useEffect } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Factura } from '@/shared/types';
import { Plus, Receipt, X, RotateCw } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

// Modals
import { GuiaRemisionModal } from '@/modules/facturacion/ui/components/GuiaRemisionModal';
import { GuiaRemision } from '@/modules/facturacion/domain/guias';
import { FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { NuevaFacturaModal } from '@/modules/facturacion/ui/components/NuevaFacturaModal';
import { NotaCreditoModal } from '@/modules/facturacion/ui/components/NotaCreditoModal';
import { NotaDebitoModal } from '@/modules/facturacion/ui/components/NotaDebitoModal';
import { FacturaRIDE } from '@/modules/facturacion/ui/components/FacturaRIDE';
import { XmlModal } from '@/modules/facturacion/ui/components/XmlModal';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';

// Componentes de Tablas
import { ComprobantesEmitidosTable } from '@/modules/facturacion/ui/components/ComprobantesEmitidosTable';
import { GuiasRemisionTable } from '@/modules/facturacion/ui/components/GuiasRemisionTable';

export default function FacturacionPage() {
    const { currentEmpresa } = useEmpresa();
    const [activeTab, setActiveTab] = useState<'comprobantes' | 'guias'>('comprobantes');
    const [selectedFacturaNC, setSelectedFacturaNC] = useState<Factura | null>(null);
    const [selectedFacturaND, setSelectedFacturaND] = useState<Factura | null>(null);
    const [selectedFacturaGuia, setSelectedFacturaGuia] = useState<Factura | null>(null);
    const [facturaVerRide, setFacturaVerRide] = useState<Factura | null>(null);
    const [xmlVer, setXmlVer] = useState<string | null>(null);
    const [guias, setGuias] = useState<GuiaRemision[]>([]);
    const [showModalGuia, setShowModalGuia] = useState(false);
    const [showModalFactura, setShowModalFactura] = useState(false);
    const [loading, setLoading] = useState(true);
    const [facturas, setFacturas] = useState<Factura[]>([]);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const [dataFacturas, dataGuias] = await Promise.all([
                FacturacionUseCases.listarComprobantes(),
                FacturacionUseCases.listarGuias()
            ]);
            console.log('Respuesta Facturas:', dataFacturas);
            console.log('Respuesta Guías:', dataGuias);

            // Extraer el array 'data' de la respuesta paginada
            setFacturas(dataFacturas?.data || dataFacturas || []);
            setGuias(dataGuias?.data || dataGuias || []);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentEmpresa?.id, activeTab]);

    const handleSaveFactura = async (nuevaFactura: any) => {
        if (!currentEmpresa) return;

        try {
            await FacturacionUseCases.emitirFactura(nuevaFactura);
            alert('Factura emitida y autorizada exitosamente por el SRI');
            loadData();
            setShowModalFactura(false);
        } catch (error) {
            alert('Error al emitir factura: ' + (error as Error).message);
        }
    };

    const handleReemitir = async (row: any) => {
        try {
            setLoading(true);
            const dataSri = SriStandardizer.standardizeFactura(row);
            const res = await FacturacionUseCases.emitirFactura(dataSri);

            if (res.estado === 'AUTORIZADO') {
                alert('¡Documento autorizado exitosamente!');
                loadData();
            } else {
                alert('Error SRI: ' + JSON.stringify(res.error || res.detalles));
            }
        } catch (err: any) {
            alert('Error al re-emitir: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!currentEmpresa) return null;

    const tabs = [
        { id: 'comprobantes', label: 'Comprobantes Emitidos' },
        { id: 'guias', label: 'Guías de Remisión' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-sri-blue rounded-xl text-white">
                            <Receipt size={24} />
                        </div>
                        Facturación Electrónica
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de comprobantes y guías de remisión autorizados por el SRI</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={loadData} className="gap-2">
                        <RotateCw size={18} className={loading ? 'animate-spin' : ''} />
                        Actualizar
                    </Button>
                    {activeTab === 'comprobantes' && (
                        <Button onClick={() => setShowModalFactura(true)} className="gap-2">
                            <Plus size={18} />
                            Nueva Factura
                        </Button>
                    )}
                    {activeTab === 'guias' && (
                        <Button onClick={() => { setSelectedFacturaGuia(null); setShowModalGuia(true); }} className="gap-2">
                            <Plus size={18} />
                            Nueva Guía
                        </Button>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {activeTab === 'comprobantes' ? (
                        <ComprobantesEmitidosTable
                            facturas={facturas}
                            loading={loading}
                            onReemitir={handleReemitir}
                            onNuevaNotaCredito={(factura) => setSelectedFacturaNC(factura)}
                            onNuevaNotaDebito={(factura) => setSelectedFacturaND(factura)}
                            onNuevaGuia={(factura) => { setSelectedFacturaGuia(factura); setShowModalGuia(true); }}
                            onVerRide={(factura) => setFacturaVerRide(factura)}
                            onVerXml={(xml) => setXmlVer(xml)}
                        />
                    ) : (
                        <GuiasRemisionTable
                            guias={guias}
                            loading={loading}
                            currentEmpresa={currentEmpresa}
                            onReemitir={handleReemitir}
                            onVerXml={(xml) => setXmlVer(xml)}
                        />
                    )}
                </div>
            </div>

            {/* Modals */}
            {showModalFactura && (
                <NuevaFacturaModal
                    onClose={() => setShowModalFactura(false)}
                    onSave={handleSaveFactura}
                />
            )}

            {showModalGuia && (
                <GuiaRemisionModal
                    facturaReferencia={selectedFacturaGuia}
                    onClose={() => { setShowModalGuia(false); setSelectedFacturaGuia(null); }}
                    onSave={() => { loadData(); setShowModalGuia(false); setSelectedFacturaGuia(null); }}
                    empresaId={currentEmpresa?.id || ''}
                />
            )}

            {selectedFacturaNC && (
                <NotaCreditoModal
                    factura={selectedFacturaNC}
                    onClose={() => setSelectedFacturaNC(null)}
                    onSave={() => { loadData(); setSelectedFacturaNC(null); }}
                />
            )}

            {selectedFacturaND && (
                <NotaDebitoModal
                    factura={selectedFacturaND}
                    onClose={() => setSelectedFacturaND(null)}
                    onSave={() => { loadData(); setSelectedFacturaND(null); }}
                />
            )}

            {facturaVerRide && (
                <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Vista Previa RIDE</h3>
                            <button onClick={() => setFacturaVerRide(null)} className="p-2 hover:bg-slate-200 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
                            <div className="bg-white shadow-lg mx-auto max-w-[21cm] min-h-[29.7cm]">
                                <FacturaRIDE factura={facturaVerRide as any} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {xmlVer && (
                <XmlModal
                    xml={xmlVer}
                    onClose={() => setXmlVer(null)}
                />
            )}
        </div>
    );
}
