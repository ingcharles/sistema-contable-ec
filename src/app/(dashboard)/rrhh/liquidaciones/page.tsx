'use client';

import { useState, useEffect } from 'react';
import { FileText, UserMinus, AlertTriangle } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Liquidacion, Empleado } from '@/modules/nomina/domain/types';
import { NominaUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { format } from 'date-fns';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';

export default function LiquidacionesPage() {
    const { currentEmpresa } = useEmpresa();
    const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        empleadoId: '',
        fechaSalida: new Date().toISOString().split('T')[0],
        motivoSalida: 'RENUNCIA',
        totalIngresos: 0,
        totalEgresos: 0,
        valorLiquido: 0,
        detalleCalculo: {}
    });

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const [dataLiq, dataEmp] = await Promise.all([
                NominaUseCases.listarLiquidaciones(),
                NominaUseCases.listarEmpleados()
            ]);
            setLiquidaciones(dataLiq);
            setEmpleados(dataEmp);
        } catch (error) {
            console.error('Error cargando liquidaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id]);

    const handleSaveLiquidacion = async () => {
        if (!formData.empleadoId) {
            alert('Seleccione un empleado');
            return;
        }
        setSaving(true);
        try {
            await NominaUseCases.procesarLiquidacion(formData);
            setShowModal(false);
            loadData();
        } catch (error) {
            alert('Error al procesar liquidación');
        } finally {
            setSaving(false);
        }
    };

    const columns: Column<Liquidacion>[] = [
        {
            header: 'Empleado',
            cell: (row: any) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-slate-800 uppercase text-xs">{row.apellidos} {row.nombres}</span>
                </div>
            )
        },
        {
            header: 'Fecha Salida',
            accessorKey: 'fechaSalida',
            cell: (row) => format(new Date(row.fechaSalida), 'dd/MM/yyyy')
        },
        { header: 'Motivo', accessorKey: 'motivoSalida' },
        {
            header: 'Valor Líquido',
            accessorKey: 'valorLiquido',
            className: 'text-right font-black text-slate-900',
            cell: (row) => formatMoney(row.valorLiquido)
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            cell: (row) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${row.estado === 'PAGADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                    {row.estado}
                </span>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Actas de Finiquito</h1>
                    <p className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-widest text-[10px]">Liquidaciones y desvinculación de personal.</p>
                </div>
                <Button onClick={() => setShowModal(true)} className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl transition-all shadow-xl shadow-slate-200">
                    <UserMinus size={20} /> Generar Liquidación
                </Button>
            </div>

            <DataTable
                data={liquidaciones}
                columns={columns}
                loading={loading}
                searchable
                searchPlaceholder="Buscar por empleado..."
            />

            {showModal && (
                <Modal
                    isOpen={true}
                    onClose={() => setShowModal(false)}
                    title="Procesar Acta de Finiquito"
                    icon={<FileText className="text-rose-600" size={24} />}
                    footer={
                        <ModalFooter
                            onCancel={() => setShowModal(false)}
                            onSubmit={handleSaveLiquidacion}
                            isLoading={saving}
                            submitLabel="Generar y Cerrar"
                        />
                    }
                    size="xl"
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Información General</h3>
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[10px] font-bold text-slate-500">Empleado a Liquidar</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none"
                                        value={formData.empleadoId}
                                        onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {empleados.map(e => (
                                            <option key={e.id} value={e.id}>{e.apellidos} {e.nombres}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[10px] font-bold text-slate-500">Último día laboral</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none"
                                        value={formData.fechaSalida}
                                        onChange={(e) => setFormData({ ...formData, fechaSalida: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[10px] font-bold text-slate-500">Motivo de Desvinculación</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none"
                                        value={formData.motivoSalida}
                                        onChange={(e) => setFormData({ ...formData, motivoSalida: e.target.value })}
                                    >
                                        <option value="RENUNCIA">RENUNCIA VOLUNTARIA</option>
                                        <option value="DESPIDO_INTEMPESTIVO">DESPIDO INTEMPESTIVO</option>
                                        <option value="DESPIDO_JUSTIFICADO">DESPIDO JUSTIFICADO</option>
                                        <option value="FIN_CONTRATO">FIN DE CONTRATO</option>
                                        <option value="VISTO_BUENO">VISTO BUENO</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-left">Cálculo de Haberes</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                                        <span className="text-xs font-bold text-slate-600">Proporcional 13ro</span>
                                        <input type="number" className="w-24 text-right font-bold text-sm outline-none" defaultValue="0.00" />
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                                        <span className="text-xs font-bold text-slate-600">Proporcional 14to</span>
                                        <input type="number" className="w-24 text-right font-bold text-sm outline-none" defaultValue="0.00" />
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                                        <span className="text-xs font-bold text-slate-600">Vacaciones no gozadas</span>
                                        <input type="number" className="w-24 text-right font-bold text-sm outline-none" defaultValue="0.00" />
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                                        <span className="text-xs font-bold text-slate-600">Indemnización (Art. 188)</span>
                                        <input type="number" className="w-24 text-right font-bold text-sm outline-none" defaultValue="0.00" />
                                    </div>
                                    <hr className="border-slate-200 border-dashed" />
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-sm font-black text-slate-800 uppercase">Total a Liquidar</span>
                                        <span className="text-xl font-black text-rose-600">$ 0.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                            <AlertTriangle className="text-amber-600 mt-1" size={20} />
                            <p className="text-[10px] text-amber-800 font-bold uppercase leading-relaxed">
                                Este proceso es irreversible y genera una obligación contable inmediata. Asegúrese de que los cálculos cumplen con la normativa laboral vigente (Código del Trabajo).
                            </p>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
