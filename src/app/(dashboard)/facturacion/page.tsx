'use client';

import { useState, useEffect } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { TipoComprobante, EstadoSRI, Factura } from '@/shared/types';
import { formatearDinero } from '@/shared/utils/formatearDinero';
import {
    Plus, RotateCcw, Truck, Receipt, X, Eye, FileCode, Send, RotateCw, Download, FileText
} from 'lucide-react';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { Button } from '@/shared/ui/Button';
import { EstadoBadge } from '@/shared/ui/EstadoBadge';

// Modals y Tipos de otros módulos
import { GuiaRemisionModal } from '@/modules/facturacion/ui/components/GuiaRemisionModal';
import { GuiaRemision } from '@/modules/facturacion/domain/guias';
import { FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';

import { NuevaFacturaModal } from '@/modules/facturacion/ui/components/NuevaFacturaModal';
import { NotaCreditoModal } from '@/modules/facturacion/ui/components/NotaCreditoModal';
import { NotaDebitoModal } from '@/modules/facturacion/ui/components/NotaDebitoModal';

// Importar catálogos para evitar hardcoding
import { AMBIENTE, TIPO_EMISION } from '@/modules/facturacion/domain/catalogos';
import { FacturaRIDE } from '@/modules/facturacion/ui/components/FacturaRIDE';
import { XmlModal } from '@/modules/facturacion/ui/components/XmlModal';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';

export default function FacturacionPage() {
    const { currentEmpresa } = useEmpresa();
    const [activeTab, setActiveTab] = useState<'comprobantes' | 'guias'>('comprobantes');
    const [selectedFacturaNC, setSelectedFacturaNC] = useState<any | null>(null);
    const [selectedFacturaND, setSelectedFacturaND] = useState<any | null>(null);
    const [selectedFacturaGuia, setSelectedFacturaGuia] = useState<any | null>(null);
    const [facturaVerRide, setFacturaVerRide] = useState<any | null>(null);
    const [xmlVer, setXmlVer] = useState<string | null>(null);
    const [guias, setGuias] = useState<GuiaRemision[]>([]);
    const [showModalGuia, setShowModalGuia] = useState(false);
    const [showModalFactura, setShowModalFactura] = useState(false);
    const [loading, setLoading] = useState(true);

    // Mock facturas as state to allow adding new ones
    const [facturas, setFacturas] = useState<any[]>([]);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const [dataFacturas, dataGuias] = await Promise.all([
                FacturacionUseCases.listarComprobantes(),
                FacturacionUseCases.listarGuias()
            ]);

            setFacturas(dataFacturas);
            setGuias(dataGuias);
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
            alert('Factura emitida y autorizada exitosamente por el SRI (Conectado a API)');
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

    const columns: Column<Factura>[] = [
        { header: 'Fecha', accessorKey: 'fechaEmision', className: 'text-slate-600' },
        { header: 'Secuencial', accessorKey: 'secuencial', className: 'font-mono font-bold' },
        { header: 'Cliente', accessorKey: 'terceroNombre', className: 'font-medium' },
        {
            header: 'Total',
            accessorKey: 'importeTotal',
            className: 'text-right font-bold',
            cell: (row) => formatearDinero(row.importeTotal)
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            className: 'text-center',
            cell: (row) => <EstadoBadge estado={row.estado} />
        },
        {
            header: 'Acciones',
            className: 'text-center',
            cell: (row) => (
                <div className="flex items-center justify-center gap-2">
                    {row.estado !== EstadoSRI.AUTORIZADO && (
                        <button
                            title="Re-emitir al SRI"
                            onClick={() => handleReemitir(row)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    )}
                    {row.tipo === TipoComprobante.FACTURA && row.estado === EstadoSRI.AUTORIZADO && (
                        <>
                            <button
                                title="Emitir Nota de Crédito"
                                onClick={() => setSelectedFacturaNC(row)}
                                className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                                <RotateCcw size={18} />
                            </button>
                            <button
                                title="Emitir Nota de Débito"
                                onClick={() => setSelectedFacturaND(row)}
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Plus size={18} className="text-blue-500" />
                            </button>
                            <button
                                title="Generar Guía de Remisión"
                                onClick={() => { setSelectedFacturaGuia(row); setShowModalGuia(true); }}
                                className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                                <Truck size={18} />
                            </button>
                        </>
                    )}
                    <button onClick={() => setFacturaVerRide(row)} className="p-2 text-slate-500 hover:text-sri-blue hover:bg-blue-50 rounded-lg transition-colors" title="Ver RIDE">
                        <Eye size={18} />
                    </button>
                    <button
                        onClick={() => {
                            const dataSri = SriStandardizer.standardizeFactura(row as any);
                            const xml = XmlGenerator.generateFacturaXml(dataSri);
                            setXmlVer(xml);
                        }}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver XML"
                    >
                        <FileCode size={18} />
                    </button>
                </div>
            )
        }
    ];

    const guiaColumns: Column<GuiaRemision>[] = [
        { header: 'Fecha', accessorKey: 'fechaEmision', className: 'text-slate-600' },
        { header: 'Secuencial', accessorKey: 'secuencial', className: 'font-mono font-bold' },
        {
            header: 'Transportista',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.transportista?.razonSocial}</span>
                    <span className="text-[10px] text-slate-500">Placa: {row.transportista?.placa}</span>
                </div>
            )
        },
        {
            header: 'Destinatario',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.destinatarios?.[0]?.razonSocial}</span>
                    <span className="text-[10px] text-slate-500">{row.destinatarios?.[0]?.direccionDestino}</span>
                </div>
            )
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            className: 'text-center',
            cell: (row) => <EstadoBadge estado={row.estado} />
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    {row.estado !== 'AUTORIZADO' && (
                        <button
                            title="Re-emitir al SRI"
                            onClick={() => handleReemitir(row)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    )}
                    <button className="p-1.5 text-slate-400 hover:text-sri-blue"><Eye size={16} /></button>
                    <button
                        onClick={() => {
                            // Estandarización para Guía de Remisión
                            const dataSri = {
                                infoTributaria: {
                                    ambiente: AMBIENTE.PRUEBAS, tipoEmision: TIPO_EMISION.NORMAL, razonSocial: currentEmpresa.razonSocial, ruc: currentEmpresa.ruc,
                                    codDoc: '06', estab: '001', ptoEmi: '001', secuencial: row.secuencial, dirMatriz: currentEmpresa.direccionMatriz
                                },
                                infoGuiaRemision: {
                                    dirEstablecimiento: currentEmpresa.direccionMatriz, dirPartida: row.puntoPartida, razonSocialTransportista: row.transportista?.razonSocial,
                                    tipoIdentificacionTransportista: '04', rucTransportista: row.transportista?.ruc, obligadoContabilidad: 'SI',
                                    fechaIniTraslado: row.fechaInicioTraslado, fechaFinTraslado: row.fechaFinTraslado, placa: row.transportista?.placa
                                },
                                destinatarios: row.destinatarios?.map((d: any) => ({
                                    identificacionDestinatario: d.identificacion, razonSocialDestinatario: d.razonSocial, dirDestinatario: d.direccionDestino,
                                    motivoTraslado: d.motivoTraslado, codDocSustento: '01', numDocSustento: d.documentoReferencia || '001-001-000000001',
                                    detalles: d.items?.map((i: any) => ({ codigoInterno: i.codigo, descripcion: i.descripcion, cantidad: i.cantidad }))
                                }))
                            };
                            const xml = XmlGenerator.generateGuiaXml(dataSri);
                            setXmlVer(xml);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600"
                        title="Ver XML"
                    >
                        <FileCode size={16} />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-green-600"><Download size={16} /></button>
                </div>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-sri-blue rounded-xl text-white">
                            <Receipt size={24} />
                        </div>
                        Facturación Electrónica
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de comprobantes y guías de remisión autorizados por el SRI</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={loadData} className="gap-2">
                        <RotateCw size={18} className={loading ? 'animate-spin' : ''} />
                        Actualizar
                    </Button>
                    <Button onClick={() => setShowModalFactura(true)} className="gap-2">
                        <Plus size={18} />
                        Nueva Factura
                    </Button>
                </div>
            </div>

            <div className="flex border-b border-slate-100 gap-8">
                <button
                    onClick={() => setActiveTab('comprobantes')}
                    className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'comprobantes' ? 'text-sri-blue' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Comprobantes Emitidos
                    {activeTab === 'comprobantes' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-sri-blue rounded-t-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('guias')}
                    className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'guias' ? 'text-sri-blue' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Guías de Remisión
                    {activeTab === 'guias' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-sri-blue rounded-t-full" />}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {activeTab === 'comprobantes' ? (
                    <DataTable
                        columns={columns}
                        data={facturas}
                        loading={loading}
                    />
                ) : (
                    <DataTable
                        columns={guiaColumns}
                        data={guias}
                        loading={loading}
                    />
                )}
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
                                <FacturaRIDE factura={facturaVerRide} />
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
