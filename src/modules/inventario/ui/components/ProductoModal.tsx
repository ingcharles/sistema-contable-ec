'use client';

import { useState, useEffect } from 'react';
import { Save, Package, Tag, DollarSign, BarChart2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { useCategorias, useInventarioMutations } from '../../hooks/useInventario';
import { useCatalogos } from '@/shared/hooks/useCatalogos';
import { Modal } from '@/shared/ui/Modal';

interface ProductoModalProps {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const ProductoModal = ({ onClose, onSave, empresaId }: ProductoModalProps) => {
    // Hooks de Negocio
    const { categorias } = useCategorias(empresaId);
    const { guardarProducto, guardando } = useInventarioMutations();
    const [nombre, setNombre] = useState('');
    const [codigo, setCodigo] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [precioVenta, setPrecioVenta] = useState(0);
    const [stockMinimo, setStockMinimo] = useState(1);

    // Manejo de IVA con catálogos dinámicos
    const { getCatalogo, loading: loadingCatalogos } = useCatalogos(['SRI_TIPO_IMPUESTO_IVA']);
    const tarifasIva = getCatalogo('SRI_TIPO_IMPUESTO_IVA');
    const [codigoTarifaIva, setCodigoTarifaIva] = useState('4'); // Por defecto 15% (código 4)

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
                const tarifa15 = tarifasIva.find(t => t.valor.includes('15%'));
                if (tarifa15) setCodigoTarifaIva(tarifa15.codigo);
                else setCodigoTarifaIva(tarifasIva[0].codigo);
            }
        }
    }, [loadingCatalogos, tarifasIva, codigoTarifaIva]);

    const handleGuardar = async () => {
        if (!nombre || !codigo || !categoriaId) {
            alert('Por favor complete los campos obligatorios.');
            return;
        }

        const codigosNoGraban = ['0', '6', '7'];
        const grabaIva = !codigosNoGraban.includes(codigoTarifaIva);

        const resultado = await guardarProducto({
            empresaId,
            codigoPrincipal: codigo,
            codigoAuxiliar: '',
            nombre,
            categoriaId,
            stockActual: 0,
            costoPromedio: 0,
            precioVenta,
            grabaIva,
            stockMinimo,
            activo: true
        });

        if (resultado.success) {
            onSave();
            onClose();
        } else {
            alert(resultado.error);
        }
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose} disabled={guardando}>
                Cancelar
            </Button>
            <Button
                onClick={handleGuardar}
                disabled={guardando}
                className="flex items-center gap-2 min-w-[140px] justify-center"
            >
                {guardando ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Guardando...
                    </>
                ) : (
                    <>
                        <Save size={18} /> Guardar Producto
                    </>
                )}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Registrar Nuevo Producto"
            description="Complete la ficha técnica del artículo."
            icon={<Package size={24} />}
            footer={footer}
            size="lg"
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Tag size={14} className="text-sri-blue" /> Nombre del Producto *
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Laptop Dell Latitude"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <BarChart2 size={14} className="text-sri-blue" /> Código Principal *
                        </label>
                        <input
                            type="text"
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value)}
                            placeholder="Ej: PROD-001"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                        />
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
