'use client';

import { useState } from 'react';
import { X, Save, Truck, User, Fingerprint, Mail, Phone, Hash } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

interface TransportistaModalProps {
    onClose: () => void;
    onSave: (data: any) => void;
}

export const TransportistaModal = ({ onClose, onSave }: TransportistaModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        identificacion: '',
        razonSocial: '',
        placa: '',
        email: '',
        telefono: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.identificacion || !formData.razonSocial || !formData.placa) {
            alert('Por favor complete los campos obligatorios (*)');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/transportistas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (result.success) {
                onSave(result.data);
                onClose();
            } else {
                alert(result.error || 'Error al guardar transportista');
            }
        } catch (error) {
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Truck size={20} className="text-blue-400" />
                        </div>
                        <h2 className="text-lg font-bold">Nuevo Transportista</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                <Fingerprint size={14} /> Identificación (RUC/Cédula) *
                            </label>
                            <input
                                name="identificacion"
                                value={formData.identificacion}
                                onChange={handleChange}
                                placeholder="Ej: 1792345678001"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                <User size={14} /> Razón Social *
                            </label>
                            <input
                                name="razonSocial"
                                value={formData.razonSocial}
                                onChange={handleChange}
                                placeholder="Nombre completo o Empresa"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                <Hash size={14} /> Placa Vehículo *
                            </label>
                            <input
                                name="placa"
                                value={formData.placa}
                                onChange={handleChange}
                                placeholder="Ej: PBX-1234"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none uppercase"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                    <Mail size={14} /> Email
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                    <Phone size={14} /> Teléfono
                                </label>
                                <input
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1 bg-slate-800 hover:bg-slate-700">
                            {loading ? 'Guardando...' : <span className="flex items-center gap-2"><Save size={18} /> Guardar</span>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
