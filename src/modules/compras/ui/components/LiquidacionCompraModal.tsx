'use client';

import { useState, useEffect } from 'react';
import { X, Save, FileText, UserPlus, Calculator, Plus, Trash2, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { TARIFA_IVA, FORMA_PAGO, TIPO_IDENTIFICACION, AMBIENTE, TIPO_EMISION } from '@/modules/facturacion/domain/catalogos';
import { SriStandardizer } from '@/modules/facturacion/application/services/SriStandardizer';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { validarIdentificacion } from '@/shared/utils/validacionesIdentificacion';

interface Props {
    onClose: () => void;
    onSave: () => void;
    empresaId?: string; // Optional if not used
}

export const LiquidacionCompraModal = ({ onClose, onSave }: Props) => {
    const { currentEmpresa } = useEmpresa();

    // Encabezado
    const [estab, setEstab] = useState('001');
    const [ptoEmi, setPtoEmi] = useState('001');
    const [secuencial, setSecuencial] = useState('');
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);

    // Proveedor
    const [nombre, setNombre] = useState('');
    const [identificacion, setIdentificacion] = useState('');
    const [direccion, setDireccion] = useState('');
    const [tipoIdentificacion, setTipoIdentificacion] = useState(TIPO_IDENTIFICACION.CEDULA);

    // Detalles
    const [detalles, setDetalles] = useState<any[]>([{
        codigoPrincipal: 'SERV-01',
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        descuento: 0,
        codigoIVA: TARIFA_IVA.IVA_0,
        baseImponible: 0,
        valorIVA: 0,
        total: 0
    }]);

    // Pagos
    const [pagos, setPagos] = useState<any[]>([{
        formaPago: FORMA_PAGO.SIN_SISTEMA_FINANCIERO,
        total: 0
    }]);

    const [guardando, setGuardando] = useState(false);

    // Estado de validación
    const [errorIdentificacion, setErrorIdentificacion] = useState('');
    const [identificacionValida, setIdentificacionValida] = useState(false);

    // Cálculos
    const calcularTotales = () => {
        let totalSinImpuestos = 0;
        let totalIVA = 0;
        let totalDescuento = 0;

        detalles.forEach(d => {
            totalSinImpuestos += d.baseImponible;
            totalIVA += d.valorIVA;
            totalDescuento += d.descuento;
        });

        const importeTotal = totalSinImpuestos + totalIVA;
        return { totalSinImpuestos, totalIVA, totalDescuento, importeTotal };
    };

    const totales = calcularTotales();

    useEffect(() => {
        if (pagos.length === 1) {
            const nuevosPagos = [...pagos];
            nuevosPagos[0].total = totales.importeTotal;
            setPagos(nuevosPagos);
        }
    }, [totales.importeTotal]);

    // Validar identificación en tiempo real
    useEffect(() => {
        if (!identificacion || tipoIdentificacion === TIPO_IDENTIFICACION.CONSUMIDOR_FINAL) {
            setErrorIdentificacion('');
            setIdentificacionValida(tipoIdentificacion === TIPO_IDENTIFICACION.CONSUMIDOR_FINAL);
            return;
        }

        // Solo validar si tiene longitud mínima
        if (identificacion.length >= 5) {
            const resultado = validarIdentificacion(
                tipoIdentificacion as '04' | '05' | '06' | '07' | '08',
                identificacion
            );

            if (!resultado.isValid) {
                setErrorIdentificacion(resultado.error || 'Identificación inválida');
                setIdentificacionValida(false);
            } else {
                setErrorIdentificacion('');
                setIdentificacionValida(true);
            }
        } else {
            setErrorIdentificacion('');
            setIdentificacionValida(false);
        }
    }, [identificacion, tipoIdentificacion]);

    const handleActualizarDetalle = (index: number, campo: string, valor: any) => {
        const nuevosDetalles = [...detalles];
        const detalle = { ...nuevosDetalles[index], [campo]: valor };

        detalle.baseImponible = (detalle.cantidad * detalle.precioUnitario) - detalle.descuento;
        let porcentaje = 0;
        if (detalle.codigoIVA === TARIFA_IVA.IVA_15) porcentaje = 0.15;
        else if (detalle.codigoIVA === TARIFA_IVA.IVA_12) porcentaje = 0.12;

        detalle.valorIVA = detalle.baseImponible * porcentaje;
        detalle.total = detalle.baseImponible + detalle.valorIVA;

        nuevosDetalles[index] = detalle;
        setDetalles(nuevosDetalles);
    };

    const handleGuardar = async () => {
        if (!nombre || !identificacion || !secuencial || detalles.some(d => !d.descripcion)) {
            alert('Por favor complete todos los campos obligatorios.');
            return;
        }

        setGuardando(true);

        // Generar JSON estandarizado para el SRI
        const dataSri = SriStandardizer.standardizeLiquidacion({
            ambiente: AMBIENTE.PRUEBAS,
            tipoEmision: TIPO_EMISION.NORMAL,
            razonSocial: currentEmpresa?.razonSocial || 'EMPRESA',
            nombreComercial: currentEmpresa?.nombreComercial,
            ruc: currentEmpresa?.ruc || '1790000000001',
            estab,
            ptoEmi,
            secuencial,
            dirMatriz: currentEmpresa?.direccionMatriz || 'DIRECCION',
            fechaEmision,
            tipoIdentificacionProveedor: tipoIdentificacion,
            razonSocialProveedor: nombre,
            identificacionProveedor: identificacion,
            direccionProveedor: direccion,
            totalSinImpuestos: totales.totalSinImpuestos,
            totalDescuento: totales.totalDescuento,
            importeTotal: totales.importeTotal,
            detalles,
            pagos
        });

        console.log('JSON GENERADO PARA SRI:', JSON.stringify(dataSri, null, 2));

        // Simular envío
        await new Promise(resolve => setTimeout(resolve, 2000));
        alert('Liquidación emitida y enviada al SRI (Simulación).\nRevise la consola para ver el JSON estandarizado.');

        setGuardando(false);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
                <div className="bg-sri-blue p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Nueva Liquidación de Compra</h2>
                            <p className="text-blue-100 text-xs text-opacity-80">Documento Electrónico 03 - Conforme a Ficha Técnica 2.3.2</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh]">
                    {/* Encabezado */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Establecimiento</label>
                            <input type="text" value={estab} onChange={e => setEstab(e.target.value)} maxLength={3} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Punto Emisión</label>
                            <input type="text" value={ptoEmi} onChange={e => setPtoEmi(e.target.value)} maxLength={3} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Secuencial</label>
                            <input type="text" value={secuencial} onChange={e => setSecuencial(e.target.value)} maxLength={9} placeholder="000000001" className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Emisión</label>
                            <input type="date" value={fechaEmision} onChange={e => setFechaEmision(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                    </div>

                    {/* Beneficiario */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <UserPlus size={16} /> Datos del Beneficiario
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500">Tipo Identificación</label>
                                <select value={tipoIdentificacion} onChange={e => setTipoIdentificacion(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                                    <option value={TIPO_IDENTIFICACION.CEDULA}>Cédula</option>
                                    <option value={TIPO_IDENTIFICACION.PASAPORTE}>Pasaporte</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Nro. Identificación *</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={identificacion}
                                        onChange={e => setIdentificacion(e.target.value)}
                                        className={`w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm pr-10 ${errorIdentificacion ? 'border-red-300 focus:ring-red-200' :
                                                identificacionValida ? 'border-green-300 focus:ring-green-200' :
                                                    'border-slate-200'
                                            }`}
                                        placeholder="17..."
                                    />
                                    {identificacion.length >= 5 && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {identificacionValida ? (
                                                <CheckCircle2 size={18} className="text-green-500" />
                                            ) : errorIdentificacion ? (
                                                <AlertCircle size={18} className="text-red-500" />
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                                {errorIdentificacion && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        {errorIdentificacion}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">Nombre / Razón Social *</label>
                                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Detalles */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Calculator size={16} /> Detalles
                            </h3>
                            <button onClick={() => setDetalles([...detalles, { codigoPrincipal: 'GEN-01', descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0, codigoIVA: TARIFA_IVA.IVA_0, baseImponible: 0, valorIVA: 0, total: 0 }])} className="text-sri-blue text-xs font-bold flex items-center gap-1 hover:underline">
                                <Plus size={14} /> Añadir Línea
                            </button>
                        </div>
                        <div className="border rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                                    <tr>
                                        <th className="px-4 py-3">Descripción</th>
                                        <th className="px-4 py-3 w-20 text-center">Cant.</th>
                                        <th className="px-4 py-3 w-28 text-right">P. Unit</th>
                                        <th className="px-4 py-3 w-24 text-center">IVA</th>
                                        <th className="px-4 py-3 w-28 text-right">Subtotal</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {detalles.map((d, i) => (
                                        <tr key={i}>
                                            <td className="px-2 py-2">
                                                <input type="text" value={d.descripcion} onChange={e => handleActualizarDetalle(i, 'descripcion', e.target.value)} className="w-full px-2 py-1 bg-transparent border-none focus:ring-0 outline-none" placeholder="Descripción del servicio..." />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input type="number" value={d.cantidad} onChange={e => handleActualizarDetalle(i, 'cantidad', Number(e.target.value))} className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-100 rounded" />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input type="number" value={d.precioUnitario} onChange={e => handleActualizarDetalle(i, 'precioUnitario', Number(e.target.value))} className="w-full px-2 py-1 text-right bg-slate-50 border border-slate-100 rounded" />
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <select value={d.codigoIVA} onChange={e => handleActualizarDetalle(i, 'codigoIVA', e.target.value)} className="bg-transparent text-[10px] font-bold outline-none">
                                                    <option value={TARIFA_IVA.IVA_0}>0%</option>
                                                    <option value={TARIFA_IVA.IVA_15}>15%</option>
                                                </select>
                                            </td>
                                            <td className="px-2 py-2 text-right font-bold text-slate-700">
                                                {formatMoney(d.total)}
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <button onClick={() => setDetalles(detalles.filter((_, idx) => idx !== i))} disabled={detalles.length === 1} className="text-slate-300 hover:text-red-500">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer: Pagos y Totales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <CreditCard size={16} /> Formas de Pago
                            </h3>
                            <div className="space-y-2">
                                {pagos.map((p, i) => (
                                    <div key={i} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <select value={p.formaPago} onChange={e => { const np = [...pagos]; np[i].formaPago = e.target.value; setPagos(np); }} className="flex-1 bg-transparent text-xs font-bold outline-none">
                                            {Object.entries(FORMA_PAGO).map(([k, v]) => <option key={v} value={v}>{k.replace(/_/g, ' ')}</option>)}
                                        </select>
                                        <span className="text-xs font-black text-sri-blue">{formatMoney(p.total)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-3">
                            <div className="flex justify-between text-xs opacity-60 font-bold uppercase">
                                <span>Subtotal Sin Impuestos:</span>
                                <span>{formatMoney(totales.totalSinImpuestos)}</span>
                            </div>
                            <div className="flex justify-between text-xs opacity-60 font-bold uppercase">
                                <span>IVA:</span>
                                <span>{formatMoney(totales.totalIVA)}</span>
                            </div>
                            <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                                <span className="text-sm font-black uppercase tracking-widest">Importe Total:</span>
                                <span className="text-2xl font-black text-emerald-400">{formatMoney(totales.importeTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={guardando}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGuardar}
                        disabled={guardando}
                        className="flex items-center gap-2 min-w-[180px] justify-center bg-sri-blue hover:bg-sri-light shadow-lg shadow-blue-900/20"
                    >
                        {guardando ? 'Generando JSON...' : <><Save size={18} /> Emitir SRI (JSON)</>}
                    </Button>
                </div>
            </div>
        </div>
    );
};
