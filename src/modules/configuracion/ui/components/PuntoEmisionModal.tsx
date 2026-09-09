'use client';

import { useState, useEffect } from 'react';
import { Save, Monitor, Building2, Hash, Layers, ToggleLeft, ToggleRight, AlertCircle, Users, Check, Info, FileText } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { PuntoEmision, Sucursal, UsuarioSistema } from '../../domain/types';
import { ConfiguracionUseCases, UsuariosUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { CatalogoItem } from '../../domain/types';

interface PuntoEmisionModalProps {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
    sucursales: Sucursal[];
    puntoEditar?: PuntoEmision;
}

export const PuntoEmisionModal = ({ onClose, onSave, sucursales, puntoEditar }: Omit<PuntoEmisionModalProps, 'empresaId'>) => {
    const [formData, setFormData] = useState<Partial<PuntoEmision>>(puntoEditar || {
        sucursalId: sucursales[0]?.id || '',
        codigo: '',
        nombre: '',
        activo: true,
        requiereAsignacion: true,
        permiteMultiplesUsuarios: true,
        descripcion: '',
        usuariosAsignados: [],
        secuenciales: []
    });

    const [catalogoComprobantes, setCatalogoComprobantes] = useState<CatalogoItem[]>([]);
    const [cargandoCatalogo, setCargandoCatalogo] = useState(false);

    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [guardando, setGuardando] = useState(false);
    const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

    useEffect(() => {
        const loadCatalogo = async () => {
            setCargandoCatalogo(true);
            try {
                const items = await ConfiguracionUseCases.obtenerCatalogo('SRI_TIPO_COMPROBANTE');
                setCatalogoComprobantes(items || []);

                // Si es un punto nuevo, inicializar secuenciales con todos los tipos del catálogo
                if (!puntoEditar) {
                    const initialSecs = (items || []).map((item: any) => ({
                        tipoComprobanteId: item.id,
                        secuencialActual: 1
                    }));
                    setFormData(prev => ({ ...prev, secuenciales: initialSecs }));
                }
            } catch (error) {
                console.error('Error al cargar catálogo SRI:', error);
            } finally {
                setCargandoCatalogo(false);
            }
        };

        const loadUsuarios = async () => {
            setCargandoUsuarios(true);
            try {
                const res = await UsuariosUseCases.listarUsuarios();
                setUsuarios(res.usuarios || []);
            } catch (error) {
                console.error('Error al cargar usuarios:', error);
            } finally {
                setCargandoUsuarios(false);
            }
        };

        loadCatalogo();
        loadUsuarios();
    }, [puntoEditar]);

    const handleSubmit = async () => {
        if (!formData.codigo || !formData.nombre || !formData.sucursalId) {
            setErrorValidacion('Complete los campos obligatorios (Sucursal, Código y Nombre)');
            return;
        }

        setGuardando(true);
        setErrorValidacion(null);
        try {
            await ConfiguracionUseCases.guardarPuntoEmision({
                ...formData,
                id: puntoEditar?.id
            });
            onSave();
            onClose();
        } catch (error: any) {
            console.error(error);
            setErrorValidacion(error.message || 'Error al guardar punto de emisión');
        } finally {
            setGuardando(false);
        }
    };

    const updateSecuencial = (index: number, val: number) => {
        const newSecs = [...(formData.secuenciales || [])];
        newSecs[index].secuencialActual = val;
        setFormData({ ...formData, secuenciales: newSecs });
    };

    const toggleUsuario = (usuarioId: string) => {
        const current = formData.usuariosAsignados || [];
        const isSelected = current.includes(usuarioId);
        const next = isSelected
            ? current.filter(id => id !== usuarioId)
            : [...current, usuarioId];
        setFormData({ ...formData, usuariosAsignados: next });
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleSubmit}
            isLoading={guardando}
            submitLabel="Guardar Punto"
            submitIcon={<Save size={18} />}
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={puntoEditar ? 'Editar Punto de Emisión' : 'Nuevo Punto de Emisión'}
            description="Configure una caja o terminal de facturación, sus secuenciales y usuarios autorizados."
            icon={<Monitor size={24} />}
            footer={footer}
            size="xl"
        >
            <div className="space-y-6">
                {errorValidacion && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-sm font-medium">{errorValidacion}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* COLUMNA IZQUIERDA: CONFIGURACIÓN BÁSICA */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Info size={14} className="text-sri-blue" /> Datos Generales
                            </h3>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Building2 size={14} className="text-sri-blue" /> Sucursal de Pertenencia *
                                </label>
                                <select
                                    value={formData.sucursalId}
                                    onChange={e => setFormData({ ...formData, sucursalId: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-medium text-xs"
                                >
                                    {sucursales.map(s => (
                                        <option key={s.id} value={s.id}>{s.codigo} - {s.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5 flex flex-col items-center">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 w-full">
                                        <Hash size={14} className="text-sri-blue" /> Código *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.codigo}
                                        onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all font-black text-center text-sri-blue text-lg"
                                        maxLength={3}
                                        placeholder="001"
                                    />
                                </div>
                                <div className="sm:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Monitor size={14} className="text-sri-blue" /> Nombre de Caja *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all text-sm font-medium"
                                        placeholder="Ej: Caja Principal"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={14} className="text-sri-blue" /> Descripción / Notas
                                </label>
                                <textarea
                                    value={formData.descripcion || ''}
                                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all text-xs font-medium resize-none"
                                    placeholder="Detalles adicionales sobre este punto..."
                                />
                            </div>
                        </div>

                        {/* CONFIGURACIONES DE SEGURIDAD */}
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Users size={14} className="text-sri-blue" /> Políticas de Emisión
                            </h3>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <div className="space-y-0.5">
                                        <h4 className="text-[11px] font-black text-slate-700 uppercase leading-tight">Estado Operativo</h4>
                                        <p className="text-[9px] text-slate-500">¿El punto está listo para emitir?</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                                        className={`p-1.5 rounded-lg transition-all ${formData.activo ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'}`}
                                    >
                                        {formData.activo ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <div className="space-y-0.5">
                                        <h4 className="text-[11px] font-black text-slate-700 uppercase leading-tight">Asignación Obligatoria</h4>
                                        <p className="text-[9px] text-slate-500">Solo usuarios con acceso explícito</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, requiereAsignacion: !formData.requiereAsignacion })}
                                        className={`p-1.5 rounded-lg transition-all ${formData.requiereAsignacion ? 'bg-blue-500 text-white' : 'bg-slate-300 text-white'}`}
                                    >
                                        {formData.requiereAsignacion ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <div className="space-y-0.5">
                                        <h4 className="text-[11px] font-black text-slate-700 uppercase leading-tight">Multi-Usuario</h4>
                                        <p className="text-[9px] text-slate-500">Varios usuarios al mismo tiempo</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, permiteMultiplesUsuarios: !formData.permiteMultiplesUsuarios })}
                                        className={`p-1.5 rounded-lg transition-all ${formData.permiteMultiplesUsuarios ? 'bg-blue-500 text-white' : 'bg-slate-300 text-white'}`}
                                    >
                                        {formData.permiteMultiplesUsuarios ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: SECUENCIALES Y ASIGNACIONES */}
                    <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                        {/* SECUENCIALES */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-sri-blue">
                                    <Layers size={18} />
                                    <h3 className="text-xs font-black uppercase tracking-widest">Secuenciales de Documentos</h3>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full uppercase">Configuración de Folios</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {cargandoCatalogo ? (
                                    <div className="col-span-full py-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sri-blue mx-auto"></div>
                                        <p className="text-[10px] text-slate-400 mt-2">Cargando tipos de comprobante...</p>
                                    </div>
                                ) : (
                                    formData.secuenciales?.map((sec, idx) => {
                                        const compInfo = catalogoComprobantes.find(c => c.id === sec.tipoComprobanteId);
                                        return (
                                            <div key={sec.tipoComprobanteId} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate" title={compInfo?.valor}>
                                                        {compInfo?.valor || 'Desconocido'}
                                                    </span>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={sec.secuencialActual}
                                                            onChange={e => updateSecuencial(idx, Number(e.target.value))}
                                                            className="w-full pl-3 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-right font-black text-sri-blue outline-none focus:ring-2 focus:ring-sri-blue/10"
                                                        />
                                                        <span className="absolute -top-3 -right-1 px-1.5 py-0.5 bg-sri-blue text-[7px] text-white rounded-md font-black shadow-sm uppercase">SIGUIENTE</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* ASIGNACIÓN DE USUARIOS */}
                        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[400px]">
                            <div className="flex items-center justify-between mb-4 shrink-0">
                                <div className="flex items-center gap-2 text-sri-blue">
                                    <Users size={18} />
                                    <h3 className="text-xs font-black uppercase tracking-widest">Usuarios Autorizados</h3>
                                </div>
                                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                    {formData.usuariosAsignados?.length || 0} SELECCIONADOS
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                {cargandoUsuarios ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sri-blue"></div>
                                    </div>
                                ) : usuarios.length === 0 ? (
                                    <div className="text-center p-8 border-2 border-dashed border-slate-100 rounded-xl">
                                        <p className="text-xs text-slate-400 font-medium">No hay usuarios disponibles</p>
                                    </div>
                                ) : (
                                    usuarios.map(u => {
                                        const isSelected = formData.usuariosAsignados?.includes(u.id);
                                        return (
                                            <button
                                                key={u.id}
                                                onClick={() => toggleUsuario(u.id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 'hover:bg-slate-50 border-transparent'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                        <Users size={16} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{u.nombre}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">{u.email}</p>
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-200'}`}>
                                                    {isSelected && <Check size={12} strokeWidth={4} />}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
