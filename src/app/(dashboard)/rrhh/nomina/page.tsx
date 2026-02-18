'use client';

import { useState, useEffect } from 'react';
import { Calendar, Calculator, FileSpreadsheet, CheckCircle2, CreditCard, Download, Users } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Empleado, RolPago } from '@/modules/rrhh/domain/types';
import { RRHHUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { generatePayrollPDF } from '@/shared/utils/pdfGenerator';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';

import { RolPagoModal } from '@/modules/rrhh/ui/components/RolPagoModal';
import { PagarRolModal } from '@/modules/rrhh/ui/components/PagarRolModal';

export default function NominaRolesPage() {
    const { currentEmpresa } = useEmpresa();
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [roles, setRoles] = useState<RolPago[]>([]);
    const [loading, setLoading] = useState(true);
    const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
    const [showRolModal, setShowRolModal] = useState(false);
    const [showPagarModal, setShowPagarModal] = useState(false);
    const [selectedRol, setSelectedRol] = useState<any | null>(null);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const [dataEmp, dataRoles] = await Promise.all([
                RRHHUseCases.listarEmpleados(),
                RRHHUseCases.listarRoles(periodo)
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
            await RRHHUseCases.generarRol(periodo);
            await loadData();
        } catch (error) {
            alert('Error al generar nómina');
        } finally {
            setLoading(false);
        }
    };

    const rolColumns: Column<RolPago>[] = [
        {
            header: 'Empleado',
            cell: (rol) => {
                const emp = empleados.find(e => e.id === rol.empleadoId);
                return (
                    <div className="flex items-center gap-2">
                        <div className="bg-slate-100 p-1 rounded-full"><Users size={14} className="text-slate-500" /></div>
                        <span className="font-medium text-slate-800">{emp ? `${emp.apellidos} ${emp.nombres}` : 'Empleado no encontrado'}</span>
                    </div>
                );
            }
        },
        {
            header: 'Ingresos',
            accessorKey: 'totalIngresos',
            className: 'text-right text-green-600 font-medium',
            cell: (rol) => formatMoney(rol.totalIngresos)
        },
        {
            header: 'Egresos',
            accessorKey: 'totalEgresos',
            className: 'text-right text-red-600 font-medium',
            cell: (rol) => formatMoney(rol.totalEgresos)
        },
        {
            header: 'Neto a Pagar',
            accessorKey: 'netoAPagar',
            className: 'text-right font-black text-slate-900',
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
                    <button
                        className="p-1.5 text-slate-400 hover:text-sri-blue rounded-lg transition-colors"
                        title="Editar Detalle (Recalcular)"
                        onClick={() => {
                            const emp = empleados.find(e => e.id === rol.empleadoId);
                            if (emp) {
                                setSelectedEmpleado(emp);
                                setShowRolModal(true);
                            }
                        }}
                    >
                        <Calculator size={18} />
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
                    <h1 className="text-2xl font-bold text-slate-800">Roles de Pago</h1>
                    <p className="text-slate-500 text-sm mt-1">Generación y aprobación de nómina mensual.</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Calendar size={14} /> Periodo:
                    </label>
                    <input
                        type="month"
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        className="border-none bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer"
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleGenerarNomina} className="flex items-center gap-2 shadow-sm">
                    <Calculator size={18} /> Generar Nómina Mensual (Todo)
                </Button>
            </div>

            <DataTable
                data={roles}
                columns={rolColumns}
                loading={loading}
                itemsPerPage={10}
                emptyMessage="No se han generado roles para este periodo."
                actions={
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" className="flex items-center gap-2">
                            <FileSpreadsheet size={16} /> Exportar Excel
                        </Button>
                        <Button variant="secondary" size="sm" className="flex items-center gap-1 text-emerald-600 border-emerald-100 hover:bg-emerald-50">
                            <CheckCircle2 size={14} /> Cerrar Periodo
                        </Button>
                    </div>
                }
            />

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
