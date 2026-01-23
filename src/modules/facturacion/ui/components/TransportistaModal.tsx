'use client';

import { useState } from 'react';
import { Save, Truck, User, Fingerprint, Mail, Phone, Hash, AlertCircle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { useTransportistas } from '../../hooks/useTransportistas';

interface TransportistaModalProps {
    onClose: () => void;
    onSave: (data: any) => void;
}

export const TransportistaModal = ({ onClose, onSave }: TransportistaModalProps) => {
    const { guardarTransportista, guardando: loading } = useTransportistas();
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        identificacion: '',
        razonSocial: '',
        placa: '',
        email: '',
        telefono: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errorValidacion) setErrorValidacion(null);
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!formData.identificacion || !formData.razonSocial || !formData.placa) {
            setErrorValidacion('Por favor complete los campos obligatorios (*)');
            return;
        }

        try {
            const result = await guardarTransportista(formData);
            onSave(result);
            onClose();
        } catch (error: any) {
            setErrorValidacion(error.message || 'Error al guardar transportista');
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleSave}
            isLoading={loading}
            submitLabel="Guardar Transportista"
            submitIcon={<Save size={18} />}
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Nuevo Transportista"
            description="Registre los datos del conductor y vehículo para guías de remisión."
            icon={<Truck size={24} />}
            footer={footer}
            size="md"
        >
            <form id="transportista-form" onSubmit={handleSave} className="space-y-6">
                {errorValidacion && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                        <AlertCircle size={18} />
                        {errorValidacion}
                    </div>
                )}
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Fingerprint size={14} className="text-sri-blue" /> Identificación (RUC/Cédula) *
                        </label>
                        <input
                            name="identificacion"
                            value={formData.identificacion}
                            onChange={handleChange}
                            placeholder="Ej: 1792345678001"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sri-blue/20 outline-none transition-all font-medium"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                            <User size={14} className="text-sri-blue" /> Nombre o Razón Social *
                        </label>
                        <input
                            name="razonSocial"
                            value={formData.razonSocial}
                            onChange={handleChange}
                            placeholder="Nombre completo o Empresa"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sri-blue/20 outline-none transition-all font-medium"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Hash size={14} className="text-sri-blue" /> Placa del Vehículo *
                        </label>
                        <input
                            name="placa"
                            value={formData.placa}
                            onChange={handleChange}
                            placeholder="Ej: PBX-1234"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sri-blue/20 outline-none uppercase transition-all font-mono font-bold"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                <Mail size={14} className="text-sri-blue" /> Email
                            </label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="correo@ejemplo.com"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sri-blue/20 transition-all text-xs"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                <Phone size={14} className="text-sri-blue" /> Teléfono
                            </label>
                            <input
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                placeholder="09..."
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sri-blue/20 transition-all text-xs"
                            />
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
};
