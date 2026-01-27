'use client';

import { useState, useEffect } from 'react';
import { Settings, Building2, Monitor, Users, Database, Save, Plus, Edit2, Trash2, Shield, Key, CalendarOff, Upload, CheckCircle2, Eye, EyeOff, AlertTriangle, Lock } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { useAuth } from '@/shared/context/AuthContext';
import type { CertificadoMetadata } from '@/shared/types/certificado.types';
import { Sucursal, UsuarioSistema, PuntoEmision, CodigoRetencion } from '@/modules/configuracion/domain/types';
import { useConfiguracion } from '@/modules/configuracion/hooks/useConfiguracion';
import { ContabilidadUseCases, ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { RetencionModal } from '@/modules/configuracion/ui/components/RetencionModal';
import { PuntoEmisionModal } from '@/modules/configuracion/ui/components/PuntoEmisionModal';
import { SucursalModal } from '@/modules/configuracion/ui/components/SucursalModal';
import { CuentaContable } from '@/shared/types';
import { fileToBase64 } from '@/shared/utils/fileHelpers';
import { useToast } from '@/shared/context/ToastContext';

export default function ConfiguracionPage() {
    const { currentEmpresa } = useEmpresa();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'empresa' | 'sucursales' | 'puntos' | 'usuarios' | 'parametros' | 'firma' | 'impuestos' | 'cierre'>('empresa');

    // Hooks para datos reales
    const {
        sucursales, cargarSucursales,
        puntosEmision, cargarPuntosEmision,
        retenciones, cargarRetenciones,
        parametros, setParametros, cargarParametros, guardarParametros
    } = useConfiguracion();

    // Otros estados
    const [usuarios] = useState<UsuarioSistema[]>([]);
    const [planCuentasMovimiento, setPlanCuentasMovimiento] = useState<CuentaContable[]>([]);
    const [fechaCierre, setFechaCierre] = useState('');

    // Firma States
    const [firmaFile, setFirmaFile] = useState<File | null>(null);
    const [firmaPassword, setFirmaPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [ambienteSRI, setAmbienteSRI] = useState<'1' | '2'>('1');
    const [firmaVigencia, setFirmaVigencia] = useState<string | null>(null);
    
    // Estado único para metadatos del certificado (mejor práctica: agrupar datos relacionados)
    const [certificadoInfo, setCertificadoInfo] = useState<CertificadoMetadata>({
        fechaEmision: null,
        fechaExpiracion: null,
        sujeto: null,
        emisor: null,
        numeroSerie: null,
        diasRestantes: null,
        estado: 'SIN_CERTIFICADO'
    });

    // Modals
    const [showModalRet, setShowModalRet] = useState(false);
    const [selectedRet, setSelectedRet] = useState<CodigoRetencion | undefined>(undefined);
    const [showModalPunto, setShowModalPunto] = useState(false);
    const [selectedPunto, setSelectedPunto] = useState<PuntoEmision | undefined>(undefined);
    const [showModalSuc, setShowModalSuc] = useState(false);
    const [selectedSuc, setSelectedSuc] = useState<Sucursal | undefined>(undefined);

    const loadData = async () => {
        if (!currentEmpresa) return;
        try {
            // Cargar datos según pestaña o iniciales
            if (activeTab === 'empresa' || activeTab === 'parametros' || activeTab === 'sucursales') {
                await Promise.all([
                    cargarSucursales(),
                    cargarParametros(),
                    ContabilidadUseCases.listarCuentasMovimiento().then(data => {
                        console.log('Cuentas de Movimiento cargadas:', data.data);
                        setPlanCuentasMovimiento(data.data);
                    })
                ]);
            }

            if (activeTab === 'puntos') {
                await cargarPuntosEmision();
            } else if (activeTab === 'impuestos') {
                await cargarRetenciones();
            }
            // Usuarios sigue pendiente de API real, mantenemos vacío o mock mínimo si fuera necesario
        } catch (error) {
            console.error('Error al cargar datos:', error);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id, activeTab]);

    // Load existing SRI configuration
    useEffect(() => {
        const loadSRIConfig = async () => {
            if (!currentEmpresa || !user || activeTab !== 'firma') return;
            try {
                const ambiente = ambienteSRI === '1' ? 'PRUEBAS' : 'PRODUCCION';
                const response = await fetch(`/api/configuracion/sri/metadata?ambiente=${ambiente}`, {
                    headers: {
                        'x-empresa-id': currentEmpresa.id,
                        'x-usuario-id': user.id
                    }
                });
                if (response.ok) {
                    const metadata = await response.json();
                    
                    // Actualizar todos los metadatos del certificado en un solo setState
                    setCertificadoInfo({
                        fechaEmision: metadata.fechaEmision?.split('T')[0] || null,
                        fechaExpiracion: metadata.fechaExpiracion?.split('T')[0] || null,
                        sujeto: metadata.sujeto || null,
                        emisor: metadata.emisor || null,
                        numeroSerie: metadata.numeroSerie || null,
                        diasRestantes: metadata.diasRestantes,
                        estado: metadata.tieneCertificado ? (metadata.estado || 'VIGENTE') : 'SIN_CERTIFICADO'
                    });
                    setFirmaVigencia(metadata.fechaExpiracion?.split('T')[0] || null);
                } else {
                    // Resetear todos los estados en una sola operación
                    setCertificadoInfo({
                        fechaEmision: null,
                        fechaExpiracion: null,
                        sujeto: null,
                        emisor: null,
                        numeroSerie: null,
                        diasRestantes: null,
                        estado: 'SIN_CERTIFICADO'
                    });
                    setFirmaVigencia(null);
                }
            } catch (error) {
                console.log('No existing SRI config found');
                setCertificadoInfo(prev => ({ ...prev, estado: 'SIN_CERTIFICADO' }));
            }
        };
        loadSRIConfig();
    }, [currentEmpresa?.id, user?.id, activeTab, ambienteSRI]);

    const handleGuardarFirma = async () => {
        if (!firmaFile && !firmaPassword) {
            showToast('Por favor seleccione un archivo .p12 y su contraseña', 'warning');
            return;
        }
        if (!firmaPassword) {
            showToast('Por favor ingrese la contraseña del certificado', 'warning');
            return;
        }

        if (!currentEmpresa || !user) {
            showToast('Error: No hay sesión activa o empresa seleccionada', 'error');
            return;
        }

        try {
            const p12Base64 = firmaFile ? await fileToBase64(firmaFile) : '';
            const ambiente = ambienteSRI === '1' ? 'PRUEBAS' : 'PRODUCCION';

            const response = await fetch('/api/configuracion/sri', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-empresa-id': currentEmpresa.id,
                    'x-usuario-id': user.id
                },
                body: JSON.stringify({
                    ambiente,
                    p12Base64,
                    claveCertificado: firmaPassword,
                })
            });

            if (response.ok) {
                const data = await response.json();
                
                // Mostrar mensaje con advertencia si el certificado está próximo a vencer
                let mensaje = `Configuración de firma guardada exitosamente.\nAmbiente: ${ambiente}`;
                if (data.advertencia) {
                    mensaje += `\n⚠️ ${data.advertencia}`;
                }
                
                showToast(mensaje, data.advertencia ? 'warning' : 'success');
                
                // Recargar metadatos completos del certificado
                try {
                    const metadataResponse = await fetch(`/api/configuracion/sri/metadata?ambiente=${ambiente}`, {
                        headers: {
                            'x-empresa-id': currentEmpresa.id,
                            'x-usuario-id': user.id
                        }
                    });
                    
                    if (metadataResponse.ok) {
                        const metadata = await metadataResponse.json();
                        setCertificadoInfo({
                            fechaEmision: metadata.fechaEmision?.split('T')[0] || null,
                            fechaExpiracion: metadata.fechaExpiracion?.split('T')[0] || null,
                            sujeto: metadata.sujeto || null,
                            emisor: metadata.emisor || null,
                            numeroSerie: metadata.numeroSerie || null,
                            diasRestantes: metadata.diasRestantes,
                            estado: metadata.estado || 'VIGENTE'
                        });
                        setFirmaVigencia(metadata.fechaExpiracion?.split('T')[0] || null);
                    }
                } catch (metaError) {
                    console.error('Error al cargar metadatos:', metaError);
                }
                
                setFirmaFile(null);
                setFirmaPassword('');
            } else {
                const error = await response.json();
                showToast(`Error: ${error.error || 'No se pudo guardar la configuración'}`, 'error');
            }
        } catch (error) {
            console.error('Error al guardar firma:', error);
            showToast('Error al guardar la configuración de firma', 'error');
        }
    };

    const handleGuardarCierre = async () => {
        if (!currentEmpresa || !parametros) return;
        try {
            await guardarParametros({ ...parametros, fechaCierre });
            showToast('Fecha de cierre actualizada exitosamente.', 'success');
        } catch (error) {
            showToast('Error al actualizar fecha de cierre', 'error');
        }
    };

    const handleGuardarParametros = async () => {
        if (!currentEmpresa || !parametros) return;
        try {
            await guardarParametros(parametros);
            showToast('Parámetros contables actualizados exitosamente.', 'success');
        } catch (error) {
            showToast('Error al guardar parámetros', 'error');
        }
    };

    const handleGuardarEmpresa = async () => {
        if (!currentEmpresa) return;

        // Obtener los valores actuales de los inputs
        const form = document.querySelector('form') || document;
        const nombreComercial = (form.querySelector('input[defaultValue="' + currentEmpresa.nombreComercial + '"]') as HTMLInputElement)?.value || currentEmpresa.nombreComercial;
        const direccionMatriz = (form.querySelector('input[defaultValue="' + currentEmpresa.direccionMatriz + '"]') as HTMLInputElement)?.value || currentEmpresa.direccionMatriz;

        // Logo
        const logoInputs = Array.from(form.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
        const logoUrl = logoInputs.find(input => input.placeholder?.includes('logo'))?.value || '';

        // Obligado a contabilidad
        const obligadoContSelect = Array.from(form.querySelectorAll('select')).find(select =>
            select.options[0]?.value === 'SI' && select.parentElement?.textContent?.includes('Obligado')
        ) as HTMLSelectElement;
        const obligadoContabilidad = obligadoContSelect?.value === 'SI';

        // Contribuyente especial
        const contribuyenteEspecialSelect = Array.from(form.querySelectorAll('select')).find(select =>
            select.options[0]?.value === 'SI' && select.parentElement?.textContent?.includes('Contribuyente')
        ) as HTMLSelectElement;
        const contribuyenteEspecial = contribuyenteEspecialSelect?.value === 'SI';

        try {
            await ConfiguracionUseCases.actualizarEmpresa({
                id: currentEmpresa.id,
                nombreComercial,
                direccionMatriz,
                logoUrl,
                obligadoContabilidad,
                contribuyenteEspecial
            });
            showToast('Datos de empresa actualizados exitosamente', 'success');
        } catch (error: any) {
            console.error('Error al guardar datos de empresa:', error);
            showToast(error.message || 'Error al guardar datos de empresa', 'error');
        }
    };

    // Columns Definitions
    const userColumns: Column<UsuarioSistema>[] = [
        { header: 'Nombre', accessorKey: 'nombreCompleto', sortable: true },
        { header: 'Email', accessorKey: 'email' },
        {
            header: 'Rol',
            accessorKey: 'rol',
            cell: (row) => <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600">{row.rol}</span>
        },
        {
            header: 'Estado',
            accessorKey: 'estado',
            cell: (row) => (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${row.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${row.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {row.estado}
                </span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-center',
            cell: () => <button className="text-sri-blue hover:underline text-xs font-medium">Editar</button>
        }
    ];

    const puntosColumns: Column<PuntoEmision>[] = [
        {
            header: 'Sucursal',
            cell: (row) => {
                const suc = sucursales.find(s => s.id === row.sucursalId);
                return <span className="text-xs text-slate-500">{suc?.nombre || 'N/A'}</span>;
            }
        },
        {
            header: 'Código',
            accessorKey: 'codigo',
            cell: (row) => <span className="font-mono font-bold text-slate-700">{row.codigo}</span>
        },
        { header: 'Nombre Caja', accessorKey: 'nombre' },
        {
            header: 'Secuenciales',
            cell: (row) => (
                <div className="flex flex-col gap-1 text-[10px] text-slate-500">
                    {row.secuenciales.map(s => (
                        <div key={s.tipoComprobante} className="flex justify-between w-32">
                            <span>{s.tipoComprobante}:</span>
                            <span className="font-mono font-bold">{s.secuencialActual}</span>
                        </div>
                    ))}
                </div>
            )
        },
        {
            header: 'Acciones',
            className: 'text-center',
            cell: (row) => (
                <div className="flex justify-center gap-2">
                    <button onClick={() => { setSelectedPunto(row); setShowModalPunto(true); }} className="p-1.5 text-slate-400 hover:text-sri-blue rounded"><Edit2 size={16} /></button>
                </div>
            )
        }
    ];

    const impuestosColumns: Column<CodigoRetencion>[] = [
        { header: 'Código', accessorKey: 'codigo', className: 'font-mono text-slate-700' },
        { header: 'Concepto', accessorKey: 'concepto', className: 'max-w-md truncate' },
        {
            header: 'Porcentaje',
            accessorKey: 'porcentaje',
            className: 'text-right font-bold',
            cell: (row) => `${row.porcentaje}%`
        },
        {
            header: 'Tipo',
            accessorKey: 'tipo',
            cell: (row) => <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.tipo === 'RENTA' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{row.tipo}</span>
        },
        {
            header: 'Acciones',
            className: 'text-center',
            cell: (row) => (
                <div className="flex justify-center gap-2">
                    <button onClick={() => { setSelectedRet(row); setShowModalRet(true); }} className="p-1.5 text-slate-400 hover:text-sri-blue rounded"><Edit2 size={16} /></button>
                    <button className="p-1.5 text-slate-400 hover:text-red-600 rounded"><Trash2 size={16} /></button>
                </div>
            )
        }
    ];

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Configuración del Sistema</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestione su empresa, sucursales, usuarios y parámetros globales.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-1 space-y-1">
                    <button onClick={() => setActiveTab('empresa')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'empresa' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <Building2 size={18} /> Datos de Empresa
                    </button>
                    <button onClick={() => setActiveTab('sucursales')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'sucursales' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <Database size={18} /> Sucursales
                    </button>
                    <button onClick={() => setActiveTab('puntos')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'puntos' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <Monitor size={18} /> Puntos de Emisión
                    </button>
                    <button onClick={() => setActiveTab('usuarios')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'usuarios' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <Users size={18} /> Usuarios y Roles
                    </button>
                    <button onClick={() => setActiveTab('firma')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'firma' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <Shield size={18} /> Firma Electrónica
                    </button>
                    <button onClick={() => setActiveTab('impuestos')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'impuestos' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <CheckCircle2 size={18} /> Impuestos y Retenciones
                    </button>
                    <button onClick={() => setActiveTab('cierre')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'cierre' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <CalendarOff size={18} /> Cierre de Periodos
                    </button>
                    <button onClick={() => setActiveTab('parametros')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'parametros' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <Settings size={18} /> Parámetros Contables
                    </button>
                </div>

                <div className="col-span-3 bg-white p-8 rounded-xl shadow-sm border border-slate-100 min-h-[500px]">
                    {activeTab === 'empresa' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Información de la Entidad</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Razón Social</label>
                                    <input type="text" defaultValue={currentEmpresa.razonSocial} className="w-full border rounded-lg p-2.5 text-sm bg-slate-50" readOnly />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">RUC</label>
                                    <input type="text" defaultValue={currentEmpresa.ruc} className="w-full border rounded-lg p-2.5 text-sm bg-slate-50" readOnly />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Comercial</label>
                                    <input type="text" defaultValue={currentEmpresa.nombreComercial} className="w-full border rounded-lg p-2.5 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección Matriz</label>
                                    <input type="text" defaultValue={currentEmpresa.direccionMatriz} className="w-full border rounded-lg p-2.5 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL del Logo</label>
                                    <input type="text" defaultValue={currentEmpresa.logoUrl || ''} className="w-full border rounded-lg p-2.5 text-sm" placeholder="https://ejemplo.com/logo.png" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Obligado a Contabilidad</label>
                                    <select className="w-full border rounded-lg p-2.5 text-sm" defaultValue={currentEmpresa.obligadoContabilidad ? 'SI' : 'NO'}>
                                        <option value="SI">SÍ</option>
                                        <option value="NO">NO</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contribuyente Especial</label>
                                    <select className="w-full border rounded-lg p-2.5 text-sm" defaultValue={currentEmpresa.contribuyenteEspecial ? 'SI' : 'NO'}>
                                        <option value="SI">SÍ</option>
                                        <option value="NO">NO</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleGuardarEmpresa} className="flex items-center gap-2">
                                    <Save size={18} /> Guardar Cambios
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sucursales' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="text-lg font-bold text-slate-800">Sucursales y Establecimientos</h3>
                                <Button size="sm" onClick={() => { setSelectedSuc(undefined); setShowModalSuc(true); }} className="flex items-center gap-1"><Plus size={16} /> Añadir</Button>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {sucursales.map(suc => (
                                    <div key={suc.id} className="p-4 border rounded-xl hover:border-sri-blue transition-colors flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-800">{suc.codigo} - {suc.nombre}</span>
                                                {suc.esMatriz && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">MATRIZ</span>}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{suc.direccion}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setSelectedSuc(suc); setShowModalSuc(true); }} className="p-2 text-slate-400 hover:text-sri-blue hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                            {!suc.esMatriz && <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'puntos' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="text-lg font-bold text-slate-800">Puntos de Emisión</h3>
                                <Button size="sm" onClick={() => { setSelectedPunto(undefined); setShowModalPunto(true); }} className="flex items-center gap-1"><Plus size={16} /> Nuevo Punto</Button>
                            </div>
                            <DataTable
                                data={puntosEmision}
                                columns={puntosColumns}
                                itemsPerPage={5}
                            />
                        </div>
                    )}

                    {activeTab === 'usuarios' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="text-lg font-bold text-slate-800">Gestión de Accesos</h3>
                                <Button size="sm" className="flex items-center gap-1"><Plus size={16} /> Nuevo Usuario</Button>
                            </div>
                            <DataTable
                                data={usuarios}
                                columns={userColumns}
                                itemsPerPage={5}
                            />
                        </div>
                    )}

                    {activeTab === 'firma' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="border-b border-slate-100 pb-3">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Key className="text-sri-blue" size={20} /> Configuración de Firma Electrónica
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Carga tu archivo .p12 para firmar automáticamente los comprobantes XML.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Ambiente SRI</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-slate-50 flex-1">
                                                <input type="radio" name="ambiente" value="1" checked={ambienteSRI === '1'} onChange={() => setAmbienteSRI('1')} className="text-sri-blue" />
                                                <span className="text-sm font-medium">Pruebas</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-slate-50 flex-1">
                                                <input type="radio" name="ambiente" value="2" checked={ambienteSRI === '2'} onChange={() => setAmbienteSRI('2')} className="text-sri-blue" />
                                                <span className="text-sm font-medium">Producción</span>
                                            </label>
                                        </div>
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
                                        Información del Certificado Digital
                                    </h4>
                                    {certificadoInfo.estado !== 'SIN_CERTIFICADO' ? (
                                        <div className="space-y-3">
                                            {/* Estado */}
                                            <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                                <span className="text-sm text-slate-500">Estado</span>
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    certificadoInfo.estado === 'VIGENTE' ? 'bg-green-100 text-green-700' :
                                                    certificadoInfo.estado === 'PROXIMO_A_VENCER' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {certificadoInfo.estado === 'VIGENTE' ? 'VIGENTE' : 
                                                     certificadoInfo.estado === 'PROXIMO_A_VENCER' ? 'PRÓXIMO A VENCER' : 
                                                     'EXPIRADO'}
                                                </span>
                                            </div>
                                            
                                            {/* Días Restantes */}
                                            {certificadoInfo.diasRestantes !== null && certificadoInfo.diasRestantes >= 0 && (
                                                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                                    <span className="text-sm text-slate-500">Días Restantes</span>
                                                    <span className={`text-sm font-bold ${
                                                        certificadoInfo.diasRestantes > 30 ? 'text-green-600' :
                                                        certificadoInfo.diasRestantes > 7 ? 'text-yellow-600' :
                                                        'text-red-600'
                                                    }`}>
                                                        {certificadoInfo.diasRestantes} días
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {/* Fecha Emisión */}
                                            {certificadoInfo.fechaEmision && (
                                                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                                    <span className="text-sm text-slate-500">Fecha Emisión</span>
                                                    <span className="text-sm font-mono font-medium">{certificadoInfo.fechaEmision}</span>
                                                </div>
                                            )}
                                            
                                            {/* Fecha Expiración */}
                                            {certificadoInfo.fechaExpiracion && (
                                                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                                    <span className="text-sm text-slate-500">Fecha Expiración</span>
                                                    <span className="text-sm font-mono font-medium">{certificadoInfo.fechaExpiracion}</span>
                                                </div>
                                            )}
                                            
                                            {/* Número de Serie */}
                                            {certificadoInfo.numeroSerie && (
                                                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                                    <span className="text-sm text-slate-500">Número de Serie</span>
                                                    <span className="text-xs font-mono text-slate-600 break-all">{certificadoInfo.numeroSerie}</span>
                                                </div>
                                            )}
                                            
                                            {/* Sujeto */}
                                            {certificadoInfo.sujeto && (
                                                <div className="py-2 border-b border-slate-200">
                                                    <span className="text-sm text-slate-500 block mb-1">Sujeto (Subject DN)</span>
                                                    <span className="text-xs font-mono text-slate-600 break-all">{certificadoInfo.sujeto}</span>
                                                </div>
                                            )}
                                            
                                            {/* Emisor */}
                                            {certificadoInfo.emisor && (
                                                <div className="py-2">
                                                    <span className="text-sm text-slate-500 block mb-1">Emisor (Issuer DN)</span>
                                                    <span className="text-xs font-mono text-slate-600 break-all">{certificadoInfo.emisor}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center text-slate-400 py-8">
                                            <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No se ha configurado ningún certificado digital.</p>
                                            <p className="text-xs mt-2">Suba un archivo .p12 para configurar la firma electrónica.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'impuestos' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="text-lg font-bold text-slate-800">Códigos de Retención</h3>
                                <Button size="sm" onClick={() => { setSelectedRet(undefined); setShowModalRet(true); }} className="flex items-center gap-1"><Plus size={16} /> Nuevo Código</Button>
                            </div>
                            <DataTable
                                data={retenciones}
                                columns={impuestosColumns}
                                itemsPerPage={8}
                            />
                        </div>
                    )}

                    {activeTab === 'cierre' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                                <Lock size={20} className="text-red-500" /> Bloqueo de Periodos Contables
                            </h3>
                            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="text-red-600 mt-1" size={20} />
                                    <div>
                                        <h4 className="text-sm font-bold text-red-800">Advertencia de Seguridad</h4>
                                        <p className="text-xs text-red-700 mt-1">
                                            Al establecer una fecha de cierre, el sistema <strong>bloqueará</strong> la creación, edición o anulación de cualquier documento con fecha anterior.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="max-w-md">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Fecha de Cierre Efectiva</label>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="date"
                                        value={fechaCierre}
                                        onChange={e => setFechaCierre(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
                                    />
                                    <button
                                        onClick={handleGuardarCierre}
                                        className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg"
                                    >
                                        Bloquear
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'parametros' && parametros && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Configuración Contable y Tributaria</h3>
                            
                            {/* Valores de Referencia */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-4 col-span-3">
                                    <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Valores de Referencia</h4>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">SBU Vigente ($)</label>
                                    <input
                                        type="number"
                                        value={parametros.sbu}
                                        onChange={e => setParametros({ ...parametros, sbu: Number(e.target.value) })}
                                        className="w-full border rounded-lg p-2.5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">IVA General (%)</label>
                                    <input
                                        type="number"
                                        value={parametros.iva}
                                        onChange={e => setParametros({ ...parametros, iva: Number(e.target.value) })}
                                        className="w-full border rounded-lg p-2.5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Máximo Consumidor Final ($)</label>
                                    <input
                                        type="number"
                                        value={parametros.maxConsumidorFinal}
                                        onChange={e => setParametros({ ...parametros, maxConsumidorFinal: Number(e.target.value) })}
                                        className="w-full border rounded-lg p-2.5 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Cuentas de Efectivo */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-4 col-span-3">
                                    <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Cuentas de Efectivo</h4>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Cuenta Caja</label>
                                    <select
                                        value={parametros.cuentaCaja || ''}
                                        onChange={e => setParametros({ ...parametros, cuentaCaja: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                    >
                                        <option value="">Seleccione una cuenta...</option>
                                        {Array.isArray(planCuentasMovimiento) && planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.1.01')).map(c => (
                                            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Cuentas de Cartera */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-4 col-span-3">
                                    <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Cuentas de Cartera</h4>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">CXC Clientes</label>
                                    <select
                                        value={parametros.cuentaCxcClientes || ''}
                                        onChange={e => setParametros({ ...parametros, cuentaCxcClientes: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                    >
                                        <option value="">Seleccione una cuenta...</option>
                                        {Array.isArray(planCuentasMovimiento) && planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.1')).map(c => (
                                            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Anticipo Clientes</label>
                                    <select
                                        value={parametros.cuentaAnticipoClientes || ''}
                                        onChange={e => setParametros({ ...parametros, cuentaAnticipoClientes: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                    >
                                        <option value="">Seleccione una cuenta...</option>
                                        {Array.isArray(planCuentasMovimiento) && planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.1')).map(c => (
                                            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">CXP Proveedores</label>
                                    <select
                                        value={parametros.cuentaCxpProveedores || ''}
                                        onChange={e => setParametros({ ...parametros, cuentaCxpProveedores: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                    >
                                        <option value="">Seleccione una cuenta...</option>
                                        {Array.isArray(planCuentasMovimiento) && planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.1')).map(c => (
                                            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Anticipo Proveedores</label>
                                    <select
                                        value={parametros.cuentaAnticipoProveedores || ''}
                                        onChange={e => setParametros({ ...parametros, cuentaAnticipoProveedores: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                    >
                                        <option value="">Seleccione una cuenta...</option>
                                        {Array.isArray(planCuentasMovimiento) && planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.1')).map(c => (
                                            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Cuentas de Ventas */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-4 col-span-3">
                                    <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Cuentas de Ventas</h4>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Ventas / Ingresos</label>
                                    <select
                                        value={parametros.cuentaVentas || ''}
                                        onChange={e => setParametros({ ...parametros, cuentaVentas: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                    >
                                        <option value="">Seleccione una cuenta...</option>
                                        {Array.isArray(planCuentasMovimiento) && planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('4.')).map(c => (
                                            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Devolución en Ventas</label>
                                    <select
                                        value={parametros.cuentaDevolucionVentas || ''}
                                        onChange={e => setParametros({ ...parametros, cuentaDevolucionVentas: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                    >
                                        <option value="">Seleccione una cuenta...</option>
                                        {Array.isArray(planCuentasMovimiento) && planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('4.')).map(c => (
                                            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Descuento en Ventas</label>
                                    <select
                                        value={parametros.cuentaDescuentoVentas || ''}
                                        onChange={e => setParametros({ ...parametros, cuentaDescuentoVentas: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                    >
                                        <option value="">Seleccione una cuenta...</option>
                                        {Array.isArray(planCuentasMovimiento) && planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('4.')).map(c => (
                                            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Costo de Ventas</label>
                                    <select
                                        value={parametros.cuentaCostoVentas || ''}
                                        onChange={e => setParametros({ ...parametros, cuentaCostoVentas: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                    >
                                        <option value="">Seleccione una cuenta...</option>
                                        {Array.isArray(planCuentasMovimiento) && planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('5.')).map(c => (
                                            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Cuentas de Compras */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-4 col-span-3">
                                    <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Cuentas de Compras / Inventario</h4>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Compras / Gastos Generales</label>
                                    <select
                                        value={parametros.cuentaCompras || ''}
                                        onChange={e => setParametros({ ...parametros, cuentaCompras: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                    >
                                        <option value="">Seleccione una cuenta...</option>
                                        {Array.isArray(planCuentasMovimiento) && planCuentasMovimiento.filter(c => c.nivel >= 4 && (c.codigo.startsWith('5.') || c.codigo.startsWith('6.'))).map(c => (
                                            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Inventario / Mercadería</label>
                                    <select
                                        value={parametros.cuentaInventario || ''}
                                        onChange={e => setParametros({ ...parametros, cuentaInventario: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                    >
                                        <option value="">Seleccione una cuenta...</option>
                                        {Array.isArray(planCuentasMovimiento) && planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.1.03')).map(c => (
                                            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Cuentas de IVA */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-4 col-span-3">
                                    <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Cuentas de IVA</h4>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">IVA en Ventas (Crédito Tributario)</label>
                                    <select
                                        value={parametros.cuentaIvaVentas || ''}
                                        onChange={e => setParametros({ ...parametros, cuentaIvaVentas: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                    >
                                        <option value="">Seleccione una cuenta...</option>
                                        {Array.isArray(planCuentasMovimiento) && planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.')).map(c => (
                                            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">IVA en Compras (Activo)</label>
                                    <select
                                        value={parametros.cuentaIvaCompras || ''}
                                        onChange={e => setParametros({ ...parametros, cuentaIvaCompras: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                    >
                                        <option value="">Seleccione una cuenta...</option>
                                        {Array.isArray(planCuentasMovimiento) && planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.')).map(c => (
                                            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">IVA por Pagar</label>
                                    <select
                                        value={parametros.cuentaIvaPorPagar || ''}
                                        onChange={e => setParametros({ ...parametros, cuentaIvaPorPagar: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                    >
                                        <option value="">Seleccione una cuenta...</option>
                                        {Array.isArray(planCuentasMovimiento) && planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.')).map(c => (
                                            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Cuentas de Retenciones */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-4 col-span-3">
                                    <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Cuentas de Retenciones</h4>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Ret. Renta por Pagar (Pasivo)</label>
                                    <select
                                        value={parametros.cuentaRetRentaPorPagar || ''}
                                        onChange={e => setParametros({ ...parametros, cuentaRetRentaPorPagar: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                    >
                                        <option value="">Seleccione una cuenta...</option>
                                        {Array.isArray(planCuentasMovimiento) && planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.')).map(c => (
                                            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Ret. IVA por Pagar (Pasivo)</label>
                                    <select
                                        value={parametros.cuentaRetIvaPorPagar || ''}
                                        onChange={e => setParametros({ ...parametros, cuentaRetIvaPorPagar: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                    >
                                        <option value="">Seleccione una cuenta...</option>
                                        {Array.isArray(planCuentasMovimiento) && planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.')).map(c => (
                                            <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t">
                                <Button onClick={handleGuardarParametros} className="flex items-center gap-2">
                                    <Save size={18} /> Guardar Parámetros
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {
                showModalRet && (
                    <RetencionModal
                        onClose={() => setShowModalRet(false)}
                        onSave={loadData}
                        empresaId={currentEmpresa.id}
                        retencionEditar={selectedRet}
                    />
                )
            }

            {
                showModalPunto && (
                    <PuntoEmisionModal
                        onClose={() => setShowModalPunto(false)}
                        onSave={loadData}
                        sucursales={sucursales}
                        puntoEditar={selectedPunto}
                    />
                )
            }

            {
                showModalSuc && (
                    <SucursalModal
                        onClose={() => setShowModalSuc(false)}
                        onSave={loadData}
                        sucursalEditar={selectedSuc}
                    />
                )
            }
        </div >
    );
}
