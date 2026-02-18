'use client';

import { useState, useEffect } from 'react';
import { Landmark, Wallet, Plus, History, AlertCircle, DollarSign, PieChart } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Prestamo, Empleado } from '@/modules/rrhh/domain/types';
import { RRHHUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';

export default function PrestamosPage() {
    const { currentEmpresa } = useEmpresa();
    const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        empleadoId: '',
        fechaPrestamo: new Date().toISOString().split('T')[0],
        montoTotal: 0,
        montoCuota: 0,
        numeroCuotas: 1,
        tipoPrestamo: 'EMPRESA',
        observaciones: ''
    });

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const [dataPres, dataEmp] = await Promise.all([
                RRHHUseCases.listarPrestamos(),
                RRHHUseCases.listarEmpleados()
            ]);
            setPrestamos(dataPres);
            setEmpleados(dataEmp);
        } catch (error) {
            console.error('Error cargando préstamos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id]);

    const handleSavePrestamo = async () => {
        if (!formData.empleadoId || formData.montoTotal <= 0) {
            alert('Complete los campos obligatorios');
            return;
        }
        setSaving(true);
        try {
            await RRHHUseCases.registrarPrestamo(formData);
            setShowModal(false);
            loadData();
        } catch (error) {
            alert('Error al registrar préstamo');
        } finally {
            setSaving(false);
        }
    };

    const columns: Column<Prestamo>[] = [
        {
            header: 'Empleado',
            cell: (row: any) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-slate-800 uppercase text-xs">{row.apellidos} {row.nombres}</span>
                </div>
            )
        },
        {
            header: 'Monto Total',
            className: 'text-right font-black text-slate-900',
            cell: (row: any) => formatMoney(row.monto_total)
        },
        {
            header: 'Cuota',
            accessorKey: 'monto_cuota',
            className: 'text-right font-bold text-sri-blue',
            cell: (row) => `${formatMoney(row.monto_cuota)} (${row.numero_cuotas} cuotas)`
        },
        {
            header: 'Saldo',
            accessorKey: 'saldo_pendiente',
            className: 'text-right font-black text-rose-600',
            cell: (row) => formatMoney(row.saldo_pendiente)
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            cell: (row) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-black ${row.estado === 'ACTIVO' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                    {row.estado}
                </span>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-3 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Préstamos y Anticipos</h1>
                        <p className="text-slate-500 text-sm mt-1">Control de financiamiento interno para colaboradores.</p>
                    </div>
                    <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 scale-105 transition-transform">
                        <Plus size={20} /> Nuevo Préstamo
                    </Button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="bg-blue-50 p-3 rounded-2xl"><Landmark className="text-blue-600" size={24} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Cartera Total</p>
                        <p className="text-xl font-black text-slate-800">{formatMoney(prestamos.reduce((acc, p) => acc + Number(p.saldoPendiente || 0), 0))}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="bg-emerald-50 p-3 rounded-2xl"><Wallet className="text-emerald-600" size={24} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Créditos Activos</p>
                        <p className="text-xl font-black text-slate-800">{prestamos.filter(p => p.estado === 'ACTIVO').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="bg-rose-50 p-3 rounded-2xl"><History className="text-rose-600" size={24} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Vencimientos Prox.</p>
                        <p className="text-xl font-black text-slate-800">3</p>
                    </div>
                </div>
            </div>

            <DataTable
                data={prestamos}
                columns={columns}
                loading={loading}
                searchable
                searchPlaceholder="Buscar por empleado..."
            />

            {showModal && (
                <Modal
                    isOpen={true}
                    onClose={() => setShowModal(false)}
                    title="Otorgar Nuevo Préstamo"
                    icon={<DollarSign className="text-indigo-600" size={24} />}
                    footer={
                        <ModalFooter
                            onCancel={() => setShowModal(false)}
                            onSubmit={handleSavePrestamo}
                            isLoading={saving}
                            submitLabel="Generar Préstamo"
                        />
                    }
                    size="lg"
                >
                    <div className="space-y-6">
                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                            <AlertCircle className="text-indigo-600 mt-1" size={20} />
                            <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                                Al registrar un préstamo, se creará automáticamente un registro de amortización que se descontará en los próximos roles de pago del empleado.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Beneficiario</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    value={formData.empleadoId}
                                    onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
                                >
                                    <option value="">-- Seleccionar Empleado --</option>
                                    {empleados.map(e => (
                                        <option key={e.id} value={e.id}>{e.apellidos} {e.nombres}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Financiamiento</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10"
                                    value={formData.tipoPrestamo}
                                    onChange={(e) => setFormData({ ...formData, tipoPrestamo: e.target.value as any })}
                                >
                                    <option value="EMPRESA">PRÉSTAMO EMPRESARIAL</option>
                                    <option value="ANTICIPO_SUELDO">ANTICIPO DE SUELDO</option>
                                </select>
                            </div>
                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto Principal ($)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10"
                                    value={formData.montoTotal}
                                    onChange={(e) => {
                                        const total = Number(e.target.value);
                                        setFormData({ ...formData, montoTotal: total, montoCuota: total / (formData.numeroCuotas || 1) });
                                    }}
                                />
                            </div>
                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nro. de Cuotas</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10"
                                    value={formData.numeroCuotas}
                                    onChange={(e) => {
                                        const cuotas = Number(e.target.value);
                                        setFormData({ ...formData, numeroCuotas: cuotas, montoCuota: (formData.montoTotal || 0) / (cuotas || 1) });
                                    }}
                                />
                            </div>
                        </div>

                        <div className="p-5 bg-slate-800 rounded-2xl flex items-center justify-between text-white shadow-xl shadow-slate-200">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Proyección de Cuota Mensual</p>
                                <p className="text-2xl font-black">{formatMoney(formData.montoCuota)}</p>
                            </div>
                            <PieChart size={32} className="text-slate-600" />
                        </div>

                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalles del Préstamo</label>
                            <textarea
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 min-h-[100px]"
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                placeholder="Indique el motivo del préstamo..."
                            />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
