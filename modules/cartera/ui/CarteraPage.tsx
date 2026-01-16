
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Empresa } from '../../../types';
import { DocumentoPendiente, TipoCartera, TransaccionCartera } from '../domain/types';
import { InMemoryCarteraRepository } from '../infrastructure/CarteraRepository';
import { InMemoryContabilidadRepository } from '../../contabilidad/infrastructure/ContabilidadRepository';
import { InMemoryBancosRepository } from '../../bancos/infrastructure/BancosRepository';
import { AsientoContable } from '../../contabilidad/domain/types';
import { MovimientoBancario, TipoMovimientoBancario } from '../../bancos/domain/types';
import { formatMoney } from '../../../services/sriService';
import { Wallet, TrendingUp, TrendingDown, Clock, AlertCircle, CheckCircle2, DollarSign, X, Save, Building2, Receipt } from 'lucide-react';

const EstadoCarteraBadge = ({ diasVencidos }: { diasVencidos: number }) => {
    if (diasVencidos > 0) {
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700"><AlertCircle size={10} /> Vencido ({diasVencidos}d)</span>;
    } else if (diasVencidos > -5) {
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={10} /> Vence pronto</span>;
    } else {
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 size={10} /> Al día</span>;
    }
};

// --- MODAL DE TESORERÍA ---
const TesoreriaModal = ({ documento, onClose, onSave, empresaId }: { documento: DocumentoPendiente, onClose: () => void, onSave: () => void, empresaId: string }) => {
    const esCobro = documento.tipo === TipoCartera.CXC;
    
    // Estados del formulario
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [formaPago, setFormaPago] = useState<'TRANSFERENCIA' | 'CHEQUE' | 'EFECTIVO'>('TRANSFERENCIA');
    const [referencia, setReferencia] = useState('');
    const [bancoId, setBancoId] = useState('cta1'); // Mock Default
    
    // Valores
    const [valorRetencion, setValorRetencion] = useState(0);
    const [nroRetencion, setNroRetencion] = useState('');
    const [valorPagar, setValorPagar] = useState(documento.saldoPendiente);

    // Cálculos
    const abonoTotal = Number(valorPagar) + Number(valorRetencion);
    const nuevoSaldo = documento.saldoPendiente - abonoTotal;

    const handleSubmit = async () => {
        if (abonoTotal <= 0) return;
        if (esCobro && valorRetencion > 0 && !nroRetencion) {
            alert('Debe ingresar el número de retención recibida.');
            return;
        }

        // 1. Registrar en Cartera (Bajar Saldo)
        const tx: TransaccionCartera = {
            documentoId: documento.id,
            fecha,
            valorEfectivo: Number(valorPagar),
            valorRetencion: Number(valorRetencion),
            formaPago,
            bancoId: formaPago !== 'EFECTIVO' ? bancoId : undefined,
            referencia,
            nroRetencionRecibida: nroRetencion
        };

        const repoCartera = new InMemoryCarteraRepository();
        await repoCartera.registrarTransaccion(tx);

        // 2. Registrar Movimiento Bancario (Si aplica)
        if (formaPago !== 'EFECTIVO' && valorPagar > 0) {
            const repoBancos = new InMemoryBancosRepository();
            const movBanco: MovimientoBancario = {
                id: Math.random().toString(36),
                cuentaId: bancoId,
                fecha,
                tipo: esCobro ? TipoMovimientoBancario.TRANSFERENCIA_RECIBIDA : TipoMovimientoBancario.TRANSFERENCIA_ENVIADA,
                referencia: referencia || 'S/N',
                beneficiario: documento.terceroNombre,
                concepto: `${esCobro ? 'COBRO' : 'PAGO'} FAC ${documento.nroComprobante}`,
                monto: valorPagar,
                esEgreso: !esCobro,
                conciliado: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'user'
            };
            await repoBancos.saveMovimiento(movBanco);
        }

        // 3. Generar Asiento Contable
        const repoContabilidad = new InMemoryContabilidadRepository();
        const cuentaEfectivo = formaPago === 'EFECTIVO' ? '1.1.01.01' : '1.1.01.02'; // Caja o Bancos
        const cuentaTercero = esCobro ? '1.1.02.01' : '2.1.01.01'; // CxC o CxP
        
        let detalles = [];

        if (esCobro) {
            // Asiento de Cobro (Ingreso)
            // DEBE: Bancos/Caja (valorPagar)
            // DEBE: Retención Renta (valorRetencion) - Activo Tributario
            // HABER: Cuentas por Cobrar (abonoTotal)
            if (valorPagar > 0) detalles.push({ cuentaCodigo: cuentaEfectivo, cuentaNombre: formaPago === 'EFECTIVO' ? 'CAJA GENERAL' : 'BANCOS', debe: valorPagar, haber: 0 });
            if (valorRetencion > 0) detalles.push({ cuentaCodigo: '1.1.05.02', cuentaNombre: 'RETENCIONES RENTA RECIBIDAS', debe: valorRetencion, haber: 0 });
            detalles.push({ cuentaCodigo: cuentaTercero, cuentaNombre: 'CUENTAS POR COBRAR CLIENTES', debe: 0, haber: abonoTotal });
        } else {
            // Asiento de Pago (Egreso)
            // DEBE: Cuentas por Pagar (abonoTotal)
            // HABER: Bancos/Caja (valorPagar)
            // (La retención en pago se hace al registrar la compra, no al pagar, generalmente)
            detalles.push({ cuentaCodigo: cuentaTercero, cuentaNombre: 'CUENTAS POR PAGAR PROVEEDORES', debe: abonoTotal, haber: 0 });
            if (valorPagar > 0) detalles.push({ cuentaCodigo: cuentaEfectivo, cuentaNombre: formaPago === 'EFECTIVO' ? 'CAJA GENERAL' : 'BANCOS', debe: 0, haber: valorPagar });
        }

        const asiento: AsientoContable = {
            id: Math.random().toString(36),
            empresaId,
            numero: `TES-${Math.floor(Math.random() * 1000)}`,
            fecha,
            glosa: `${esCobro ? 'Cobro' : 'Pago'} Fac/${documento.nroComprobante} - ${documento.terceroNombre}`,
            tipo: esCobro ? 'INGRESO' : 'EGRESO',
            estado: 'MAYORIZADO',
            totalDebe: abonoTotal,
            totalHaber: abonoTotal,
            detalles,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        };

        await repoContabilidad.saveAsiento(asiento);

        alert('Transacción registrada. Se generó el asiento contable y movimiento bancario automáticamente.');
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col animate-in zoom-in-95 duration-200">
                <div className={`p-6 border-b border-slate-100 flex justify-between items-center rounded-t-xl ${esCobro ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                    <div>
                        <h2 className={`text-xl font-bold ${esCobro ? 'text-emerald-800' : 'text-blue-800'}`}>
                            {esCobro ? 'Registrar Cobro' : 'Registrar Pago'}
                        </h2>
                        <p className={`text-xs ${esCobro ? 'text-emerald-600' : 'text-blue-600'}`}>
                            {esCobro ? 'Ingreso de dinero a Caja/Bancos' : 'Egreso de dinero por obligaciones'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Info Documento */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">{esCobro ? 'Cliente' : 'Proveedor'}</span>
                            <span className="text-xs font-mono text-slate-400">{documento.terceroId}</span>
                        </div>
                        <p className="font-bold text-slate-800 text-sm mb-1">{documento.terceroNombre}</p>
                        <div className="flex justify-between text-sm mt-3 pt-3 border-t border-slate-200">
                            <span className="text-slate-600">Comprobante: {documento.nroComprobante}</span>
                            <span className="font-mono font-bold text-slate-900">Saldo: {formatMoney(documento.saldoPendiente)}</span>
                        </div>
                    </div>

                    {/* Formulario */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Fecha</label>
                                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Forma de Pago</label>
                                <select value={formaPago} onChange={e => setFormaPago(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="EFECTIVO">Efectivo</option>
                                </select>
                            </div>
                        </div>

                        {formaPago !== 'EFECTIVO' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Cuenta Bancaria</label>
                                    <select value={bancoId} onChange={e => setBancoId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                        <option value="cta1">Banco Pichincha - Cta Cte</option>
                                        <option value="cta2">Banco Guayaquil - Cta Cte</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Referencia / Nro Cheque</label>
                                    <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Ej: 123456" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                </div>
                            </div>
                        )}

                        {/* Sección Retenciones (Solo CxC) */}
                        {esCobro && (
                            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg space-y-3">
                                <div className="flex items-center gap-2 text-yellow-800 mb-1">
                                    <Receipt size={16} />
                                    <span className="text-xs font-bold uppercase">Retención Recibida</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-[10px] font-medium text-yellow-700 mb-1">Valor Retenido ($)</label>
                                        <input 
                                            type="number" 
                                            value={valorRetencion} 
                                            onChange={e => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setValorRetencion(val);
                                                // Ajustar sugerencia de pago: Saldo - Retencion
                                                setValorPagar(Math.max(0, documento.saldoPendiente - val));
                                            }}
                                            className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm focus:border-yellow-400 outline-none" 
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-yellow-700 mb-1">Nro. Comprobante</label>
                                        <input 
                                            type="text" 
                                            value={nroRetencion} 
                                            onChange={e => setNroRetencion(e.target.value)}
                                            className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm focus:border-yellow-400 outline-none" 
                                            placeholder="001-001-..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Totales */}
                        <div className="pt-2">
                             <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Monto a {esCobro ? 'Recibir' : 'Pagar'} (Dinero)</label>
                             <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <input 
                                    type="number" 
                                    value={valorPagar} 
                                    onChange={e => setValorPagar(parseFloat(e.target.value) || 0)}
                                    className="w-full pl-8 pr-4 py-3 border-2 border-slate-200 rounded-xl text-lg font-bold text-slate-800 outline-none focus:border-sri-blue transition-colors"
                                />
                             </div>
                        </div>

                        {/* Resumen Final */}
                        <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                            <span>Abono Total: <strong>{formatMoney(abonoTotal)}</strong></span>
                            <span className={nuevoSaldo < 0 ? 'text-red-500 font-bold' : 'text-slate-500'}>
                                Nuevo Saldo: {formatMoney(Math.max(0, nuevoSaldo))}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-white rounded-lg transition-colors">Cancelar</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={abonoTotal <= 0}
                        className={`px-6 py-2 text-white font-medium rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 ${esCobro ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                    >
                        <Save size={18} /> Confirmar Transacción
                    </button>
                </div>
            </div>
        </div>
    );
};

export const CarteraPage: React.FC = () => {
    const { currentEmpresa } = useOutletContext<{ currentEmpresa: Empresa }>();
    const [tipo, setTipo] = useState<TipoCartera>(TipoCartera.CXC);
    const [documentos, setDocumentos] = useState<DocumentoPendiente[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<DocumentoPendiente | null>(null);
    
    const load = async () => {
        const repo = new InMemoryCarteraRepository();
        const data = await repo.getPendientes(currentEmpresa.id, tipo);
        setDocumentos(data);
    };

    useEffect(() => {
        load();
    }, [currentEmpresa.id, tipo]);

    const totalVencido = documentos.filter(d => d.diasVencidos > 0).reduce((acc, d) => acc + d.saldoPendiente, 0);
    const totalPorVencer = documentos.filter(d => d.diasVencidos <= 0).reduce((acc, d) => acc + d.saldoPendiente, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Cartera y Tesorería</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Gestión de cobros a clientes y pagos a proveedores.
                    </p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setTipo(TipoCartera.CXC)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${tipo === TipoCartera.CXC ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <TrendingUp size={16} /> Clientes (CXC)
                    </button>
                    <button 
                        onClick={() => setTipo(TipoCartera.CXP)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${tipo === TipoCartera.CXP ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <TrendingDown size={16} /> Proveedores (CXP)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-red-600 mb-1">Cartera Vencida</p>
                        <h3 className="text-3xl font-bold text-red-900">{formatMoney(totalVencido)}</h3>
                    </div>
                    <div className="p-3 bg-white rounded-full text-red-500 shadow-sm"><AlertCircle size={24} /></div>
                 </div>
                 <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-blue-600 mb-1">Por Vencer</p>
                        <h3 className="text-3xl font-bold text-blue-900">{formatMoney(totalPorVencer)}</h3>
                    </div>
                    <div className="p-3 bg-white rounded-full text-blue-500 shadow-sm"><Clock size={24} /></div>
                 </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">
                        {tipo === TipoCartera.CXC ? 'Facturas pendientes de cobro' : 'Facturas pendientes de pago'}
                    </h3>
                    <span className="text-xs text-slate-500">{documentos.length} documentos encontrados</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Emisión</th>
                                <th className="px-6 py-4">Vencimiento</th>
                                <th className="px-6 py-4">Tercero</th>
                                <th className="px-6 py-4">Documento</th>
                                <th className="px-6 py-4 text-right">Monto Original</th>
                                <th className="px-6 py-4 text-right font-bold">Saldo Pendiente</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {documentos.map((doc) => (
                                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-600">{doc.fechaEmision}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{doc.fechaVencimiento}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-800">{doc.terceroNombre}</span>
                                            <span className="text-xs text-slate-500">{doc.terceroId}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{doc.nroComprobante}</td>
                                    <td className="px-6 py-4 text-right text-slate-500">{formatMoney(doc.montoTotal)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900">{formatMoney(doc.saldoPendiente)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <EstadoCarteraBadge diasVencidos={doc.diasVencidos} />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => setSelectedDoc(doc)}
                                            className={`text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 mx-auto shadow-sm transition-transform active:scale-95 ${tipo === TipoCartera.CXC ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                                        >
                                            <DollarSign size={12} /> {tipo === TipoCartera.CXC ? 'Cobrar' : 'Pagar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {documentos.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">
                                        No hay documentos pendientes en esta categoría.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedDoc && (
                <TesoreriaModal 
                    documento={selectedDoc} 
                    onClose={() => setSelectedDoc(null)} 
                    onSave={() => {
                        setSelectedDoc(null);
                        load();
                    }}
                    empresaId={currentEmpresa.id}
                />
            )}
        </div>
    );
};
