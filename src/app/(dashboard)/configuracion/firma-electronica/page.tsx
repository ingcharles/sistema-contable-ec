'use client';

import { useState, useEffect } from 'react';
import { Shield, Key, Upload, CheckCircle2, Eye, EyeOff, AlertTriangle, Bot, Save, Loader2 } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { useAuth } from '@/shared/context/AuthContext';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/context/ToastContext';
import { SriUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import type { CertificadoMetadata } from '@/shared/types/certificado.types';

export default function FirmaElectronicaConfigPage() {
    const { currentEmpresa } = useEmpresa();
    const { user } = useAuth();
    const { showToast } = useToast();

    // Firma States
    const [firmaFile, setFirmaFile] = useState<File | null>(null);
    const [firmaPassword, setFirmaPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [ambienteSRI, setAmbienteSRI] = useState<'1' | '2'>('1');

    // SRI Portal Credentials States
    const [usuarioSri, setUsuarioSri] = useState('');
    const [claveSri, setClaveSri] = useState('');
    const [showClaveSri, setShowClaveSri] = useState(false);
    const [guardandoCredenciales, setGuardandoCredenciales] = useState(false);
    const [hasCredenciales, setHasCredenciales] = useState(false);
    const [usuarioSriActual, setUsuarioSriActual] = useState<string | null>(null);

    const [certificadoInfo, setCertificadoInfo] = useState<CertificadoMetadata>({
        fechaEmision: null,
        fechaExpiracion: null,
        sujeto: null,
        emisor: null,
        numeroSerie: null,
        diasRestantes: null,
        estado: 'SIN_CERTIFICADO'
    });

    const loadSRIConfig = async () => {
        if (!currentEmpresa || !user) return;
        try {
            const data = await SriUseCases.obtenerMetadata();
            setCertificadoInfo({
                ...data,
                ambiente: data.ambiente || 'PRUEBAS'
            });
        } catch (error) {
            console.error('Error al cargar config SRI:', error);
            setCertificadoInfo(prev => ({ ...prev, estado: 'SIN_CERTIFICADO' }));
        }
    };

    const loadCredencialesSRI = async () => {
        if (!currentEmpresa || !user) return;
        try {
            const data = await SriUseCases.obtenerConfiguracion();
            setHasCredenciales(data.has_credenciales_sri || false);
            setUsuarioSriActual(data.usuario_sri_display || null);
            if (data.usuario_sri_display) {
                setUsuarioSri(data.usuario_sri_display);
            }
        } catch {
            // No hay config activa, es normal
        }
    };

    useEffect(() => {
        loadSRIConfig();
        loadCredencialesSRI();
    }, [currentEmpresa?.id, user?.id, ambienteSRI]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleGuardarFirma = async () => {
        if (!firmaFile && !firmaPassword) {
            showToast('Por favor seleccione un archivo .p12 y su contraseña', 'warning');
            return;
        }
        if (!firmaPassword) {
            showToast('Por favor ingrese la contraseña del certificado', 'warning');
            return;
        }
        if (!currentEmpresa || !user) return;

        try {
            // Extraer solo la parte base64 del data URL
            const base64 = firmaFile ? await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(firmaFile);
                reader.onload = () => {
                    const result = reader.result as string;
                    const base64Content = result.split(',')[1];
                    resolve(base64Content);
                };
                reader.onerror = error => reject(error);
            }) : '';

            const ambiente = ambienteSRI === '1' ? 'PRUEBAS' : 'PRODUCCION';

            const data = await SriUseCases.guardarConfiguracion({
                ambiente,
                p12Base64: base64,
                claveCertificado: firmaPassword
            });

            let mensaje = `Configuración de firma guardada exitosamente.\nAmbiente: ${ambiente}`;
            if (data.advertencia) mensaje += `\n⚠️ ${data.advertencia}`;
            showToast(mensaje, data.advertencia ? 'warning' : 'success');

            await loadSRIConfig();
            await loadCredencialesSRI();
            setFirmaFile(null);
            setFirmaPassword('');
        } catch (error: any) {
            console.error('Error al guardar firma:', error);
            showToast(error.message || 'Error al guardar la configuración de firma', 'error');
        }
    };

    const handleGuardarCredenciales = async () => {
        if (!usuarioSri.trim() || !claveSri.trim()) {
            showToast('Ingrese usuario y clave del portal SRI', 'warning');
            return;
        }

        setGuardandoCredenciales(true);
        try {
            await SriUseCases.guardarCredencialesSRI({
                usuarioSri: usuarioSri.trim(),
                claveSri: claveSri.trim()
            });
            showToast('Credenciales del portal SRI guardadas correctamente', 'success');
            setHasCredenciales(true);
            setUsuarioSriActual(usuarioSri.trim());
            setClaveSri('');
        } catch (error: any) {
            showToast(error.message || 'Error al guardar credenciales', 'error');
        } finally {
            setGuardandoCredenciales(false);
        }
    };

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="text-sri-blue" /> Firma Electrónica
                </h1>
                <p className="text-slate-500 text-sm mt-1">Configure su certificado digital y credenciales del portal SRI.</p>
            </div>

            {/* SECCIÓN 1: Certificado Digital */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 min-h-[500px]">
                <div className="space-y-6">
                    <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Key className="text-sri-blue" size={20} /> Configuración de Firma
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Activar en Ambiente SRI</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-slate-50 flex-1 bg-white">
                                        <input type="radio" name="ambiente" value="1" checked={ambienteSRI === '1'} onChange={() => setAmbienteSRI('1')} className="text-sri-blue" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">Pruebas</span>
                                            <span className="text-[10px] text-slate-400">Certificación/Testing</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-slate-50 flex-1 bg-white">
                                        <input type="radio" name="ambiente" value="2" checked={ambienteSRI === '2'} onChange={() => setAmbienteSRI('2')} className="text-sri-blue" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">Producción</span>
                                            <span className="text-[10px] text-slate-400">Válidez legal</span>
                                        </div>
                                    </label>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 italic">* El certificado subido se marcará como ACTIVO para el ambiente seleccionado, desactivando los anteriores.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Archivo de Firma (.p12)</label>
                                <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-sri-blue transition-colors bg-slate-50">
                                    <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                                    {firmaFile ? (
                                        <div className="text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                                            <CheckCircle2 size={16} /> {firmaFile.name}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-slate-500">Haz clic para seleccionar archivo</span>
                                    )}
                                    <input type="file" accept=".p12,.pfx" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setFirmaFile(e.target.files[0])} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña del Certificado</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} value={firmaPassword} onChange={e => setFirmaPassword(e.target.value)} className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg text-sm" placeholder="••••••••" />
                                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <Button onClick={handleGuardarFirma} className="w-full">Guardar Configuración</Button>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Shield size={18} className={certificadoInfo.estado === 'VIGENTE' ? 'text-green-600' : certificadoInfo.estado === 'PROXIMO_A_VENCER' ? 'text-yellow-600' : certificadoInfo.estado === 'EXPIRADO' ? 'text-red-600' : 'text-slate-400'} />
                                Información del Certificado
                            </h4>
                            {certificadoInfo.estado !== 'SIN_CERTIFICADO' ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                        <span className="text-sm text-slate-500">Ambiente Activo</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${certificadoInfo.ambiente === 'PRODUCCION' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                                            {certificadoInfo.ambiente}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                        <span className="text-sm text-slate-500">Estado</span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${certificadoInfo.estado === 'VIGENTE' ? 'bg-green-100 text-green-700' :
                                            certificadoInfo.estado === 'PROXIMO_A_VENCER' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {certificadoInfo.estado}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                        <span className="text-sm text-slate-500">Expira el</span>
                                        <span className="text-sm font-mono font-medium">{certificadoInfo.fechaExpiracion?.split('T')[0]}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                        <span className="text-sm text-slate-500">Días restantes</span>
                                        <span className={`text-sm font-bold ${certificadoInfo.diasRestantes && certificadoInfo.diasRestantes > 30 ? 'text-green-600' : 'text-red-600'}`}>{certificadoInfo.diasRestantes}</span>
                                    </div>
                                    <div className="py-2">
                                        <span className="text-sm text-slate-500 block mb-1">Sujeto</span>
                                        <span className="text-[10px] font-mono text-slate-600 break-all">{certificadoInfo.sujeto}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 py-8">
                                    <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No hay certificado configurado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: Credenciales Portal SRI en Línea */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <div className="space-y-6">
                    <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Bot className="text-teal-600" size={20} /> Credenciales Portal SRI en Línea
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Estas credenciales son necesarias para la descarga automatizada de comprobantes electrónicos desde el portal del SRI.
                        </p>
                    </div>

                    {certificadoInfo.estado === 'SIN_CERTIFICADO' ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                            <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                            <p className="text-sm text-amber-700">
                                Primero configure su firma electrónica (certificado .p12) antes de agregar las credenciales del portal SRI.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Usuario del Portal SRI
                                    </label>
                                    <input
                                        type="text"
                                        value={usuarioSri}
                                        onChange={e => setUsuarioSri(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                                        placeholder="Generalmente su RUC o cédula"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Clave del Portal SRI
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showClaveSri ? 'text' : 'password'}
                                            value={claveSri}
                                            onChange={e => setClaveSri(e.target.value)}
                                            className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button onClick={() => setShowClaveSri(!showClaveSri)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            {showClaveSri ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1.5">
                                        La clave se almacena encriptada (AES-256) y no se muestra después de guardar.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleGuardarCredenciales}
                                    disabled={guardandoCredenciales || !usuarioSri.trim() || !claveSri.trim()}
                                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                                >
                                    {guardandoCredenciales ? (
                                        <><Loader2 size={16} className="animate-spin mr-2" /> Guardando...</>
                                    ) : (
                                        <><Save size={16} className="mr-2" /> Guardar Credenciales SRI</>
                                    )}
                                </Button>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <Bot size={18} className={hasCredenciales ? 'text-teal-600' : 'text-slate-400'} />
                                    Estado de Credenciales
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                        <span className="text-sm text-slate-500">Estado</span>
                                        {hasCredenciales ? (
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-teal-100 text-teal-700 flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Configurado
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-500">
                                                No configurado
                                            </span>
                                        )}
                                    </div>
                                    {usuarioSriActual && (
                                        <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                            <span className="text-sm text-slate-500">Usuario</span>
                                            <span className="text-sm font-mono font-medium text-slate-700">{usuarioSriActual}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                        <span className="text-sm text-slate-500">Clave</span>
                                        <span className="text-sm text-slate-400">••••••••</span>
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-[10px] text-slate-400 italic">
                                            Estas credenciales se usan exclusivamente para el módulo &quot;Descarga por Robot&quot;
                                            en Compras → Descarga por Robot.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
