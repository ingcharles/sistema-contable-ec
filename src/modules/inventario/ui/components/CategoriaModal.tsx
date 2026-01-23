'use client';

import React, { useState, useEffect } from 'react';
import { Save, FolderTree, Type, Package, TrendingDown, TrendingUp } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { CategoriaProducto } from '../../domain/types';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { InventarioUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { useCuentasContables } from '@/modules/contabilidad/hooks/useContabilidad';

interface Props {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
    categoriaEditar?: CategoriaProducto | null;
}

export const CategoriaModal: React.FC<Props> = ({ onClose, onSave, empresaId, categoriaEditar }) => {
    const { cuentas: planCuentas, cargarCuentas } = useCuentasContables();
    const [formData, setFormData] = useState<Partial<CategoriaProducto>>({
        nombre: '',
        cuentaInventario: '',
        cuentaCostoVenta: '',
        cuentaVenta: ''
    });
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        cargarCuentas();
    }, [cargarCuentas]);

    useEffect(() => {
        if (categoriaEditar) {
            setFormData({
                nombre: categoriaEditar.nombre,
                cuentaInventario: categoriaEditar.cuentaInventario,
                cuentaCostoVenta: categoriaEditar.cuentaCostoVenta,
                cuentaVenta: categoriaEditar.cuentaVenta
            });
        }
    }, [categoriaEditar]);

    const handleSave = async () => {
        if (!formData.nombre) return;

        setGuardando(true);
        try {
            if (categoriaEditar && categoriaEditar.id) {
                await InventarioUseCases.actualizarCategoria(categoriaEditar.id, {
                    empresaId,
                    nombre: formData.nombre || '',
                    cuentaInventario: formData.cuentaInventario || '',
                    cuentaCostoVenta: formData.cuentaCostoVenta || '',
                    cuentaVenta: formData.cuentaVenta || '',
                    activa: true
                });
            } else {
                await InventarioUseCases.guardarCategoria({
                    empresaId,
                    nombre: formData.nombre || '',
                    cuentaInventario: formData.cuentaInventario || '',
                    cuentaCostoVenta: formData.cuentaCostoVenta || '',
                    cuentaVenta: formData.cuentaVenta || '',
                    activa: true
                });
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Error al guardar categoría:', error);
            alert('Error al guardar la categoría.');
        } finally {
            setGuardando(false);
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleSave}
            isLoading={guardando}
            isDisabled={!formData.nombre}
            submitLabel={categoriaEditar ? 'Actualizar' : 'Guardar Categoría'}
            submitIcon={<Save size={18} />}
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={categoriaEditar ? 'Editar Categoría' : 'Nueva Categoría'}
            description="Organice su inventario en divisiones para mejor control contable."
            icon={<FolderTree size={24} />}
            footer={footer}
            size="md"
        >
            <div className="space-y-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Type size={14} className="text-sri-blue" /> Nombre de la Categoría *
                    </label>
                    <input
                        type="text"
                        value={formData.nombre}
                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-700 uppercase outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                        placeholder="EJ: LÍNEA BLANCA"
                        disabled={guardando}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <div className="p-1.5 bg-sri-blue/10 rounded-lg">
                            <Package size={16} className="text-sri-blue" />
                        </div>
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Contabilización Automática</h4>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Package size={12} className="text-blue-500" /> Cuenta Inventario (Activo)
                        </label>
                        <select
                            value={formData.cuentaInventario}
                            onChange={e => setFormData({ ...formData, cuentaInventario: e.target.value })}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            disabled={guardando}
                        >
                            <option value="">-- Seleccione cuenta --</option>
                            {planCuentas.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.1.03')).map(c => (
                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <TrendingDown size={12} className="text-red-500" /> Cuenta Costo de Venta (Egreso)
                        </label>
                        <select
                            value={formData.cuentaCostoVenta}
                            onChange={e => setFormData({ ...formData, cuentaCostoVenta: e.target.value })}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            disabled={guardando}
                        >
                            <option value="">-- Seleccione cuenta --</option>
                            {planCuentas.filter(c => c.nivel >= 4 && c.codigo.startsWith('5.1.01')).map(c => (
                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp size={12} className="text-emerald-500" /> Cuenta Venta (Ingreso)
                        </label>
                        <select
                            value={formData.cuentaVenta}
                            onChange={e => setFormData({ ...formData, cuentaVenta: e.target.value })}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-600 outline-none focus:ring-4 focus:ring-sri-blue/10 transition-all"
                            disabled={guardando}
                        >
                            <option value="">-- Seleccione cuenta --</option>
                            {planCuentas.filter(c => c.nivel >= 4 && c.codigo.startsWith('4.1.01')).map(c => (
                                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
