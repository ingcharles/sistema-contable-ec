'use client';

import { useState } from 'react';
import { Save, AlertCircle, UserPlus, Contact } from 'lucide-react';
import { Tercero, TipoTercero } from '../../domain/types';
import { TipoIdentificacion } from '@/shared/types';
import { useDirectorioMutations } from '../../hooks/useDirectorio';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { useCatalogos } from '@/shared/hooks/useCatalogos';

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

    const { guardarTercero, actualizarTercero, guardando, error: errorSaving } = useDirectorioMutations();

    const [formData, setFormData] = useState<Partial<any>>(terceroEditar || {
        tipoIdentificacion: TipoIdentificacion.RUC,
        identificacion: '',
        razonSocial: '',
        nombreComercial: '',
        tipo: TipoTercero.CLIENTE,
        direccion: '',
        telefono: '',
        celular: '',
        email: '',
        provincia: '',
        ciudad: '',
        esContribuyenteEspecial: false,
        llevaContabilidad: false,
        limiteCredito: 0,
        diasCredito: 0
    });

    const [errorId, setErrorId] = useState('');

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (field === 'identificacion') {
            if (formData.tipoIdentificacion === TipoIdentificacion.RUC && !validarRuc(value)) {
                setErrorId('RUC inválido (13 dígitos)');
            } else {
                setErrorId('');
            }
        }
    };

    const handleSubmit = async () => {
        if (!formData.identificacion || !formData.razonSocial || !formData.email) {
            alert('Por favor complete los campos obligatorios.');
            return;
        }

        try {
            const payload = {
                ...formData,
                tipoTercero: formData.tipo,
                obligadoContabilidad: formData.llevaContabilidad,
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
            console.error(error);
        }
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose} disabled={guardando}>Cancelar</Button>
            <Button onClick={handleSubmit} className="flex items-center gap-2" disabled={guardando}>
                {guardando ? (
                    <>Guardando...</>
                ) : (
                    <>
                        <Save size={18} /> {terceroEditar ? 'Actualizar Contacto' : 'Guardar Contacto'}
                    </>
                )}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={terceroEditar ? 'Editar Contacto' : 'Nuevo Contacto'}
            description="Administre la información fiscal y comercial de su cliente o proveedor."
            icon={terceroEditar ? <Contact size={24} /> : <UserPlus size={24} />}
            footer={footer}
            size="xl"
        >
            <div className="space-y-6">
                {errorSaving && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                        <AlertCircle size={18} />
                        {errorSaving}
                    </div>
                )}

                {/* SECCIÓN 1: IDENTIFICACIÓN PRINCIPAL */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tipo Identificación</label>
                        <select
                            value={formData.tipoIdentificacion}
                            onChange={e => handleChange('tipoIdentificacion', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium"
                        >
                            {tiposIdentificacion?.map(tipo => (
                                <option key={tipo.codigo} value={tipo.codigo}>{tipo.valor}</option>
                            )) || (
                                    <>
                                        <option value="04">RUC</option>
                                        <option value="05">CEDULA</option>
                                        <option value="06">PASAPORTE</option>
                                    </>
                                )}
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Identificación *</label>
                        <input
                            type="text"
                            value={formData.identificacion}
                            onChange={e => handleChange('identificacion', e.target.value)}
                            className={`w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-mono font-bold ${errorId ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                            placeholder="Ej: 1712345678001"
                        />
                        {errorId && <span className="text-[10px] text-red-500 mt-1 block font-medium">{errorId}</span>}
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tipo de Contacto</label>
                        <select
                            value={formData.tipo}
                            onChange={e => handleChange('tipo', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-bold text-sri-blue"
                        >
                            <option value={TipoTercero.CLIENTE}>Cliente</option>
                            <option value={TipoTercero.PROVEEDOR}>Proveedor</option>
                            <option value="AMBOS">Cliente y Proveedor</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Razón Social / Nombres Completos *</label>
                    <input
                        type="text"
                        value={formData.razonSocial}
                        onChange={e => handleChange('razonSocial', e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-bold uppercase"
                        placeholder="Ej: EMPRESA S.A. o JUAN PEREZ"
                    />
                </div>

                {/* SECCIÓN 2: CONTACTO Y UBICACIÓN */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Email Facturación *</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => handleChange('email', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                            placeholder="ejemplo@correo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Celular</label>
                        <input
                            type="text"
                            value={formData.celular}
                            onChange={e => handleChange('celular', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                            placeholder="0998877665"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Provincia</label>
                        <input
                            type="text"
                            value={formData.provincia}
                            onChange={e => handleChange('provincia', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Ciudad</label>
                        <input
                            type="text"
                            value={formData.ciudad}
                            onChange={e => handleChange('ciudad', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Teléfono Fijo</label>
                        <input
                            type="text"
                            value={formData.telefono}
                            onChange={e => handleChange('telefono', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                        />
                    </div>
                </div>

                {/* SECCIÓN 3: COMERCIAL Y SRI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuración SRI</h3>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={formData.llevaContabilidad} onChange={e => handleChange('llevaContabilidad', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-sri-blue focus:ring-sri-blue/20" />
                                <span className="text-xs font-bold text-slate-700 group-hover:text-sri-blue transition-colors">Obligado Contabilidad</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={formData.esContribuyenteEspecial} onChange={e => handleChange('esContribuyenteEspecial', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-sri-blue focus:ring-sri-blue/20" />
                                <span className="text-xs font-bold text-slate-700 group-hover:text-sri-blue transition-colors">Contribuyente Especial</span>
                            </label>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-4">
                        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Información de Crédito</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">Límite Crédito ($)</label>
                                <input
                                    type="number"
                                    value={formData.limiteCredito}
                                    onChange={e => handleChange('limiteCredito', Number(e.target.value))}
                                    className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">Días Crédito</label>
                                <input
                                    type="number"
                                    value={formData.diasCredito}
                                    onChange={e => handleChange('diasCredito', Number(e.target.value))}
                                    className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-bold"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

