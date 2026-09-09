import { useState, useEffect } from 'react';
import { Box, Calendar, DollarSign, Save, Hash, Clock, Package, Target } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { useActivosMutations } from '../../hooks/useActivos';
import { ContabilidadUseCases, ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { CuentaContable } from '@/shared/types';
import { useToast } from '@/shared/context/ToastContext';

interface ActivoFijoModalProps {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

interface CatalogoItem {
    codigo: string;
    valor: string;
}

export const ActivoFijoModal = ({ onClose, onSave }: ActivoFijoModalProps) => {
    const [nombre, setNombre] = useState('');
    const [codigo, setCodigo] = useState('');
    const [categoria, setCategoria] = useState('');
    const [categorias, setCategorias] = useState<CatalogoItem[]>([]);
    const [fechaAdquisicion, setFechaAdquisicion] = useState(new Date().toISOString().split('T')[0]);
    const [valorOriginal, setValorOriginal] = useState(0);
    const [vidaUtil, setVidaUtil] = useState(10);
    const [valorResidual] = useState(0);
    const [cuentaGasto, setCuentaGasto] = useState('');
    const [cuentaDepAcumulada, setCuentaDepAcumulada] = useState('');
    const [planCuentas, setPlanCuentas] = useState<CuentaContable[]>([]);

    const { guardarActivo, guardando } = useActivosMutations();
    const { showToast } = useToast();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [cuentas, cats] = await Promise.all([
                    ContabilidadUseCases.listarCuentas(),
                    ConfiguracionUseCases.obtenerCatalogo('ACTIVOS_FIJOS_CATEGORIA')
                ]);
                setPlanCuentas(cuentas);
                setCategorias(cats);
                if (cats.length > 0) {
                    setCategoria(cats[0].codigo);
                }
            } catch (error) {
                console.error('Error loading data:', error);
                showToast('Error al cargar datos iniciales', 'error');
            }
        };
        loadData();
    }, []);

    const planMovimiento = planCuentas.filter(c => c.nivel >= 4);

    const handleGuardar = async () => {
        try {
            await guardarActivo({
                nombre,
                codigo,
                categoria,
                fechaAdquisicion,
                valorAdquisicion: valorOriginal,
                valorResidual,
                vidaUtilMeses: vidaUtil * 12,
                depreciacionAcumulada: 0,
                valorLibros: valorOriginal,
                estado: 'EN_USO',
                cuentaGasto,
                cuentaDepAcumulada
            });
            showToast('Activo guardado exitosamente', 'success');
            onSave();
            onClose();
        } catch (err: any) {
            showToast(err.message || 'Error al guardar activo', 'error');
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleGuardar}
            isLoading={guardando}
            isDisabled={!nombre || !codigo || valorOriginal <= 0 || !categoria}
            submitLabel="Guardar Activo"
            submitIcon={<Save size={18} />}
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Registrar Nuevo Activo Fijo"
            description="Ingreso de bienes para control y depreciación."
            icon={<Box size={24} className="text-indigo-600" />}
            footer={footer}
            size="lg"
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Package size={14} className="text-sri-blue" /> Nombre del Activo *
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Laptop Dell XPS 15"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 uppercase outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Hash size={14} className="text-sri-blue" /> Código / Serie *
                        </label>
                        <input
                            type="text"
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value)}
                            placeholder="Ej: ACT-001"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-700 uppercase outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Target size={14} className="text-sri-blue" /> Categoría *
                        </label>
                        <select
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        >
                            {categorias.length === 0 && <option value="">Cargando...</option>}
                            {categorias.map(cat => (
                                <option key={cat.codigo} value={cat.codigo}>{cat.valor}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={14} className="text-sri-blue" /> Fecha de Adquisición *
                        </label>
                        <input
                            type="date"
                            value={fechaAdquisicion}
                            onChange={(e) => setFechaAdquisicion(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign size={14} className="text-emerald-600" /> Valor de Adquisición *
                        </label>
                        <input
                            type="number"
                            value={valorOriginal}
                            onChange={(e) => setValorOriginal(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-mono font-bold text-emerald-700 text-right outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gasto Depreciación</label>
                        <select
                            value={cuentaGasto}
                            onChange={(e) => setCuentaGasto(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                        >
                            <option value="">Seleccione cuenta...</option>
                            {planMovimiento.filter(c => c.codigo.startsWith('5')).map(c => (
                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dep. Acumulada</label>
                        <select
                            value={cuentaDepAcumulada}
                            onChange={(e) => setCuentaDepAcumulada(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                        >
                            <option value="">Seleccione cuenta...</option>
                            {planMovimiento.filter(c => c.codigo.startsWith('1.2.02')).map(c => (
                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Clock size={14} className="text-indigo-600" /> Vida Útil (Años) *
                        </label>
                        <input
                            type="number"
                            value={vidaUtil}
                            onChange={(e) => setVidaUtil(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-black text-indigo-700 text-center outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            min="1"
                        />
                    </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-700 uppercase tracking-wider">Depreciación Anual Estimada:</span>
                        <span className="font-mono font-black text-indigo-900">
                            ${vidaUtil > 0 ? ((valorOriginal - valorResidual) / vidaUtil).toFixed(2) : '0.00'}
                        </span>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

