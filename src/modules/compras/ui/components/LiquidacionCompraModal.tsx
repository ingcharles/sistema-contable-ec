'use client';

import { useState } from 'react';
import { X, Save, FileText, UserPlus, Calculator, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { formatMoney } from '@/shared/utils/formatearDinero';

interface LiquidacionCompraModalProps {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const LiquidacionCompraModal = ({ onClose, onSave, empresaId }: LiquidacionCompraModalProps) => {
    const [nombre, setNombre] = useState('');
    const [identificacion, setIdentificacion] = useState('');
    const [direccion, setDireccion] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [subtotal, setSubtotal] = useState(0);
    const [grabaIva, setGrabaIva] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const iva = grabaIva ? subtotal * 0.15 : 0;
    const total = subtotal + iva;

    // Lógica de retención automática para Liquidación de Compra (Ecuador)
    // Generalmente 100% del IVA y un % de Renta (ej. 2% por servicios)
    const retencionIva = iva; // 100% de retención de IVA en liquidaciones
    const retencionRenta = subtotal * 0.02; // Ejemplo 2% servicios
    const totalPagar = total - retencionIva - retencionRenta;

    const handleGuardar = async () => {
        if (!nombre || !identificacion || subtotal <= 0) {
            alert('Por favor complete los campos obligatorios.');
            return;
        }

        setGuardando(true);
        // Simular guardado y emisión electrónica usando empresaId
        console.log('Emitiendo liquidación para empresa:', empresaId);
        await new Promise(resolve => setTimeout(resolve, 2000));

        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-sri-blue p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Emitir Liquidación de Compra</h2>
                            <p className="text-blue-100 text-xs text-opacity-80">Documento Electrónico 03 - Para personas sin RUC.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Datos del Proveedor (Persona Natural) */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <UserPlus size={16} /> Datos del Beneficiario
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">Nombre Completo *</label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20"
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">Cédula / Pasaporte *</label>
                                <input
                                    type="text"
                                    value={identificacion}
                                    onChange={(e) => setIdentificacion(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20"
                                    placeholder="17..."
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Dirección</label>
                            <input
                                type="text"
                                value={direccion}
                                onChange={(e) => setDireccion(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20"
                            />
                        </div>
                    </div>

                    {/* Detalle del Gasto */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator size={16} /> Detalle del Servicio o Bien
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">Descripción del Gasto *</label>
                                <textarea
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 h-20 resize-none"
                                    placeholder="Ej: Servicios de limpieza ocasional..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">Subtotal *</label>
                                    <input
                                        type="number"
                                        value={subtotal}
                                        onChange={(e) => setSubtotal(Number(e.target.value))}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 font-bold"
                                    />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input
                                        type="checkbox"
                                        id="grabaIva"
                                        checked={grabaIva}
                                        onChange={(e) => setGrabaIva(e.target.checked)}
                                        className="w-4 h-4 text-sri-blue border-slate-300 rounded focus:ring-sri-blue"
                                    />
                                    <label htmlFor="grabaIva" className="text-sm font-medium text-slate-700">Graba IVA 15%</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resumen de Retenciones Automáticas */}
                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 space-y-3">
                        <div className="flex items-center gap-2 text-sri-blue mb-2">
                            <AlertCircle size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Retenciones Sugeridas (Automáticas)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Retención IVA (100%):</span>
                            <span className="font-bold text-red-600">-{formatMoney(retencionIva)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Retención Renta (2%):</span>
                            <span className="font-bold text-red-600">-{formatMoney(retencionRenta)}</span>
                        </div>
                        <div className="pt-2 border-t border-blue-200 flex justify-between items-center">
                            <span className="text-slate-800 font-bold">Total a Pagar al Beneficiario:</span>
                            <span className="text-xl font-black text-sri-blue">{formatMoney(totalPagar)}</span>
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
                        {guardando ? 'Emitiendo...' : <><Save size={18} /> Emitir y Autorizar</>}
                    </Button>
                </div>
            </div>
        </div>
    );
};
