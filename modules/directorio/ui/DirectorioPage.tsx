
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Empresa, TipoIdentificacion } from '../../../types';
import { Tercero, TipoTercero } from '../domain/types';
import { InMemoryDirectorioRepository } from '../infrastructure/DirectorioRepository';
import { Search, Plus, Download, Edit2, Trash2, Phone, Mail, MapPin, Building2, User, Filter, X, Save } from 'lucide-react';
import { validarRuc } from '../../../services/sriService';

// --- MODAL NUEVO/EDITAR TERCERO ---
const TerceroModal = ({ onClose, onSave, empresaId, terceroEditar }: { onClose: () => void, onSave: () => void, empresaId: string, terceroEditar?: Tercero }) => {
    const [formData, setFormData] = useState<Partial<Tercero>>(terceroEditar || {
        tipoIdentificacion: TipoIdentificacion.RUC,
        identificacion: '',
        razonSocial: '',
        nombreComercial: '',
        tipo: TipoTercero.CLIENTE,
        direccion: '',
        telefono: '',
        email: '',
        esContribuyenteEspecial: false,
        obligadoContabilidad: false,
        parteRelacionada: false
    });

    const [errorId, setErrorId] = useState('');

    const handleChange = (field: keyof Tercero, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        if (field === 'identificacion') {
            if (formData.tipoIdentificacion === TipoIdentificacion.RUC && !validarRuc(value)) {
                setErrorId('RUC inválido');
            } else {
                setErrorId('');
            }
        }
    };

    const handleSubmit = async () => {
        if (!formData.identificacion || !formData.razonSocial || !formData.email) return;
        
        const newTercero: Tercero = {
            id: terceroEditar?.id || Math.random().toString(36),
            empresaId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'user',
            ...formData as Tercero
        };

        const repo = new InMemoryDirectorioRepository();
        await repo.save(newTercero);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800">
                        {terceroEditar ? 'Editar Contacto' : 'Nuevo Contacto'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Identificación */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Identificación</label>
                            <select 
                                value={formData.tipoIdentificacion}
                                onChange={e => handleChange('tipoIdentificacion', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                            >
                                <option value="RUC">RUC</option>
                                <option value="CEDULA">Cédula</option>
                                <option value="PASAPORTE">Pasaporte</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                            <input 
                                type="text" 
                                value={formData.identificacion}
                                onChange={e => handleChange('identificacion', e.target.value)}
                                className={`w-full border rounded-lg p-2 text-sm ${errorId ? 'border-red-500' : 'border-slate-200'}`}
                            />
                            {errorId && <span className="text-xs text-red-500">{errorId}</span>}
                        </div>
                    </div>

                    {/* Nombres */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social / Nombres</label>
                             <input 
                                type="text" 
                                value={formData.razonSocial}
                                onChange={e => handleChange('razonSocial', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm uppercase"
                             />
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Comercial (Opcional)</label>
                             <input 
                                type="text" 
                                value={formData.nombreComercial}
                                onChange={e => handleChange('nombreComercial', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm uppercase"
                             />
                        </div>
                    </div>

                    {/* Clasificación */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Relación</label>
                            <select 
                                value={formData.tipo}
                                onChange={e => handleChange('tipo', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                            >
                                <option value="CLIENTE">Cliente</option>
                                <option value="PROVEEDOR">Proveedor</option>
                                <option value="AMBOS">Ambos</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                            <input 
                                type="text" 
                                value={formData.telefono}
                                onChange={e => handleChange('telefono', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                            />
                        </div>
                    </div>

                    {/* Contacto */}
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Email (Para Facturación Electrónica)</label>
                         <input 
                            type="email" 
                            value={formData.email}
                            onChange={e => handleChange('email', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                         />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                         <input 
                            type="text" 
                            value={formData.direccion}
                            onChange={e => handleChange('direccion', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                         />
                    </div>

                    {/* Datos Tributarios */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Información Tributaria (SRI)</h3>
                        <div className="grid grid-cols-2 gap-4">
                             <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.obligadoContabilidad} onChange={e => handleChange('obligadoContabilidad', e.target.checked)} className="rounded text-sri-blue" />
                                <span className="text-sm text-slate-700">Obligado Contabilidad</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.esContribuyenteEspecial} onChange={e => handleChange('esContribuyenteEspecial', e.target.checked)} className="rounded text-sri-blue" />
                                <span className="text-sm text-slate-700">Contribuyente Especial</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.parteRelacionada} onChange={e => handleChange('parteRelacionada', e.target.checked)} className="rounded text-sri-blue" />
                                <span className="text-sm text-slate-700">Parte Relacionada</span>
                             </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancelar</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-sri-blue text-white font-medium rounded-lg hover:bg-sri-light flex items-center gap-2 shadow-sm">
                        <Save size={18} /> Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- PAGINA PRINCIPAL ---
export const DirectorioPage: React.FC = () => {
    const { currentEmpresa } = useOutletContext<{ currentEmpresa: Empresa }>();
    const [terceros, setTerceros] = useState<Tercero[]>([]);
    const [filtro, setFiltro] = useState('');
    const [tipoFiltro, setTipoFiltro] = useState<'TODOS' | 'CLIENTE' | 'PROVEEDOR'>('TODOS');
    const [modalOpen, setModalOpen] = useState(false);
    const [terceroEdit, setTerceroEdit] = useState<Tercero | undefined>(undefined);

    const loadData = async () => {
        const repo = new InMemoryDirectorioRepository();
        const data = await repo.getAll(currentEmpresa.id);
        setTerceros(data);
    };

    useEffect(() => {
        loadData();
    }, [currentEmpresa.id]);

    const handleEdit = (tercero: Tercero) => {
        setTerceroEdit(tercero);
        setModalOpen(true);
    };

    const handleNew = () => {
        setTerceroEdit(undefined);
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este contacto?')) {
            const repo = new InMemoryDirectorioRepository();
            await repo.delete(id);
            loadData();
        }
    };

    const filtered = terceros.filter(t => {
        const matchesText = t.razonSocial.toLowerCase().includes(filtro.toLowerCase()) || t.identificacion.includes(filtro);
        const matchesType = tipoFiltro === 'TODOS' || t.tipo === tipoFiltro || t.tipo === 'AMBOS';
        return matchesText && matchesType;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Directorio de Contactos</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Gestión de Clientes y Proveedores para facturación y retenciones.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                        <Download size={16} /> Exportar Excel
                    </button>
                    <button onClick={handleNew} className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm">
                        <Plus size={16} /> Nuevo Contacto
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Filtros */}
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4">
                     <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar por Razón Social o RUC..." 
                            value={filtro}
                            onChange={e => setFiltro(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none" 
                        />
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setTipoFiltro('TODOS')} 
                            className={`px-4 py-2 text-sm font-medium rounded-lg border ${tipoFiltro === 'TODOS' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                            Todos
                        </button>
                        <button 
                            onClick={() => setTipoFiltro('CLIENTE')} 
                            className={`px-4 py-2 text-sm font-medium rounded-lg border ${tipoFiltro === 'CLIENTE' ? 'bg-sri-blue text-white border-sri-blue' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                            Clientes
                        </button>
                        <button 
                            onClick={() => setTipoFiltro('PROVEEDOR')} 
                            className={`px-4 py-2 text-sm font-medium rounded-lg border ${tipoFiltro === 'PROVEEDOR' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                            Proveedores
                        </button>
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Razón Social / Comercial</th>
                                <th className="px-6 py-3">Identificación</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Contacto</th>
                                <th className="px-6 py-3">Ubicación</th>
                                <th className="px-6 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((tercero) => (
                                <tr key={tercero.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800">{tercero.razonSocial}</span>
                                            {tercero.nombreComercial && <span className="text-xs text-slate-500">{tercero.nombreComercial}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs">
                                            {tercero.identificacion}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            tercero.tipo === 'CLIENTE' ? 'bg-blue-100 text-blue-700' : 
                                            tercero.tipo === 'PROVEEDOR' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {tercero.tipo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-xs text-slate-600">
                                            <div className="flex items-center gap-1"><Mail size={12} className="text-slate-400" /> {tercero.email}</div>
                                            {tercero.telefono && <div className="flex items-center gap-1"><Phone size={12} className="text-slate-400" /> {tercero.telefono}</div>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-xs text-slate-600 truncate max-w-[150px]" title={tercero.direccion}>
                                            <MapPin size={12} className="text-slate-400 flex-shrink-0" /> {tercero.direccion}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleEdit(tercero)} className="p-1.5 text-slate-500 hover:text-sri-blue hover:bg-blue-50 rounded transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(tercero.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">
                                        No se encontraron contactos.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalOpen && (
                <TerceroModal 
                    onClose={() => setModalOpen(false)} 
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                    terceroEditar={terceroEdit}
                />
            )}
        </div>
    );
};
