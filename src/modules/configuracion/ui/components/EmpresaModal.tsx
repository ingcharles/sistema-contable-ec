import React, { useState } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { useToast } from '@/shared/context/ToastContext';

interface EmpresaModalProps {
    onClose: () => void;
    onSave: (nuevaEmpresa: any) => void;
}

export const EmpresaModal: React.FC<EmpresaModalProps> = ({ onClose, onSave }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        ruc: '',
        razonSocial: '',
        nombreComercial: '',
        direccionMatriz: '',
        email: '',
        logoUrl: '',
        obligadoContabilidad: false,
        contribuyenteEspecial: false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value === 'SI'
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.ruc || !formData.razonSocial) {
            showToast('RUC y Razón Social son obligatorios', 'warning');
            return;
        }

        setLoading(true);
        try {
            const result = await ConfiguracionUseCases.crearEmpresa(formData);
            showToast('Empresa creada exitosamente', 'success');
            onSave(result.empresa);
            onClose();
        } catch (error: any) {
            showToast(error.message || 'Error al crear empresa', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-sri-blue/10 text-sri-blue flex items-center justify-center">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Nueva Empresa</h3>
                            <p className="text-xs text-slate-500">Registre una nueva entidad en el sistema</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">RUC *</label>
                            <input
                                type="text"
                                name="ruc"
                                value={formData.ruc}
                                onChange={handleChange}
                                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sri-blue/20 focus:border-sri-blue transition-all outline-none"
                                placeholder="Ej: 1790011223001"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Razón Social *</label>
                            <input
                                type="text"
                                name="razonSocial"
                                value={formData.razonSocial}
                                onChange={handleChange}
                                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sri-blue/20 focus:border-sri-blue transition-all outline-none"
                                placeholder="Nombre legal de la empresa"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Nombre Comercial</label>
                            <input
                                type="text"
                                name="nombreComercial"
                                value={formData.nombreComercial}
                                onChange={handleChange}
                                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sri-blue/20 focus:border-sri-blue transition-all outline-none"
                                placeholder="Nombre de fantasía"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Dirección Matriz</label>
                            <input
                                type="text"
                                name="direccionMatriz"
                                value={formData.direccionMatriz}
                                onChange={handleChange}
                                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sri-blue/20 focus:border-sri-blue transition-all outline-none"
                                placeholder="Calle principal, número y transversal"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Correo Electrónico</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sri-blue/20 focus:border-sri-blue transition-all outline-none"
                                placeholder="correo@empresa.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">URL del Logo</label>
                            <input
                                type="text"
                                name="logoUrl"
                                value={formData.logoUrl}
                                onChange={handleChange}
                                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sri-blue/20 focus:border-sri-blue transition-all outline-none"
                                placeholder="https://ejemplo.com/logo.png"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Obligado Contabilidad</label>
                                <select
                                    name="obligadoContabilidad"
                                    onChange={handleSelectChange}
                                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sri-blue/20 focus:border-sri-blue transition-all outline-none"
                                >
                                    <option value="NO">NO</option>
                                    <option value="SI">SÍ</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Contribuyente Especial</label>
                                <select
                                    name="contribuyenteEspecial"
                                    onChange={handleSelectChange}
                                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sri-blue/20 focus:border-sri-blue transition-all outline-none"
                                >
                                    <option value="NO">NO</option>
                                    <option value="SI">SÍ</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex items-center gap-2 px-8" disabled={loading}>
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            Guardar Empresa
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
