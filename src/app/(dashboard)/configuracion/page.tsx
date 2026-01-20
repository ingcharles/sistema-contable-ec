'use client';

import { useState, useEffect } from 'react';
import { Settings, Building2, Monitor, Users, Database, Save, Plus, Edit2, Trash2, Shield, Key, CalendarOff, Upload, CheckCircle2, Eye, EyeOff, AlertTriangle, Lock } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Sucursal, UsuarioSistema, ParametrosContables, PuntoEmision, CodigoRetencion } from '@/modules/configuracion/domain/types';
import { InMemoryConfiguracionRepository } from '@/modules/configuracion/infrastructure/ConfiguracionRepository';
import { InMemoryContabilidadRepository } from '@/modules/contabilidad/infrastructure/ContabilidadRepository';
import { Button } from '@/shared/ui/Button';
import { DataTable, Column } from '@/shared/ui/DataTable';
import { RetencionModal } from '@/modules/configuracion/ui/components/RetencionModal';
import { PuntoEmisionModal } from '@/modules/configuracion/ui/components/PuntoEmisionModal';
import { CuentaContable } from '@/shared/types';

export default function ConfiguracionPage() {
    const { currentEmpresa } = useEmpresa();
    const [activeTab, setActiveTab] = useState<'empresa' | 'sucursales' | 'puntos' | 'usuarios' | 'parametros' | 'firma' | 'impuestos' | 'cierre'>('empresa');

    // Data States
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
    const [parametros, setParametros] = useState<ParametrosContables | null>(null);
    const [planCuentas, setPlanCuentas] = useState<CuentaContable[]>([]);
    const [puntosEmision, setPuntosEmision] = useState<PuntoEmision[]>([]);
    const [retenciones, setRetenciones] = useState<CodigoRetencion[]>([]);
    const [fechaCierre, setFechaCierre] = useState('');
    const [cargando, setCargando] = useState(true);

    // Firma States
    const [firmaFile, setFirmaFile] = useState<File | null>(null);
    const [firmaPassword, setFirmaPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [ambienteSRI, setAmbienteSRI] = useState<'1' | '2'>('1');
    const [firmaVigencia, setFirmaVigencia] = useState<string | null>('2024-12-31');

    // Modals
    const [showModalRet, setShowModalRet] = useState(false);
    const [selectedRet, setSelectedRet] = useState<CodigoRetencion | undefined>(undefined);
    const [showModalPunto, setShowModalPunto] = useState(false);
    const [selectedPunto, setSelectedPunto] = useState<PuntoEmision | undefined>(undefined);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setCargando(true);
        try {
            const repoConfig = new InMemoryConfiguracionRepository();
            const repoCont = new InMemoryContabilidadRepository();

            // Load basic data
            const [dataSuc, dataUser, dataParams, dataPC] = await Promise.all([
                repoConfig.getSucursales(currentEmpresa.id),
                repoConfig.getUsuarios(currentEmpresa.id),
                repoConfig.getParametros(currentEmpresa.id),
                repoCont.getPlanCuentas(currentEmpresa.id)
            ]);

            setSucursales(dataSuc);
            setUsuarios(dataUser);
            setParametros(dataParams);
            setPlanCuentas(dataPC);

            // Load tab specific data
            if (activeTab === 'puntos') {
                const dataPuntos = await repoConfig.getPuntosEmision(currentEmpresa.id);
                setPuntosEmision(dataPuntos);
            } else if (activeTab === 'impuestos') {
                const dataRet = await repoConfig.getCodigosRetencion(currentEmpresa.id);
                setRetenciones(dataRet);
            } else if (activeTab === 'cierre') {
                const fecha = await repoConfig.getFechaCierre(currentEmpresa.id);
                setFechaCierre(fecha);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { loadData(); }, [currentEmpresa?.id, activeTab]);

    const handleGuardarFirma = () => {
        if (!firmaFile && !firmaVigencia) {
            alert('Por favor seleccione un archivo .p12');
            return;
        }
        alert(`Configuración de firma actualizada.\nAmbiente: ${ambienteSRI === '1' ? 'PRUEBAS' : 'PRODUCCIÓN'}\nArchivo: ${firmaFile?.name || 'Mantenido'}`);
        setFirmaVigencia('2025-10-25');
    };

    const handleGuardarCierre = async () => {
        if (!currentEmpresa) return;
        const repo = new InMemoryConfiguracionRepository();
        await repo.setFechaCierre(currentEmpresa.id, fechaCierre);
        alert('Fecha de cierre actualizada exitosamente.');
    };

    const handleGuardarParametros = async () => {
        if (!currentEmpresa || !parametros) return;
        const repo = new InMemoryConfiguracionRepository();
        await repo.saveParametros(currentEmpresa.id, parametros);
        alert('Parámetros contables actualizados exitosamente.');
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
                <Button className="flex items-center gap-2">
                    <Save size={18} /> Guardar Cambios
                </Button>
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
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Obligado a Contabilidad</label>
                                    <select className="w-full border rounded-lg p-2.5 text-sm" defaultValue={currentEmpresa.obligadoContabilidad ? 'SI' : 'NO'}>
                                        <option value="SI">SÍ</option>
                                        <option value="NO">NO</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contribuyente Especial</label>
                                    <input type="text" defaultValue={currentEmpresa.contribuyenteEspecial || ''} className="w-full border rounded-lg p-2.5 text-sm" placeholder="Nro. Resolución" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sucursales' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="text-lg font-bold text-slate-800">Sucursales y Establecimientos</h3>
                                <Button size="sm" className="flex items-center gap-1"><Plus size={16} /> Añadir</Button>
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
                                            <button className="p-2 text-slate-400 hover:text-sri-blue hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
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
                                        <Shield size={18} className={firmaVigencia ? 'text-green-600' : 'text-slate-400'} /> Estado del Certificado
                                    </h4>
                                    {firmaVigencia ? (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                                <span className="text-sm text-slate-500">Estado</span>
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">VIGENTE</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                                <span className="text-sm text-slate-500">Fecha Expiración</span>
                                                <span className="text-sm font-mono font-medium">{firmaVigencia}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-slate-400 py-8">
                                            <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No se ha configurado ninguna firma válida.</p>
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
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Valores de Referencia</h4>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">SBU Vigente ($)</label>
                                        <input type="number" defaultValue={parametros.sbu} className="w-full border rounded-lg p-2.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">IVA General (%)</label>
                                        <input type="number" defaultValue={parametros.iva} className="w-full border rounded-lg p-2.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Máximo Consumidor Final ($)</label>
                                        <input type="number" defaultValue={parametros.maxConsumidorFinal} className="w-full border rounded-lg p-2.5 text-sm" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Cuentas Predeterminadas</h4>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Cuenta Caja</label>
                                        <select
                                            value={parametros.cuentaCaja}
                                            onChange={e => setParametros({ ...parametros, cuentaCaja: e.target.value })}
                                            className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                        >
                                            <option value="">Seleccione una cuenta...</option>
                                            {planCuentas.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.1.01')).map(c => (
                                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Cuenta IVA Ventas</label>
                                        <select
                                            value={parametros.cuentaIvaVentas}
                                            onChange={e => setParametros({ ...parametros, cuentaIvaVentas: e.target.value })}
                                            className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                        >
                                            <option value="">Seleccione una cuenta...</option>
                                            {planCuentas.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.1.02')).map(c => (
                                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Cuenta IVA Compras</label>
                                        <select
                                            value={parametros.cuentaIvaCompras}
                                            onChange={e => setParametros({ ...parametros, cuentaIvaCompras: e.target.value })}
                                            className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                        >
                                            <option value="">Seleccione una cuenta...</option>
                                            {planCuentas.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.1.04')).map(c => (
                                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Cuentas de Cartera</h4>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">CXC Clientes</label>
                                        <select
                                            value={parametros.cuentaCxcClientes}
                                            onChange={e => setParametros({ ...parametros, cuentaCxcClientes: e.target.value })}
                                            className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                        >
                                            <option value="">Seleccione una cuenta...</option>
                                            {planCuentas.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.1.02')).map(c => (
                                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Anticipo Clientes</label>
                                        <select
                                            value={parametros.cuentaAnticipoClientes}
                                            onChange={e => setParametros({ ...parametros, cuentaAnticipoClientes: e.target.value })}
                                            className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                        >
                                            <option value="">Seleccione una cuenta...</option>
                                            {planCuentas.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.1.01')).map(c => (
                                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">CXP Proveedores</label>
                                        <select
                                            value={parametros.cuentaCxpProveedores}
                                            onChange={e => setParametros({ ...parametros, cuentaCxpProveedores: e.target.value })}
                                            className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                        >
                                            <option value="">Seleccione una cuenta...</option>
                                            {planCuentas.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.1.01')).map(c => (
                                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Anticipo Proveedores</label>
                                        <select
                                            value={parametros.cuentaAnticipoProveedores}
                                            onChange={e => setParametros({ ...parametros, cuentaAnticipoProveedores: e.target.value })}
                                            className="w-full border rounded-lg p-2.5 text-sm font-mono"
                                        >
                                            <option value="">Seleccione una cuenta...</option>
                                            {planCuentas.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.1.02')).map(c => (
                                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleGuardarParametros} className="flex items-center gap-2">
                                    <Save size={18} /> Guardar Parámetros
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showModalRet && (
                <RetencionModal
                    onClose={() => setShowModalRet(false)}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                    retencionEditar={selectedRet}
                />
            )}

            {showModalPunto && (
                <PuntoEmisionModal
                    onClose={() => setShowModalPunto(false)}
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                    sucursales={sucursales}
                    puntoEditar={selectedPunto}
                />
            )}
        </div>
    );
}
