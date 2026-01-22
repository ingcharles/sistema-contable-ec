'use client';

import { useState, useEffect } from 'react';
import { UserPlus, FileText, Calculator, CheckCircle2, Trash2, Users, FileSpreadsheet, Calendar, CreditCard, Download } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Empleado, RolPago } from '@/modules/nomina/domain/types';
import { NominaUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { generatePayrollPDF } from '@/shared/utils/pdfGenerator';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';

import { RolPagoModal } from '@/modules/nomina/ui/components/RolPagoModal';
import { EmpleadoModal } from '@/modules/nomina/ui/components/EmpleadoModal';
import { PagarRolModal } from '@/modules/nomina/ui/components/PagarRolModal';

export default function NominaPage() {
    const { currentEmpresa } = useEmpresa();
    const [activeTab, setActiveTab] = useState<'empleados' | 'roles'>('empleados');
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [roles, setRoles] = useState<RolPago[]>([]);
    const [loading, setLoading] = useState(true);
    const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
    const [selectedEmpleadoEdit, setSelectedEmpleadoEdit] = useState<Empleado | null>(null);
    const [showRolModal, setShowRolModal] = useState(false);
    const [showEmpleadoModal, setShowEmpleadoModal] = useState(false);
    const [showPagarModal, setShowPagarModal] = useState(false);
    const [selectedRol, setSelectedRol] = useState<any | null>(null);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const [dataEmp, dataRoles] = await Promise.all([
                NominaUseCases.listarEmpleados(),
                NominaUseCases.listarRoles(periodo)
            ]);
            setEmpleados(dataEmp);
            setRoles(dataRoles);
        } catch (error) {
            console.error('Error cargando nómina:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id, periodo]);

    const handleDownloadRol = (rol: RolPago) => {
        if (!currentEmpresa) return;

        const empleado = empleados.find(e => e.id === rol.empleadoId);
        if (!empleado) {
            alert('No se encontró información del empleado');
            return;
        }

        generatePayrollPDF({
            empleado: {
                nombre: `${empleado.nombres} ${empleado.apellidos}`,
                cedula: empleado.identificacion,
                cargo: empleado.cargo,
                sueldoBase: empleado.sueldoBase
            },
            periodo: rol.periodo,
            ingresos: {
                sueldoBase: empleado.sueldoBase,
                horasExtras: rol.horasExtras,
                comisiones: rol.comisiones,
                otros: rol.otrosIngresos
            },
            egresos: {
                aportePersonal: rol.aportePersonal,
                anticipos: rol.anticipos,
                prestamos: rol.prestamosIESS,
                otros: rol.otrosDescuentos
            },
            provisiones: {
                decimoTercero: rol.decimoTercero,
                decimoCuarto: rol.decimoCuarto,
                fondosReserva: rol.fondosReserva,
                vacaciones: rol.vacaciones,
                aportePatronal: rol.aportePatronal
            },
            netoPagar: rol.netoAPagar,
            empresa: {
                nombre: currentEmpresa.razonSocial,
                ruc: currentEmpresa.ruc,
                direccion: currentEmpresa.direccionMatriz
            }
        });
    };

    const handleGenerarNomina = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            await NominaUseCases.generarRol(periodo);
            await loadData();
        } catch (error) {
            alert('Error al generar nómina');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEmpleado = async (id: string) => {
        if (window.confirm('¿Está seguro de anular este empleado?')) {
            try {
                await NominaUseCases.eliminarEmpleado(id);
                loadData();
            } catch (error) {
                alert('Error al eliminar empleado');
            }
        }
    };

    const empleadoColumns: Column<Empleado>[] = [
        {
            header: 'Empleado',
            cell: (emp) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{emp.apellidos} {emp.nombres}</span>
                    <span className="text-xs text-slate-500">{emp.identificacion}</span>
                </div>
            ),
            sortable: true,
            accessorKey: 'apellidos'
        },
        { header: 'Cargo', accessorKey: 'cargo', sortable: true },
        { header: 'Fecha Ingreso', accessorKey: 'fechaIngreso' },
        {
            header: 'Sueldo Base',
            accessorKey: 'sueldoBase',
            className: 'text-right font-medium',
            cell: (emp) => formatMoney(emp.sueldoBase)
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            className: 'text-center',
            cell: (emp) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${emp.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {emp.estado}
                </span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (emp) => (
                <div className="flex justify-end gap-1">
                    <button
                        className="p-1.5 text-slate-400 hover:text-sri-blue rounded-lg transition-colors"
                        title="Generar Rol Individual"
                        onClick={() => { setSelectedEmpleado(emp); setShowRolModal(true); }}
                    >
                        <Calculator size={18} />
                    </button>
                    <button
                        className="p-1.5 text-slate-400 hover:text-sri-blue rounded-lg transition-colors"
                        title="Editar"
                        onClick={() => { setSelectedEmpleadoEdit(emp); setShowEmpleadoModal(true); }}
                    >
                        <FileText size={18} />
                    </button>
                    <button
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Anular"
                        onClick={() => handleDeleteEmpleado(emp.id)}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }
    ];

    const rolColumns: Column<RolPago>[] = [
        {
            header: 'Empleado',
            cell: (rol) => {
                const emp = empleados.find(e => e.id === rol.empleadoId);
                return <span className="font-medium text-slate-800">{emp ? `${emp.apellidos} ${emp.nombres}` : 'Empleado no encontrado'}</span>;
            }
        },
        {
            header: 'Ingresos',
            accessorKey: 'totalIngresos',
            className: 'text-right text-green-600',
            cell: (rol) => formatMoney(rol.totalIngresos)
        },
        {
            header: 'Egresos',
            accessorKey: 'totalEgresos',
            className: 'text-right text-red-600',
            cell: (rol) => formatMoney(rol.totalEgresos)
        },
        {
            header: 'Neto a Pagar',
            accessorKey: 'netoAPagar',
            className: 'text-right font-bold text-slate-900',
            cell: (rol) => formatMoney(rol.netoAPagar)
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            className: 'text-center',
            cell: (rol) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${rol.estado === 'BORRADOR' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {rol.estado}
                </span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (rol) => (
                <div className="flex justify-end gap-1">
                    {rol.estado !== 'PAGADO' && (
                        <button
                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg"
                            title="Pagar"
                            onClick={() => { setSelectedRol(rol); setShowPagarModal(true); }}
                        >
                            <CreditCard size={18} />
                        </button>
                    )}
                    <button
                        className="p-1.5 text-sri-blue hover:bg-sri-blue/10 rounded-lg"
                        title="Descargar PDF"
                        onClick={() => handleDownloadRol(rol)}
                    >
                        <Download size={18} />
                    </button>
                </div>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Nómina y Talento Humano</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de personal, roles de pago y provisiones sociales.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('empleados')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'empleados' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Users size={16} /> Empleados
                    </button>
                    <button onClick={() => setActiveTab('roles')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'roles' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <FileText size={16} /> Roles de Pago
                    </button>
                </div>
            </div>

            {activeTab === 'roles' && (
                <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                            <Calendar size={12} /> Periodo de Nómina
                        </label>
                        <input
                            type="month"
                            value={periodo}
                            onChange={(e) => setPeriodo(e.target.value)}
                            className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-sri-blue/20 bg-white"
                        />
                    </div>
                    <Button onClick={handleGenerarNomina} className="flex items-center gap-2 shadow-sm">
                        <Calculator size={18} /> Generar Nómina Mensual
                    </Button>
                </div>
            )}

            {activeTab === 'empleados' ? (
                <DataTable
                    data={empleados}
                    columns={empleadoColumns}
                    loading={loading}
                    itemsPerPage={5}
                    searchable
                    searchPlaceholder="Buscar empleado..."
                    actions={
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" className="flex items-center gap-2">
                                <FileSpreadsheet size={16} /> Exportar
                            </Button>
                            <Button onClick={() => { setSelectedEmpleadoEdit(null); setShowEmpleadoModal(true); }} size="sm" className="flex items-center gap-2 shadow-sm">
                                <UserPlus size={18} /> Nuevo
                            </Button>
                        </div>
                    }
                />
            ) : (
                <div className="space-y-4">
                    <DataTable
                        data={roles}
                        columns={rolColumns}
                        loading={loading}
                        itemsPerPage={5}
                        emptyMessage="No se han generado roles para este periodo."
                        actions={
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm" className="flex items-center gap-2">
                                    <FileSpreadsheet size={16} /> Exportar
                                </Button>
                                <Button variant="secondary" size="sm" className="flex items-center gap-1 text-emerald-600 border-emerald-100 hover:bg-emerald-50"><CheckCircle2 size={14} /> Cerrar Nómina</Button>
                            </div>
                        }
                    />
                </div>
            )}

            {showRolModal && selectedEmpleado && (
                <RolPagoModal
                    empleado={{
                        id: selectedEmpleado.id,
                        nombre: `${selectedEmpleado.apellidos} ${selectedEmpleado.nombres}`,
                        cargo: selectedEmpleado.cargo,
                        sueldoBase: selectedEmpleado.sueldoBase
                    }}
                    periodo={periodo}
                    onClose={() => { setShowRolModal(false); setSelectedEmpleado(null); }}
                    onSave={loadData}
                />
            )}

            {showEmpleadoModal && (
                <EmpleadoModal
                    empleado={selectedEmpleadoEdit || undefined}
                    onClose={() => { setShowEmpleadoModal(false); setSelectedEmpleadoEdit(null); }}
                    onSave={loadData}
                />
            )}

            {showPagarModal && selectedRol && (
                <PagarRolModal
                    rol={selectedRol}
                    onClose={() => { setShowPagarModal(false); setSelectedRol(null); }}
                    onSave={loadData}
                />
            )}
        </div>
    );
}
