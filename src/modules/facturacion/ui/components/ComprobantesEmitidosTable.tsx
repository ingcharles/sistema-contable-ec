'use client';

import { TipoComprobante, EstadoSRI, Factura } from '@/shared/types';
import { formatearDinero } from '@/shared/utils/formatearDinero';
import { Plus, RotateCcw, Truck, Eye, FileCode, Send } from 'lucide-react';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { EstadoBadge } from '@/shared/ui/EstadoBadge';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';

interface ComprobantesEmitidosTableProps {
    facturas: Factura[];
    loading: boolean;
    onReemitir: (row: Factura) => void;
    onNuevaNotaCredito: (factura: Factura) => void;
    onNuevaNotaDebito: (factura: Factura) => void;
    onNuevaGuia: (factura: Factura) => void;
    onVerRide: (factura: Factura) => void;
    onVerXml: (xml: string) => void;
}

export function ComprobantesEmitidosTable({
    facturas,
    loading,
    onReemitir,
    onNuevaNotaCredito,
    onNuevaNotaDebito,
    onNuevaGuia,
    onVerRide,
    onVerXml
}: ComprobantesEmitidosTableProps) {
    const columns: Column<Factura>[] = [
        { header: 'Fecha', accessorKey: 'fechaEmision', className: 'text-slate-600' },
        {
            header: 'Tipo',
            cell: (row) => (
                <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 rounded">
                    {row.tipoComprobanteNombre}
                </span>
            ),
            className: 'text-sm'
        },
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
                            onClick={() => onReemitir(row)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    )}
                    {(row.tipoComprobante === '01' || row.tipo === TipoComprobante.FACTURA) && row.estado === EstadoSRI.AUTORIZADO && (
                        <>
                            <button
                                title="Emitir Nota de Crédito"
                                onClick={() => onNuevaNotaCredito(row)}
                                className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                                <RotateCcw size={18} />
                            </button>
                            <button
                                title="Emitir Nota de Débito"
                                onClick={() => onNuevaNotaDebito(row)}
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Plus size={18} className="text-blue-500" />
                            </button>
                            <button
                                title="Generar Guía de Remisión"
                                onClick={() => onNuevaGuia(row)}
                                className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                                <Truck size={18} />
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => onVerRide(row)}
                        className="p-2 text-slate-500 hover:text-sri-blue hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver RIDE"
                    >
                        <Eye size={18} />
                    </button>
                    <button
                        onClick={() => {
                            if (row.xmlFirmado) {
                                onVerXml(row.xmlFirmado);
                            } else {
                                const dataSri = SriStandardizer.standardizeFactura(row as any);
                                const xml = XmlGenerator.generateFacturaXml(dataSri);
                                onVerXml(xml);
                            }
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

    return <DataTable columns={columns} data={facturas} loading={loading} />;
}
