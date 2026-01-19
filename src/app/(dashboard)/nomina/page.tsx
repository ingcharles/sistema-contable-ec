'use client';

import { useState, useEffect } from 'react';
import { UserPlus, FileText, Calculator, Search, Download, CheckCircle2, MoreVertical } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Empleado, RolPago } from '@/modules/nomina/domain/types';
import { InMemoryNominaRepository } from '@/modules/nomina/infrastructure/NominaRepository';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { Button } from '@/shared/ui/Button';

import { RolPagoModal } from '@/modules/nomina/ui/components/RolPagoModal';

export default function NominaPage() {
    const { currentEmpresa } = useEmpresa();
    const [activeTab, setActiveTab] = useState<'empleados' | 'roles'>('empleados');
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [roles, setRoles] = useState<RolPago[]>([]);
    const [loading, setLoading] = useState(true);
    const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
    const [showRolModal, setShowRolModal] = useState(false);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        const repo = new InMemoryNominaRepository();
        const [dataEmp, dataRoles] = await Promise.all([
            repo.getEmpleados(currentEmpresa.id),
            repo.getRolesPago(currentEmpresa.id, periodo)
        ]);
        setEmpleados(dataEmp);
        setRoles(dataRoles);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id, periodo]);

    const handleGenerarNomina = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        const repo = new InMemoryNominaRepository();
        await repo.generarRoles(currentEmpresa.id, periodo);
        await loadData();
    };

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Nómina y Talento Humano</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de personal, roles de pago y provisiones sociales.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="month"
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sri-blue/20"
                    />
                    <Button onClick={handleGenerarNomina} className="flex items-center gap-2">
                        <Calculator size={18} /> Generar Roles
                    </Button>
                </div>
            </div>

            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                <button onClick={() => setActiveTab('empleados')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'empleados' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Empleados</button>
                <button onClick={() => setActiveTab('roles')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'roles' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Roles de Pago</button>
            </div>

            {activeTab === 'empleados' ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input type="text" placeholder="Buscar empleado..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none" />
                        </div>
                        <Button variant="secondary" className="flex items-center gap-2">
                            <UserPlus size={18} /> Nuevo Empleado
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                                <tr>
                                    <th className="px-6 py-4">Empleado</th>
                                    <th className="px-6 py-4">Cargo</th>
                                    <th className="px-6 py-4">Fecha Ingreso</th>
                                    <th className="px-6 py-4 text-right">Sueldo Base</th>
                                    <th className="px-6 py-4 text-center">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-12 text-center text-slate-400">Cargando empleados...</td></tr>
                                ) : empleados.map(emp => (
                                    <tr key={emp.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{emp.apellidos} {emp.nombres}</span>
                                                <span className="text-xs text-slate-500">{emp.identificacion}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{emp.cargo}</td>
                                        <td className="px-6 py-4 text-slate-600">{emp.fechaIngreso}</td>
                                        <td className="px-6 py-4 text-right font-medium">{formatMoney(emp.sueldoBase)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">{emp.estado}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    className="p-1.5 text-slate-400 hover:text-sri-blue rounded-lg"
                                                    title="Generar Rol Individual"
                                                    onClick={() => { setSelectedEmpleado(emp); setShowRolModal(true); }}
                                                >
                                                    <Calculator size={18} />
                                                </button>
                                                <button className="p-1.5 text-slate-400 hover:text-sri-blue rounded-lg"><MoreVertical size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-700">Roles del Periodo: {periodo}</h3>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" className="flex items-center gap-1"><Download size={14} /> PDF Masivo</Button>
                            <Button variant="secondary" size="sm" className="flex items-center gap-1 text-emerald-600 border-emerald-100 hover:bg-emerald-50"><CheckCircle2 size={14} /> Cerrar Nómina</Button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                                <tr>
                                    <th className="px-6 py-4">Empleado</th>
                                    <th className="px-6 py-4 text-right">Ingresos</th>
                                    <th className="px-6 py-4 text-right">Egresos</th>
                                    <th className="px-6 py-4 text-right font-bold">Neto a Pagar</th>
                                    <th className="px-6 py-4 text-center">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-12 text-center text-slate-400">Cargando roles...</td></tr>
                                ) : roles.length === 0 ? (
                                    <tr><td colSpan={6} className="p-12 text-center text-slate-400">No se han generado roles para este periodo.</td></tr>
                                ) : roles.map(rol => (
                                    <tr key={rol.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {empleados.find(e => e.id === rol.empleadoId)?.apellidos} {empleados.find(e => e.id === rol.empleadoId)?.nombres}
                                        </td>
                                        <td className="px-6 py-4 text-right text-green-600">{formatMoney(rol.totalIngresos)}</td>
                                        <td className="px-6 py-4 text-right text-red-600">{formatMoney(rol.totalEgresos)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">{formatMoney(rol.netoAPagar)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${rol.estado === 'BORRADOR' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {rol.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-1.5 text-slate-400 hover:text-sri-blue rounded-lg" title="Ver Detalle"><FileText size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
        </div>
    );
}
