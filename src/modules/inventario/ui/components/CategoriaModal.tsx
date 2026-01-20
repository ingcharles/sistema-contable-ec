'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CategoriaProducto } from '../../domain/types';
import { Button } from '@/shared/ui/Button';
import { InMemoryInventarioRepository } from '@/modules/inventario/infrastructure/InventarioRepository';
import { InMemoryContabilidadRepository } from '@/modules/contabilidad/infrastructure/ContabilidadRepository';
import { CuentaContable } from '@/shared/types';

interface Props {
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
    categoriaEditar?: CategoriaProducto | null;
}

export const CategoriaModal: React.FC<Props> = ({ onClose, onSave, empresaId, categoriaEditar }) => {
    const [formData, setFormData] = useState<Partial<CategoriaProducto>>({
        nombre: '',
        cuentaInventario: '',
        cuentaCostoVenta: '',
        cuentaVenta: ''
    });
    const [planCuentas, setPlanCuentas] = useState<CuentaContable[]>([]);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        const loadPlan = async () => {
            const repo = new InMemoryContabilidadRepository();
            const pc = await repo.getPlanCuentas(empresaId);
            setPlanCuentas(pc);
        };
        loadPlan();
    }, [empresaId]);

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
            const repo = new InMemoryInventarioRepository();
            await repo.saveCategoria({
                id: categoriaEditar?.id || Math.random().toString(36).substr(2, 9),
                empresaId,
                nombre: formData.nombre || '',
                cuentaInventario: formData.cuentaInventario || '',
                cuentaCostoVenta: formData.cuentaCostoVenta || '',
                cuentaVenta: formData.cuentaVenta || '',
                createdAt: categoriaEditar?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: categoriaEditar?.createdBy || 'admin'
            });

            onSave();
            onClose();
        } catch (error) {
            console.error('Error al guardar categoría:', error);
            alert('Error al guardar la categoría.');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95">
                <div className="p-5 border-b flex justify-between">
                    <h3 className="font-bold text-slate-800">
                        {categoriaEditar ? 'Editar Categoría' : 'Nueva Categoría (División Artículo)'}
                    </h3>
                    <button onClick={onClose} disabled={guardando}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Categoría</label>
                        <input
                            type="text"
                            value={formData.nombre}
                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            className="w-full border rounded p-2 text-sm"
                            placeholder="EJ: LINEA BLANCA"
                            disabled={guardando}
                        />
                    </div>
                    <div className="bg-slate-50 p-4 rounded border border-slate-100 space-y-3">
                        <h4 className="text-xs font-bold text-sri-blue">Contabilización Automática</h4>
                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Cuenta Inventario (Activo)</label>
                            <select
                                value={formData.cuentaInventario}
                                onChange={e => setFormData({ ...formData, cuentaInventario: e.target.value })}
                                className="w-full border rounded p-1.5 text-xs font-mono"
                                disabled={guardando}
                            >
                                <option value="">Seleccione una cuenta...</option>
                                {planCuentas.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.1.03')).map(c => (
                                    <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Cuenta Costo Venta (Costo)</label>
                            <select
                                value={formData.cuentaCostoVenta}
                                onChange={e => setFormData({ ...formData, cuentaCostoVenta: e.target.value })}
                                className="w-full border rounded p-1.5 text-xs font-mono"
                                disabled={guardando}
                            >
                                <option value="">Seleccione una cuenta...</option>
                                {planCuentas.filter(c => c.nivel >= 4 && c.codigo.startsWith('5.1.01')).map(c => (
                                    <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-600 mb-1">Cuenta Venta (Ingreso)</label>
                            <select
                                value={formData.cuentaVenta}
                                onChange={e => setFormData({ ...formData, cuentaVenta: e.target.value })}
                                className="w-full border rounded p-1.5 text-xs font-mono"
                                disabled={guardando}
                            >
                                <option value="">Seleccione una cuenta...</option>
                                {planCuentas.filter(c => c.nivel >= 4 && c.codigo.startsWith('4.1.01')).map(c => (
                                    <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="p-5 border-t flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose} disabled={guardando}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={guardando}>
                        {guardando ? 'Guardando...' : (categoriaEditar ? 'Guardar Cambios' : 'Guardar')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
