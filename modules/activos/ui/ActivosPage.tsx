
import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Empresa } from '../../../types';
import { ActivoFijo, CategoriaActivo, EstadoActivo } from '../domain/types';
import { InMemoryActivosRepository } from '../infrastructure/ActivosRepository';
import { InMemoryContabilidadRepository } from '../../contabilidad/infrastructure/ContabilidadRepository';
import { AsientoContable } from '../../contabilidad/domain/types';
import { formatMoney } from '../../../services/sriService';
import { Monitor, Plus, Search, Filter, TrendingDown, Tag, User, MapPin, Calculator, Save, X, Truck, Armchair, Hammer, Building } from 'lucide-react';

const CategoriaIcon = ({ categoria }: { categoria: CategoriaActivo }) => {
    switch(categoria) {
        case CategoriaActivo.VEHICULOS: return <Truck size={16} />;
        case CategoriaActivo.MUEBLES_ENSERES: return <Armchair size={16} />;
        case CategoriaActivo.MAQUINARIA: return <Hammer size={16} />;
        case CategoriaActivo.EDIFICIOS: return <Building size={16} />;
        default: return <Monitor size={16} />;
    }
};

const NuevoActivoModal = ({ onClose, onSave, empresaId }: { onClose: () => void, onSave: () => void, empresaId: string }) => {
    const [nombre, setNombre] = useState('');
    const [codigo, setCodigo] = useState('');
    const [costo, setCosto] = useState(0);
    const [categoria, setCategoria] = useState<CategoriaActivo>(CategoriaActivo.EQUIPO_COMPUTO);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [custodio, setCustodio] = useState('');

    const vidaUtilDefault = (cat: CategoriaActivo) => {
        switch(cat) {
            case CategoriaActivo.EDIFICIOS: return 20;
            case CategoriaActivo.MUEBLES_ENSERES: return 10;
            case CategoriaActivo.MAQUINARIA: return 10;
            case CategoriaActivo.VEHICULOS: return 5;
            case CategoriaActivo.EQUIPO_COMPUTO: return 3;
            default: return 3;
        }
    };

    const [vidaUtil, setVidaUtil] = useState(vidaUtilDefault(categoria));

    useEffect(() => {
        setVidaUtil(vidaUtilDefault(categoria));
    }, [categoria]);

    const depMensual = vidaUtil > 0 ? costo / (vidaUtil * 12) : 0;

    const handleGuardar = async () => {
        if(!nombre || !codigo) return;

        const nuevo: ActivoFijo = {
            id: Math.random().toString(36),
            empresaId,
            codigo,
            nombre,
            descripcion: 'Registro Manual',
            categoria,
            fechaAdquisicion: fecha,
            proveedor: 'N/A',
            facturaCompra: 'N/A',
            costoAdquisicion: costo,
            valorResidual: 0,
            vidaUtilAnios: vidaUtil,
            depreciacionAcumulada: 0,
            depreciacionMensual: depMensual,
            custodio,
            ubicacion: 'Matriz',
            estado: EstadoActivo.ACTIVO,
            valorLibros: costo,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'admin'
        };

        const repo = new InMemoryActivosRepository();
        await repo.save(nuevo);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800">Registrar Activo Fijo</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código</label>
                            <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="EJ: EQ-001" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                            <select value={categoria} onChange={e => setCategoria(e.target.value as CategoriaActivo)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                {Object.values(CategoriaActivo).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Activo</label>
                        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Descripción breve" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Compra</label>
                            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Costo ($)</label>
                            <input type="number" value={costo} onChange={e => setCosto(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-right" />
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vida Útil (Años)</label>
                            <input type="number" value={vidaUtil} onChange={e => setVidaUtil(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-center" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Depreciación Mensual Est.</label>
                            <div className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-right font-bold text-slate-700">
                                {formatMoney(depMensual)}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Custodio / Responsable</label>
                        <input type="text" value={custodio} onChange={e => setCustodio(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Nombre del empleado" />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancelar</button>
                    <button onClick={handleGuardar} className="px-6 py-2 bg-sri-blue text-white font-medium rounded-lg hover:bg-sri-light shadow-sm flex items-center gap-2">
                        <Save size={18} /> Guardar Activo
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ActivosPage: React.FC = () => {
    const { currentEmpresa } = useOutletContext<{ currentEmpresa: Empresa }>();
    const [activos, setActivos] = useState<ActivoFijo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const repo = new InMemoryActivosRepository();
        const data = await repo.getAll(currentEmpresa.id);
        setActivos(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [currentEmpresa.id]);

    const handleDepreciar = async () => {
        // Calcular depreciación total del mes
        const activosDepreciables = activos.filter(a => a.estado === EstadoActivo.ACTIVO);
        const totalDepreciacion = activosDepreciables.reduce((acc, a) => acc + a.depreciacionMensual, 0);

        if (totalDepreciacion <= 0) {
            alert("No hay activos para depreciar o el valor es cero.");
            return;
        }

        const fecha = new Date().toISOString().split('T')[0];
        const asiento: AsientoContable = {
            id: Math.random().toString(36),
            empresaId: currentEmpresa.id,
            numero: `DEP-${new Date().getMonth()+1}-${new Date().getFullYear()}`,
            fecha,
            glosa: `Depreciación Mensual Activos Fijos - ${new Date().toLocaleDateString('es-EC', {month: 'long', year: 'numeric'})}`,
            tipo: 'AJUSTE',
            estado: 'MAYORIZADO',
            totalDebe: totalDepreciacion,
            totalHaber: totalDepreciacion,
            detalles: [
                { cuentaCodigo: '5.1.03.01', cuentaNombre: 'GASTO DEPRECIACIÓN ACTIVOS FIJOS', debe: totalDepreciacion, haber: 0 },
                { cuentaCodigo: '1.2.03.99', cuentaNombre: 'DEPRECIACIÓN ACUMULADA ACTIVOS FIJOS', debe: 0, haber: totalDepreciacion }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        };

        const repoContabilidad = new InMemoryContabilidadRepository();
        await repoContabilidad.saveAsiento(asiento);
        
        // En una app real, actualizaríamos la depreciación acumulada de cada activo en la BD
        // Aquí solo simulamos el asiento
        
        alert(`Depreciación generada correctamente por ${formatMoney(totalDepreciacion)}. Se ha creado el asiento contable de ajuste.`);
    };

    const totalActivos = activos.reduce((acc, a) => acc + a.costoAdquisicion, 0);
    const totalDepreciacion = activos.reduce((acc, a) => acc + a.depreciacionAcumulada, 0);
    const totalValorLibros = activos.reduce((acc, a) => acc + a.valorLibros, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Activos Fijos y Depreciación</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Control de bienes, custodios y generación automática de asientos de depreciación.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleDepreciar}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"
                    >
                        <Calculator size={16} /> Correr Depreciación
                    </button>
                    <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-sri-blue text-white rounded-lg text-sm font-medium hover:bg-sri-light flex items-center gap-2 shadow-sm">
                        <Plus size={16} /> Nuevo Activo
                    </button>
                </div>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <p className="text-sm font-medium text-slate-500 mb-2">Costo Histórico Total</p>
                    <h3 className="text-2xl font-bold text-slate-800">{formatMoney(totalActivos)}</h3>
                    <div className="h-1 w-full bg-slate-100 mt-4 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-full rounded-full"></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <p className="text-sm font-medium text-slate-500 mb-2">Depreciación Acumulada</p>
                    <h3 className="text-2xl font-bold text-red-600">-{formatMoney(totalDepreciacion)}</h3>
                    <div className="h-1 w-full bg-slate-100 mt-4 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: `${(totalDepreciacion/totalActivos)*100}%` }}></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <p className="text-sm font-medium text-slate-500 mb-2">Valor Neto en Libros</p>
                    <h3 className="text-2xl font-bold text-green-600">{formatMoney(totalValorLibros)}</h3>
                    <div className="h-1 w-full bg-slate-100 mt-4 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${(totalValorLibros/totalActivos)*100}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Listado */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Buscar activo..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Código / Nombre</th>
                                <th className="px-6 py-4">Categoría</th>
                                <th className="px-6 py-4">Ubicación / Custodio</th>
                                <th className="px-6 py-4 text-right">Costo</th>
                                <th className="px-6 py-4 text-right">Dep. Acum.</th>
                                <th className="px-6 py-4 text-right">Valor Libros</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activos.map(activo => (
                                <tr key={activo.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800">{activo.nombre}</span>
                                            <span className="text-xs text-slate-500 font-mono">{activo.codigo}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600 text-xs bg-slate-100 px-2 py-1 rounded w-fit">
                                            <CategoriaIcon categoria={activo.categoria} />
                                            {activo.categoria.replace('_', ' ')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-xs text-slate-500">
                                            <div className="flex items-center gap-1"><MapPin size={12}/> {activo.ubicacion}</div>
                                            <div className="flex items-center gap-1"><User size={12}/> {activo.custodio}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                                        {formatMoney(activo.costoAdquisicion)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-red-600 text-xs">
                                        -{formatMoney(activo.depreciacionAcumulada)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-green-700">
                                        {formatMoney(activo.valorLibros)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">{activo.estado}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <NuevoActivoModal 
                    onClose={() => setShowModal(false)} 
                    onSave={loadData}
                    empresaId={currentEmpresa.id}
                />
            )}
        </div>
    );
};
