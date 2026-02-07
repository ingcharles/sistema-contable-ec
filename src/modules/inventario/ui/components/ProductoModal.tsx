'use client';

import { useState, useEffect } from 'react';
import { Save, Package, Tag, DollarSign, BarChart2, AlertCircle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { useConfiguracion } from '@/modules/configuracion/hooks/useConfiguracion';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { useCategorias, useInventarioMutations } from '../../hooks/useInventario';
import { useCatalogos } from '@/shared/hooks/useCatalogos';
import { Producto } from '../../domain/types';

interface ProductoModalProps {
    producto?: Producto;
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const ProductoModal = ({ producto, onClose, onSave, empresaId }: ProductoModalProps) => {
    // Hooks de Negocio
    const { categorias } = useCategorias(empresaId);
    const { guardarProducto, guardando } = useInventarioMutations();
    const [nombre, setNombre] = useState(producto?.nombre || '');
    const [codigo, setCodigo] = useState(producto?.codigoPrincipal || '');
    const [categoriaId, setCategoriaId] = useState(producto?.categoriaId || '');
    const [precioVenta, setPrecioVenta] = useState(producto?.precioVenta || 0);
    const [stockMinimo, setStockMinimo] = useState(producto?.stockMinimo || 1);
    const [unidadMedida, setUnidadMedida] = useState(producto?.unidadMedida || 'UND');
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

    const { parametros, cargarParametros } = useConfiguracion();

    useEffect(() => {
        cargarParametros();
    }, []);

    // Manejo de IVA y Unidades con catálogos dinámicos
    const { getCatalogo, loading: loadingCatalogos } = useCatalogos(['SRI_TIPO_IMPUESTO_IVA', 'SRI_UNIDAD_MEDIDA']);
    const tarifasIva = getCatalogo('SRI_TIPO_IMPUESTO_IVA');
    const unidadesMedida = getCatalogo('SRI_UNIDAD_MEDIDA');
    const [codigoTarifaIva, setCodigoTarifaIva] = useState(producto?.codigoTarifaIva || '4'); // Por defecto 15% (código 4)

    // Seleccionar primera categoría cuando carguen
    useEffect(() => {
        if (!categoriaId && categorias.length > 0) {
            setCategoriaId(categorias[0].id);
        }
    }, [categorias, categoriaId]);

    // Actualizar default tarifa cuando carguen los catálogos si el actual no existe o es inválido
    useEffect(() => {
        if (!loadingCatalogos && tarifasIva.length > 0) {
            const existe = tarifasIva.some(t => t.codigo === codigoTarifaIva);
            if (!existe) {
                const tarifaDinamica = tarifasIva.find(t => t.valor.includes(`${parametros?.ivaValor}%`));
                if (tarifaDinamica) setCodigoTarifaIva(tarifaDinamica.codigo);
                else setCodigoTarifaIva(tarifasIva[0].codigo);
            }
        }
    }, [loadingCatalogos, tarifasIva, codigoTarifaIva]);

    const handleGuardar = async () => {
        if (!nombre || !codigo || !categoriaId) {
            setErrorValidacion('Por favor complete los campos obligatorios marcados con *');
            return;
        }

        const codigosNoGraban = ['0', '6', '7'];
        const grabaIva = !codigosNoGraban.includes(codigoTarifaIva);

        const resultado = await guardarProducto({
            id: producto?.id, // Si existe, es edición
            empresaId,
            codigoPrincipal: codigo,
            codigoAuxiliar: '',
            nombre,
            categoriaId,
            stockActual: producto?.stockActual || 0,
            costoPromedio: producto?.costoPromedio || 0,
            precioVenta,
            grabaIva,
            codigoTarifaIva,
            unidadMedida,
            stockMinimo,
            activo: true
        });

        if (resultado.success) {
            onSave();
            onClose();
        } else {
            setErrorValidacion(resultado.error || 'Error al guardar el producto');
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleGuardar}
            isLoading={guardando}
            submitLabel="Guardar Producto"
            submitIcon={<Save size={18} />}
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={producto ? "Editar Producto" : "Registrar Nuevo Producto"}
            description={producto ? `Actualizando: ${producto.nombre}` : "Complete la ficha técnica del artículo."}
            icon={<Package size={24} />}
            footer={footer}
            size="lg"
        >
            <div className="space-y-6">
                {errorValidacion && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                        <AlertCircle size={18} />
                        {errorValidacion}
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2 col-span-1">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Tag size={14} className="text-sri-blue" /> Nombre *
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Laptop Dell"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <BarChart2 size={14} className="text-sri-blue" /> Código *
                        </label>
                        <input
                            type="text"
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value)}
                            disabled={!!producto}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {producto && <p className="text-[10px] text-slate-500 italic">El código no se puede modificar</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Unidad SRI</label>
                        <select
                            value={unidadMedida}
                            onChange={(e) => setUnidadMedida(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-bold"
                            disabled={loadingCatalogos}
                        >
                            {unidadesMedida.length > 0 ? (
                                unidadesMedida.map(u => (
                                    <option key={u.codigo} value={u.codigo}>{u.valor}</option>
                                ))
                            ) : (
                                <option value="UND">UNIDAD</option>
                            )}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Categoría / Línea *</label>
                        <select
                            value={categoriaId}
                            onChange={(e) => setCategoriaId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                        >
                            {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <DollarSign size={14} className="text-sri-blue" /> Precio de Venta (sin IVA) *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={precioVenta}
                            onChange={(e) => setPrecioVenta(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Stock Mínimo (Alerta)</label>
                        <input
                            type="number"
                            value={stockMinimo}
                            onChange={(e) => setStockMinimo(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Graba IVA</label>
                        <select
                            value={codigoTarifaIva}
                            onChange={(e) => setCodigoTarifaIva(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                            disabled={loadingCatalogos}
                        >
                            {tarifasIva.map(t => (
                                <option key={t.codigo} value={t.codigo}>{t.valor} {t.descripcion ? `- ${t.descripcion}` : ''}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
