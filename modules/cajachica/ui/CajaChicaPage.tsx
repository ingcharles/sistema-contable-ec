
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Empresa } from '../../../types';
import { FondoCaja, GastoCaja, ReposicionCaja } from '../domain/types';
import { CentroCosto } from '../../contabilidad/domain/types';
import { InMemoryCajaChicaRepository } from '../infrastructure/CajaChicaRepository';
import { InMemoryContabilidadRepository } from '../../contabilidad/infrastructure/ContabilidadRepository';
import { AsientoContable } from '../../contabilidad/domain/types';
import { formatMoney } from '../../../services/sriService';
import { Coins, Plus, FileText, RefreshCw, AlertTriangle, Wallet, ArrowRight, Save, X, Tag } from 'lucide-react';

const NuevoGastoModal = ({ fondo, centros, onClose, onSave }: { fondo: FondoCaja, centros: CentroCosto[], onClose: () => void, onSave: () => void }) => {
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [concepto, setConcepto] = useState('');
    const [monto, setMonto] = useState(0);
    const [proveedor, setProveedor] = useState('');
    const [comprobante, setComprobante] = useState('');
    const [centroCostoId, setCentroCostoId] = useState('');
    const [categoria, setCategoria] = useState('Movilización');

    const handleGuardar = async () => {
        if (!concepto || monto <= 0 || monto > fondo.saldoActual) return;

        const nuevoGasto: GastoCaja = {
            id: Math.random().toString(36),
            fondoCajaId: fondo.id,
            fecha,
            concepto,
            monto,
            proveedor: proveedor || 'Consumidor Final',
            nroComprobante: comprobante,
            centroCostoId,
            categoriaGasto: categoria,
            estado: 'REGISTRADO',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user'
        };

        const repo = new InMemoryCajaChicaRepository();
        await repo.registrarGasto(nuevoGasto);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800">Nuevo Gasto / Vale</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-emerald-50 p-3 rounded-lg flex justify-between items-center text-sm border border-emerald-100">
                        <span className="text-emerald-800">Disponible en Caja:</span>
                        <span className="font-bold text-emerald-900">{formatMoney(fondo.saldoActual)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha</label>
                            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Monto ($)</label>
                            <input type="number" value={monto} onChange={e => setMonto(parseFloat(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm font-bold text-right" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Concepto</label>
                        <input type="text" value={concepto} onChange={e => setConcepto(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ej: Taxis envío documentos" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Categoría</label>
                            <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                <option>Movilización</option>
                                <option>Suministros</option>
                                <option>Alimentación</option>
                                <option>Mantenimiento</option>
                                <option>Varios</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Centro de Costo</label>
                            <select value={centroCostoId} onChange={e => setCentroCostoId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                <option value="">-- General --</option>
                                {centros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Proveedor (Opcional)</label>
                        <input type="text" value={proveedor} onChange={e => setProveedor(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-white rounded-lg">Cancelar</button>
                    <button onClick={handleGuardar} disabled={monto <= 0 || monto > fondo.saldoActual} className="px-6 py-2 bg-sri-blue text-white font-medium rounded-lg hover:bg-sri-light disabled:opacity-50 flex items-center gap-2">
                        <Save size={18} /> Registrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export const CajaChicaPage: React.FC = () => {
    const { currentEmpresa } = useOutletContext<{ currentEmpresa: Empresa }>();
    const [fondos, setFondos] = useState<FondoCaja[]>([]);
    const [selectedFondo, setSelectedFondo] = useState<FondoCaja | null>(null);
    const [gastos, setGastos] = useState<GastoCaja[]>([]);
    const [centros, setCentros] = useState<CentroCosto[]>([]);
    const [showModal, setShowModal] = useState(false);

    const loadData = async () => {
        const repo = new InMemoryCajaChicaRepository();
        const repoCont = new InMemoryContabilidadRepository();
        const dataFondos = await repo.getFondos(currentEmpresa.id);
        const dataCentros = await repoCont.getCentrosCostos(currentEmpresa.id);
        
        setFondos(dataFondos);
        setCentros(dataCentros);
        
        if (dataFondos.length > 0 && !selectedFondo) {
            setSelectedFondo(dataFondos[0]);
        }
    };

    const loadGastos = async () => {
        if (selectedFondo) {
            const repo = new InMemoryCajaChicaRepository();
            const dataGastos = await repo.getGastosPendientes(selectedFondo.id);
            setGastos(dataGastos);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentEmpresa.id]);

    useEffect(() => {
        loadGastos();
    }, [selectedFondo]);

    const handleReponer = async () => {
        if (!selectedFondo || gastos.length === 0) return;
        if (!window.confirm(`¿Generar reposición por ${formatMoney(gastos.reduce((a,b)=>a+b.monto,0))}? Esto generará el asiento contable y cheque.`)) return;

        const totalReposicion = gastos.reduce((acc, g) => acc + g.monto, 0);
        
        // 1. Generar Asiento de Gastos
        // Debe: Gastos (por categoría/centro costo)
        // Haber: Bancos (Salida de cheque para reponer)
        
        const asiento: AsientoContable = {
            id: Math.random().toString(36),
            empresaId: currentEmpresa.id,
            numero: `REP-${Math.floor(Math.random()*1000)}`,
            fecha: new Date().toISOString().split('T')[0],
            glosa: `Reposición Caja Chica ${selectedFondo.nombre} - ${gastos.length} vales`,
            tipo: 'EGRESO',
            estado: 'MAYORIZADO',
            totalDebe: totalReposicion,
            totalHaber: totalReposicion,
            detalles: [
                // Simplificación: Un solo débito a Gastos Varios, en prod se desglosa por cuenta
                { cuentaCodigo: '5.2.02.02', cuentaNombre: 'GASTOS MOVILIZACIÓN Y VARIOS', debe: totalReposicion, haber: 0 },
                { cuentaCodigo: '1.1.01.02', cuentaNombre: 'BANCOS', debe: 0, haber: totalReposicion }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        };

        const repoCont = new InMemoryContabilidadRepository();
        await repoCont.saveAsiento(asiento);

        // 2. Actualizar Caja
        const repoCaja = new InMemoryCajaChicaRepository();
        const reposicion: ReposicionCaja = {
            id: Math.random().toString(36),
            fondoCajaId: selectedFondo.id,
            fecha: new Date().toISOString().split('T')[0],
            montoTotal: totalReposicion,
            gastosIncluidosIds: gastos.map(g => g.id),
            estado: 'APROBADA',
            asientoContableId: asiento.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'admin'
        };
        await repoCaja.generarReposicion(reposicion);

        alert('Reposición generada con éxito. Fondo restaurado.');
        loadData();
        loadGastos();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Control de Caja Chica</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de fondos fijos y gastos menores.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleReponer} disabled={!selectedFondo || gastos.length === 0} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50">
                        <RefreshCw size={16} /> Reponer Fondo
                    </button>
                    <button onClick={() => setShowModal(true)} disabled={!selectedFondo} className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm disabled:opacity-50">
                        <Plus size={16} /> Nuevo Gasto
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {fondos.map(fondo => (
                    <div 
                        key={fondo.id} 
                        onClick={() => setSelectedFondo(fondo)}
                        className={`cursor-pointer p-6 rounded-xl border transition-all relative overflow-hidden ${selectedFondo?.id === fondo.id ? 'border-sri-blue ring-1 ring-sri-blue bg-blue-50/30' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                                <Wallet size={24} />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${fondo.saldoActual < fondo.montoAsignado * 0.2 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {((fondo.saldoActual / fondo.montoAsignado) * 100).toFixed(0)}% Disp.
                            </span>
                        </div>
                        <h3 className="font-bold text-slate-800">{fondo.nombre}</h3>
                        <p className="text-xs text-slate-500 mb-4">{fondo.responsable}</p>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Asignado:</span>
                                <span className="font-mono font-medium">{formatMoney(fondo.montoAsignado)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Saldo Actual:</span>
                                <span className="font-mono font-bold text-slate-800">{formatMoney(fondo.saldoActual)}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${fondo.saldoActual < fondo.montoAsignado * 0.2 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                                    style={{ width: `${(fondo.saldoActual / fondo.montoAsignado) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedFondo && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">Gastos Pendientes de Reposición</h3>
                        <span className="text-xs text-slate-500">Total: <strong>{formatMoney(gastos.reduce((a,b)=>a+b.monto,0))}</strong></span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3">Concepto</th>
                                    <th className="px-6 py-3">Categoría</th>
                                    <th className="px-6 py-3">Proveedor / Comp.</th>
                                    <th className="px-6 py-3">C. Costo</th>
                                    <th className="px-6 py-3 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {gastos.map(g => (
                                    <tr key={g.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-3 text-slate-600">{g.fecha}</td>
                                        <td className="px-6 py-3 font-medium text-slate-800">{g.concepto}</td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">
                                                <Tag size={10} /> {g.categoriaGasto}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-xs text-slate-500">
                                            {g.proveedor} <br/> {g.nroComprobante}
                                        </td>
                                        <td className="px-6 py-3 text-xs text-slate-500">
                                            {centros.find(c => c.id === g.centroCostoId)?.nombre || '-'}
                                        </td>
                                        <td className="px-6 py-3 text-right font-bold text-slate-900">{formatMoney(g.monto)}</td>
                                    </tr>
                                ))}
                                {gastos.length === 0 && (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-400">No hay gastos pendientes.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && selectedFondo && (
                <NuevoGastoModal 
                    fondo={selectedFondo} 
                    centros={centros}
                    onClose={() => setShowModal(false)}
                    onSave={() => {
                        loadData();
                        loadGastos();
                    }}
                />
            )}
        </div>
    );
};
