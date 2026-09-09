'use client';

import { useEffect } from 'react';

import { TipoComprobante, EstadoSRI, Factura } from '@/shared/types';
import { formatearDinero } from '@/shared/utils/formatearDinero';
import { Plus, RotateCcw, Truck, Eye, FileCode, Send, RotateCw } from 'lucide-react';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { EstadoBadge } from '@/shared/ui/EstadoBadge';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';

interface ComprobantesEmitidosTableProps {
    facturas: Factura[];
    loading: boolean;
    onReemitir: (row: Factura) => void;
    onAutorizar: (row: Factura) => void;
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
    onAutorizar,
    onNuevaNotaCredito,
    onNuevaNotaDebito,
    onNuevaGuia,
    onVerRide,
    onVerXml
}: ComprobantesEmitidosTableProps) {
    // Polling para documentos en procesamiento
    // useEffect(() => {
    //     const documentosEnProcesamiento = facturas.filter(f => f.estado === EstadoSRI.EN_PROCESAMIENTO);

    //     if (documentosEnProcesamiento.length === 0) return;

    //     const intervalId = setInterval(async () => {
    //         let cambios = false;
    //         for (const doc of documentosEnProcesamiento) {
    //             try {
    //                 const res = await fetch('/api/facturacion/autorizar', {
    //                     method: 'POST',
    //                     body: JSON.stringify({ comprobanteId: doc.id })
    //                 });
    //                 const data = await res.json();

    //                 if (data.success && data.estado !== 'RECIBIDA') {
    //                     // Aquí deberíamos notificar al padre o recargar la tabla
    //                     // Como este componente solo recibe props, idealmente llamaríamos a una función onUpdate
    //                     // Pero por ahora dispararemos un evento de ventana o recarga del router si estuviéramos usando useRouter
    //                     window.location.reload(); // Enfoque simple dado que no tenemos onReload prop
    //                     cambios = true;
    //                     break; // Recargamos, no necesitamos seguir
    //                 }
    //             } catch (error) {
    //                 console.error('Error polling autorización:', error);
    //             }
    //         }
    //         if (cambios) clearInterval(intervalId);
    //     }, 5000); // Poll cada 5 segundos

    //     return () => clearInterval(intervalId);
    // }, [facturas]);

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
        { header: 'Cliente', accessorKey: 'razonSocialComprador', className: 'font-medium' },
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
            header: 'Mensaje SRI',
            className: 'text-center',
            cell: (row) => {
                // Mostrar mensaje para estados de error o procesamiento
                if (row.estado === EstadoSRI.DEVUELTA ||
                    row.estado === EstadoSRI.NO_AUTORIZADO ||
                    row.estado === EstadoSRI.RECHAZADO
                ) {
                    // Lógica unificada para obtener mensaje code 70 o errores generales
                    let mensajeMostrar = '';
                    let esCode70 = false;

                    try {
                        const raw = row.mensajesSri;
                        const msgs = typeof raw === 'string'
                            ? JSON.parse(raw).mensajes
                            : (raw as any)?.mensajes || [];

                        // 1. Buscar Code 70 primero
                        const found70 = msgs?.find((m: any) => m.identificador === '70');
                        if (found70) {
                            mensajeMostrar = found70.mensaje;
                            esCode70 = true;
                        } else if (msgs.length > 0) {
                            // 2. Si no es 70, mostrar el primer mensaje de error disponible
                            const firstMsg = msgs[0];
                            mensajeMostrar = firstMsg.mensaje + (firstMsg.informacionAdicional ? ` - ${firstMsg.informacionAdicional}` : '');
                        }
                    } catch (e) {
                        console.error('Error parsing mensajesSri:', e);
                    }

                    if (!mensajeMostrar && !esCode70) return null;

                    return (
                        <div className="flex flex-col items-center max-w-[200px] mx-auto">
                            {((row.estado === EstadoSRI.DEVUELTA && esCode70)) ? (
                                <>
                                    <span className={`text-xs ${row.estado === EstadoSRI.DEVUELTA ? 'text-red-500' : 'text-blue-500'} animate-pulse font-medium`}>
                                        {row.estado === EstadoSRI.DEVUELTA ? 'SRI Devuelta (Procesando)' : 'Procesando SRI...'}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-bold">
                                        (Code 70: En Espera)
                                    </span>
                                </>
                            ) : (
                                <span className="text-xs text-red-600 font-medium break-words text-center">
                                    {mensajeMostrar}
                                </span>
                            )}

                            {esCode70 && mensajeMostrar && (
                                <span className="text-[9px] text-gray-400 truncate max-w-full" title={mensajeMostrar}>
                                    {mensajeMostrar}
                                </span>
                            )}
                        </div>
                    );
                }
                return null;
            }
        },
        {
            header: 'Acciones',
            className: 'text-center',
            cell: (row) => (
                <div className="flex items-center justify-center gap-2">
                    {/* Botón de Verificar Autorización (Manual) - Solo si NO está autorizado */}
                    {row.estado !== EstadoSRI.AUTORIZADO && (
                        <button
                            title="Verificar Autorización en SRI"
                            onClick={() => onAutorizar(row)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <RotateCw size={18} />
                        </button>
                    )}

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
