'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Hash, CheckCircle, AlertCircle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { PlanesUseCases } from '@/modules/shared/application/useCases/PlanesUseCases';

interface TipoComprobante {
    id: string;
    codigo: string;
    valor: string;
}

interface Caracteristica {
    id?: string;
    clave: string;
    tipoDocumentoId?: string | null;
    tipoValor: 'NUMERO' | 'BOOLEANO';
    valorNumero?: number;
    valorBooleano?: boolean;
}

interface Plan {
    id?: string;
    codigo: string;
    nombre: string;
    precioMensual: number;
    caracteristicas: Caracteristica[];
}

interface PlanModalProps {
    plan: Plan | null;
    onClose: () => void;
    onSave: () => void;
}

// Mapeo técnico de claves a códigos SRI
const SRI_FEATURES_MAP: Record<string, string> = {
    'MAX_FACTURAS_MENSUALES': '01',
    'MAX_LIQUIDACION_COMPRA': '03',
    'MAX_NOTAS_CREDITO_MENSUALES': '04',
    'MAX_NOTAS_DEBITO_MENSUALES': '05',
    'MAX_GUIAS_MENSUALES': '06',
    'MAX_RETENCIONES_MENSUALES': '07',
};

export default function PlanModal({ plan, onClose, onSave }: PlanModalProps) {
    const [id] = useState(plan?.id);
    const [codigo, setCodigo] = useState(plan?.codigo || '');
    const [nombre, setNombre] = useState(plan?.nombre || '');
    const [precioMensual, setPrecioMensual] = useState(plan?.precioMensual || 0);
    const [caracteristicas, setCaracteristicas] = useState<Caracteristica[]>(plan?.caracteristicas || []);
    const [tiposComprobantes, setTiposComprobantes] = useState<TipoComprobante[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingComprobantes, setLoadingComprobantes] = useState(true);

    useEffect(() => {
        loadTiposComprobantes();
    }, []);

    const loadTiposComprobantes = async () => {
        try {
            const response = await fetch('/api/catalogos?codigos=SRI_TIPO_COMPROBANTE');
            const data = await response.json();
            setTiposComprobantes(data.SRI_TIPO_COMPROBANTE || []);
        } catch (error) {
            console.error('Error cargando tipos de comprobantes:', error);
        } finally {
            setLoadingComprobantes(false);
        }
    };

    const addCaracteristica = () => {
        setCaracteristicas([
            ...caracteristicas,
            { clave: 'NUEVA_CLAVE', tipoValor: 'NUMERO', valorNumero: 0 }
        ]);
    };

    const removeCaracteristica = (index: number) => {
        setCaracteristicas(caracteristicas.filter((_, i) => i !== index));
    };

    const updateCaracteristica = (index: number, updates: Partial<Caracteristica>) => {
        const newChars = [...caracteristicas];
        let finalizedUpdates = { ...updates };

        // Si se actualiza la CLAVE, intentamos mapear el TIPO DOCUMENTO automáticamente
        if (updates.clave) {
            const sriCodigo = SRI_FEATURES_MAP[updates.clave];
            if (sriCodigo) {
                const docType = tiposComprobantes.find(t => t.codigo === sriCodigo);
                if (docType) {
                    finalizedUpdates.tipoDocumentoId = docType.id;
                }
            } else if (!updates.tipoDocumentoId) {
                // Si no es una clave SRI conocida y no se pasó un ID explícito, lo dejamos como general
                // Pero solo si el usuario no está intentando cambiar el docType manualmente en este mismo update
                if (updates.clave !== newChars[index].clave) {
                    // Si cambió la clave y no es SRI, quitamos el docType previo
                    finalizedUpdates.tipoDocumentoId = null;
                }
            }
        }

        newChars[index] = { ...newChars[index], ...finalizedUpdates };
        setCaracteristicas(newChars);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                codigo,
                nombre,
                precioMensual: Number(precioMensual),
                caracteristicas
            };

            if (id) {
                await PlanesUseCases.actualizarPlan(id, payload);
            } else {
                await PlanesUseCases.crearPlan(payload);
            }

            onSave();
        } catch (error) {
            console.error('Error guardando plan:', error);
            alert('Error al guardar el plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            size="2xl"
            title={plan ? 'Editar Plan Comercial' : 'Nuevo Plan Comercial'}
            description="Define el nombre, precio y límites del plan para los usuarios."
            icon={<Package size={24} />}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !codigo || !nombre}>
                        {loading ? 'Guardando...' : plan ? 'Actualizar Plan' : 'Crear Plan'}
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                {/* Datos básicos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-slate-700 mb-1 uppercase text-[10px] tracking-wider">
                            Código Técnico
                        </label>
                        <input
                            type="text"
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                            disabled={!!id}
                            placeholder="ej: PREMIUM"
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sri-blue/20 outline-none font-bold uppercase disabled:bg-slate-50"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-slate-700 mb-1 uppercase text-[10px] tracking-wider">
                            Nombre Visible
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="ej: Plan Premium"
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sri-blue/20 outline-none"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-slate-700 mb-1 uppercase text-[10px] tracking-wider">
                            Precio Mensual ($)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={precioMensual}
                            onChange={(e) => setPrecioMensual(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sri-blue/20 outline-none font-mono"
                        />
                    </div>
                </div>

                {/* Características y Límites */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Plus size={16} className="text-emerald-500" />
                            Características y Límites
                        </h3>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => {
                                setCaracteristicas([
                                    ...caracteristicas,
                                    { clave: 'MAX_FACTURAS_MENSUALES', tipoValor: 'NUMERO', valorNumero: 0, tipoDocumentoId: tiposComprobantes.find(t => t.codigo === '01')?.id }
                                ]);
                            }} className="h-8 text-[10px]">
                                + Facturas
                            </Button>
                            <Button variant="secondary" size="sm" onClick={addCaracteristica} className="h-8 text-xs">
                                <Plus size={14} /> Custom
                            </Button>
                        </div>
                    </div>

                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Característica / Tipo Comprobante</th>
                                    <th className="px-4 py-3 text-left">Tipo</th>
                                    <th className="px-4 py-3 text-left">Valor</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {caracteristicas.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">
                                            No hay características definidas para este plan.
                                        </td>
                                    </tr>
                                ) : (
                                    caracteristicas.map((char, index) => {
                                        const isSriKey = !!SRI_FEATURES_MAP[char.clave];
                                        return (
                                            <tr key={index} className="group hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-1">
                                                        <input
                                                            type="text"
                                                            value={char.clave}
                                                            onChange={(e) => updateCaracteristica(index, { clave: e.target.value.toUpperCase() })}
                                                            placeholder="CLAVE_TECNICA"
                                                            className="px-2 py-1 text-xs border border-slate-200 rounded bg-white font-mono uppercase focus:ring-1 focus:ring-sri-blue"
                                                        />
                                                        <select
                                                            value={char.tipoDocumentoId || ''}
                                                            onChange={(e) => updateCaracteristica(index, { tipoDocumentoId: e.target.value || null })}
                                                            disabled={isSriKey}
                                                            className={`px-2 py-1 text-[10px] border border-slate-200 rounded ${isSriKey ? 'bg-slate-50 text-slate-400 italic cursor-not-allowed' : 'bg-white text-slate-600'}`}
                                                        >
                                                            <option value="">Límite General (Sin Doc)</option>
                                                            {tiposComprobantes.map(t => (
                                                                <option key={t.id} value={t.id}>{t.valor}</option>
                                                            ))}
                                                        </select>
                                                        {isSriKey && (
                                                            <span className="text-[9px] text-sri-blue font-bold px-1 uppercase tracking-tighter">
                                                                Vínculo Automático SRI
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={char.tipoValor}
                                                        onChange={(e) => updateCaracteristica(index, {
                                                            tipoValor: e.target.value as 'NUMERO' | 'BOOLEANO',
                                                            valorNumero: e.target.value === 'NUMERO' ? 0 : undefined,
                                                            valorBooleano: e.target.value === 'BOOLEANO' ? true : undefined
                                                        })}
                                                        className="px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                                                    >
                                                        <option value="NUMERO">Número</option>
                                                        <option value="BOOLEANO">Booleano</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {char.tipoValor === 'NUMERO' ? (
                                                        <div className="relative">
                                                            <Hash size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                            <input
                                                                type="number"
                                                                value={char.valorNumero || 0}
                                                                onChange={(e) => updateCaracteristica(index, { valorNumero: Number(e.target.value) })}
                                                                className="w-24 pl-6 pr-2 py-1 text-xs border border-slate-200 rounded bg-white"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCaracteristica(index, { valorBooleano: !char.valorBooleano })}
                                                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${char.valorBooleano
                                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                                : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                                }`}
                                                        >
                                                            {char.valorBooleano ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                                            {char.valorBooleano ? 'Activado' : 'Desactivado'}
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => removeCaracteristica(index)}
                                                        className="text-slate-300 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
