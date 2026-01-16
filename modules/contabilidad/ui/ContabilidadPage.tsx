
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PLAN_CUENTAS } from '../../../constants';
import { Empresa } from '../../../types';
import { AsientoContable, CentroCosto, DetalleAsiento } from '../domain/types';
import { InMemoryContabilidadRepository } from '../infrastructure/ContabilidadRepository';
import { Download, Plus, Filter, Folder, FileText, ChevronRight, BookOpen, List, ChevronDown, ChevronUp, Layers, X, Save, Trash2, AlertCircle, PieChart, TrendingUp, DollarSign } from 'lucide-react';
import { formatMoney } from '../../../services/sriService';

// --- HELPERS PARA ESTADOS FINANCIEROS ---

const calcularSaldoCuenta = (codigo: string, asientos: AsientoContable[]) => {
    let debe = 0;
    let haber = 0;
    
    // Sumar movimientos de la cuenta específica
    asientos.filter(a => a.estado === 'MAYORIZADO').forEach(a => {
        a.detalles.forEach(d => {
            if (d.cuentaCodigo === codigo || d.cuentaCodigo.startsWith(codigo + '.')) {
                debe += d.debe;
                haber += d.haber;
            }
        });
    });

    // Determinar naturaleza por el primer dígito (1=Deudor, 2=Acreedor, 3=Acreedor, 4=Deudor, 5=Acreedor)
    // Simplificación para el demo: Activos y Gastos (1,5) son Deudores. Pasivos, Patrimonio e Ingresos (2,3,4) son Acreedores.
    // Nota: El código 4 suele ser Ingresos (Acreedor) y 5 Gastos (Deudor) en planes comunes, o viceversa.
    // Asumiremos: 1=Activo(D), 2=Pasivo(H), 3=Patrimonio(H), 4=Ingresos(H), 5=Gastos(D)
    
    const primerDigito = codigo.charAt(0);
    const esDeudora = ['1', '5'].includes(primerDigito);

    const saldo = esDeudora ? (debe - haber) : (haber - debe);
    return { debe, haber, saldo };
};

// --- SUBCOMPONENTES ---

const AsientoRow = ({ asiento }: { asiento: AsientoContable }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <>
            <tr className={`hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 ${expanded ? 'bg-slate-50' : ''}`} onClick={() => setExpanded(!expanded)}>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        {expanded ? <ChevronUp size={16} className="text-sri-blue" /> : <ChevronDown size={16} className="text-slate-400" />}
                        <span className="font-mono font-medium text-slate-700 text-xs bg-slate-100 px-2 py-1 rounded">{asiento.numero}</span>
                    </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{asiento.fecha}</td>
                <td className="px-6 py-4">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        asiento.tipo === 'INGRESO' ? 'bg-green-50 text-green-700 border-green-100' :
                        asiento.tipo === 'EGRESO' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                        {asiento.tipo}
                    </span>
                </td>
                <td className="px-6 py-4 font-medium text-slate-800">{asiento.glosa}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-900">{formatMoney(asiento.totalDebe)}</td>
                <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        {asiento.estado}
                    </span>
                </td>
            </tr>
            {expanded && (
                <tr className="bg-slate-50/50">
                    <td colSpan={6} className="p-4 border-b border-slate-100 shadow-inner">
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden max-w-4xl mx-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Código</th>
                                        <th className="px-4 py-2 text-left">Cuenta</th>
                                        <th className="px-4 py-2 text-right">Debe</th>
                                        <th className="px-4 py-2 text-right">Haber</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {asiento.detalles.map((det, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 last:border-0">
                                            <td className="px-4 py-2 font-mono text-slate-500 text-xs">{det.cuentaCodigo}</td>
                                            <td className="px-4 py-2 text-slate-700">{det.cuentaNombre}</td>
                                            <td className="px-4 py-2 text-right text-slate-600 font-mono">{det.debe > 0 ? formatMoney(det.debe) : '-'}</td>
                                            <td className="px-4 py-2 text-right text-slate-600 font-mono">{det.haber > 0 ? formatMoney(det.haber) : '-'}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                        <td colSpan={2} className="px-4 py-2 text-right">TOTALES</td>
                                        <td className="px-4 py-2 text-right">{formatMoney(asiento.totalDebe)}</td>
                                        <td className="px-4 py-2 text-right">{formatMoney(asiento.totalHaber)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

// --- MODAL NUEVO ASIENTO ---
const NuevoAsientoModal = ({ onClose, onSave, empresaId }: { onClose: () => void, onSave: () => void, empresaId: string }) => {
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [glosa, setGlosa] = useState('');
    const [tipo, setTipo] = useState<'DIARIO' | 'INGRESO' | 'EGRESO' | 'AJUSTE'>('DIARIO');
    const [detalles, setDetalles] = useState<DetalleAsiento[]>([
        { cuentaCodigo: '', cuentaNombre: '', debe: 0, haber: 0 },
        { cuentaCodigo: '', cuentaNombre: '', debe: 0, haber: 0 }
    ]);

    // Calcular Totales
    const totalDebe = detalles.reduce((acc, curr) => acc + (Number(curr.debe) || 0), 0);
    const totalHaber = detalles.reduce((acc, curr) => acc + (Number(curr.haber) || 0), 0);
    const diferencia = totalDebe - totalHaber;
    const cuadrado = Math.abs(diferencia) < 0.01;

    const updateDetalle = (index: number, field: keyof DetalleAsiento, value: any) => {
        const newDetalles = [...detalles];
        
        if (field === 'cuentaCodigo') {
            // Simular búsqueda de cuenta
            const cuenta = PLAN_CUENTAS.find(c => c.codigo === value);
            newDetalles[index].cuentaCodigo = value;
            if (cuenta) newDetalles[index].cuentaNombre = cuenta.nombre;
        } else {
            newDetalles[index] = { ...newDetalles[index], [field]: value };
        }
        setDetalles(newDetalles);
    };

    const addLinea = () => {
        setDetalles([...detalles, { cuentaCodigo: '', cuentaNombre: '', debe: 0, haber: 0 }]);
    };

    const removeLinea = (index: number) => {
        if (detalles.length > 2) {
            setDetalles(detalles.filter((_, i) => i !== index));
        }
    };

    const handleGuardar = async () => {
        if (!glosa || !cuadrado || totalDebe === 0) return;
        
        const nuevoAsiento: AsientoContable = {
            id: Math.random().toString(36),
            empresaId,
            numero: `CD-${Math.floor(Math.random() * 1000)}`,
            fecha,
            glosa,
            tipo,
            estado: 'MAYORIZADO',
            detalles: detalles.filter(d => d.cuentaCodigo !== ''),
            totalDebe,
            totalHaber,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'User'
        };

        const repo = new InMemoryContabilidadRepository();
        await repo.saveAsiento(nuevoAsiento);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Nuevo Asiento Contable</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Cabecera */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                            <select value={tipo} onChange={e => setTipo(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                <option value="DIARIO">Diario</option>
                                <option value="INGRESO">Ingreso</option>
                                <option value="EGRESO">Egreso</option>
                                <option value="AJUSTE">Ajuste</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Glosa / Descripción</label>
                            <input type="text" value={glosa} onChange={e => setGlosa(e.target.value)} placeholder="Descripción del movimiento..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        </div>
                    </div>

                    {/* Tabla de Detalles */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-semibold">
                                <tr>
                                    <th className="px-4 py-2 text-left w-48">Cuenta Contable</th>
                                    <th className="px-4 py-2 text-left">Descripción</th>
                                    <th className="px-4 py-2 text-right w-32">Debe</th>
                                    <th className="px-4 py-2 text-right w-32">Haber</th>
                                    <th className="px-4 py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {detalles.map((det, idx) => (
                                    <tr key={idx}>
                                        <td className="p-2">
                                            <select 
                                                value={det.cuentaCodigo} 
                                                onChange={(e) => updateDetalle(idx, 'cuentaCodigo', e.target.value)}
                                                className="w-full border border-slate-200 rounded p-1.5 text-xs focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                            >
                                                <option value="">Seleccionar...</option>
                                                {PLAN_CUENTAS.filter(c => c.nivel > 2).map(c => (
                                                    <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input 
                                                type="text" 
                                                value={det.cuentaNombre} 
                                                readOnly 
                                                className="w-full bg-slate-50 text-slate-500 border border-transparent p-1.5 text-xs rounded" 
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input 
                                                type="number" 
                                                value={det.debe || ''} 
                                                onChange={(e) => updateDetalle(idx, 'debe', parseFloat(e.target.value))}
                                                className="w-full border border-slate-200 rounded p-1.5 text-xs text-right focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input 
                                                type="number" 
                                                value={det.haber || ''} 
                                                onChange={(e) => updateDetalle(idx, 'haber', parseFloat(e.target.value))}
                                                className="w-full border border-slate-200 rounded p-1.5 text-xs text-right focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => removeLinea(idx)} className="text-slate-400 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold text-slate-700">
                                <tr>
                                    <td colSpan={2} className="px-4 py-2 text-right">
                                        <button onClick={addLinea} className="text-sri-blue hover:underline text-xs flex items-center gap-1 float-left mt-1">
                                            <Plus size={14} /> Agregar Línea
                                        </button>
                                        TOTALES:
                                    </td>
                                    <td className="px-4 py-2 text-right">{formatMoney(totalDebe)}</td>
                                    <td className="px-4 py-2 text-right">{formatMoney(totalHaber)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Validación */}
                    {!cuadrado ? (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 text-sm">
                            <AlertCircle size={18} />
                            <span>El asiento no está cuadrado. Diferencia: <strong>{formatMoney(diferencia)}</strong></span>
                        </div>
                    ) : totalDebe > 0 ? (
                        <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-100 text-sm">
                            <Save size={18} />
                            <span>Asiento cuadrado correctamente. Listo para guardar.</span>
                        </div>
                    ) : null}

                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-white hover:shadow-sm rounded-lg transition-all">Cancelar</button>
                    <button 
                        onClick={handleGuardar} 
                        disabled={!cuadrado || !glosa || totalDebe === 0}
                        className="px-6 py-2 bg-sri-blue text-white font-medium rounded-lg hover:bg-sri-light disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-900/10 transition-all flex items-center gap-2"
                    >
                        Guardar Asiento
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- PAGINA PRINCIPAL ---
export const ContabilidadPage: React.FC = () => {
  const { currentEmpresa } = useOutletContext<{ currentEmpresa: Empresa }>();
  const [activeTab, setActiveTab] = useState<'plan' | 'diario' | 'mayor' | 'balances' | 'costos'>('plan');
  const [asientos, setAsientos] = useState<AsientoContable[]>([]);
  const [centros, setCentros] = useState<CentroCosto[]>([]);
  const [showModalAsiento, setShowModalAsiento] = useState(false);
  
  // Estado para Mayor
  const [cuentaMayor, setCuentaMayor] = useState('');
  const [movimientosMayor, setMovimientosMayor] = useState<{fecha: string, asiento: string, glosa: string, debe: number, haber: number, saldo: number}[]>([]);

  const loadData = () => {
    const repo = new InMemoryContabilidadRepository();
    repo.getAsientos(currentEmpresa.id).then(setAsientos);
    if (activeTab === 'costos') {
        repo.getCentrosCostos(currentEmpresa.id).then(setCentros);
    }
  };

  useEffect(() => {
      loadData();
  }, [activeTab, currentEmpresa.id]);

  // Efecto para calcular Mayor cuando cambia la cuenta o los asientos
  useEffect(() => {
    if (activeTab === 'mayor' && cuentaMayor && asientos.length > 0) {
        const movimientos: any[] = [];
        let saldo = 0;
        
        // Ordenar asientos por fecha
        const asientosOrdenados = [...asientos].sort((a,b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

        asientosOrdenados.forEach(asiento => {
            asiento.detalles.forEach(det => {
                if (det.cuentaCodigo === cuentaMayor) {
                    const primerDigito = cuentaMayor.charAt(0);
                    const esDeudora = ['1', '5'].includes(primerDigito); // Activo y Gastos
                    
                    if (esDeudora) {
                        saldo += (det.debe - det.haber);
                    } else {
                        saldo += (det.haber - det.debe);
                    }

                    movimientos.push({
                        fecha: asiento.fecha,
                        asiento: asiento.numero,
                        glosa: asiento.glosa,
                        debe: det.debe,
                        haber: det.haber,
                        saldo: saldo
                    });
                }
            });
        });
        setMovimientosMayor(movimientos);
    }
  }, [cuentaMayor, activeTab, asientos]);

  // Helper para Balance
  const renderBalanceRow = (codigo: string, nombre: string, nivel: number) => {
      const { saldo } = calcularSaldoCuenta(codigo, asientos);
      // Solo mostrar si tiene saldo o es nivel superior
      if (Math.abs(saldo) < 0.01 && nivel > 2) return null;
      
      return (
          <div key={codigo} className={`flex justify-between py-2 border-b border-slate-50 hover:bg-slate-50 ${nivel === 1 ? 'font-bold text-lg mt-4 border-slate-200' : nivel === 2 ? 'font-semibold text-slate-800' : 'text-slate-600 text-sm'}`}>
              <div className="flex gap-2">
                  <span className="font-mono text-slate-400 w-24">{codigo}</span>
                  <span style={{ paddingLeft: `${(nivel-1)*12}px` }}>{nombre}</span>
              </div>
              <span className={saldo < 0 ? 'text-red-600' : ''}>{formatMoney(saldo)}</span>
          </div>
      );
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contabilidad General</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión del ciclo contable y estados financieros.</p>
        </div>
        <div className="flex gap-2">
           <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto">
                <button onClick={() => setActiveTab('plan')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'plan' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <List size={16} /> Plan Cuentas
                </button>
                <button onClick={() => setActiveTab('diario')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'diario' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <BookOpen size={16} /> Libro Diario
                </button>
                <button onClick={() => setActiveTab('mayor')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'mayor' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Layers size={16} /> Libro Mayor
                </button>
                <button onClick={() => setActiveTab('balances')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'balances' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <PieChart size={16} /> Estados Financieros
                </button>
                <button onClick={() => setActiveTab('costos')} className={`px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'costos' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <TrendingUp size={16} /> Costos
                </button>
            </div>
        </div>
      </div>

      {activeTab === 'plan' && (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
         <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full md:max-w-md">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Filtrar por código o nombre de cuenta..." 
                  className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sri-blue/50"
                />
            </div>
             <div className="flex gap-2">
                <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2 transition-all">
                    <Download size={16} /> Exportar
                </button>
                <button className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all">
                    <Plus size={16} /> Nueva Cuenta
                </button>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 w-64">Código Contable</th>
                <th className="px-6 py-3">Descripción</th>
                <th className="px-6 py-3">Clasificación</th>
                <th className="px-6 py-3 text-right">Saldo (Ref)</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PLAN_CUENTAS.map((cuenta) => (
                <tr key={cuenta.codigo} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-3 font-mono text-slate-600 font-medium">
                    <div style={{ paddingLeft: `${(cuenta.nivel - 1) * 20}px` }} className="flex items-center gap-2">
                       {cuenta.nivel < 4 ? (
                           <Folder size={16} className="text-yellow-500 fill-yellow-500/20" /> 
                       ) : (
                           <FileText size={16} className="text-slate-400" />
                       )}
                       <span>{cuenta.codigo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={cuenta.nivel === 1 ? 'font-bold text-slate-900 text-base' : cuenta.nivel === 2 ? 'font-semibold text-slate-800' : 'text-slate-600'}>
                        {cuenta.nombre}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold tracking-wide ${
                        cuenta.tipo === 'ACTIVO' ? 'bg-green-50 text-green-700 border border-green-100' :
                        cuenta.tipo === 'PASIVO' ? 'bg-red-50 text-red-700 border border-red-100' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                        {cuenta.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-slate-700">
                    {formatMoney(cuenta.saldo)}
                  </td>
                  <td className="px-6 py-3 text-center">
                     <button onClick={() => { setActiveTab('mayor'); setCuentaMayor(cuenta.codigo); }} className="text-sri-blue hover:text-sri-light font-medium text-xs flex items-center justify-center gap-1 mx-auto hover:underline">
                        Mayor <ChevronRight size={12} />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === 'diario' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Buscar por número o glosa..." 
                      className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sri-blue/50"
                    />
                </div>
                 <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2 transition-all">
                        <Download size={16} /> Imprimir Diario
                    </button>
                    <button 
                        onClick={() => setShowModalAsiento(true)}
                        className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all"
                    >
                        <Plus size={16} /> Nuevo Asiento
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 w-32">Número</th>
                    <th className="px-6 py-3 w-32">Fecha</th>
                    <th className="px-6 py-3 w-24">Tipo</th>
                    <th className="px-6 py-3">Glosa / Descripción</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {asientos.map((asiento) => (
                        <AsientoRow key={asiento.id} asiento={asiento} />
                    ))}
                    {asientos.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">No hay asientos registrados en este periodo.</td>
                        </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
      )}

      {activeTab === 'mayor' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col md:flex-row h-[70vh]">
             {/* Sidebar Selection */}
             <div className="w-full md:w-1/3 border-r border-slate-200 flex flex-col">
                 <div className="p-4 border-b border-slate-100 bg-slate-50">
                     <h3 className="font-bold text-slate-700">Seleccionar Cuenta</h3>
                     <input type="text" placeholder="Buscar..." className="mt-2 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                 </div>
                 <div className="flex-1 overflow-y-auto">
                     {PLAN_CUENTAS.filter(c => c.nivel > 2).map(c => (
                         <button 
                            key={c.codigo} 
                            onClick={() => setCuentaMayor(c.codigo)}
                            className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 flex justify-between items-center ${cuentaMayor === c.codigo ? 'bg-blue-50 text-sri-blue' : 'text-slate-600'}`}
                         >
                             <div>
                                 <p className="font-bold text-xs font-mono">{c.codigo}</p>
                                 <p className="text-sm truncate w-48">{c.nombre}</p>
                             </div>
                             <ChevronRight size={16} className="text-slate-300" />
                         </button>
                     ))}
                 </div>
             </div>
             
             {/* Content */}
             <div className="flex-1 flex flex-col">
                 {cuentaMayor ? (
                     <>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Layers className="text-sri-blue" /> Mayor General
                                </h2>
                                <p className="text-slate-500 text-sm">Cuenta: <span className="font-mono font-bold text-slate-700">{cuentaMayor} - {PLAN_CUENTAS.find(c => c.codigo === cuentaMayor)?.nombre}</span></p>
                            </div>
                            <button className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium hover:bg-slate-50">
                                <Download size={14} className="inline mr-1" /> Exportar PDF
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-0">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-3">Fecha</th>
                                        <th className="px-6 py-3">Asiento</th>
                                        <th className="px-6 py-3">Concepto</th>
                                        <th className="px-6 py-3 text-right">Debe</th>
                                        <th className="px-6 py-3 text-right">Haber</th>
                                        <th className="px-6 py-3 text-right bg-slate-200/50">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {movimientosMayor.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-400">No hay movimientos en esta cuenta.</td></tr>
                                    ) : movimientosMayor.map((mov, i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 text-slate-600">{mov.fecha}</td>
                                            <td className="px-6 py-3">
                                                <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 hover:text-sri-blue cursor-pointer">{mov.asiento}</span>
                                            </td>
                                            <td className="px-6 py-3 text-slate-700 truncate max-w-xs">{mov.glosa}</td>
                                            <td className="px-6 py-3 text-right font-mono text-slate-600">{mov.debe > 0 ? formatMoney(mov.debe) : '-'}</td>
                                            <td className="px-6 py-3 text-right font-mono text-slate-600">{mov.haber > 0 ? formatMoney(mov.haber) : '-'}</td>
                                            <td className="px-6 py-3 text-right font-mono font-bold text-slate-800 bg-slate-50">{formatMoney(mov.saldo)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </>
                 ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                         <Layers size={64} className="mb-4 opacity-20" />
                         <p>Seleccione una cuenta contable para visualizar su Mayor.</p>
                     </div>
                 )}
             </div>
          </div>
      )}

      {activeTab === 'balances' && (
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="border-b border-slate-200 flex">
                   <button className="px-6 py-4 font-bold text-sm text-sri-blue border-b-2 border-sri-blue bg-blue-50/30">Estado de Situación Financiera</button>
                   <button className="px-6 py-4 font-bold text-sm text-slate-500 hover:text-slate-700">Estado de Resultados</button>
               </div>
               
               <div className="p-8 max-w-5xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 uppercase">{currentEmpresa.razonSocial}</h2>
                        <h3 className="text-lg font-medium text-slate-600">Estado de Situación Financiera</h3>
                        <p className="text-sm text-slate-500">Al {new Date().toLocaleDateString()}</p>
                        <p className="text-xs text-slate-400 mt-1">(Expresado en Dólares de los Estados Unidos de América)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Activos */}
                        <div>
                            <h4 className="font-bold text-slate-800 border-b-2 border-slate-800 pb-2 mb-4">ACTIVOS</h4>
                            <div className="space-y-1">
                                {PLAN_CUENTAS.filter(c => c.codigo.startsWith('1')).map(c => renderBalanceRow(c.codigo, c.nombre, c.nivel))}
                            </div>
                            <div className="flex justify-between border-t-2 border-slate-800 pt-2 mt-4 font-bold text-lg">
                                <span>TOTAL ACTIVOS</span>
                                <span>{formatMoney(calcularSaldoCuenta('1', asientos).saldo)}</span>
                            </div>
                        </div>

                        {/* Pasivos y Patrimonio */}
                        <div className="space-y-8">
                             <div>
                                <h4 className="font-bold text-slate-800 border-b-2 border-slate-800 pb-2 mb-4">PASIVOS</h4>
                                <div className="space-y-1">
                                    {PLAN_CUENTAS.filter(c => c.codigo.startsWith('2')).map(c => renderBalanceRow(c.codigo, c.nombre, c.nivel))}
                                </div>
                                <div className="flex justify-between border-t border-slate-300 pt-2 mt-2 font-bold">
                                    <span>Total Pasivos</span>
                                    <span>{formatMoney(calcularSaldoCuenta('2', asientos).saldo)}</span>
                                </div>
                             </div>

                             <div>
                                <h4 className="font-bold text-slate-800 border-b-2 border-slate-800 pb-2 mb-4">PATRIMONIO</h4>
                                <div className="space-y-1">
                                    {PLAN_CUENTAS.filter(c => c.codigo.startsWith('3')).map(c => renderBalanceRow(c.codigo, c.nombre, c.nivel))}
                                </div>
                                <div className="flex justify-between border-t border-slate-300 pt-2 mt-2 font-bold">
                                    <span>Total Patrimonio</span>
                                    <span>{formatMoney(calcularSaldoCuenta('3', asientos).saldo)}</span>
                                </div>
                             </div>

                             <div className="flex justify-between border-t-4 border-slate-800 pt-2 font-bold text-lg bg-slate-50 p-2">
                                <span>TOTAL PASIVO + PATRIMONIO</span>
                                <span>{formatMoney(calcularSaldoCuenta('2', asientos).saldo + calcularSaldoCuenta('3', asientos).saldo)}</span>
                            </div>
                        </div>
                    </div>
               </div>
           </div>
      )}

      {activeTab === 'costos' && (
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                   <div>
                       <h3 className="text-lg font-bold text-slate-800">Centros de Costos</h3>
                       <p className="text-sm text-slate-500">Estructura para contabilidad administrativa y gestión de gastos.</p>
                   </div>
                   <button className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm">
                       <Plus size={16} /> Crear Centro
                   </button>
               </div>
               <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                       <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                           <tr>
                               <th className="px-6 py-3">Código</th>
                               <th className="px-6 py-3">Nombre</th>
                               <th className="px-6 py-3">Nivel</th>
                               <th className="px-6 py-3 text-center">Estado</th>
                               <th className="px-6 py-3 text-center">Acciones</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                           {centros.map(centro => (
                               <tr key={centro.id} className="hover:bg-slate-50">
                                   <td className="px-6 py-4 font-mono text-slate-600">
                                       <span style={{ paddingLeft: `${(centro.nivel - 1) * 20}px` }}>
                                            {centro.codigo}
                                       </span>
                                   </td>
                                   <td className="px-6 py-4 font-medium text-slate-800">{centro.nombre}</td>
                                   <td className="px-6 py-4">
                                       <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{centro.nivel === 1 ? 'Principal' : 'Auxiliar'}</span>
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                       <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Activo</span>
                                   </td>
                                    <td className="px-6 py-4 text-center">
                                       <button className="text-sri-blue hover:underline text-xs">Editar</button>
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
           </div>
      )}

      {/* Modal Render */}
      {showModalAsiento && (
          <NuevoAsientoModal 
            onClose={() => setShowModalAsiento(false)} 
            onSave={loadData}
            empresaId={currentEmpresa.id}
          />
      )}
    </div>
  );
};
