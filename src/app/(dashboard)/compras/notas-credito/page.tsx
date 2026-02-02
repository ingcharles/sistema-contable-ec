"use client";

import { useState, useEffect, useCallback } from 'react';
import { FileMinus, Plus, Receipt } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { NotaCreditoCompraModal } from '@/modules/compras/ui/components/NotaCreditoCompraModal';

export default function NotasCreditoComprasPage() {
    const { currentEmpresa } = useEmpresa();
    const [notas, setNotas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    const loadData = useCallback(async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            // Fetch directly from API as we don't have a UseCase wrapper yet
            const res = await fetch('/api/compras/notas-credito');
            if (res.ok) {
                const data = await res.json();
                setNotas(data || []);
            }
        } catch (error) {
            console.error('Error al cargar notas:', error);
        } finally {
            setLoading(false);
        }
    }, [currentEmpresa]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const columns: Column<any>[] = [
        {
            header: 'Emisión',
            accessorKey: 'fecha_emision',
            cell: (row) => new Date(row.fecha_emision).toLocaleDateString()
        },
        {
            header: 'Proveedor',
            accessorKey: 'proveedor_nombre',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{row.proveedor_nombre}</span>
                    <span className="text-xs text-slate-500">{row.proveedor_ruc}</span>
                </div>
            )
        },
        {
            header: 'Secuencial',
            accessorKey: 'secuencial',
            cell: (row) => <span className="font-mono text-slate-600">{row.secuencial}</span>
        },
        {
            header: 'Factura',
            accessorKey: 'factura_numero',
            cell: (row) => row.factura_numero ?
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">{row.factura_numero}</span> :
                <span className="text-xs text-slate-400">Sin referencia</span>
        },
        {
            header: 'Motivo',
            accessorKey: 'motivo',
            cell: (row) => <span className="text-sm text-slate-600 truncate max-w-[200px] block" title={row.motivo}>{row.motivo}</span>
        },
        {
            header: 'Total',
            accessorKey: 'total',
            cell: (row) => <span className="font-bold text-slate-800">${parseFloat(row.total).toFixed(2)}</span>
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            cell: (row) => (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700`}>
                    {row.estado}
                </span>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-sri-blue rounded-xl text-white">
                            <FileMinus size={24} />
                        </div>
                        Notas de Crédito de Proveedores
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de devoluciones y ajustes de facturas de compra.</p>
                </div>
                <Button onClick={() => setModalOpen(true)} className="gap-2 shadow-lg shadow-blue-500/20">
                    <Plus size={18} />
                    Registrar Nota
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Receipt size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Notas Emitidas</p>
                            <h3 className="text-2xl font-bold text-slate-800">{notas.length}</h3>
                        </div>
                    </div>
                </div>
                {/* Metrías adicionales (pendientes de calcular) */}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <DataTable
                    data={notas}
                    columns={columns}
                    loading={loading}
                    itemsPerPage={10}
                    searchable
                    searchPlaceholder="Buscar por proveedor o secuencial..."
                />
            </div>

            {modalOpen && (
                <NotaCreditoCompraModal
                    onClose={() => setModalOpen(false)}
                    onSave={() => {
                        setModalOpen(false);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}
