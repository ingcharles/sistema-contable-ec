'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Search, User } from 'lucide-react';
import { TipoCartera } from '../../domain/types';
import { TipoTercero, Tercero } from '@/modules/directorio/domain/types';
import { DirectorioUseCases, ContabilidadUseCases, ConfiguracionUseCases, CarteraUseCases, BancosUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { TipoMovimientoBancario } from '@/modules/bancos/domain/types';
import { Button } from '@/shared/ui/Button';

interface Props {
    tipo: TipoCartera;
    onClose: () => void;
    onSave: () => void;
}

export const RegistroAnticipoModal: React.FC<Props> = ({ tipo, onClose, onSave }) => {
    const esCliente = tipo === TipoCartera.CXC;
    const [terceroId, setTerceroId] = useState('');
    const [terceroNombre, setTerceroNombre] = useState('');
    const [monto, setMonto] = useState(0);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [referencia, setReferencia] = useState('');
    const [bancoId] = useState('cta1');

    const [busqueda, setBusqueda] = useState('');
    const [terceros, setTerceros] = useState<Tercero[]>([]);
    const [mostrarResultados, setMostrarResultados] = useState(false);
    const [cargandoTerceros, setCargandoTerceros] = useState(false);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (busqueda.length > 2) {
            const buscar = async () => {
                setCargandoTerceros(true);
                const tipoBusqueda = esCliente ? TipoTercero.CLIENTE : TipoTercero.PROVEEDOR;
                const data = await DirectorioUseCases.listarTerceros(tipoBusqueda, busqueda);
                setTerceros(data);
                setCargandoTerceros(false);
                setMostrarResultados(true);
            };
            const timer = setTimeout(buscar, 300);
            return () => clearTimeout(timer);
        } else {
            setMostrarResultados(false);
        }
    }, [busqueda, esCliente]);

    const seleccionarTercero = (t: Tercero) => {
        setTerceroId(t.identificacion);
        setTerceroNombre(t.razonSocial);
        setBusqueda(t.razonSocial);
        setMostrarResultados(false);
    };

    const handleGuardar = async () => {
        if (!terceroId || monto <= 0) return;

        setGuardando(true);
        try {
            // 1. Registrar Anticipo en Cartera
            await CarteraUseCases.registrarAnticipo({
                tipo,
                fecha,
                terceroId,
                terceroNombre,
                referencia,
                monto,
                moneda: 'USD',
                observaciones: `Registro de anticipo ${esCliente ? 'recibido' : 'entregado'}`
            });

            // 2. Registrar Movimiento Bancario
            await BancosUseCases.registrarTransaccion({
                cuentaId: bancoId,
                fecha,
                tipo: esCliente ? TipoMovimientoBancario.TRANSFERENCIA_RECIBIDA : TipoMovimientoBancario.TRANSFERENCIA_ENVIADA,
                referencia: referencia || 'ANTICIPO',
                beneficiario: terceroNombre,
                concepto: `Anticipo ${esCliente ? 'de Cliente' : 'a Proveedor'} - ${referencia}`,
                monto,
                esEgreso: !esCliente
            });

            // 3. Registrar Asiento Contable
            const params = await ConfiguracionUseCases.obtenerParametros();
            const ctaBanco = params.cuentaCaja || '1.1.01.01';
            const ctaAnticipo = esCliente ? params.cuentaAnticipoClientes : params.cuentaAnticipoProveedores;

            const detalles = esCliente ? [
                { cuentaCodigo: ctaBanco, debe: monto, haber: 0 },
                { cuentaCodigo: ctaAnticipo, debe: 0, haber: monto }
            ] : [
                { cuentaCodigo: ctaAnticipo, debe: monto, haber: 0 },
                { cuentaCodigo: ctaBanco, debe: 0, haber: monto }
            ];

            await ContabilidadUseCases.registrarAsiento({
                numero: `ANT-${crypto.randomUUID().slice(0, 8)}`,
                fecha,
                glosa: `Reg. Anticipo ${esCliente ? 'Cliente' : 'Proveedor'} ${terceroNombre}`,
                tipo: esCliente ? 'INGRESO' : 'EGRESO',
                detalles
            });

            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al registrar el anticipo');
        } finally {
            setGuardando(false);
        }
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

                    <div className="relative">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Buscar {esCliente ? 'Cliente' : 'Proveedor'}</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                placeholder="Nombre o RUC..."
                            />
                        </div>

                        {mostrarResultados && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                {cargandoTerceros ? (
                                    <div className="p-4 text-center text-xs text-slate-500">Buscando...</div>
                                ) : terceros.length > 0 ? (
                                    terceros.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => seleccionarTercero(t)}
                                            className="w-full p-3 text-left hover:bg-slate-50 border-b last:border-0 flex items-center gap-3"
                                        >
                                            <div className="bg-slate-100 p-2 rounded-full text-slate-500">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{t.razonSocial}</div>
                                                <div className="text-[10px] text-slate-500">{t.identificacion}</div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-xs text-slate-500">No se encontraron resultados</div>
                                )}
                            </div>
                        )}
                    </div>

                    {terceroId && (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Seleccionado:</div>
                                <div className="text-sm font-bold text-slate-700">{terceroNombre}</div>
                            </div>
                            <button onClick={() => { setTerceroId(''); setTerceroNombre(''); setBusqueda(''); }} className="text-slate-400 hover:text-red-500">
                                <X size={16} />
                            </button>
                        </div>
                    )}

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
                    <Button variant="secondary" onClick={onClose} disabled={guardando}>Cancelar</Button>
                    <Button onClick={handleGuardar} disabled={monto <= 0 || !terceroId || guardando} className="flex items-center gap-2">
                        <Save size={18} /> {guardando ? 'Guardando...' : 'Guardar Anticipo'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

