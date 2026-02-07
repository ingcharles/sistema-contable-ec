'use client';

import { Building2, Save, Palette, RotateCcw, Upload, Image as ImageIcon } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/context/ToastContext';
import { useState } from 'react';

export default function EmpresaConfigPage() {
    const { currentEmpresa, refreshEmpresas } = useEmpresa();
    const { showToast } = useToast();

    // Estado para colores de marca
    const [colorPrimario, setColorPrimario] = useState(currentEmpresa?.colorPrimario || '#0f172a');
    const [colorSecundario, setColorSecundario] = useState(currentEmpresa?.colorSecundario || '#475569');
    const [colorAcento, setColorAcento] = useState(currentEmpresa?.colorAcento || '#334155');
    const [logoPreview, setLogoPreview] = useState<string | null>(currentEmpresa?.logo ? `data:image/png;base64,${currentEmpresa.logo}` : null);
    const [logoBase64, setLogoBase64] = useState<string | null>(currentEmpresa?.logo || null);

    const handleGuardarEmpresa = async () => {
        if (!currentEmpresa) return;

        // Obtener los valores actuales de los inputs
        const form = document.querySelector('form') || document;
        const nombreComercial = (form.querySelector('input[name="nombreComercial"]') as HTMLInputElement)?.value || currentEmpresa.nombreComercial;
        const direccionMatriz = (form.querySelector('input[name="direccionMatriz"]') as HTMLInputElement)?.value || currentEmpresa.direccionMatriz;
        const email = (form.querySelector('input[name="email"]') as HTMLInputElement)?.value || currentEmpresa.email;

        const obligadoContSelect = form.querySelector('select[name="obligadoContabilidad"]') as HTMLSelectElement;
        const obligadoContabilidad = obligadoContSelect?.value === 'SI';

        const contribuyenteEspecialSelect = form.querySelector('select[name="contribuyenteEspecial"]') as HTMLSelectElement;
        const contribuyenteEspecial = contribuyenteEspecialSelect?.value === 'SI';

        try {
            await ConfiguracionUseCases.actualizarEmpresa({
                id: currentEmpresa.id,
                nombreComercial,
                direccionMatriz,
                email,
                logo: logoBase64,
                obligadoContabilidad,
                contribuyenteEspecial,
                colorPrimario: colorPrimario === '#0f172a' ? null : colorPrimario,
                colorSecundario: colorSecundario === '#475569' ? null : colorSecundario,
                colorAcento: colorAcento === '#334155' ? null : colorAcento
            });
            await refreshEmpresas();
            showToast('Datos de empresa actualizados exitosamente', 'success');
        } catch (error: any) {
            console.error('Error al guardar datos de empresa:', error);
            showToast(error.message || 'Error al guardar datos de empresa', 'error');
        }
    };

    const resetearColores = () => {
        setColorPrimario('#0f172a');
        setColorSecundario('#475569');
        setColorAcento('#334155');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast('La imagen es demasiado grande (máx 2MB)', 'warning');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setLogoPreview(base64String);
                setLogoBase64(base64String);
            };
            reader.readAsDataURL(file);
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
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email de la Empresa</label>
                            <input type="email" name="email" defaultValue={currentEmpresa.email || ''} className="w-full border rounded-lg p-2.5 text-sm" />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Logo de la Empresa</label>
                            <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center gap-4 transition-all hover:border-sri-blue/50">
                                <div className="h-32 w-64 bg-white rounded-xl shadow-inner border border-slate-100 flex items-center justify-center overflow-hidden p-2">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                                    ) : (
                                        <div className="text-slate-300 flex flex-col items-center gap-2">
                                            <ImageIcon size={40} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Sin Logo</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-sri-blue text-white rounded-xl cursor-pointer transition-all hover:bg-sri-blue/90 text-sm font-bold shadow-lg shadow-sri-blue/20">
                                        <Upload size={18} />
                                        <span>Subir Nuevo Logo</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                    {logoPreview && (
                                        <button
                                            type="button"
                                            onClick={() => { setLogoPreview(null); setLogoBase64(null); }}
                                            className="px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors text-xs font-bold uppercase"
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium tracking-tight">Formatos recomendados: PNG o JPG con fondo transparente. Máximo 2MB.</p>
                            </div>
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

                    {/* Sección de Colores de Marca */}
                    <div className="pt-6 border-t">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Palette className="text-sri-blue" size={20} />
                                    Colores de Marca
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Personalice los colores de sus documentos RIDE</p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetearColores}
                                className="flex items-center gap-2 text-xs"
                            >
                                <RotateCcw size={14} />
                                Resetear
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Color Primario</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={colorPrimario}
                                        onChange={(e) => setColorPrimario(e.target.value)}
                                        className="h-10 w-16 rounded border border-slate-300 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={colorPrimario}
                                        onChange={(e) => setColorPrimario(e.target.value)}
                                        className="flex-1 border rounded-lg p-2 text-sm font-mono uppercase"
                                        placeholder="#0f172a"
                                        maxLength={7}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Encabezados y bordes RIDE</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Color Secundario</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={colorSecundario}
                                        onChange={(e) => setColorSecundario(e.target.value)}
                                        className="h-10 w-16 rounded border border-slate-300 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={colorSecundario}
                                        onChange={(e) => setColorSecundario(e.target.value)}
                                        className="flex-1 border rounded-lg p-2 text-sm font-mono uppercase"
                                        placeholder="#475569"
                                        maxLength={7}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Detalles secundarios</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Color de Acento</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={colorAcento}
                                        onChange={(e) => setColorAcento(e.target.value)}
                                        className="h-10 w-16 rounded border border-slate-300 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={colorAcento}
                                        onChange={(e) => setColorAcento(e.target.value)}
                                        className="flex-1 border rounded-lg p-2 text-sm font-mono uppercase"
                                        placeholder="#334155"
                                        maxLength={7}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Highlights y estados</p>
                            </div>
                        </div>

                        {/* Vista Previa */}
                        <div className="mt-6 p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-3">Vista Previa RIDE</p>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="border-2 p-4 rounded-xl" style={{ borderColor: colorPrimario }}>
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold">R.U.C.: {currentEmpresa.ruc}</p>
                                        <p
                                            className="text-base font-black uppercase text-white px-3 py-1.5 inline-block rounded-md"
                                            style={{ backgroundColor: colorPrimario }}
                                        >
                                            FACTURA
                                        </p>
                                        <p className="text-xs text-slate-600">No. 001-001-000000001</p>
                                    </div>
                                </div>
                            </div>
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
