'use client';

import React, { useEffect, useState } from 'react';
import { Save, Warehouse } from 'lucide-react';
import { Bodega } from '../../domain/types';
import { Sucursal } from '@/modules/configuracion/domain/types';
import { ConfiguracionUseCases, InventarioUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

interface Props {
    bodega?: Bodega; // Opcional para edición
    onClose: () => void;
    onSave: () => void;
    empresaId: string;
}

export const BodegaModal: React.FC<Props> = ({ bodega, onClose, onSave, empresaId }) => {
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [formData, setFormData] = useState<Partial<Bodega>>({
        nombre: '', codigo: '', responsable: '', ubicacion: '', sucursalId: ''
    });

    useEffect(() => {
        ConfiguracionUseCases.listarSucursales().then(setSucursales);

        if (bodega) {
            setFormData(bodega);
        }
    }, [empresaId, bodega]);

    const handleSave = async () => {
        if (!formData.nombre || !formData.sucursalId) {
            alert('Por favor complete los campos obligatorios (Nombre y Sucursal)');
            return;
        }

        await InventarioUseCases.guardarBodega({
            id: bodega?.id,
            empresaId,
            sucursalId: formData.sucursalId,
            codigo: formData.codigo || '',
            nombre: formData.nombre,
            responsable: formData.responsable || '',
            ubicacion: formData.ubicacion || '',
            activo: true
        });
        onSave();
        onClose();
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
                <Save size={18} /> {bodega ? 'Actualizar Bodega' : 'Guardar Bodega'}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={bodega ? 'Editar Bodega' : 'Nueva Bodega'}
            description="Administre la información física de su inventario."
            icon={<Warehouse size={24} />}
            footer={footer}
            size="md"
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Sucursal Asociada *</label>
                    <select
                        value={formData.sucursalId}
                        onChange={e => setFormData({ ...formData, sucursalId: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium"
                    >
                        <option value="">Seleccione Sucursal...</option>
                        {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Código</label>
                        <input
                            type="text"
                            value={formData.codigo}
                            onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                            placeholder="B001"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre *</label>
                        <input
                            type="text"
                            value={formData.nombre}
                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                            placeholder="Principal"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Responsable</label>
                    <input
                        type="text"
                        value={formData.responsable}
                        onChange={e => setFormData({ ...formData, responsable: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                        placeholder="Nombre del encargado"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Ubicación / Dirección</label>
                    <input
                        type="text"
                        value={formData.ubicacion}
                        onChange={e => setFormData({ ...formData, ubicacion: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all"
                        placeholder="Calle, Sector..."
                    />
                </div>
            </div>
        </Modal>
    );
};

