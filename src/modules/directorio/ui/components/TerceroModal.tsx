'use client';

import { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Tercero, TipoTercero } from '../../domain/types';
import { TipoIdentificacion } from '@/shared/types';
import { useDirectorioMutations } from '../../hooks/useDirectorio';
import { Button } from '@/shared/ui/Button';

import { useCatalogos } from '@/shared/hooks/useCatalogos';

// Simple RUC validation (placeholder, replace with real service if needed)
const validarRuc = (ruc: string) => {
    return ruc.length === 13 && !isNaN(Number(ruc));
};

interface TerceroModalProps {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
    terceroEditar?: Tercero;
}

export const TerceroModal = ({ onClose, onSave, empresaId, terceroEditar }: TerceroModalProps) => {
    const { getCatalogo } = useCatalogos(['SRI_TIPO_IDENTIFICACION']);
    const tiposIdentificacion = getCatalogo('SRI_TIPO_IDENTIFICACION');

    // Hooks para mutaciones
    const { guardarTercero, actualizarTercero, guardando, error: errorSaving } = useDirectorioMutations();

    const [formData, setFormData] = useState<Partial<Tercero>>(terceroEditar || {
        tipoIdentificacion: TipoIdentificacion.RUC, // Default RUC
        identificacion: '',
        razonSocial: '',
        nombreComercial: '',
        tipo: TipoTercero.CLIENTE,
        direccion: '',
        telefono: '',
        email: '',
        esContribuyenteEspecial: false,
        llevaContabilidad: false,
        parteRelacionada: false
    });

    const [errorId, setErrorId] = useState('');

    const handleChange = (field: keyof Tercero, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (field === 'identificacion') {
            if (formData.tipoIdentificacion === TipoIdentificacion.RUC && !validarRuc(value)) {
                setErrorId('RUC inválido (debe tener 13 dígitos)');
            } else {
                setErrorId('');
            }
        }
    };

    const handleSubmit = async () => {
        if (!formData.identificacion || !formData.razonSocial || !formData.email) {
            alert('Por favor complete los campos obligatorios (Identificación, Razón Social, Email)');
            return;
        }

        try {
            // Mapeo de campos para el API
            const payload = {
                ...formData,
                tipoTercero: formData.tipo, // API espera tipoTercero
                obligadoContabilidad: formData.llevaContabilidad, // API espera obligadoContabilidad
                empresaId
            };

            if (terceroEditar?.id) {
                await actualizarTercero(terceroEditar.id, payload);
            } else {
                await guardarTercero(payload);
            }

            onSave();
            onClose();
        } catch (error) {
            // El error se muestra en la UI a través de errorSaving
            console.error(error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800">
                        {terceroEditar ? 'Editar Contacto' : 'Nuevo Contacto'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Mensaje de Error */}
                    {errorSaving && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 mb-4">
                            <AlertCircle size={16} />
                            {errorSaving}
                        </div>
                    )}

                    {/* Identificación */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Identificación</label>
                            <select
                                value={formData.tipoIdentificacion}
                                onChange={e => handleChange('tipoIdentificacion', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                            >
                                {tiposIdentificacion && tiposIdentificacion.length > 0 ? (
                                    tiposIdentificacion.map(tipo => (
                                        <option key={tipo.codigo} value={tipo.codigo}>
                                            {tipo.valor}
                                        </option>
                                    ))
                                ) : (
                                    <>
                                        <option value="04">RUC</option>
                                        <option value="05">CEDULA</option>
                                        <option value="06">PASAPORTE</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Número <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={formData.identificacion}
                                onChange={e => handleChange('identificacion', e.target.value)}
                                className={`w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none ${errorId ? 'border-red-500' : 'border-slate-200'}`}
                            />
                            {errorId && <span className="text-xs text-red-500 mt-1">{errorId}</span>}
                        </div>
                    </div>

                    {/* Nombres */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social / Nombres <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={formData.razonSocial}
                                onChange={e => handleChange('razonSocial', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm uppercase focus:ring-2 focus:ring-sri-blue/20 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Comercial (Opcional)</label>
                            <input
                                type="text"
                                value={formData.nombreComercial}
                                onChange={e => handleChange('nombreComercial', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm uppercase focus:ring-2 focus:ring-sri-blue/20 outline-none"
                            />
                        </div>
                    </div>

                    {/* Clasificación */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Relación</label>
                            <select
                                value={formData.tipo}
                                onChange={e => handleChange('tipo', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                            >
                                <option value={TipoTercero.CLIENTE}>Cliente</option>
                                <option value={TipoTercero.PROVEEDOR}>Proveedor</option>
                                <option value="AMBOS">Ambos</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                            <input
                                type="text"
                                value={formData.telefono}
                                onChange={e => handleChange('telefono', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                            />
                        </div>
                    </div>

                    {/* Contacto */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email (Facturación Electrónica) <span className="text-red-500">*</span></label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => handleChange('email', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                        <input
                            type="text"
                            value={formData.direccion}
                            onChange={e => handleChange('direccion', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                        />
                    </div>

                    {/* Datos Tributarios */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Información Tributaria (SRI)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors">
                                <input type="checkbox" checked={formData.llevaContabilidad} onChange={e => handleChange('llevaContabilidad', e.target.checked)} className="rounded text-sri-blue focus:ring-sri-blue" />
                                <span className="text-sm text-slate-700">Obligado Contabilidad</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors">
                                <input type="checkbox" checked={formData.esContribuyenteEspecial} onChange={e => handleChange('esContribuyenteEspecial', e.target.checked)} className="rounded text-sri-blue focus:ring-sri-blue" />
                                <span className="text-sm text-slate-700">Contribuyente Especial</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors">
                                <input type="checkbox" checked={formData.parteRelacionada} onChange={e => handleChange('parteRelacionada', e.target.checked)} className="rounded text-sri-blue focus:ring-sri-blue" />
                                <span className="text-sm text-slate-700">Parte Relacionada</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl bg-slate-50">
                    <Button variant="secondary" onClick={onClose} disabled={guardando}>Cancelar</Button>
                    <Button onClick={handleSubmit} className="flex items-center gap-2 shadow-sm" disabled={guardando}>
                        {guardando ? (
                            <>Guardando...</>
                        ) : (
                            <>
                                <Save size={18} /> Guardar
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

