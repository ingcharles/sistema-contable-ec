'use client';

import { Building2, Save } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/context/ToastContext';

export default function EmpresaConfigPage() {
    const { currentEmpresa } = useEmpresa();
    const { showToast } = useToast();

    const handleGuardarEmpresa = async () => {
        if (!currentEmpresa) return;

        // Obtener los valores actuales de los inputs
        const form = document.querySelector('form') || document;
        const nombreComercial = (form.querySelector('input[name="nombreComercial"]') as HTMLInputElement)?.value || currentEmpresa.nombreComercial;
        const direccionMatriz = (form.querySelector('input[name="direccionMatriz"]') as HTMLInputElement)?.value || currentEmpresa.direccionMatriz;
        const logoUrl = (form.querySelector('input[name="logoUrl"]') as HTMLInputElement)?.value || currentEmpresa.logoUrl;

        const obligadoContSelect = form.querySelector('select[name="obligadoContabilidad"]') as HTMLSelectElement;
        const obligadoContabilidad = obligadoContSelect?.value === 'SI';

        const contribuyenteEspecialSelect = form.querySelector('select[name="contribuyenteEspecial"]') as HTMLSelectElement;
        const contribuyenteEspecial = contribuyenteEspecialSelect?.value === 'SI';

        try {
            await ConfiguracionUseCases.actualizarEmpresa({
                id: currentEmpresa.id,
                nombreComercial,
                direccionMatriz,
                logoUrl: logoUrl || '',
                obligadoContabilidad,
                contribuyenteEspecial
            });
            showToast('Datos de empresa actualizados exitosamente', 'success');
        } catch (error: any) {
            console.error('Error al guardar datos de empresa:', error);
            showToast(error.message || 'Error al guardar datos de empresa', 'error');
        }
    };

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Building2 className="text-sri-blue" /> Datos de Empresa
                </h1>
                <p className="text-slate-500 text-sm mt-1">Gestione la información legal y comercial de su entidad.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleGuardarEmpresa(); }}>
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Información de la Entidad</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Razón Social</label>
                            <input type="text" defaultValue={currentEmpresa.razonSocial} className="w-full border rounded-lg p-2.5 text-sm bg-slate-50" readOnly />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">RUC</label>
                            <input type="text" defaultValue={currentEmpresa.ruc} className="w-full border rounded-lg p-2.5 text-sm bg-slate-50" readOnly />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Comercial</label>
                            <input type="text" name="nombreComercial" defaultValue={currentEmpresa.nombreComercial} className="w-full border rounded-lg p-2.5 text-sm" />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección Matriz</label>
                            <input type="text" name="direccionMatriz" defaultValue={currentEmpresa.direccionMatriz} className="w-full border rounded-lg p-2.5 text-sm" />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL del Logo</label>
                            <input type="text" name="logoUrl" defaultValue={currentEmpresa.logoUrl || ''} className="w-full border rounded-lg p-2.5 text-sm" placeholder="https://ejemplo.com/logo.png" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Obligado a Contabilidad</label>
                            <select name="obligadoContabilidad" className="w-full border rounded-lg p-2.5 text-sm" defaultValue={currentEmpresa.obligadoContabilidad ? 'SI' : 'NO'}>
                                <option value="SI">SÍ</option>
                                <option value="NO">NO</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contribuyente Especial</label>
                            <select name="contribuyenteEspecial" className="w-full border rounded-lg p-2.5 text-sm" defaultValue={currentEmpresa.contribuyenteEspecial ? 'SI' : 'NO'}>
                                <option value="SI">SÍ</option>
                                <option value="NO">NO</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" className="flex items-center gap-2">
                            <Save size={18} /> Guardar Cambios
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
