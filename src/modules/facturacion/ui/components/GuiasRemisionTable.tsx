'use client';

import { Eye, FileCode, Send, Download } from 'lucide-react';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { EstadoBadge } from '@/shared/ui/EstadoBadge';
import { GuiaRemision } from '@/modules/facturacion/domain/guias';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';
import { Empresa } from '@/shared/types';

interface GuiasRemisionTableProps {
    guias: GuiaRemision[];
    loading: boolean;
    currentEmpresa: Empresa;
    onReemitir: (row: GuiaRemision) => void;
    onVerXml: (xml: string) => void;
}

export function GuiasRemisionTable({
    guias,
    loading,
    currentEmpresa,
    onReemitir,
    onVerXml
}: GuiasRemisionTableProps) {
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
                            onClick={() => onReemitir(row)}
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
                                    ambiente: '1', tipoEmision: '1', razonSocial: currentEmpresa.razonSocial, ruc: currentEmpresa.ruc,
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
                            onVerXml(xml);
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

    return <DataTable columns={guiaColumns} data={guias} loading={loading} />;
}
