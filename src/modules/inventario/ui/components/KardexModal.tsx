'use client';

import React, { useEffect, useState } from 'react';
import { History, Package, Hash, Plus } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Producto } from '../../domain/types';
import { useKardex } from '../../hooks/useKardex';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { AjusteStockModal } from './AjusteStockModal';
import { Button } from '@/shared/ui/Button';

interface Props {
    producto: Producto;
    onClose: () => void;
    empresaId: string;
    onRefresh?: () => void;
}

export const KardexModal: React.FC<Props> = ({ producto, onClose, empresaId, onRefresh }) => {
    const { movimientos, loading, listarMovimientos } = useKardex();
    const [showAjusteModal, setShowAjusteModal] = useState(false);

    const cargarMovimientos = () => {
        listarMovimientos(producto.id, '2020-01-01', '2030-12-31');
    };

    useEffect(() => {
        cargarMovimientos();
    }, [producto.id]);

    const footer = (
        <div className="flex justify-between items-center">
            <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAjusteModal(true)}
                className="flex items-center gap-2"
            >
                <Plus size={16} /> Nuevo Ajuste
            </Button>
            <ModalFooter
                onCancel={onClose}
                showSubmit={false}
                cancelLabel="Cerrar"
            />
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Kardex de Artículo"
            description="Historial de movimientos de inventario con método de promedio ponderado."
            icon={<History size={24} />}
            footer={footer}
            size="xl"
        >
            <div className="space-y-4">
                <div className="p-4 bg-sri-blue/5 rounded-xl border border-sri-blue/10">
                    <div className="flex items-center gap-2 mb-1">
                        <Package size={16} className="text-sri-blue" />
                        <span className="font-black text-slate-800 uppercase tracking-tight">{producto.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Hash size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-600">Código: <span className="font-mono font-bold text-sri-blue">{producto.codigoPrincipal}</span></span>
                    </div>
                </div>

                <div className="overflow-auto max-h-[60vh] -mx-6">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th rowSpan={2} className="px-4 py-2 border-r border-slate-200 w-24">Fecha</th>
                                <th rowSpan={2} className="px-4 py-2 border-r border-slate-200">Detalle / Comprobante</th>
                                <th colSpan={3} className="px-4 py-1 text-center border-b border-r border-slate-200 bg-emerald-50 text-emerald-700 font-black uppercase tracking-wider">Entradas</th>
                                <th colSpan={3} className="px-4 py-1 text-center border-b border-r border-slate-200 bg-rose-50 text-rose-700 font-black uppercase tracking-wider">Salidas</th>
                                <th colSpan={3} className="px-4 py-1 text-center border-b bg-sri-blue/10 text-sri-blue font-black uppercase tracking-wider">Saldos</th>
                            </tr>
                            <tr>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-emerald-50/50">Cant.</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-emerald-50/50">C. Unit</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-emerald-50/50 font-bold">Total</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-rose-50/50">Cant.</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-rose-50/50">C. Unit</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-rose-50/50 font-bold">Total</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-sri-blue/5">Cant.</th>
                                <th className="px-2 py-1 text-right border-r border-slate-200 bg-sri-blue/5">C. Prom</th>
                                <th className="px-2 py-1 text-right bg-sri-blue/5 font-bold">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={11} className="p-8 text-center text-slate-400">Cargando movimientos...</td></tr>
                            ) : movimientos.map((mov) => (
                                <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-2 border-r border-slate-100 whitespace-nowrap font-medium text-slate-600">{mov.fecha}</td>
                                    <td className="px-4 py-2 border-r border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="font-black text-[10px] uppercase text-slate-500 tracking-wider">{mov.tipo.replace('_', ' ')}</span>
                                            <span className="font-mono text-xs font-bold text-slate-700">{mov.referenciaComprobante}</span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 text-slate-600 font-medium">{mov.cantidadEntrada > 0 ? mov.cantidadEntrada : '-'}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 text-slate-500 font-mono text-[10px]">{mov.cantidadEntrada > 0 ? formatMoney(mov.costoUnitario) : '-'}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 font-bold text-emerald-700 bg-emerald-50/20">{mov.valorEntrada > 0 ? formatMoney(mov.valorEntrada) : '-'}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 text-slate-600 font-medium">{mov.cantidadSalida > 0 ? mov.cantidadSalida : '-'}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 text-slate-500 font-mono text-[10px]">{mov.cantidadSalida > 0 ? formatMoney(mov.costoUnitario) : '-'}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 font-bold text-rose-700 bg-rose-50/20">{mov.valorSalida > 0 ? formatMoney(mov.valorSalida) : '-'}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 font-black text-sri-blue bg-sri-blue/5">{mov.saldoCantidad}</td>
                                    <td className="px-2 py-2 text-right border-r border-slate-100 text-slate-600 bg-sri-blue/5 font-mono text-[10px]">{formatMoney(mov.costoUnitario)}</td>
                                    <td className="px-2 py-2 text-right font-black text-sri-blue bg-sri-blue/10">{formatMoney(mov.saldoValor)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAjusteModal && (
                <AjusteStockModal
                    producto={producto}
                    onClose={() => setShowAjusteModal(false)}
                    onSave={() => {
                        setShowAjusteModal(false);
                        cargarMovimientos();
                        onRefresh?.();
                    }}
                    empresaId={empresaId}
                />
            )}
        </Modal>
    );
};
