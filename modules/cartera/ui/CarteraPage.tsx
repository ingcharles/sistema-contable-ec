
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Empresa } from '../../../types';
import { DocumentoPendiente, TipoCartera, TransaccionCartera, Anticipo } from '../domain/types';
import { InMemoryCarteraRepository } from '../infrastructure/CarteraRepository';
import { InMemoryContabilidadRepository } from '../../contabilidad/infrastructure/ContabilidadRepository';
import { InMemoryBancosRepository } from '../../bancos/infrastructure/BancosRepository';
import { AsientoContable } from '../../contabilidad/domain/types';
import { MovimientoBancario, TipoMovimientoBancario } from '../../bancos/domain/types';
import { formatMoney } from '../../../services/sriService';
import { Wallet, TrendingUp, TrendingDown, Clock, AlertCircle, CheckCircle2, DollarSign, X, Save, Receipt, ArrowRightLeft, Plus } from 'lucide-react';

const EstadoCarteraBadge = ({ diasVencidos }: { diasVencidos: number }) => {
    if (diasVencidos > 0) {
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700"><AlertCircle size={10} /> Vencido ({diasVencidos}d)</span>;
    } else if (diasVencidos > -5) {
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={10} /> Vence pronto</span>;
    } else {
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 size={10} /> Al día</span>;
    }
};

// --- MODAL: REGISTRO DE ANTICIPO ---
const RegistroAnticipoModal = ({ tipo, onClose, onSave, empresaId }: { tipo: TipoCartera, onClose: () => void, onSave: () => void, empresaId: string }) => {
    const esCliente = tipo === TipoCartera.CXC;
    const [terceroId, setTerceroId] = useState('');
    const [terceroNombre, setTerceroNombre] = useState('');
    const [monto, setMonto] = useState(0);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [referencia, setReferencia] = useState('');
    const [bancoId, setBancoId] = useState('cta1');

    const handleGuardar = async () => {
        if (!terceroId || monto <= 0) return;

        // 1. Guardar Anticipo en Cartera
        const anticipo: Anticipo = {
            id: Math.random().toString(36),
            empresaId,
            tipo,
            terceroId,
            terceroNombre,
            fecha,
            referencia,
            montoOriginal: monto,
            montoUsado: 0,
            saldoDisponible: monto,
            estado: 'DISPONIBLE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user'
        };

        const repoCartera = new InMemoryCarteraRepository();
        await repoCartera.saveAnticipo(anticipo);

        // 2. Movimiento Bancario
        const repoBancos = new InMemoryBancosRepository();
        const movBanco: MovimientoBancario = {
            id: Math.random().toString(36),
            cuentaId: bancoId,
            fecha,
            tipo: esCliente ? TipoMovimientoBancario.TRANSFERENCIA_RECIBIDA : TipoMovimientoBancario.TRANSFERENCIA_ENVIADA,
            referencia: referencia || 'ANTICIPO',
            beneficiario: terceroNombre,
            concepto: `Anticipo ${esCliente ? 'de Cliente' : 'a Proveedor'} - ${referencia}`,
            monto,
            esEgreso: !esCliente,
            conciliado: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user'
        };
        await repoBancos.saveMovimiento(movBanco);

        // 3. Asiento Contable
        const repoCont = new InMemoryContabilidadRepository();
        const ctaBanco = '1.1.01.02';
        const ctaAnticipo = esCliente ? '2.1.01.05' : '1.1.02.05'; // Pasivo (Cli) o Activo (Prov)

        const detalles = esCliente ? [
            { cuentaCodigo: ctaBanco, cuentaNombre: 'BANCOS', debe: monto, haber: 0 },
            { cuentaCodigo: ctaAnticipo, cuentaNombre: 'ANTICIPO DE CLIENTES', debe: 0, haber: monto }
        ] : [
            { cuentaCodigo: ctaAnticipo, cuentaNombre: 'ANTICIPO A PROVEEDORES', debe: monto, haber: 0 },
            { cuentaCodigo: ctaBanco, cuentaNombre: 'BANCOS', debe: 0, haber: monto }
        ];

        const asiento: AsientoContable = {
            id: Math.random().toString(36),
            empresaId,
            numero: `ANT-${Math.floor(Math.random() * 1000)}`,
            fecha,
            glosa: `Reg. Anticipo ${esCliente ? 'Cliente' : 'Proveedor'} ${terceroNombre}`,
            tipo: esCliente ? 'INGRESO' : 'EGRESO',
            estado: 'MAYORIZADO',
            totalDebe: monto,
            totalHaber: monto,
            detalles,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        };
        await repoCont.saveAsiento(asiento);

        alert('Anticipo registrado y contabilizado.');
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800">Registrar Anticipo</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800">
                        Este proceso registra un movimiento de dinero (Banco) sin asociarlo a una factura. Se creará un saldo a favor para cruzarlo posteriormente.
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">RUC / Identificación</label>
                        <input type="text" value={terceroId} onChange={e => setTerceroId(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Ej: 179..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nombre {esCliente ? 'Cliente' : 'Proveedor'}</label>
                        <input type="text" value={terceroNombre} onChange={e => setTerceroNombre(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Razón Social" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Monto ($)</label>
                            <input type="number" value={monto} onChange={e => setMonto(parseFloat(e.target.value))} className="w-full border rounded p-2 text-sm text-right font-bold" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha</label>
                            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full border rounded p-2 text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Referencia</label>
                        <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Nro Transferencia / Cheque" />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancelar</button>
                    <button onClick={handleGuardar} disabled={monto <= 0} className="px-6 py-2 bg-sri-blue text-white font-medium rounded-lg hover:bg-sri-light shadow-sm flex items-center gap-2">
                        <Save size={18} /> Guardar Anticipo
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MODAL: CRUCE DE CUENTAS ---
const CruceCuentasModal = ({ documento, anticipos, onClose, onSave, empresaId }: { documento: DocumentoPendiente, anticipos: Anticipo[], onClose: () => void, onSave: () => void, empresaId: string }) => {
    const [selectedAnticipoId, setSelectedAnticipoId] = useState('');
    const [valorCruce, setValorCruce] = useState(0);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

    const anticipoSeleccionado = anticipos.find(a => a.id === selectedAnticipoId);
    const maxCruce = anticipoSeleccionado ? Math.min(anticipoSeleccionado.saldoDisponible, documento.saldoPendiente) : 0;

    const handleCruce = async () => {
        if (!anticipoSeleccionado || valorCruce <= 0 || valorCruce > maxCruce) return;

        // 1. Registrar Transaccion en Cartera (Actualiza Saldos Doc y Anticipo)
        const tx: TransaccionCartera = {
            documentoId: documento.id,
            anticipoId: anticipoSeleccionado.id,
            fecha,
            valorEfectivo: 0,
            valorRetencion: 0,
            valorCruce,
            formaPago: 'CRUCE_ANTICIPO',
            referencia: `Cruce con Ant. ${anticipoSeleccionado.referencia}`
        };

        const repoCartera = new InMemoryCarteraRepository();
        await repoCartera.registrarTransaccion(tx);

        // 2. Asiento Contable de Cruce
        // Si es Cliente (CxC): Debe Anticipo Clientes (Pasivo dism) / Haber CxC Clientes (Activo dism)
        // Si es Proveedor (CxP): Debe CxP Proveedores (Pasivo dism) / Haber Anticipo Prov (Activo dism)
        
        const esCxC = documento.tipo === TipoCartera.CXC;
        const ctaCxC = '1.1.02.01';
        const ctaCxP = '2.1.01.01';
        const ctaAntCli = '2.1.01.05';
        const ctaAntProv = '1.1.02.05';

        const detalles = esCxC ? [
            { cuentaCodigo: ctaAntCli, cuentaNombre: 'ANTICIPO DE CLIENTES', debe: valorCruce, haber: 0 },
            { cuentaCodigo: ctaCxC, cuentaNombre: 'CUENTAS POR COBRAR CLIENTES', debe: 0, haber: valorCruce }
        ] : [
            { cuentaCodigo: ctaCxP, cuentaNombre: 'CUENTAS POR PAGAR PROVEEDORES', debe: valorCruce, haber: 0 },
            { cuentaCodigo: ctaAntProv, cuentaNombre: 'ANTICIPO A PROVEEDORES', debe: 0, haber: valorCruce }
        ];

        const repoCont = new InMemoryContabilidadRepository();
        const asiento: AsientoContable = {
            id: Math.random().toString(36),
            empresaId,
            numero: `CRU-${Math.floor(Math.random() * 1000)}`,
            fecha,
            glosa: `Cruce Fac/${documento.nroComprobante} con Anticipo ${anticipoSeleccionado.referencia}`,
            tipo: 'DIARIO',
            estado: 'MAYORIZADO',
            totalDebe: valorCruce,
            totalHaber: valorCruce,
            detalles,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        };
        await repoCont.saveAsiento(asiento);

        alert('Cruce realizado con éxito.');
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ArrowRightLeft className="text-sri-blue" /> Cruce de Cuentas
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-slate-50 p-3 rounded text-sm mb-4 border border-slate-200">
                        <p><strong>Documento:</strong> {documento.nroComprobante}</p>
                        <p><strong>Saldo Pendiente:</strong> {formatMoney(documento.saldoPendiente)}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Seleccionar Anticipo Disponible</label>
                        <select 
                            value={selectedAnticipoId} 
                            onChange={e => {
                                setSelectedAnticipoId(e.target.value);
                                const ant = anticipos.find(a => a.id === e.target.value);
                                if (ant) setValorCruce(Math.min(ant.saldoDisponible, documento.saldoPendiente));
                            }}
                            className="w-full border rounded p-2 text-sm"
                        >
                            <option value="">-- Seleccione --</option>
                            {anticipos.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.fecha} - Ref: {a.referencia} - Disp: {formatMoney(a.saldoDisponible)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {anticipoSeleccionado && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Valor a Cruzar</label>
                            <input 
                                type="number" 
                                value={valorCruce} 
                                onChange={e => setValorCruce(parseFloat(e.target.value))} 
                                max={maxCruce}
                                className="w-full border rounded p-2 text-sm text-right font-bold" 
                            />
                            <p className="text-xs text-slate-400 mt-1 text-right">Máximo posible: {formatMoney(maxCruce)}</p>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancelar</button>
                    <button onClick={handleCruce} disabled={!selectedAnticipoId || valorCruce <= 0} className="px-6 py-2 bg-sri-blue text-white font-medium rounded-lg hover:bg-sri-light shadow-sm flex items-center gap-2 disabled:opacity-50">
                        <ArrowRightLeft size={18} /> Procesar Cruce
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- TESORERIA MODAL (Existente, actualizada para invocar registro simple) ---
// (Se mantiene la lógica existente, solo se envuelve en el componente principal)

// --- COMPONENTE PRINCIPAL ---
export const CarteraPage: React.FC = () => {
    const { currentEmpresa } = useOutletContext<{ currentEmpresa: Empresa }>();
    const [activeTab, setActiveTab] = useState<'documentos' | 'anticipos'>('documentos');
    const [tipo, setTipo] = useState<TipoCartera>(TipoCartera.CXC);
    
    const [documentos, setDocumentos] = useState<DocumentoPendiente[]>([]);
    const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
    
    // Modales
    const [selectedDoc, setSelectedDoc] = useState<DocumentoPendiente | null>(null); // Para cobro normal
    const [showAnticipoModal, setShowAnticipoModal] = useState(false);
    const [showCruceModal, setShowCruceModal] = useState(false);
    
    const load = async () => {
        const repo = new InMemoryCarteraRepository();
        const dataDocs = await repo.getPendientes(currentEmpresa.id, tipo);
        const dataAnt = await repo.getAnticipos(currentEmpresa.id, tipo);
        setDocumentos(dataDocs);
        setAnticipos(dataAnt);
    };

    useEffect(() => { load(); }, [currentEmpresa.id, tipo]);

    // Calcular KPI
    const totalPendiente = documentos.reduce((acc, d) => acc + d.saldoPendiente, 0);
    const totalAnticipos = anticipos.reduce((acc, a) => acc + a.saldoDisponible, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Cartera y Tesorería</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de cobros, pagos y anticipos.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setTipo(TipoCartera.CXC)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${tipo === TipoCartera.CXC ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <TrendingUp size={16} /> Clientes (CXC)
                    </button>
                    <button onClick={() => setTipo(TipoCartera.CXP)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${tipo === TipoCartera.CXP ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <TrendingDown size={16} /> Proveedores (CXP)
                    </button>
                </div>
            </div>

            {/* KPI simple */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Total por {tipo === TipoCartera.CXC ? 'Cobrar' : 'Pagar'}</p>
                        <p className="text-2xl font-bold text-slate-800">{formatMoney(totalPendiente)}</p>
                    </div>
                    <div className="p-2 bg-slate-100 rounded text-slate-500"><Receipt size={20} /></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Anticipos Disponibles</p>
                        <p className="text-2xl font-bold text-blue-600">{formatMoney(totalAnticipos)}</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded text-blue-500"><Wallet size={20} /></div>
                </div>
            </div>

            {/* Sub-Tabs */}
            <div className="border-b border-slate-200 flex gap-4">
                <button onClick={() => setActiveTab('documentos')} className={`pb-2 text-sm font-medium ${activeTab === 'documentos' ? 'text-sri-blue border-b-2 border-sri-blue' : 'text-slate-500'}`}>
                    Documentos Pendientes
                </button>
                <button onClick={() => setActiveTab('anticipos')} className={`pb-2 text-sm font-medium ${activeTab === 'anticipos' ? 'text-sri-blue border-b-2 border-sri-blue' : 'text-slate-500'}`}>
                    Anticipos y Saldos a Favor
                </button>
            </div>

            {activeTab === 'documentos' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Tercero</th>
                                    <th className="px-6 py-4">Documento</th>
                                    <th className="px-6 py-4">Vencimiento</th>
                                    <th className="px-6 py-4 text-right">Saldo</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {documentos.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-800">{doc.terceroNombre}</td>
                                        <td className="px-6 py-4 font-mono text-slate-600">{doc.nroComprobante}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-slate-500">{doc.fechaVencimiento}</span>
                                                <EstadoCarteraBadge diasVencidos={doc.diasVencidos} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">{formatMoney(doc.saldoPendiente)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                {/* Botón Pagar/Cobrar normal (sin modal en este snippet para brevedad, llamar a TesoreriaModal existente si se desea) */}
                                                <button className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold hover:bg-emerald-200">
                                                    {tipo === TipoCartera.CXC ? 'Cobrar' : 'Pagar'}
                                                </button>
                                                {anticipos.filter(a => a.terceroId === doc.terceroId).length > 0 && (
                                                    <button 
                                                        onClick={() => { setSelectedDoc(doc); setShowCruceModal(true); }}
                                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold hover:bg-blue-200"
                                                    >
                                                        Cruzar Anticipo
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {documentos.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No hay documentos pendientes.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'anticipos' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">Saldos a Favor Disponibles</h3>
                        <button onClick={() => setShowAnticipoModal(true)} className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm">
                            <Plus size={16} /> Registrar Nuevo Anticipo
                        </button>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Tercero</th>
                                <th className="px-6 py-4">Referencia</th>
                                <th className="px-6 py-4 text-right">Monto Original</th>
                                <th className="px-6 py-4 text-right text-green-600 font-bold">Disponible</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {anticipos.map(ant => (
                                <tr key={ant.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-slate-600">{ant.fecha}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{ant.terceroNombre}</td>
                                    <td className="px-6 py-4 text-xs text-slate-500">{ant.referencia}</td>
                                    <td className="px-6 py-4 text-right text-slate-500">{formatMoney(ant.montoOriginal)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-green-700 bg-green-50/30">{formatMoney(ant.saldoDisponible)}</td>
                                </tr>
                            ))}
                            {anticipos.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No hay anticipos disponibles.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {showAnticipoModal && (
                <RegistroAnticipoModal 
                    tipo={tipo} 
                    onClose={() => setShowAnticipoModal(false)} 
                    onSave={load} 
                    empresaId={currentEmpresa.id}
                />
            )}

            {showCruceModal && selectedDoc && (
                <CruceCuentasModal 
                    documento={selectedDoc} 
                    anticipos={anticipos.filter(a => a.terceroId === selectedDoc.terceroId)} 
                    onClose={() => { setShowCruceModal(false); setSelectedDoc(null); }} 
                    onSave={load} 
                    empresaId={currentEmpresa.id}
                />
            )}
        </div>
    );
};
