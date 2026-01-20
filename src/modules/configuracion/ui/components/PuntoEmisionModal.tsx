'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { PuntoEmision, Sucursal } from '../../domain/types';
import { ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';
import { TipoComprobante } from '@/shared/types';

interface PuntoEmisionModalProps {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
    sucursales: Sucursal[];
    puntoEditar?: PuntoEmision;
}

export const PuntoEmisionModal = ({ onClose, onSave, sucursales, puntoEditar }: Omit<PuntoEmisionModalProps, 'empresaId'>) => {
    const [formData, setFormData] = useState<Partial<PuntoEmision>>(puntoEditar || {
        sucursalId: sucursales[0]?.id || '',
        codigo: '',
        nombre: '',
        activo: true,
        secuenciales: [
            { tipoComprobante: TipoComprobante.FACTURA, secuencialActual: 1 },
            { tipoComprobante: TipoComprobante.RETENCION, secuencialActual: 1 }
        ]
    });

    const [guardando, setGuardando] = useState(false);

    const handleSubmit = async () => {
        if (!formData.codigo || !formData.nombre || !formData.sucursalId) {
            alert('Complete los campos obligatorios');
            return;
        }

        setGuardando(true);
        try {
            await ConfiguracionUseCases.guardarPuntoEmision({
                ...formData,
                id: puntoEditar?.id
            });
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al guardar punto de emisión');
        } finally {
            setGuardando(false);
        }
    };

    const updateSecuencial = (index: number, val: number) => {
        const newSecs = [...(formData.secuenciales || [])];
        newSecs[index].secuencialActual = val;
        setFormData({ ...formData, secuenciales: newSecs });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800">
                        {puntoEditar ? 'Editar Punto de Emisión' : 'Nuevo Punto de Emisión'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sucursal</label>
                        <select
                            value={formData.sucursalId}
                            onChange={e => setFormData({ ...formData, sucursalId: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                        >
                            {sucursales.map(s => (
                                <option key={s.id} value={s.id}>{s.codigo} - {s.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Código (Ej: 001)</label>
                            <input
                                type="text"
                                value={formData.codigo}
                                onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono"
                                maxLength={3}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Caja</label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Secuenciales Iniciales</h4>
                        <div className="space-y-3">
                            {formData.secuenciales?.map((sec, idx) => (
                                <div key={sec.tipoComprobante} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 w-1/2">
                                        {sec.tipoComprobante === TipoComprobante.FACTURA ? 'Factura' :
                                            sec.tipoComprobante === TipoComprobante.RETENCION ? 'Retención' :
                                                sec.tipoComprobante === TipoComprobante.NOTA_CREDITO ? 'Nota Crédito' :
                                                    sec.tipoComprobante === TipoComprobante.GUIA_REMISION ? 'Guía Remisión' : sec.tipoComprobante}
                                    </span>
                                    <input
                                        type="number"
                                        value={sec.secuencialActual}
                                        onChange={e => updateSecuencial(idx, Number(e.target.value))}
                                        className="w-24 border border-slate-200 rounded p-1 text-right font-mono"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                        <input
                            type="checkbox"
                            checked={formData.activo}
                            onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                            className="rounded text-sri-blue focus:ring-sri-blue"
                        />
                        <span className="text-sm text-slate-700">Punto de Emisión Activo</span>
                    </label>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl bg-slate-50">
                    <Button variant="secondary" onClick={onClose} disabled={guardando}>Cancelar</Button>
                    <Button onClick={handleSubmit} className="flex items-center gap-2" disabled={guardando}>
                        <Save size={18} /> {guardando ? 'Guardando...' : 'Guardar'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
