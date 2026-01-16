
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Empresa } from '../../../types';
import { PLAN_CUENTAS } from '../../../constants';
import { InMemoryContabilidadRepository } from '../../contabilidad/infrastructure/ContabilidadRepository';
import { generarArbolFinanciero, LineaReporteFinanciero } from '../utils/financeEngine';
import { formatMoney } from '../../../services/sriService';
import { FileText, Download, Calendar, BarChart3, PieChart, Table, Search, ShoppingBag, ShoppingCart, Filter, ChevronRight, ChevronDown } from 'lucide-react';

// --- COMPONENTE RECURSIVO PARA FILAS DEL BALANCE ---
const FilaReporte = ({ linea, nivelExpandido }: { linea: LineaReporteFinanciero, nivelExpandido: number }) => {
    const [expandido, setExpandido] = useState(linea.nivel <= nivelExpandido);
    const tieneHijos = linea.hijos.length > 0;
    
    // Si el nivel global cambia, actualizar estado local
    useEffect(() => {
        setExpandido(linea.nivel <= nivelExpandido);
    }, [nivelExpandido, linea.nivel]);

    // Ocultar filas con saldo cero si no es nivel 1
    if (Math.abs(linea.saldoFinal) < 0.01 && linea.nivel > 1) return null;

    return (
        <>
            <tr className={`hover:bg-slate-50 transition-colors ${linea.nivel === 1 ? 'bg-slate-100 font-bold' : ''} ${linea.nivel === 2 ? 'font-semibold' : ''}`}>
                <td className="py-2 pr-4 pl-2 whitespace-nowrap text-xs font-mono text-slate-500">
                    {linea.codigo}
                </td>
                <td className="py-2 pr-4 w-full">
                    <div className="flex items-center" style={{ paddingLeft: `${(linea.nivel - 1) * 20}px` }}>
                        {tieneHijos && (
                            <button onClick={() => setExpandido(!expandido)} className="mr-2 text-slate-400 hover:text-sri-blue">
                                {expandido ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        )}
                        <span className={linea.nivel === 1 ? 'text-slate-800' : 'text-slate-600'}>{linea.nombre}</span>
                    </div>
                </td>
                <td className="py-2 px-4 text-right font-mono text-sm text-slate-700">
                    {formatMoney(linea.saldoFinal)}
                </td>
            </tr>
            {expandido && linea.hijos.map(hijo => (
                <FilaReporte key={hijo.codigo} linea={hijo} nivelExpandido={nivelExpandido} />
            ))}
        </>
    );
};

export const ReportesPage: React.FC = () => {
    const { currentEmpresa } = useOutletContext<{ currentEmpresa: Empresa }>();
    const [activeReport, setActiveReport] = useState<'balance_general' | 'estado_resultados' | 'ventas_detalladas' | null>('balance_general');
    const [arbolFinanciero, setArbolFinanciero] = useState<LineaReporteFinanciero[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Filtros
    const [fechaInicio, setFechaInicio] = useState(`${new Date().getFullYear()}-01-01`);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
    const [nivelDetalle, setNivelDetalle] = useState(3);

    useEffect(() => {
        if (activeReport === 'balance_general' || activeReport === 'estado_resultados') {
            generarEstadosFinancieros();
        }
    }, [activeReport, fechaInicio, fechaFin, currentEmpresa.id]);

    const generarEstadosFinancieros = async () => {
        setLoading(true);
        const repo = new InMemoryContabilidadRepository();
        const asientos = await repo.getAsientos(currentEmpresa.id);
        
        // Generar árbol completo
        const arbol = generarArbolFinanciero(PLAN_CUENTAS, asientos, fechaInicio, fechaFin);
        setArbolFinanciero(arbol);
        setLoading(false);
    };

    // Filtrar árbol según reporte seleccionado
    const datosReporte = useMemo(() => {
        if (!arbolFinanciero.length) return [];
        
        if (activeReport === 'balance_general') {
            // Activos (1), Pasivos (2), Patrimonio (3)
            return arbolFinanciero.filter(l => ['1', '2', '3'].includes(l.codigo.charAt(0)));
        } 
        if (activeReport === 'estado_resultados') {
            // Ingresos (4), Gastos (5), Costos (6)
            return arbolFinanciero.filter(l => ['4', '5', '6'].includes(l.codigo.charAt(0)));
        }
        return [];
    }, [arbolFinanciero, activeReport]);

    // Calcular totales para el header del reporte
    const totalUtilidad = useMemo(() => {
        if (activeReport !== 'estado_resultados') return 0;
        const ingresos = arbolFinanciero.find(l => l.codigo.startsWith('4'))?.saldoFinal || 0;
        const gastos = arbolFinanciero.find(l => l.codigo.startsWith('5'))?.saldoFinal || 0;
        // Asumiendo Ingresos son acreedores (+) y Gastos deudores (+) en el modelo de árbol, la lógica depende de signos.
        // En generarArbolFinanciero:
        // Activo/Gasto: saldo = debe - haber
        // Pasivo/Ingreso: saldo = haber - debe
        // Por tanto ambos son positivos por naturaleza.
        // Utilidad = Ingresos - Gastos
        return ingresos - gastos;
    }, [arbolFinanciero, activeReport]);

    const ecuacionContable = useMemo(() => {
        if (activeReport !== 'balance_general') return { cuadra: false, diff: 0 };
        const activo = arbolFinanciero.find(l => l.codigo.startsWith('1'))?.saldoFinal || 0;
        const pasivo = arbolFinanciero.find(l => l.codigo.startsWith('2'))?.saldoFinal || 0;
        const patrimonio = arbolFinanciero.find(l => l.codigo.startsWith('3'))?.saldoFinal || 0;
        const diff = activo - (pasivo + patrimonio);
        return { cuadra: Math.abs(diff) < 0.01, diff, activo, pasivo_patrimonio: pasivo + patrimonio };
    }, [arbolFinanciero, activeReport]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Estados Financieros NIIF</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Información financiera en tiempo real para la toma de decisiones.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Menú */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide px-2">Financieros</h3>
                    <button 
                        onClick={() => setActiveReport('balance_general')}
                        className={`w-full text-left p-3 rounded-lg border flex items-center gap-3 transition-colors ${activeReport === 'balance_general' ? 'bg-blue-50 border-sri-blue text-sri-blue font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <PieChart size={18} /> Estado de Situación Financiera
                    </button>
                    <button 
                        onClick={() => setActiveReport('estado_resultados')}
                        className={`w-full text-left p-3 rounded-lg border flex items-center gap-3 transition-colors ${activeReport === 'estado_resultados' ? 'bg-blue-50 border-sri-blue text-sri-blue font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <BarChart3 size={18} /> Estado de Resultados Integral
                    </button>

                    <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide px-2 pt-4">Operativos</h3>
                    <button className="w-full text-left p-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                        <ShoppingBag size={18} /> Ventas por Cliente
                    </button>
                    <button className="w-full text-left p-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                        <Table size={18} /> Kardex Valorado
                    </button>
                </div>

                {/* Área de Reporte */}
                <div className="lg:col-span-3 bg-white p-8 rounded-xl border border-slate-100 min-h-[600px] flex flex-col">
                    {activeReport ? (
                        <>
                            {/* Filtros Reporte */}
                            <div className="flex flex-wrap gap-4 items-end mb-6 pb-6 border-b border-slate-100">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Desde</label>
                                    <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Hasta</label>
                                    <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="border border-slate-200 rounded px-3 py-1.5 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nivel Detalle</label>
                                    <select value={nivelDetalle} onChange={e => setNivelDetalle(Number(e.target.value))} className="border border-slate-200 rounded px-3 py-1.5 text-sm bg-white">
                                        <option value="1">Grupo (Nivel 1)</option>
                                        <option value="2">Subgrupo (Nivel 2)</option>
                                        <option value="3">Cuenta Mayor (Nivel 3)</option>
                                        <option value="4">Subcuenta (Nivel 4)</option>
                                        <option value="5">Auxiliar (Nivel 5)</option>
                                    </select>
                                </div>
                                <div className="flex-1 text-right">
                                    <button className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 flex items-center gap-2 ml-auto">
                                        <Download size={16} /> Exportar Excel
                                    </button>
                                </div>
                            </div>

                            {/* Cabecera Reporte */}
                            <div className="text-center mb-8">
                                <h2 className="text-xl font-bold text-slate-900 uppercase">{currentEmpresa.razonSocial}</h2>
                                <h3 className="text-lg font-medium text-slate-700 mt-1">
                                    {activeReport === 'balance_general' ? 'ESTADO DE SITUACIÓN FINANCIERA' : 'ESTADO DE RESULTADOS INTEGRAL'}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Del {fechaInicio} al {fechaFin}
                                </p>
                                <p className="text-xs text-slate-400 italic mt-1">(Expresado en Dólares de los Estados Unidos de América)</p>
                            </div>

                            {/* Cuerpo Reporte */}
                            {loading ? (
                                <div className="flex-1 flex items-center justify-center text-slate-400">Calculando saldos...</div>
                            ) : (
                                <div className="flex-1 overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-slate-800">
                                                <th className="py-2 pl-2 text-xs font-bold text-slate-600 w-32">CÓDIGO</th>
                                                <th className="py-2 text-xs font-bold text-slate-600">CUENTA CONTABLE</th>
                                                <th className="py-2 px-4 text-right text-xs font-bold text-slate-600 w-40">SALDO</th>
                                            </tr>
                                        </thead>
                                        <tbody className="align-top">
                                            {datosReporte.map(linea => (
                                                <FilaReporte key={linea.codigo} linea={linea} nivelExpandido={nivelDetalle} />
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Footer Totales */}
                                    <div className="mt-8 pt-4 border-t-2 border-slate-800">
                                        {activeReport === 'estado_resultados' && (
                                            <div className="flex justify-between items-center text-lg font-bold">
                                                <span>UTILIDAD (PÉRDIDA) DEL EJERCICIO</span>
                                                <span className={totalUtilidad >= 0 ? 'text-slate-900' : 'text-red-600'}>
                                                    {formatMoney(totalUtilidad)}
                                                </span>
                                            </div>
                                        )}
                                        {activeReport === 'balance_general' && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>TOTAL ACTIVO</span>
                                                    <span className="font-bold">{formatMoney(ecuacionContable.activo)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>TOTAL PASIVO + PATRIMONIO</span>
                                                    <span className="font-bold">{formatMoney(ecuacionContable.pasivo_patrimonio)}</span>
                                                </div>
                                                {!ecuacionContable.cuadra && (
                                                    <div className="bg-red-50 text-red-700 p-2 rounded text-center text-xs font-bold mt-2 border border-red-200">
                                                        DESCUADRE CONTABLE: {formatMoney(ecuacionContable.diff)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Firmas */}
                                    <div className="grid grid-cols-3 gap-12 mt-24 text-center">
                                        <div className="border-t border-slate-400 pt-2">
                                            <p className="text-sm font-bold text-slate-800">GERENTE GENERAL</p>
                                            <p className="text-xs text-slate-500">C.I.</p>
                                        </div>
                                        <div className="border-t border-slate-400 pt-2">
                                            <p className="text-sm font-bold text-slate-800">CONTADOR</p>
                                            <p className="text-xs text-slate-500">RUC / CPA</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <BarChart3 size={64} className="mb-4 opacity-20" />
                            <p>Seleccione un estado financiero del menú lateral.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
