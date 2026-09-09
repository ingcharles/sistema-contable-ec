'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, ArrowRight } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { formatMoney } from '@/shared/utils/formatearDinero';

// Modal
import { ProformaModal } from '@/modules/facturacion/ui/components/ProformaModal';

export default function ProformasPage() {
    const { currentEmpresa } = useEmpresa();
    const [proformas, setProformas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProforma, setSelectedProforma] = useState<any>(null);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const res = await fetch('/api/facturacion/proformas', {
                headers: { 'x-empresa-id': currentEmpresa.id }
            });
            const data = await res.json();
            setProformas(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error al cargar proformas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentEmpresa]);

    const handleNew = () => {
        setSelectedProforma(null);
        setModalOpen(true);
    };

    const handleEdit = (row: any) => {
        setSelectedProforma(row);
        setModalOpen(true);
    };

    const handleFacturar = async (row: any) => {
        if (!confirm('¿Está seguro de convertir esta proforma en una factura?')) return;

        try {
            const res = await fetch(`/api/facturacion/proformas/${row.id}/facturar`, {
                method: 'POST',
                headers: { 'x-empresa-id': currentEmpresa?.id || '' }
            });
            if (res.ok) {
                alert('Proforma facturada con éxito');
                loadData();
            } else {
                const err = await res.json();
                alert('Error: ' + err.error);
            }
        } catch (error: any) {
            alert('Error al facturar: ' + error.message);
        }
    };

    const proformaColumns: Column<any>[] = [
        {
            header: 'Número',
            cell: (row: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <FileText size={16} />
                    </div>
                    <span className="font-bold text-slate-700">{row.numero}</span>
                </div>
            )
        },
        {
            header: 'Fecha',
            cell: (row: any) => <span className="text-slate-600">{new Date(row.fecha).toLocaleDateString()}</span>
        },
        {
            header: 'Cliente',
            cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-800">{row.cliente_nombre}</span>
                    <span className="text-xs text-slate-400">{row.cliente_identificacion}</span>
                </div>
            )
        },
        {
            header: 'Total',
            cell: (row: any) => <span className="font-black text-indigo-700">{formatMoney(row.total)}</span>
        },
        {
            header: 'Estado',
            cell: (row: any) => (
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${row.estado === 'FACTURADA' ? 'bg-emerald-100 text-emerald-700' :
                    row.estado === 'ANULADA' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                    }`}>
                    {row.estado}
                </span>
            )
        },
        {
            header: 'Acciones',
            cell: (row: any) => (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600">
                        <Search size={16} />
                    </Button>
                    {row.estado === 'PENDIENTE' && (
                        <Button variant="ghost" size="sm" onClick={() => handleFacturar(row)} className="h-8 px-2 text-indigo-600 hover:bg-indigo-50 gap-1 font-bold">
                            <ArrowRight size={14} />
                            Facturar
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 p-6 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Proformas</h1>
                    <p className="text-slate-500 font-medium">Gestión de presupuestos y cotizaciones</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl bg-white border-slate-200 text-slate-600 font-bold gap-2">
                        <Filter size={20} />
                        Filtrar
                    </Button>
                    <Button onClick={handleNew} className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-100 gap-2">
                        <Plus size={24} />
                        Nueva Proforma
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <DataTable
                    columns={proformaColumns}
                    data={proformas}
                    loading={loading}
                />
            </div>

            <ProformaModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={loadData}
                proforma={selectedProforma}
            />
        </div>
    );
}
