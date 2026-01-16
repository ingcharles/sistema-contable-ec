
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Empresa, TipoComprobante } from '../../../types';
import { Sucursal, PuntoEmision, UsuarioSistema, CodigoRetencion } from '../domain/types';
import { InMemoryConfiguracionRepository } from '../infrastructure/ConfiguracionRepository';
import { Save, Shield, Key, Building, FileSignature, RefreshCw, Store, Users, Plus, Edit, Trash2, CheckCircle2, Lock, CalendarOff, AlertTriangle, Percent, X, Table, Calculator, Sliders, BookOpen } from 'lucide-react';

// --- HELPERS PARA TABLA IR (MOCK) ---
const TABLA_IR_2024 = [
    { fraccionBasica: 0, excesoHasta: 11902, impuesto: 0, porcentaje: 0 },
    { fraccionBasica: 11902, excesoHasta: 15159, impuesto: 0, porcentaje: 5 },
    { fraccionBasica: 15159, excesoHasta: 19682, impuesto: 163, porcentaje: 10 },
    { fraccionBasica: 19682, excesoHasta: 26031, impuesto: 615, porcentaje: 12 },
    { fraccionBasica: 26031, excesoHasta: 34255, impuesto: 1377, porcentaje: 15 },
    { fraccionBasica: 34255, excesoHasta: 45407, impuesto: 2611, porcentaje: 20 },
    { fraccionBasica: 45407, excesoHasta: 60450, impuesto: 4841, porcentaje: 25 },
    { fraccionBasica: 60450, excesoHasta: 80605, impuesto: 8602, porcentaje: 30 },
    { fraccionBasica: 80605, excesoHasta: 107199, impuesto: 14648, porcentaje: 35 },
    { fraccionBasica: 107199, excesoHasta: 999999, impuesto: 23956, porcentaje: 37 },
];

const TASAS_INTERES = [
    { periodo: 'Ene-Mar 2024', tasa: 0.88 },
    { periodo: 'Abr-Jun 2024', tasa: 0.92 },
    { periodo: 'Jul-Sep 2024', tasa: 0.95 },
    { periodo: 'Oct-Dic 2023', tasa: 0.85 },
];

// --- SUBCOMPONENTE: MODAL SUCURSAL ---
const SucursalModal = ({ onClose, onSave, empresaId, sucursalEditar }: { onClose: () => void, onSave: () => void, empresaId: string, sucursalEditar?: Sucursal }) => {
    const [formData, setFormData] = useState<Partial<Sucursal>>(sucursalEditar || {
        codigo: '',
        nombre: '',
        direccion: '',
        esMatriz: false,
        activa: true
    });

    const handleSubmit = async () => {
        if (!formData.codigo || !formData.nombre || !formData.direccion) return;
        if (formData.codigo?.length !== 3) {
            alert('El código debe tener 3 dígitos (Ej: 001)');
            return;
        }

        const sucursal: Sucursal = {
            id: sucursalEditar?.id || Math.random().toString(36),
            empresaId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'admin',
            ...formData as Sucursal
        };

        const repo = new InMemoryConfiguracionRepository();
        await repo.saveSucursal(sucursal);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-lg font-bold text-slate-800">{sucursalEditar ? 'Editar' : 'Nueva'} Sucursal</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Código Establecimiento (SRI)</label>
                        <input type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} maxLength={3} placeholder="001" className="w-full border border-slate-200 rounded p-2 text-sm font-mono uppercase" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Comercial</label>
                        <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Sucursal Centro" className="w-full border border-slate-200 rounded p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Dirección Física</label>
                        <input type="text" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="w-full border border-slate-200 rounded p-2 text-sm" />
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input type="checkbox" checked={formData.esMatriz} onChange={e => setFormData({...formData, esMatriz: e.target.checked})} className="rounded text-sri-blue" />
                            Es Matriz
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input type="checkbox" checked={formData.activa} onChange={e => setFormData({...formData, activa: e.target.checked})} className="rounded text-sri-blue" />
                            Activa
                        </label>
                    </div>
                </div>
                <div className="p-5 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-white rounded-lg text-sm">Cancelar</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm hover:bg-sri-light">Guardar</button>
                </div>
            </div>
        </div>
    );
};

// --- SUBCOMPONENTE: MODAL PUNTO EMISIÓN ---
const PuntoEmisionModal = ({ onClose, onSave, empresaId, sucursales, puntoEditar }: { onClose: () => void, onSave: () => void, empresaId: string, sucursales: Sucursal[], puntoEditar?: PuntoEmision }) => {
    const [formData, setFormData] = useState<Partial<PuntoEmision>>(puntoEditar || {
        sucursalId: sucursales[0]?.id || '',
        codigo: '',
        nombre: '',
        activo: true,
        secuenciales: [
            { tipoComprobante: TipoComprobante.FACTURA, secuencialActual: 1 },
            { tipoComprobante: TipoComprobante.RETENCION, secuencialActual: 1 },
            { tipoComprobante: TipoComprobante.NOTA_CREDITO, secuencialActual: 1 },
            { tipoComprobante: TipoComprobante.GUIA_REMISION, secuencialActual: 1 },
            { tipoComprobante: TipoComprobante.LIQUIDACION_COMPRA, secuencialActual: 1 },
        ]
    });

    const updateSecuencial = (tipo: string, val: number) => {
        const secs = [...(formData.secuenciales || [])];
        const idx = secs.findIndex(s => s.tipoComprobante === tipo);
        if (idx >= 0) secs[idx].secuencialActual = val;
        setFormData({ ...formData, secuenciales: secs });
    };

    const handleSubmit = async () => {
        if (!formData.codigo || !formData.nombre || !formData.sucursalId) return;
        if (formData.codigo.length !== 3) {
            alert('El código debe tener 3 dígitos (Ej: 001)');
            return;
        }

        const punto: PuntoEmision = {
            id: puntoEditar?.id || Math.random().toString(36),
            ...formData as PuntoEmision,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'admin'
        };

        const repo = new InMemoryConfiguracionRepository();
        await repo.savePuntoEmision(punto);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-lg font-bold text-slate-800">{puntoEditar ? 'Editar' : 'Nuevo'} Punto de Emisión</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Sucursal</label>
                            <select value={formData.sucursalId} onChange={e => setFormData({...formData, sucursalId: e.target.value})} className="w-full border border-slate-200 rounded p-2 text-sm bg-white">
                                {sucursales.map(s => <option key={s.id} value={s.id}>{s.codigo} - {s.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Código Punto (Caja)</label>
                            <input type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} maxLength={3} placeholder="001" className="w-full border border-slate-200 rounded p-2 text-sm font-mono uppercase" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Descriptivo</label>
                        <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Caja Principal" className="w-full border border-slate-200 rounded p-2 text-sm" />
                    </div>
                    
                    <div className="border-t border-slate-100 pt-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Secuenciales Iniciales (Próximo a emitir)</h3>
                        <div className="space-y-2">
                            {formData.secuenciales?.map(sec => (
                                <div key={sec.tipoComprobante} className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 w-1/2">
                                        {sec.tipoComprobante === '01' ? 'Factura' : 
                                         sec.tipoComprobante === '07' ? 'Retención' : 
                                         sec.tipoComprobante === '04' ? 'N. Crédito' : 
                                         sec.tipoComprobante === '06' ? 'Guía' : sec.tipoComprobante}
                                    </span>
                                    <input 
                                        type="number" 
                                        value={sec.secuencialActual} 
                                        onChange={e => updateSecuencial(sec.tipoComprobante, parseInt(e.target.value))}
                                        className="w-1/2 border border-slate-200 rounded p-1.5 text-sm text-right font-mono"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-5 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-white rounded-lg text-sm">Cancelar</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm hover:bg-sri-light">Guardar</button>
                </div>
            </div>
        </div>
    );
};

export const ConfiguracionPage: React.FC = () => {
    const { currentEmpresa } = useOutletContext<{ currentEmpresa: Empresa }>();
    const [activeTab, setActiveTab] = useState<'general' | 'sucursales' | 'secuenciales' | 'usuarios' | 'firma' | 'impuestos' | 'cierre' | 'intereses' | 'contabilizacion'>('general');
    
    // Estados para datos
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [puntosEmision, setPuntosEmision] = useState<PuntoEmision[]>([]);
    const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
    const [retenciones, setRetenciones] = useState<CodigoRetencion[]>([]);
    const [fechaCierre, setFechaCierre] = useState('');
    const [loading, setLoading] = useState(false);

    // Estados Modales
    const [showModalRet, setShowModalRet] = useState(false);
    const [showModalSucursal, setShowModalSucursal] = useState(false);
    const [showModalPunto, setShowModalPunto] = useState(false);
    
    const [newRet, setNewRet] = useState<Partial<CodigoRetencion>>({ tipo: 'RENTA', codigo: '', concepto: '', porcentaje: 0, activo: true });
    const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | undefined>(undefined);
    const [selectedPunto, setSelectedPunto] = useState<PuntoEmision | undefined>(undefined);

    // Calculadora Intereses
    const [calcMonto, setCalcMonto] = useState(0);
    const [calcDias, setCalcDias] = useState(30);
    const [calcTasa, setCalcTasa] = useState(0.95);

    // Parámetros Generales Mock
    const [params, setParams] = useState({
        sbu: 460,
        iva: 15,
        maxConsumidorFinal: 50,
        cuentaCaja: '1.1.01.01',
        cuentaIvaVentas: '2.1.07.01',
        cuentaIvaCompras: '1.1.05.01',
        cuentaRetRentaPorPagar: '2.1.03.01'
    });

    useEffect(() => {
        loadData();
    }, [currentEmpresa.id, activeTab]);

    const loadData = async () => {
        setLoading(true);
        const repo = new InMemoryConfiguracionRepository();
        
        if (activeTab === 'sucursales' || activeTab === 'secuenciales') {
            const suc = await repo.getSucursales(currentEmpresa.id);
            setSucursales(suc);
            if (activeTab === 'secuenciales') {
                const ptos = await repo.getPuntosEmision(currentEmpresa.id);
                setPuntosEmision(ptos);
            }
        } else if (activeTab === 'usuarios') {
            const us = await repo.getUsuarios(currentEmpresa.id);
            setUsuarios(us);
        } else if (activeTab === 'impuestos') {
            const rets = await repo.getCodigosRetencion(currentEmpresa.id);
            setRetenciones(rets);
        } else if (activeTab === 'cierre') {
            const fecha = await repo.getFechaCierre(currentEmpresa.id);
            setFechaCierre(fecha);
        }
        setLoading(false);
    };

    const handleGuardarCierre = async () => {
        const repo = new InMemoryConfiguracionRepository();
        await repo.setFechaCierre(currentEmpresa.id, fechaCierre);
        alert('Fecha de cierre actualizada. No se podrán registrar transacciones anteriores a esta fecha.');
    };

    const handleSaveRetencion = async () => {
        if (!newRet.codigo || !newRet.concepto) return;
        const repo = new InMemoryConfiguracionRepository();
        const retencion: CodigoRetencion = {
            id: newRet.id || Math.random().toString(36),
            empresaId: currentEmpresa.id,
            codigo: newRet.codigo!,
            concepto: newRet.concepto!,
            porcentaje: Number(newRet.porcentaje),
            tipo: newRet.tipo as 'RENTA' | 'IVA',
            activo: newRet.activo!,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'admin'
        };
        await repo.saveCodigoRetencion(retencion);
        setShowModalRet(false);
        setNewRet({ tipo: 'RENTA', codigo: '', concepto: '', porcentaje: 0, activo: true });
        loadData();
    };

    const handleDeleteRetencion = async (id: string) => {
        if(window.confirm('¿Eliminar código de retención?')) {
            const repo = new InMemoryConfiguracionRepository();
            await repo.deleteCodigoRetencion(id);
            loadData();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Configuración del Sistema</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Administración integral para <span className="font-semibold text-sri-blue">{currentEmpresa.razonSocial}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm">
                        <Save size={16} /> Guardar Cambios
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar Menu */}
                <div className="md:col-span-1 space-y-1">
                    <button onClick={() => setActiveTab('general')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'general' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <Building size={18} /> Datos Empresa
                    </button>
                    <button onClick={() => setActiveTab('sucursales')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'sucursales' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <Store size={18} /> Sucursales
                    </button>
                    <button onClick={() => setActiveTab('secuenciales')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'secuenciales' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <FileSignature size={18} /> Puntos de Emisión
                    </button>
                    <button onClick={() => setActiveTab('impuestos')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'impuestos' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <Percent size={18} /> Impuestos y Retenciones
                    </button>
                    <button onClick={() => setActiveTab('contabilizacion')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'contabilizacion' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <Sliders size={18} /> Parámetros y Cuentas
                    </button>
                    <button onClick={() => setActiveTab('intereses')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'intereses' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <Calculator size={18} /> Tabla de Intereses
                    </button>
                    <button onClick={() => setActiveTab('usuarios')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'usuarios' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <Users size={18} /> Usuarios y Roles
                    </button>
                    <button onClick={() => setActiveTab('firma')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'firma' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <Shield size={18} /> Firma Electrónica
                    </button>
                    <button onClick={() => setActiveTab('cierre')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${activeTab === 'cierre' ? 'bg-white shadow-sm text-sri-blue border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <CalendarOff size={18} /> Cierre de Periodos
                    </button>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3 space-y-6">
                    
                    {/* ... (Previous tabs content remains the same: general, sucursales, secuenciales, impuestos) ... */}
                    {activeTab === 'general' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6 animate-in fade-in duration-300">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Información Tributaria</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Razón Social</label>
                                    <input type="text" defaultValue={currentEmpresa.razonSocial} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Nombre Comercial</label>
                                    <input type="text" defaultValue={currentEmpresa.nombreComercial} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">RUC</label>
                                    <input type="text" defaultValue={currentEmpresa.ruc} disabled className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-500 cursor-not-allowed" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Dirección Matriz</label>
                                    <input type="text" defaultValue={currentEmpresa.direccionMatriz} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none" />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 pt-4">Parámetros SRI</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                                    <input type="checkbox" defaultChecked={currentEmpresa.obligadoContabilidad} className="h-4 w-4 text-sri-blue rounded focus:ring-sri-blue" />
                                    <span className="text-sm text-slate-700 font-medium">Obligado a Llevar Contabilidad</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                                    <input type="checkbox" defaultChecked={currentEmpresa.agenteRetencion} className="h-4 w-4 text-sri-blue rounded focus:ring-sri-blue" />
                                    <span className="text-sm text-slate-700 font-medium">Agente de Retención</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sucursales' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6 animate-in fade-in duration-300">
                             <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <h3 className="text-lg font-bold text-slate-800">Establecimientos (Sucursales)</h3>
                                <button 
                                    onClick={() => { setSelectedSucursal(undefined); setShowModalSucursal(true); }}
                                    className="text-xs bg-sri-blue text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-sri-light"
                                >
                                    <Plus size={14} /> Nueva Sucursal
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600 font-semibold">
                                        <tr>
                                            <th className="px-4 py-2">Código</th>
                                            <th className="px-4 py-2">Nombre Comercial</th>
                                            <th className="px-4 py-2">Dirección</th>
                                            <th className="px-4 py-2 text-center">Es Matriz</th>
                                            <th className="px-4 py-2 text-center">Estado</th>
                                            <th className="px-4 py-2 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sucursales.map(suc => (
                                            <tr key={suc.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-mono font-bold text-slate-700">{suc.codigo}</td>
                                                <td className="px-4 py-3 font-medium text-slate-800">{suc.nombre}</td>
                                                <td className="px-4 py-3 text-slate-500 text-xs">{suc.direccion}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {suc.esMatriz && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">MATRIZ</span>}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${suc.activa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {suc.activa ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button 
                                                        onClick={() => { setSelectedSucursal(suc); setShowModalSucursal(true); }}
                                                        className="text-slate-400 hover:text-sri-blue"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'secuenciales' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6 animate-in fade-in duration-300">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <h3 className="text-lg font-bold text-slate-800">Puntos de Emisión y Secuenciales</h3>
                                <button 
                                    onClick={() => { setSelectedPunto(undefined); setShowModalPunto(true); }}
                                    className="text-xs bg-sri-blue text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-sri-light"
                                >
                                    <Plus size={14} /> Nuevo Punto
                                </button>
                            </div>
                            
                            {/* Group by Sucursal */}
                            {sucursales.map(suc => {
                                const ptos = puntosEmision.filter(p => p.sucursalId === suc.id);
                                if (ptos.length === 0) return null;
                                return (
                                    <div key={suc.id} className="border border-slate-200 rounded-lg overflow-hidden">
                                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between">
                                            <span className="font-bold text-slate-700 text-sm">Establecimiento {suc.codigo} - {suc.nombre}</span>
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {ptos.map(pto => (
                                                <div key={pto.id} className="p-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="bg-blue-100 text-blue-700 font-mono font-bold px-2 py-1 rounded text-xs">{suc.codigo}-{pto.codigo}</div>
                                                            <span className="font-medium text-slate-800 text-sm">{pto.nombre}</span>
                                                        </div>
                                                        <button 
                                                            onClick={() => { setSelectedPunto(pto); setShowModalPunto(true); }}
                                                            className="text-xs text-sri-blue hover:underline"
                                                        >
                                                            Configurar
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                                        {pto.secuenciales.map((sec, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs">
                                                                <span className="text-slate-500 font-medium">
                                                                    {sec.tipoComprobante === '01' ? 'Factura' : 
                                                                     sec.tipoComprobante === '07' ? 'Retención' : 
                                                                     sec.tipoComprobante === '04' ? 'N. Crédito' : 
                                                                     sec.tipoComprobante === '06' ? 'Guía' : sec.tipoComprobante}
                                                                </span>
                                                                <span className="font-mono text-slate-700">{String(sec.secuencialActual).padStart(9, '0')}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'impuestos' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">Códigos de Retención</h3>
                                        <p className="text-xs text-slate-500">Configuración para retenciones en la fuente</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowModalRet(true)}
                                        className="text-xs bg-sri-blue text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-sri-light"
                                    >
                                        <Plus size={14} /> Nuevo Código
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2 w-20">Código</th>
                                                <th className="px-4 py-2">Concepto</th>
                                                <th className="px-4 py-2 text-center w-24">Tipo</th>
                                                <th className="px-4 py-2 text-right w-24">% Ret.</th>
                                                <th className="px-4 py-2 text-center w-20">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {retenciones.map(ret => (
                                                <tr key={ret.id} className="hover:bg-slate-50 group">
                                                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{ret.codigo}</td>
                                                    <td className="px-4 py-3 text-slate-700">{ret.concepto}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${ret.tipo === 'RENTA' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {ret.tipo}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">{ret.porcentaje}%</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button 
                                                            onClick={() => handleDeleteRetencion(ret.id)}
                                                            className="text-slate-400 hover:text-red-500 p-1"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* TABLA DE IMPUESTO A LA RENTA */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <Table size={18} className="text-sri-blue" />
                                            Tabla Impuesto a la Renta (2024)
                                        </h3>
                                        <p className="text-xs text-slate-500">Personas Naturales - Art. 36 LORTI</p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2 text-right">Fracción Básica</th>
                                                <th className="px-4 py-2 text-right">Exceso Hasta</th>
                                                <th className="px-4 py-2 text-right">Imp. Frac. Básica</th>
                                                <th className="px-4 py-2 text-right">% Imp. Excedente</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {TABLA_IR_2024.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="px-4 py-2 text-right font-mono text-slate-600">{row.fraccionBasica.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                                    <td className="px-4 py-2 text-right font-mono text-slate-600">{row.excesoHasta.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                                    <td className="px-4 py-2 text-right font-mono text-slate-600">{row.impuesto.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                                    <td className="px-4 py-2 text-right font-mono font-bold text-slate-800">{row.porcentaje}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contabilizacion' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Parámetros Generales */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                                    <Sliders size={18} className="text-sri-blue" /> Parámetros Generales (Variables del Sistema)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Salario Básico (SBU)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                            <input type="number" value={params.sbu} onChange={e => setParams({...params, sbu: parseFloat(e.target.value)})} className="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Tarifa IVA Vigente (%)</label>
                                        <input type="number" value={params.iva} onChange={e => setParams({...params, iva: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Max. Consumidor Final ($)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                            <input type="number" value={params.maxConsumidorFinal} onChange={e => setParams({...params, maxConsumidorFinal: parseFloat(e.target.value)})} className="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mapeo Contable */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                                    <BookOpen size={18} className="text-sri-blue" /> Mapeo de Cuentas Contables (Automatización)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-700 mb-3 bg-blue-50 p-2 rounded">Ventas y Cuentas por Cobrar</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Cuenta IVA Ventas (Pasivo)</label>
                                                <input type="text" value={params.cuentaIvaVentas} onChange={e => setParams({...params, cuentaIvaVentas: e.target.value})} className="w-full font-mono text-sm border rounded p-2" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Caja General (Default)</label>
                                                <input type="text" value={params.cuentaCaja} onChange={e => setParams({...params, cuentaCaja: e.target.value})} className="w-full font-mono text-sm border rounded p-2" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-orange-700 mb-3 bg-orange-50 p-2 rounded">Compras y Cuentas por Pagar</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Cuenta IVA Compras (Activo)</label>
                                                <input type="text" value={params.cuentaIvaCompras} onChange={e => setParams({...params, cuentaIvaCompras: e.target.value})} className="w-full font-mono text-sm border rounded p-2" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Retención Renta por Pagar</label>
                                                <input type="text" value={params.cuentaRetRentaPorPagar} onChange={e => setParams({...params, cuentaRetRentaPorPagar: e.target.value})} className="w-full font-mono text-sm border rounded p-2" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'intereses' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Tabla de Intereses por Mora Tributaria</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-600 mb-2">Tasas Trimestrales (Referencial)</h4>
                                        <table className="w-full text-sm text-left border border-slate-200 rounded-lg overflow-hidden">
                                            <thead className="bg-slate-50 text-slate-600">
                                                <tr>
                                                    <th className="px-4 py-2">Periodo</th>
                                                    <th className="px-4 py-2 text-right">Tasa Mensual (%)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {TASAS_INTERES.map((rate, i) => (
                                                    <tr key={i} className="border-t border-slate-100">
                                                        <td className="px-4 py-2">{rate.periodo}</td>
                                                        <td className="px-4 py-2 text-right font-bold">{rate.tasa}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                        <h4 className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
                                            <Calculator size={16} /> Calculadora Simple
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-bold text-blue-700 mb-1">Monto Deuda ($)</label>
                                                <input type="number" value={calcMonto} onChange={e => setCalcMonto(parseFloat(e.target.value))} className="w-full p-2 rounded border border-blue-200 text-right" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-blue-700 mb-1">Días Mora</label>
                                                    <input type="number" value={calcDias} onChange={e => setCalcDias(parseFloat(e.target.value))} className="w-full p-2 rounded border border-blue-200 text-center" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-blue-700 mb-1">Tasa Aplicable (%)</label>
                                                    <input type="number" value={calcTasa} onChange={e => setCalcTasa(parseFloat(e.target.value))} className="w-full p-2 rounded border border-blue-200 text-center" />
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-blue-200">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-blue-700">Interés Generado:</span>
                                                    <span className="font-bold text-blue-900">
                                                        ${((calcMonto * (calcTasa/100) * calcDias) / 30).toFixed(2)}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-blue-500 mt-1 italic">* Cálculo referencial basado en fórmula simple (Monto * Tasa * Meses).</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'usuarios' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6 animate-in fade-in duration-300">
                             <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <h3 className="text-lg font-bold text-slate-800">Usuarios del Sistema</h3>
                                <button className="text-xs bg-sri-blue text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-sri-light">
                                    <Plus size={14} /> Nuevo Usuario
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600 font-semibold">
                                        <tr>
                                            <th className="px-4 py-2">Nombre</th>
                                            <th className="px-4 py-2">Email</th>
                                            <th className="px-4 py-2">Rol</th>
                                            <th className="px-4 py-2">Estado</th>
                                            <th className="px-4 py-2 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {usuarios.map(u => (
                                            <tr key={u.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-800">{u.nombreCompleto}</td>
                                                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                                                <td className="px-4 py-3">
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">{u.rol}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                                                        <CheckCircle2 size={12} /> {u.estado}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                    <button className="text-slate-400 hover:text-slate-600"><Lock size={16} /></button>
                                                    <button className="text-slate-400 hover:text-sri-blue"><Edit size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'firma' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6 animate-in fade-in duration-300">
                             <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Firma Electrónica</h3>
                             <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                                <Key className="text-sri-blue mt-1" size={20} />
                                <div>
                                    <h4 className="text-sm font-bold text-sri-blue">Certificado Digital Vigente</h4>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Emitido por: SECURITY DATA S.A.<br/>
                                        Válido hasta: 15/12/2024 (280 días restantes)
                                    </p>
                                </div>
                                <button className="ml-auto text-xs font-medium text-blue-600 hover:underline">Actualizar</button>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Ruta Archivo (.p12)</label>
                                    <div className="flex gap-2">
                                        <input type="text" value="firma_electronica_2023.p12" disabled className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-500" />
                                        <button className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors">
                                            <RefreshCw size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Contraseña Firma</label>
                                    <input type="password" value="********" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none" />
                                </div>
                             </div>
                             
                             <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 pt-4">Conexión SRI</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Ambiente</label>
                                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none">
                                        <option value="1">PRUEBAS</option>
                                        <option value="2" selected>PRODUCCIÓN</option>
                                    </select>
                                </div>
                             </div>
                        </div>
                    )}

                    {activeTab === 'cierre' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6 animate-in fade-in duration-300">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                                <Lock size={20} className="text-red-500" /> Bloqueo de Periodos Contables
                            </h3>
                            
                            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="text-red-600 mt-1" size={20} />
                                    <div>
                                        <h4 className="text-sm font-bold text-red-800">Advertencia de Seguridad</h4>
                                        <p className="text-xs text-red-700 mt-1">
                                            Al establecer una fecha de cierre, el sistema <strong>bloqueará</strong> la creación, edición o anulación de cualquier documento (Asientos, Facturas, Retenciones, etc.) con fecha anterior o igual a la fecha seleccionada.
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
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all"
                                    />
                                    <button 
                                        onClick={handleGuardarCierre}
                                        className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-900/10 flex items-center gap-2 whitespace-nowrap"
                                    >
                                        <Lock size={18} /> Bloquear Periodo
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 ml-1">
                                    Último cierre registrado: {fechaCierre || 'No definido'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals remain unchanged ... */}
            {showModalRet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                            <h2 className="text-lg font-bold text-slate-800">Nuevo Código de Retención</h2>
                            <button onClick={() => setShowModalRet(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Tipo de Impuesto</label>
                                <select 
                                    value={newRet.tipo} 
                                    onChange={e => setNewRet({ ...newRet, tipo: e.target.value as any })}
                                    className="w-full border border-slate-200 rounded p-2 text-sm"
                                >
                                    <option value="RENTA">Impuesto a la Renta</option>
                                    <option value="IVA">Impuesto al Valor Agregado (IVA)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Código SRI</label>
                                <input 
                                    type="text" 
                                    value={newRet.codigo} 
                                    onChange={e => setNewRet({ ...newRet, codigo: e.target.value })}
                                    className="w-full border border-slate-200 rounded p-2 text-sm"
                                    placeholder="Ej: 312"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Concepto</label>
                                <input 
                                    type="text" 
                                    value={newRet.concepto} 
                                    onChange={e => setNewRet({ ...newRet, concepto: e.target.value })}
                                    className="w-full border border-slate-200 rounded p-2 text-sm"
                                    placeholder="Descripción de la retención"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Porcentaje (%)</label>
                                <input 
                                    type="number" 
                                    value={newRet.porcentaje} 
                                    onChange={e => setNewRet({ ...newRet, porcentaje: parseFloat(e.target.value) })}
                                    className="w-full border border-slate-200 rounded p-2 text-sm"
                                    placeholder="Ej: 1.75"
                                />
                            </div>
                        </div>
                        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
                            <button onClick={() => setShowModalRet(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">Cancelar</button>
                            <button onClick={handleSaveRetencion} className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm hover:bg-sri-light">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {showModalSucursal && (
                <SucursalModal 
                    onClose={() => setShowModalSucursal(false)} 
                    onSave={loadData} 
                    empresaId={currentEmpresa.id} 
                    sucursalEditar={selectedSucursal}
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
};
