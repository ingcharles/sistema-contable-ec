
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Empresa } from '../../../types';
import { Empleado, RolPago, ProyeccionGastos } from '../domain/types';
import { InMemoryNominaRepository } from '../infrastructure/NominaRepository';
import { formatMoney } from '../../../services/sriService';
import { Users, UserPlus, FileSpreadsheet, Calculator, DollarSign, Wallet, FileText, Save, X, Play, CheckCircle2, Download, FileCode } from 'lucide-react';

// --- LOGICA TRIBUTARIA ECUADOR (2024) ---
const CANASTA_BASICA = 789.57; // Referencial 2024
const FRACCION_BASICA_IR = 11902; // Tabla 2024

const calcularImpuestoRenta = (sueldo: number, gastos: ProyeccionGastos | undefined, cargas: number) => {
    // 1. Base Imponible Anual Estimada
    const iess = sueldo * 0.0945;
    const netoMensual = sueldo - iess;
    const baseImponible = netoMensual * 12;

    if (baseImponible <= FRACCION_BASICA_IR) return 0;

    // 2. Impuesto Causado (Simplificado Tabla Progresiva - Rango medio para el ejemplo)
    // En producción se usa la tabla completa. Aquí simulamos un 10% sobre el excedente
    let impuestoCausado = (baseImponible - FRACCION_BASICA_IR) * 0.10; // Simplificado

    // 3. Rebaja por Gastos Personales (Ley RIMPE / Reformas)
    // Límite gastos: 7 canastas básicas
    const maxGastos = CANASTA_BASICA * 7;
    const totalGastos = Math.min(gastos?.totalGastos || 0, maxGastos);
    
    // Porcentaje de rebaja: 18% si renta bruta < 2.13 fraccion basica, sino 10%
    // + Incremento por cargas familiares (Reforma 2023)
    // Cargas: 0=0%, 1=18% de canastas, etc.
    // Simplificación Senior: Asumimos rebaja directa del 18% del menor entre (Gastos Reales) y (7 Canastas)
    const rebaja = totalGastos * 0.18;

    const impuestoPagar = Math.max(0, impuestoCausado - rebaja);
    
    return impuestoPagar / 12; // Retención Mensual
};

// --- GENERADOR XML RDEP ---
const generarXmlRDEP = (empresa: Empresa, empleados: Empleado[]) => {
    const anio = new Date().getFullYear() - 1; // Se declara el año anterior
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rdep>
    <numRuc>${empresa.ruc}</numRuc>
    <anio>${anio}</anio>
    <retRelDep>`;

    empleados.forEach(emp => {
        const sueldoAnual = emp.sueldoUnificado * 12;
        const iessAnual = sueldoAnual * 0.0945;
        const rentaCausada = calcularImpuestoRenta(emp.sueldoUnificado, emp.proyeccionGastos, emp.cargasFamiliares) * 12;
        
        xml += `
        <detalle>
            <benGalap>NO</benGalap>
            <enfCatastro>NO</enfCatastro>
            <tipIdRet>C</tipIdRet>
            <idRet>${emp.cedula}</idRet>
            <apellidoTrab>${emp.apellidos}</apellidoTrab>
            <nombreTrab>${emp.nombres}</nombreTrab>
            <estab>${empresa.ruc.substring(10)}</estab>
            <residenciaTrab>01</residenciaTrab>
            <paisResidencia>593</paisResidencia>
            <aplicConvDobTrib>NO</aplicConvDobTrib>
            <pagExtRaf>NO</pagExtRaf>
            <predesRet>NO</predesRet>
            <suelSal>${sueldoAnual.toFixed(2)}</suelSal>
            <sobSuelComRemu>0.00</sobSuelComRemu>
            <partUtil>0.00</partUtil>
            <intGrabGen>0.00</intGrabGen>
            <impRentEmpl>0.00</impRentEmpl>
            <decimTer>0.00</decimTer>
            <decimCuar>0.00</decimCuar>
            <fondoReserva>0.00</fondoReserva>
            <salarioDigno>0.00</salarioDigno>
            <otrosIngRenGrav>0.00</otrosIngRenGrav>
            <ingGravConEsteEmpl>${sueldoAnual.toFixed(2)}</ingGravConEsteEmpl>
            <sisSalNet>1</sisSalNet>
            <apoPerIess>${iessAnual.toFixed(2)}</apoPerIess>
            <aporPerIessConOtrosEmpls>0.00</aporPerIessConOtrosEmpls>
            <deducVivienda>${(emp.proyeccionGastos?.vivienda || 0).toFixed(2)}</deducVivienda>
            <deducSalud>${(emp.proyeccionGastos?.salud || 0).toFixed(2)}</deducSalud>
            <deducEduca>${(emp.proyeccionGastos?.educacion || 0).toFixed(2)}</deducEduca>
            <deducAliiment>${(emp.proyeccionGastos?.alimentacion || 0).toFixed(2)}</deducAliiment>
            <deducVestim>${(emp.proyeccionGastos?.vestimenta || 0).toFixed(2)}</deducVestim>
            <deducTurismo>${(emp.proyeccionGastos?.turismo || 0).toFixed(2)}</deducTurismo>
            <exoDiscap>0.00</exoDiscap>
            <exoTerEd>0.00</exoTerEd>
            <basImp>${(sueldoAnual - iessAnual).toFixed(2)}</basImp>
            <impRentCaus>${rentaCausada.toFixed(2)}</impRentCaus>
            <valRetAsuOtrosEmpls>0.00</valRetAsuOtrosEmpls>
            <valImpAsuEsteEmpl>0.00</valImpAsuEsteEmpl>
            <valRet>${rentaCausada.toFixed(2)}</valRet>
        </detalle>`;
    });

    xml += `
    </retRelDep>
</rdep>`;

    return xml;
};

// --- MODAL GASTOS PERSONALES ---
const GastosPersonalesModal = ({ empleado, onClose, onSave }: { empleado: Empleado, onClose: () => void, onSave: (proyeccion: ProyeccionGastos) => void }) => {
    const [gastos, setGastos] = useState<ProyeccionGastos>(empleado.proyeccionGastos || {
        anio: new Date().getFullYear(),
        vivienda: 0, salud: 0, educacion: 0, alimentacion: 0, vestimenta: 0, turismo: 0, totalGastos: 0, rebajaImpuestoRenta: 0
    });

    const handleChange = (field: keyof ProyeccionGastos, value: number) => {
        const newGastos = { ...gastos, [field]: value };
        // Recalcular total
        newGastos.totalGastos = newGastos.vivienda + newGastos.salud + newGastos.educacion + newGastos.alimentacion + newGastos.vestimenta + newGastos.turismo;
        
        // Calculo preliminar de rebaja (Visual)
        const maxGastos = CANASTA_BASICA * 7;
        const baseRebaja = Math.min(newGastos.totalGastos, maxGastos);
        newGastos.rebajaImpuestoRenta = baseRebaja * 0.18;

        setGastos(newGastos);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Gastos Personales (SRI-GP)</h2>
                        <p className="text-xs text-slate-500">{empleado.nombres} {empleado.apellidos}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Vivienda</label>
                            <input type="number" value={gastos.vivienda} onChange={e => handleChange('vivienda', Number(e.target.value))} className="w-full border border-slate-200 rounded p-2 text-sm text-right" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Salud</label>
                            <input type="number" value={gastos.salud} onChange={e => handleChange('salud', Number(e.target.value))} className="w-full border border-slate-200 rounded p-2 text-sm text-right" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Educación/Arte</label>
                            <input type="number" value={gastos.educacion} onChange={e => handleChange('educacion', Number(e.target.value))} className="w-full border border-slate-200 rounded p-2 text-sm text-right" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Alimentación</label>
                            <input type="number" value={gastos.alimentacion} onChange={e => handleChange('alimentacion', Number(e.target.value))} className="w-full border border-slate-200 rounded p-2 text-sm text-right" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Vestimenta</label>
                            <input type="number" value={gastos.vestimenta} onChange={e => handleChange('vestimenta', Number(e.target.value))} className="w-full border border-slate-200 rounded p-2 text-sm text-right" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Turismo</label>
                            <input type="number" value={gastos.turismo} onChange={e => handleChange('turismo', Number(e.target.value))} className="w-full border border-slate-200 rounded p-2 text-sm text-right" />
                        </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-blue-800">Total Gastos Proyectados:</span>
                            <span className="font-bold text-blue-900">{formatMoney(gastos.totalGastos)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-blue-600">
                            <span>Rebaja Estimada IR:</span>
                            <span>{formatMoney(gastos.rebajaImpuestoRenta)}</span>
                        </div>
                    </div>
                </div>
                <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">Cancelar</button>
                    <button onClick={() => { onSave(gastos); onClose(); }} className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm hover:bg-sri-light">Guardar Proyección</button>
                </div>
            </div>
        </div>
    );
};

export const NominaPage: React.FC = () => {
    const { currentEmpresa } = useOutletContext<{ currentEmpresa: Empresa }>();
    const [activeTab, setActiveTab] = useState<'colaboradores' | 'rol'>('colaboradores');
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [rolesGenerados, setRolesGenerados] = useState<RolPago[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
    const [periodoRol, setPeriodoRol] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    useEffect(() => {
        const repo = new InMemoryNominaRepository();
        repo.getEmpleados(currentEmpresa.id).then(data => {
            setEmpleados(data);
            setLoading(false);
        });
    }, [currentEmpresa.id]);

    const handleSaveGastos = (gastos: ProyeccionGastos) => {
        if (selectedEmpleado) {
            const updated = empleados.map(e => e.id === selectedEmpleado.id ? { ...e, proyeccionGastos: gastos } : e);
            setEmpleados(updated);
            // En un app real, llamar al repositorio save()
        }
    };

    const descargarRDEP = () => {
        const xml = generarXmlRDEP(currentEmpresa, empleados);
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `RDEP-${currentEmpresa.ruc}-${new Date().getFullYear() - 1}.xml`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generarRol = () => {
        const nuevosRoles: RolPago[] = empleados.map(emp => {
            const iess = emp.sueldoUnificado * 0.0945;
            const renta = calcularImpuestoRenta(emp.sueldoUnificado, emp.proyeccionGastos, emp.cargasFamiliares);
            const totalIngresos = emp.sueldoUnificado; // + horas extras etc
            const totalEgresos = iess + renta;
            
            return {
                id: Math.random().toString(36),
                empresaId: currentEmpresa.id,
                empleadoId: emp.id,
                empleadoNombre: `${emp.apellidos} ${emp.nombres}`,
                periodo: periodoRol,
                diasLaborados: 30,
                sueldoGanado: emp.sueldoUnificado,
                horasExtras: 0,
                comisiones: 0,
                decimoTercero: emp.acumulaDecimos ? 0 : emp.sueldoUnificado / 12,
                decimoCuarto: emp.acumulaDecimos ? 0 : 460 / 12, // SBU 2024 / 12
                fondosReserva: 0,
                totalIngresos,
                aporteIessPersonal: iess,
                retencionImpuestoRenta: renta,
                prestamosQuirografarios: 0,
                anticipos: 0,
                totalEgresos,
                liquidoRecibir: totalIngresos - totalEgresos,
                estado: 'BORRADOR',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'admin'
            };
        });
        setRolesGenerados(nuevosRoles);
    };

    const totalNomina = rolesGenerados.reduce((acc, r) => acc + r.liquidoRecibir, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Nómina y Talento Humano</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de personal, gastos personales y roles de pago.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('colaboradores')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'colaboradores' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Users size={16} /> Colaboradores
                    </button>
                    <button 
                        onClick={() => setActiveTab('rol')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'rol' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Calculator size={16} /> Procesar Rol
                    </button>
                </div>
            </div>

            {activeTab === 'colaboradores' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={descargarRDEP}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2 transition-colors"
                        >
                            <FileCode size={16} className="text-orange-600" /> Generar Anexo RDEP (XML)
                        </button>
                        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                            <FileText size={16} /> Formulario 107
                        </button>
                        <button className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm">
                            <UserPlus size={16} /> Nuevo Colaborador
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Colaborador</th>
                                    <th className="px-6 py-4">Cargo</th>
                                    <th className="px-6 py-4 text-right">Sueldo</th>
                                    <th className="px-6 py-4 text-center">Cargas</th>
                                    <th className="px-6 py-4 text-center">Gastos Personales</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {empleados.map(emp => (
                                    <tr key={emp.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{emp.apellidos} {emp.nombres}</span>
                                                <span className="text-xs text-slate-500">{emp.cedula}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{emp.cargo}</td>
                                        <td className="px-6 py-4 text-right font-mono">{formatMoney(emp.sueldoUnificado)}</td>
                                        <td className="px-6 py-4 text-center text-slate-600">{emp.cargasFamiliares}</td>
                                        <td className="px-6 py-4 text-center">
                                            {emp.proyeccionGastos ? (
                                                <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-medium border border-green-100">
                                                    <CheckCircle2 size={12} /> {formatMoney(emp.proyeccionGastos.totalGastos)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">Sin registrar</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => setSelectedEmpleado(emp)}
                                                className="text-sri-blue hover:underline text-xs font-medium"
                                            >
                                                Ver Gastos
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'rol' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Configuración Rol */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex flex-col md:flex-row items-end gap-4">
                            <div className="w-full md:w-1/4">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Periodo de Pago</label>
                                <input 
                                    type="month" 
                                    value={periodoRol} 
                                    onChange={e => setPeriodoRol(e.target.value)} 
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                            <button 
                                onClick={generarRol}
                                className="px-6 py-2 bg-sri-blue text-white font-bold rounded-lg hover:bg-sri-light flex items-center gap-2 shadow-lg shadow-blue-900/10"
                            >
                                <Play size={18} /> Generar Rol Masivo
                            </button>
                        </div>
                    </div>

                    {rolesGenerados.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700">Previsualización del Rol</h3>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase">Total a Pagar</p>
                                    <p className="text-xl font-bold text-emerald-600">{formatMoney(totalNomina)}</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white text-slate-600 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3">Empleado</th>
                                            <th className="px-6 py-3 text-right">Ingresos</th>
                                            <th className="px-6 py-3 text-right text-red-600">IESS (9.45%)</th>
                                            <th className="px-6 py-3 text-right text-orange-600">Imp. Renta</th>
                                            <th className="px-6 py-3 text-right font-bold bg-slate-50">A Recibir</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {rolesGenerados.map(rol => (
                                            <tr key={rol.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-3 font-medium text-slate-800">{rol.empleadoNombre}</td>
                                                <td className="px-6 py-3 text-right text-slate-600">{formatMoney(rol.totalIngresos)}</td>
                                                <td className="px-6 py-3 text-right text-red-600">-{formatMoney(rol.aporteIessPersonal)}</td>
                                                <td className="px-6 py-3 text-right text-orange-600">-{formatMoney(rol.retencionImpuestoRenta)}</td>
                                                <td className="px-6 py-3 text-right font-bold text-slate-900 bg-slate-50">{formatMoney(rol.liquidoRecibir)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                                <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 flex items-center gap-2">
                                    <FileSpreadsheet size={16} /> Exportar Excel
                                </button>
                                <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 flex items-center gap-2">
                                    <Download size={16} /> Archivo Banco (Cash)
                                </button>
                                <button className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-500 shadow-sm flex items-center gap-2">
                                    <Save size={18} /> Aprobar y Cerrar Rol
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedEmpleado && (
                <GastosPersonalesModal 
                    empleado={selectedEmpleado} 
                    onClose={() => setSelectedEmpleado(null)} 
                    onSave={handleSaveGastos} 
                />
            )}
        </div>
    );
};
