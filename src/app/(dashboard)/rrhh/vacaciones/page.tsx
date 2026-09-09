'use client';

import { useState, useEffect } from 'react';
import { Umbrella, Clock } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Vacacion, Empleado } from '@/modules/rrhh/domain/types';
import { RRHHUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';

export default function VacacionesPage() {
    const { currentEmpresa } = useEmpresa();
    const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        empleadoId: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: new Date().toISOString().split('T')[0],
        diasSolicitados: 1,
        tipoSolicitud: 'VACACIONES',
        observaciones: ''
    });

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const [dataVac, dataEmp] = await Promise.all([
                RRHHUseCases.listarVacaciones(),
                RRHHUseCases.listarEmpleados()
            ]);
            setVacaciones(dataVac);
            setEmpleados(dataEmp);
        } catch (error) {
            console.error('Error cargando vacaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id]);

    const handleSaveVacacion = async () => {
        if (!formData.empleadoId) {
            alert('Seleccione un empleado');
            return;
        }
        setSaving(true);
        try {
            await RRHHUseCases.solicitarVacaciones(formData);
            setShowModal(false);
            loadData();
        } catch (error) {
            alert('Error al guardar solicitud');
        } finally {
            setSaving(false);
        }
    };

    const columns: Column<Vacacion>[] = [
        {
            header: 'Empleado',
            cell: (row: any) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-slate-800">{row.apellidos} {row.nombres}</span>
                </div>
            )
        },
        {
            header: 'Periodo',
            cell: (row) => (
                <div className="text-left">
                    <span className="text-xs font-medium text-slate-500">Del {format(new Date(row.fechaInicio), 'dd/MM/yyyy')}</span>
                    <br />
                    <span className="text-xs font-medium text-slate-500">Al {format(new Date(row.fechaFin), 'dd/MM/yyyy')}</span>
                </div>
            )
        },
        { header: 'Días', accessorKey: 'diasSolicitados', className: 'text-center font-bold' },
        {
            header: 'Estado',
            accessorKey: 'estado',
            cell: (row) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${row.estado === 'APROBADA' ? 'bg-green-100 text-green-700' :
                    row.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
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
                    <h1 className="text-2xl font-black text-slate-800">Control de Vacaciones</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de periodos de descanso y permisos especiales.</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                        <Umbrella className="text-emerald-500" size={24} />
                        <div>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Días Promedio</p>
                            <p className="text-xl font-black text-emerald-800">15</p>
                        </div>
                    </div>
                </div>
            </div>

            <DataTable
                data={vacaciones}
                columns={columns}
                loading={loading}
                searchable
                searchPlaceholder="Buscar por empleado..."
                actions={
                    <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 shadow-sm bg-gradient-to-r from-emerald-600 to-teal-600 border-none">
                        <Umbrella size={18} /> Solicitar Vacaciones
                    </Button>
                }
            />

            {showModal && (
                <Modal
                    isOpen={true}
                    onClose={() => setShowModal(false)}
                    title="Nueva Solicitud de Vacaciones"
                    icon={<Umbrella className="text-emerald-500" size={24} />}
                    footer={
                        <ModalFooter
                            onCancel={() => setShowModal(false)}
                            onSubmit={handleSaveVacacion}
                            isLoading={saving}
                            submitLabel="Enviar Solicitud"
                        />
                    }
                    size="lg"
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empleado Beneficiario</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer"
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
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Permiso</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer"
                                    value={formData.tipoSolicitud}
                                    onChange={(e) => setFormData({ ...formData, tipoSolicitud: e.target.value })}
                                >
                                    <option value="VACACIONES">VACACIONES ANUALES</option>
                                    <option value="ENFERMEDAD">CITA MÉDICA / ENFERMEDAD</option>
                                    <option value="MATERNIDAD">MATERNIDAD / PATERNIDAD</option>
                                    <option value="ESTUDIOS">PERMISO POR ESTUDIOS</option>
                                    <option value="OTRO">OTROS PERMISOS</option>
                                </select>
                            </div>
                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Inicio</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                    value={formData.fechaInicio}
                                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Fin</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                    value={formData.fechaFin}
                                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock className="text-emerald-600" size={20} />
                                <span className="text-sm font-bold text-emerald-800">Días Totales Calculados</span>
                            </div>
                            <input
                                type="number"
                                className="w-20 bg-white border border-emerald-200 rounded-xl px-3 py-1.5 text-right font-black text-emerald-700 outline-none"
                                value={formData.diasSolicitados}
                                onChange={(e) => setFormData({ ...formData, diasSolicitados: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Justificación / Observaciones</label>
                            <textarea
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-emerald-500/10 min-h-[120px] transition-all"
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                placeholder="Escriba los motivos de su solicitud..."
                            />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
