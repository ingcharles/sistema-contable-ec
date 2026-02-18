'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Asistencia, Empleado } from '@/modules/rrhh/domain/types';
import { RRHHUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';

export default function AsistenciaPage() {
    const { currentEmpresa } = useEmpresa();
    const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [loading, setLoading] = useState(true);
    const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0]);
    const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0]);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        empleadoId: '',
        fecha: new Date().toISOString().split('T')[0],
        horaEntrada: '08:00',
        horaSalida: '17:00',
        novedad: 'NORMAL',
        observaciones: ''
    });

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const [dataAsis, dataEmp] = await Promise.all([
                RRHHUseCases.listarAsistencia(fechaDesde, fechaHasta),
                RRHHUseCases.listarEmpleados()
            ]);
            setAsistencias(dataAsis);
            setEmpleados(dataEmp);
        } catch (error) {
            console.error('Error cargando asistencias:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id, fechaDesde, fechaHasta]);

    const handleSaveAsistencia = async () => {
        if (!formData.empleadoId) {
            alert('Seleccione un empleado');
            return;
        }
        setSaving(true);
        try {
            await RRHHUseCases.guardarAsistencia(formData);
            setShowModal(false);
            loadData();
        } catch (error) {
            alert('Error al guardar asistencia');
        } finally {
            setSaving(false);
        }
    };

    const columns: Column<Asistencia>[] = [
        {
            header: 'Fecha',
            accessorKey: 'fecha',
            cell: (row) => format(new Date(row.fecha), 'dd/MM/yyyy', { locale: es })
        },
        {
            header: 'Empleado',
            cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{row.apellidos} {row.nombres}</span>
                </div>
            )
        },
        { header: 'Entrada', accessorKey: 'horaEntrada' },
        { header: 'Salida', accessorKey: 'horaSalida' },
        {
            header: 'Horas',
            accessorKey: 'horasTrabajadas',
            className: 'text-center font-bold text-sri-blue'
        },
        {
            header: 'Novedad',
            accessorKey: 'novedad',
            cell: (row) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${row.novedad === 'NORMAL' ? 'bg-green-100 text-green-700' :
                    row.novedad === 'ATRASO' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                    {row.novedad}
                </span>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Control de Asistencia</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de tiempos, asistencias y novedades del personal.</p>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="bg-transparent text-sm font-bold text-slate-700 outline-none"
                        />
                    </div>
                    <span className="text-slate-300">al</span>
                    <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none"
                    />
                </div>
            </div>

            <DataTable
                data={asistencias}
                columns={columns}
                loading={loading}
                searchable
                searchPlaceholder="Buscar por empleado..."
                actions={
                    <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 shadow-sm shadow-blue-200">
                        <Plus size={18} /> Registrar Asistencia
                    </Button>
                }
            />

            {showModal && (
                <Modal
                    isOpen={true}
                    onClose={() => setShowModal(false)}
                    title="Registrar Asistencia"
                    icon={<Clock className="text-sri-blue" size={24} />}
                    footer={
                        <ModalFooter
                            onCancel={() => setShowModal(false)}
                            onSubmit={handleSaveAsistencia}
                            isLoading={saving}
                            submitLabel="Guardar Registro"
                        />
                    }
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Empleado</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-sri-blue/10"
                                    value={formData.empleadoId}
                                    onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
                                >
                                    <option value="">Seleccione Empleado</option>
                                    {empleados.map(e => (
                                        <option key={e.id} value={e.id}>{e.apellidos} {e.nombres}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-sri-blue/10"
                                    value={formData.fecha}
                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hora Entrada</label>
                                <input
                                    type="time"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-sri-blue/10"
                                    value={formData.horaEntrada}
                                    onChange={(e) => setFormData({ ...formData, horaEntrada: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hora Salida</label>
                                <input
                                    type="time"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-sri-blue/10"
                                    value={formData.horaSalida}
                                    onChange={(e) => setFormData({ ...formData, horaSalida: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Novedad</label>
                            <select
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-sri-blue/10"
                                value={formData.novedad}
                                onChange={(e) => setFormData({ ...formData, novedad: e.target.value })}
                            >
                                <option value="NORMAL">ASISTENCIA NORMAL</option>
                                <option value="ATRASO">ATRASO</option>
                                <option value="FALTA">FALTA INJUSTIFICADA</option>
                                <option value="PERMISO">PERMISO / LICENCIA</option>
                            </select>
                        </div>
                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Observaciones</label>
                            <textarea
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-sri-blue/10 min-h-[100px]"
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                placeholder="Detalles adicionales..."
                            />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
