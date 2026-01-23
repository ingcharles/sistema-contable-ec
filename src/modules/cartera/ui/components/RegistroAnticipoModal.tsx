'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Search, User, Wallet, Calendar, Hash, DollarSign, Info } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { TipoCartera } from '../../domain/types';
import { TipoTercero, Tercero } from '@/modules/directorio/domain/types';
import { CarteraUseCases, BancosUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { useTerceros } from '@/modules/directorio/hooks/useDirectorio';
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
    const [cuentaBancoId, setCuentaBancoId] = useState('');
    const [cuentasBancarias, setCuentasBancarias] = useState<any[]>([]);

    // Search State
    const [busqueda, setBusqueda] = useState('');
    const [mostrarResultados, setMostrarResultados] = useState(false);
    const [guardando, setGuardando] = useState(false);

    // Hooks
    const { terceros, cargarTerceros, loading: cargandoTerceros } = useTerceros();

    useEffect(() => {
        const cargarCuentas = async () => {
            try {
                const data = await BancosUseCases.listarCuentas();
                setCuentasBancarias(data);
                if (data.length > 0) setCuentaBancoId(data[0].id);
            } catch (error) {
                console.error('Error cargando cuentas bancarias:', error);
            }
        };
        cargarCuentas();
    }, []);

    useEffect(() => {
        if (busqueda.length > 2) {
            // Si ya seleccionamos uno y el nombre coincide, no buscar
            if (terceroId && busqueda === terceroNombre) return;

            const buscar = async () => {
                const tipoBusqueda = esCliente ? TipoTercero.CLIENTE : TipoTercero.PROVEEDOR;
                await cargarTerceros(tipoBusqueda, busqueda);
                setMostrarResultados(true);
            };
            const timer = setTimeout(buscar, 300);
            return () => clearTimeout(timer);
        } else {
            setMostrarResultados(false);
        }
    }, [busqueda, esCliente, terceroId, terceroNombre, cargarTerceros]);

    const seleccionarTercero = (t: Tercero) => {
        setTerceroId(t.id!); // Use ID, not identification for backend relation
        setTerceroNombre(t.razonSocial);
        setBusqueda(t.razonSocial);
        setMostrarResultados(false);
    };

    const handleGuardar = async () => {
        if (!terceroId || monto <= 0 || !cuentaBancoId) return;

        setGuardando(true);
        try {
            await CarteraUseCases.registrarAnticipo({
                tipo,
                fecha,
                terceroId,
                referencia,
                monto,
                cuentaBancoId
            });

            onSave();
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Error al registrar el anticipo');
        } finally {
            setGuardando(false);
        }
    };

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={onClose} disabled={guardando}>
                Cancelar
            </Button>
            <Button
                onClick={handleGuardar}
                disabled={monto <= 0 || !terceroId || guardando}
                className="flex items-center gap-2 min-w-[180px] justify-center"
            >
                {guardando ? (
                    'Procesando...'
                ) : (
                    <>
                        <Save size={18} /> Guardar Anticipo
                    </>
                )}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Registrar Anticipo"
            description={`Registre un anticipo ${esCliente ? 'recibido de cliente' : 'entregado a proveedor'} (sin factura).`}
            icon={<Wallet size={24} />}
            footer={footer}
            size="md"
        >
            <div className="space-y-6">
                <div className="bg-sri-blue/5 p-4 rounded-2xl border border-sri-blue/10 flex items-start gap-4">
                    <div className="p-2 bg-sri-blue/10 rounded-xl text-sri-blue">
                        <Info size={20} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[11px] font-black text-sri-blue uppercase tracking-tighter">Información Importante</p>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                            Este proceso registrará un movimiento de banco y un saldo a favor que podrá cruzar posteriormente con facturas de venta o compra.
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                        Buscar {esCliente ? 'Cliente' : 'Proveedor'} *
                    </label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sri-blue" size={18} />
                        <input
                            type="text"
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-sri-blue/10 focus:bg-white transition-all text-sm font-medium"
                            placeholder={`Identificación o Nombre del ${esCliente ? 'Cliente' : 'Proveedor'}...`}
                        />
                    </div>

                    {mostrarResultados && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                            {cargandoTerceros ? (
                                <div className="p-8 text-center">
                                    <div className="inline-block w-6 h-6 border-2 border-sri-blue/30 border-t-sri-blue rounded-full animate-spin mb-2"></div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Buscando...</div>
                                </div>
                            ) : terceros.length > 0 ? (
                                <div className="p-2">
                                    {terceros.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => seleccionarTercero(t)}
                                            className="w-full p-3 text-left hover:bg-sri-blue/5 rounded-xl transition-colors group flex items-center gap-4 border-b border-slate-50 last:border-0"
                                        >
                                            <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500 group-hover:bg-sri-blue group-hover:text-white transition-all">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{t.razonSocial}</div>
                                                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 capitalize">
                                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] group-hover:bg-sri-blue/10 group-hover:text-sri-blue">{t.tipoIdentificacion}</span>
                                                    {t.identificacion}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="text-slate-300 mb-2"><Search size={32} className="mx-auto" /></div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No se encontraron resultados</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {terceroId && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between shadow-inner animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="bg-sri-blue p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/30">
                                <User size={20} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionado</div>
                                <div className="text-sm font-black text-slate-800 uppercase">{terceroNombre}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => { setTerceroId(''); setTerceroNombre(''); setBusqueda(''); }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                <div className="space-y-1.5 mb-6">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Wallet size={14} className="text-sri-blue" /> Cuenta Bancaria (Origen/Destino) *
                    </label>
                    <select
                        value={cuentaBancoId}
                        onChange={e => setCuentaBancoId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-sri-blue/10 focus:bg-white transition-all text-sm font-medium"
                    >
                        {cuentasBancarias.map(cta => (
                            <option key={cta.id} value={cta.id}>
                                {cta.banco} - {cta.nombre} (Saldo: ${Number(cta.saldo_actual).toFixed(2)})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign size={14} className="text-sri-blue" /> Monto del Anticipo ($) *
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">$</span>
                            <input
                                type="number"
                                value={monto}
                                onChange={e => setMonto(parseFloat(e.target.value))}
                                className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-black text-right text-sri-blue text-lg"
                                step="0.01"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={14} className="text-sri-blue" /> Fecha de Registro
                        </label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={e => setFecha(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-sri-blue/10 focus:bg-white transition-all font-medium text-xs"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Hash size={14} className="text-sri-blue" /> Referencia (Nro. Documento Bancario)
                    </label>
                    <input
                        type="text"
                        value={referencia}
                        onChange={e => setReferencia(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-sri-blue/10 focus:bg-white transition-all text-sm font-medium"
                        placeholder="Ej: Transferencia #987654"
                    />
                </div>
            </div>
        </Modal>
    );
};

