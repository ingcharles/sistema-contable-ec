'use client';

import React, { useEffect } from 'react';
import { History, X } from 'lucide-react';
import { Producto } from '../../domain/types';
import { useKardex } from '../../hooks/useKardex';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';

interface Props {
    producto: Producto;
    onClose: () => void;
    empresaId: string;
}

export const KardexModal: React.FC<Props> = ({ producto, onClose, empresaId: _empresaId }) => {
    const { movimientos, loading, listarMovimientos } = useKardex();

    useEffect(() => {
        listarMovimientos(producto.id, '2020-01-01', '2030-12-31');
    }, [producto.id, listarMovimientos]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <History size={24} className="text-sri-blue" /> Kardex de Artículo
                        </h2>
                        <div className="mt-2 space-y-1">
                            <p className="text-sm text-slate-600"><span className="font-semibold">Producto:</span> {producto.nombre}</p>
                            <p className="text-sm text-slate-600"><span className="font-semibold">Código:</span> {producto.codigoPrincipal}</p>
                            <p className="text-xs text-slate-400">Método de valoración: PROMEDIO PONDERADO</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-lg transition-colors"><X size={24} /></button>
                </div>

                <div className="overflow-auto flex-1 p-0">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th rowSpan={2} className="px-4 py-2 border-r border-slate-200 w-24">Fecha</th>
                                <th rowSpan={2} className="px-4 py-2 border-r border-slate-200">Detalle / Comprobante</th>
                                <th colSpan={3} className="px-4 py-1 text-center border-b border-r border-slate-200 bg-green-50 text-green-700">ENTRADAS</th>
                                <th colSpan={3} className="px-4 py-1 text-center border-b border-r border-slate-200 bg-red-50 text-red-700">SALIDAS</th>
                                <th colSpan={3} className="px-4 py-1 text-center border-b bg-blue-50 text-blue-700">SALDOS</th>
                            </tr>
                            <tr>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-green-50/50">Cant.</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-green-50/50">C. Unit</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-green-50/50 font-bold">Total</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-red-50/50">Cant.</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-red-50/50">C. Unit</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-red-50/50 font-bold">Total</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-blue-50/50">Cant.</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-blue-50/50">C. Prom</th>
                                <th className="px-2 py-1 text-right bg-blue-50/50 font-bold">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={11} className="p-8 text-center text-slate-400">Cargando movimientos...</td></tr>
                            ) : movimientos.map((mov) => (
                                <tr key={mov.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2 border-r border-slate-100 whitespace-nowrap">{mov.fecha}</td>
                                    <td className="px-4 py-2 border-r border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-[10px] uppercase text-slate-500">{mov.tipo.replace('_', ' ')}</span>
                                            <span className="font-mono">{mov.referenciaComprobante}</span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 text-slate-600">{mov.cantidadEntrada > 0 ? mov.cantidadEntrada : '-'}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 text-slate-500">{mov.cantidadEntrada > 0 ? formatMoney(mov.costoUnitario) : '-'}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 font-medium text-green-700 bg-green-50/10">{mov.valorEntrada > 0 ? formatMoney(mov.valorEntrada) : '-'}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 text-slate-600">{mov.cantidadSalida > 0 ? mov.cantidadSalida : '-'}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 text-slate-500">{mov.cantidadSalida > 0 ? formatMoney(mov.costoUnitario) : '-'}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 font-medium text-red-700 bg-red-50/10">{mov.valorSalida > 0 ? formatMoney(mov.valorSalida) : '-'}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 font-bold text-slate-800 bg-blue-50/10">{mov.saldoCantidad}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 text-slate-600 bg-blue-50/10">{formatMoney(mov.costoUnitario)}</td>
                                    <td className="px-2 py-2 text-right font-bold text-blue-800 bg-blue-50/10">{formatMoney(mov.saldoValor)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end">
                    <Button variant="secondary" onClick={onClose}>Cerrar</Button>
                </div>
            </div>
        </div>
    );
};
