'use client';

import { useEffect, useState } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Anticipo, TipoCartera } from '@/modules/cartera/domain/types';
import { CarteraUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { RegistroAnticipoModal } from '@/modules/cartera/ui/components/RegistroAnticipoModal';
import { Plus, FileSpreadsheet } from 'lucide-react';

export default function AnticiposPage() {
    const { currentEmpresa } = useEmpresa();
    const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
    const [showAnticipoModal, setShowAnticipoModal] = useState(false);
    const [tipo, setTipo] = useState<TipoCartera>(TipoCartera.CXC);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const dataAnt = await CarteraUseCases.listarAnticipos(tipo);
            setAnticipos(dataAnt);
        } catch (error) {
            console.error('Error cargando anticipos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id, tipo]);

    const handleExport = () => {
        if (anticipos.length === 0) return;
        const csvContent = ["Fecha", "Tercero", "Referencia", "Disponible"].join(",") + "\n" +
            anticipos.map(a => [a.fecha, `"${a.terceroNombre}"`, `"${a.referencia}"`, a.saldoDisponible].join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `anticipos_${tipo}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const antColumns: Column<Anticipo>[] = [
        { header: 'Fecha', accessorKey: 'fecha', className: 'text-slate-600' },
        { header: 'Tercero', accessorKey: 'terceroNombre', className: 'font-medium text-slate-800' },
        { header: 'Referencia', accessorKey: 'referencia', className: 'text-xs text-slate-500' },
        {
            header: 'Monto Original',
            accessorKey: 'montoOriginal',
            className: 'text-right text-slate-500',
            cell: (ant) => formatMoney(ant.montoOriginal)
        },
        {
            header: 'Disponible',
            accessorKey: 'saldoDisponible',
            className: 'text-right font-bold text-emerald-700 bg-emerald-50/20',
            cell: (ant) => formatMoney(ant.saldoDisponible)
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Anticipos</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de anticipos recibidos y entregados.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setTipo(TipoCartera.CXC)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tipo === TipoCartera.CXC ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500'}`}>
                        Clientes
                    </button>
                    <button onClick={() => setTipo(TipoCartera.CXP)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tipo === TipoCartera.CXP ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500'}`}>
                        Proveedores
                    </button>
                </div>
            </div>

            <DataTable
                data={anticipos}
                columns={antColumns}
                loading={loading}
                itemsPerPage={10}
                searchable
                searchPlaceholder="Buscar anticipo..."
                actions={
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={handleExport} className="flex items-center gap-2">
                            <FileSpreadsheet size={16} /> Exportar
                        </Button>
                        <Button onClick={() => setShowAnticipoModal(true)} size="sm" className="flex items-center gap-2 shadow-sm">
                            <Plus size={16} /> Nuevo
                        </Button>
                    </div>
                }
            />

            {showAnticipoModal && (
                <RegistroAnticipoModal
                    tipo={tipo}
                    onClose={() => setShowAnticipoModal(false)}
                    onSave={loadData}
                />
            )}
        </div>
    );
}
