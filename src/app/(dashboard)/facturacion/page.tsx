'use client';

import { useState, useEffect } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { TipoComprobante, EstadoSRI, Factura } from '@/shared/types';
import { formatearDinero } from '@/shared/utils/formatearDinero';
import {
    CheckCircle2, XCircle, Clock, FileText, Download, Plus,
    RotateCcw, Truck, Receipt, X, Eye, FileCode
} from 'lucide-react';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { Button } from '@/shared/ui/Button';

// Modals y Tipos de otros módulos
import { GuiaRemisionModal } from '@/modules/facturacion/ui/components/GuiaRemisionModal';
import { GuiaRemision } from '@/modules/facturacion/domain/guias';
import { FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';

import { NuevaFacturaModal } from '@/modules/facturacion/ui/components/NuevaFacturaModal';

// Componente para badge de estado
const EstadoBadge = ({ estado }: { estado: EstadoSRI | string }) => {
    const styles: Record<string, string> = {
        [EstadoSRI.AUTORIZADO]: 'bg-green-100 text-green-800',
        'AUTORIZADA': 'bg-green-100 text-green-800',
        [EstadoSRI.PENDIENTE]: 'bg-yellow-100 text-yellow-800',
        'BORRADOR': 'bg-yellow-100 text-yellow-800',
        [EstadoSRI.ANULADO]: 'bg-red-100 text-red-800',
        'ANULADA': 'bg-red-100 text-red-800',
        [EstadoSRI.DEVUELTO]: 'bg-orange-100 text-orange-800',
        [EstadoSRI.RECHAZADO]: 'bg-red-100 text-red-800',
    };

    const icons: Record<string, React.ReactNode> = {
        [EstadoSRI.AUTORIZADO]: <CheckCircle2 size={14} />,
        'AUTORIZADA': <CheckCircle2 size={14} />,
        [EstadoSRI.PENDIENTE]: <Clock size={14} />,
        'BORRADOR': <Clock size={14} />,
        [EstadoSRI.ANULADO]: <XCircle size={14} />,
        'ANULADA': <XCircle size={14} />,
        [EstadoSRI.DEVUELTO]: <RotateCcw size={14} />,
        [EstadoSRI.RECHAZADO]: <XCircle size={14} />,
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${styles[estado] || 'bg-gray-100 text-gray-800'}`}>
            {icons[estado] || <Clock size={14} />}
            {estado}
        </span>
    );
};


// Importar catálogos para evitar hardcoding
import { FORMA_PAGO, TARIFA_IVA, AMBIENTE, TIPO_EMISION } from '@/modules/facturacion/domain/catalogos';
import { FacturaRIDE } from '@/modules/facturacion/ui/components/FacturaRIDE';
import { XmlModal } from '@/modules/facturacion/ui/components/XmlModal';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';

// Modal Visor RIDE (Usando el componente profesional)
const VisorRideModal = ({ factura, onClose }: { factura: any, onClose: () => void }) => {
    // Adaptar factura mock al ViewModel si es necesario
    const facturaViewModel: any = {
        ...factura,
        pagos: factura.pagos || [{ formaPago: FORMA_PAGO.OTROS_CON_SISTEMA_FINANCIERO, total: factura.importeTotal, plazo: 0, unidadTiempo: 'Dias' }],
        detalles: factura.items?.map((item: any) => ({
            codigoPrincipal: item.codigo || '001',
            cantidad: item.cantidad,
            descripcion: item.nombre || item.descripcion,
            precioUnitario: item.precio,
            descuento: 0,
            total: item.cantidad * item.precio,
            codigoIVA: TARIFA_IVA.IVA_15 // Simular IVA 15%
        })) || [],
        totalSinImpuestos: factura.subtotal || (factura.importeTotal / 1.15),
        totalIVA: factura.totalImpuestos || (factura.importeTotal - (factura.importeTotal / 1.15)),
        razonSocialAdquirente: factura.terceroNombre,
        identificacionAdquirente: factura.terceroId,
        dirMatriz: 'AV. AMAZONAS N32-123 Y LA NIÑA', // Mock
        obligadoContabilidad: 'SI',
        ruc: '1790016919001', // Mock de la empresa
        ambiente: '1',
        tipoEmision: '1',
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl h-[95vh] flex flex-col shadow-2xl overflow-hidden rounded-2xl animate-in zoom-in-95 duration-200">
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="bg-sri-blue p-1.5 rounded-lg">
                            <FileText size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm tracking-tight">RIDE - REPRESENTACIÓN IMPRESA</h3>
                            <p className="text-[10px] text-slate-400 font-mono">{factura.secuencial}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => window.print()} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                            <Download size={14} className="mr-2" /> Descargar PDF
                        </Button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
                    </div>
                </div>
                <div className="flex-1 bg-slate-100 p-4 md:p-12 overflow-y-auto">
                    <FacturaRIDE factura={facturaViewModel} />
                </div>
            </div>
        </div>
    );
};

interface ItemNotaCredito {
    id: string;
    nombre: string;
    cantidadOriginal: number;
    precio: number;
    cantidadDevolver: number;
}

// Modal Nota de Crédito
const NotaCreditoModal = ({ factura, onClose, onSave }: { factura: any, onClose: () => void, onSave: () => void }) => {
    const [motivo, setMotivo] = useState('');
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<ItemNotaCredito[]>(
        factura.items?.map((item: any, index: number) => ({
            id: item.id || `item-${index}`,
            nombre: item.nombre || item.descripcion,
            cantidadOriginal: item.cantidad,
            precio: item.precio,
            cantidadDevolver: 0
        })) || []
    );

    const handleCantidadChange = (id: string, val: number) => {
        setItems((prev: ItemNotaCredito[]) => prev.map(item =>
            item.id === id ? { ...item, cantidadDevolver: Math.min(Math.max(0, val), item.cantidadOriginal) } : item
        ));
    };

    const subtotalDevolucion = items.reduce((acc, item) => acc + (item.cantidadDevolver * item.precio), 0);
    const ivaDevolucion = subtotalDevolucion * 0.15;
    const totalDevolucion = subtotalDevolucion + ivaDevolucion;

    const handleEmitirNC = () => {
        if (!motivo || totalDevolucion === 0) {
            alert("Debe ingresar un motivo y devolver al menos un ítem.");
            return;
        }
        if (window.confirm(`¿Confirma la emisión de Nota de Crédito por ${formatearDinero(totalDevolucion)}?`)) {
            alert('Nota de Crédito emitida exitosamente.');
            onSave();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <RotateCcw className="text-orange-500" /> Emisión de Nota de Crédito
                        </h2>
                        <p className="text-xs text-slate-500">Sobre Factura: <span className="font-mono font-bold">{factura.secuencial}</span></p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Motivo de Modificación</label>
                            <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="Ej: Devolución mercadería" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Emisión NC</label>
                            <input type="date" value={fechaEmision} onChange={e => setFechaEmision(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase border-b pb-1">Items Facturados</h4>
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-600 font-semibold">
                                <tr>
                                    <th className="p-2">Producto</th>
                                    <th className="p-2 text-right">Facturado</th>
                                    <th className="p-2 text-right">Devolver</th>
                                    <th className="p-2 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map(item => (
                                    <tr key={item.id}>
                                        <td className="p-2">{item.nombre}</td>
                                        <td className="p-2 text-right">{item.cantidadOriginal}</td>
                                        <td className="p-2 text-right">
                                            <input
                                                type="number"
                                                min="0"
                                                max={item.cantidadOriginal}
                                                value={item.cantidadDevolver}
                                                onChange={e => handleCantidadChange(item.id, Number(e.target.value))}
                                                className="w-16 border rounded p-1 text-center font-bold bg-orange-50 border-orange-200"
                                            />
                                        </td>
                                        <td className="p-2 text-right font-mono">{formatearDinero(item.cantidadDevolver * item.precio)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end pt-2">
                        <div className="w-48 space-y-1 text-right text-sm">
                            <div className="flex justify-between"><span>Subtotal:</span> <span>{formatearDinero(subtotalDevolucion)}</span></div>
                            <div className="flex justify-between"><span>IVA 15%:</span> <span>{formatearDinero(ivaDevolucion)}</span></div>
                            <div className="flex justify-between font-bold text-lg text-orange-600 border-t pt-1">
                                <span>Total NC:</span> <span>{formatearDinero(totalDevolucion)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-white rounded-lg">Cancelar</button>
                    <button onClick={handleEmitirNC} className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-500 shadow-sm flex items-center gap-2">
                        <RotateCcw size={18} /> Generar NC
                    </button>
                </div>
            </div>
        </div>
    );
};


export default function FacturacionPage() {
    const { currentEmpresa } = useEmpresa();
    const [activeTab, setActiveTab] = useState<'comprobantes' | 'guias'>('comprobantes');
    const [selectedFacturaNC, setSelectedFacturaNC] = useState<any | null>(null);
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
                    <span className="font-medium">{row.transportista.razonSocial}</span>
                    <span className="text-[10px] text-slate-500">Placa: {row.transportista.placa}</span>
                </div>
            )
        },
        {
            header: 'Destinatario',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.destinatarios[0]?.razonSocial}</span>
                    <span className="text-[10px] text-slate-500">{row.destinatarios[0]?.ruta}</span>
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
                    <button className="p-1.5 text-slate-400 hover:text-sri-blue"><Eye size={16} /></button>
                    <button
                        onClick={() => {
                            // Mock para Guía de Remisión (Estandarización rápida para demo)
                            const dataSri = {
                                infoTributaria: {
                                    ambiente: AMBIENTE.PRUEBAS, tipoEmision: TIPO_EMISION.NORMAL, razonSocial: currentEmpresa.razonSocial, ruc: currentEmpresa.ruc,
                                    codDoc: '06', estab: '001', ptoEmi: '001', secuencial: row.secuencial.split('-')[2], dirMatriz: currentEmpresa.direccionMatriz
                                },
                                infoGuiaRemision: {
                                    dirEstablecimiento: currentEmpresa.direccionMatriz, dirPartida: row.puntoPartida, razonSocialTransportista: row.transportista.razonSocial,
                                    tipoIdentificacionTransportista: '04', rucTransportista: row.transportista.ruc, obligadoContabilidad: 'SI',
                                    fechaIniTraslado: row.fechaInicioTraslado, fechaFinTraslado: row.fechaFinTraslado, placa: row.transportista.placa
                                },
                                destinatarios: row.destinatarios.map((d: any) => ({
                                    identificacionDestinatario: d.identificacion, razonSocialDestinatario: d.razonSocial, dirDestinatario: d.direccionDestino,
                                    motivoTraslado: d.motivoTraslado, ruta: d.ruta, codDocSustento: '01', numDocSustento: d.documentoReferencia,
                                    detalles: d.items.map((i: any) => ({ codigoInterno: i.codigo, descripcion: i.descripcion, cantidad: i.cantidad }))
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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Facturación Electrónica</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de comprobantes y documentos autorizados por el SRI.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('comprobantes')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'comprobantes' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Receipt size={16} /> Comprobantes
                    </button>
                    <button onClick={() => setActiveTab('guias')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'guias' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Truck size={16} /> Guías Remisión
                    </button>
                </div>
            </div>

            {activeTab === 'comprobantes' && (
                <DataTable
                    data={facturas}
                    columns={columns}
                    itemsPerPage={10}
                    loading={loading}
                    searchPlaceholder="Buscar por cliente, RUC o secuencial..."
                    actions={
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowModalFactura(true)}
                                className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all transform hover:scale-105"
                            >
                                <Plus size={16} /> Emitir Factura
                            </button>

                        </div>
                    }
                />
            )}

            {activeTab === 'guias' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => { setSelectedFacturaGuia(null); setShowModalGuia(true); }} className="flex items-center gap-2">
                            <Plus size={16} /> Nueva Guía Libre
                        </Button>
                    </div>
                    <DataTable
                        data={guias}
                        columns={guiaColumns}
                        itemsPerPage={10}
                        loading={loading}
                        searchPlaceholder="Buscar por transportista, placa o destino..."
                    />
                </div>
            )}

            {/* Modals */}
            {selectedFacturaNC && (
                <NotaCreditoModal
                    factura={selectedFacturaNC}
                    onClose={() => setSelectedFacturaNC(null)}
                    onSave={loadData}
                />
            )}

            {facturaVerRide && (
                <VisorRideModal
                    factura={facturaVerRide}
                    onClose={() => setFacturaVerRide(null)}
                />
            )}

            {showModalGuia && (
                <GuiaRemisionModal
                    facturaReferencia={selectedFacturaGuia}
                    onClose={() => { setShowModalGuia(false); setSelectedFacturaGuia(null); }}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                />
            )}

            {showModalFactura && (
                <NuevaFacturaModal
                    onClose={() => setShowModalFactura(false)}
                    onSave={handleSaveFactura}
                />
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


