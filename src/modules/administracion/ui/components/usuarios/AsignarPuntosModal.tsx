'use client';

import { useState, useEffect } from 'react';
import {
    X,
    Search,
    CheckCircle2,
    Building2,
    ArrowRight,
    ArrowLeft,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/shared/ui/Button';

interface PuntoEmision {
    id: string;
    codigo: string;
    nombre: string;
    sucursal: string;
    activo: boolean;
}

interface AsignacionConfig {
    puntoEmisionId: string;
    esPrincipal: boolean;
    puedeCambiar: boolean;
    activo: boolean;
}

interface AsignarPuntosModalProps {
    usuario: { id: string; nombre: string; puntosAsignados: any[] };
    onClose: () => void;
    onSave: () => void;
}

export function AsignarPuntosModal({ usuario, onClose, onSave }: AsignarPuntosModalProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [puntosDisponibles, setPuntosDisponibles] = useState<PuntoEmision[]>([]);
    const [selectedPuntos, setSelectedPuntos] = useState<string[]>([]);
    const [configuraciones, setConfiguraciones] = useState<Record<string, AsignacionConfig>>({});
    const [searchTerm, setSearchTerm] = useState('');

    // Cargar puntos disponibles y configuración actual
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Cargar todos los puntos de la empresa
                const res = await fetch('/api/administracion/puntos-emision');
                const data = await res.json();

                if (data.puntos) {
                    setPuntosDisponibles(data.puntos);

                    // Pre-seleccionar los que ya tiene el usuario
                    const currentIds = usuario.puntosAsignados?.map(p => p.puntoEmisionId) || [];
                    setSelectedPuntos(currentIds);

                    // Pre-configurar
                    const initialConfig: Record<string, AsignacionConfig> = {};
                    usuario.puntosAsignados?.forEach(p => {
                        initialConfig[p.puntoEmisionId] = {
                            puntoEmisionId: p.puntoEmisionId,
                            esPrincipal: p.esPrincipal,
                            puedeCambiar: true,
                            activo: p.activo
                        };
                    });
                    setConfiguraciones(initialConfig);
                }
            } catch (error) {
                console.error('Error cargando puntos:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [usuario]);

    const handleTogglePunto = (puntoId: string) => {
        setSelectedPuntos(prev => {
            const isSelected = prev.includes(puntoId);
            if (isSelected) {
                // Remover
                const newSelection = prev.filter(id => id !== puntoId);
                const newConfig = { ...configuraciones };
                delete newConfig[puntoId];
                setConfiguraciones(newConfig);
                return newSelection;
            } else {
                // Agregar
                const newSelection = [...prev, puntoId];
                setConfiguraciones(curr => ({
                    ...curr,
                    [puntoId]: {
                        puntoEmisionId: puntoId,
                        esPrincipal: newSelection.length === 1, // Si es el primero, es principal
                        puedeCambiar: true,
                        activo: newSelection.length === 1 // Si es el primero, es activo
                    }
                }));
                return newSelection;
            }
        });
    };

    const handleConfigChange = (puntoId: string, field: keyof AsignacionConfig, value: boolean) => {
        setConfiguraciones(curr => {
            const newConfig = { ...curr };

            if (field === 'esPrincipal' && value === true) {
                // Solo uno puede ser principal, desmarcar otros
                Object.keys(newConfig).forEach(k => {
                    newConfig[k] = { ...newConfig[k], esPrincipal: false };
                });
            }

            newConfig[puntoId] = { ...newConfig[puntoId], [field]: value };
            return newConfig;
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                usuarioId: usuario.id,
                puntosEmision: selectedPuntos.map(id => configuraciones[id])
            };

            const res = await fetch('/api/administracion/usuarios/asignar-puntos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Error al guardar');

            onSave();
            onClose();
        } catch (error) {
            alert('Error al guardar asignaciones');
        } finally {
            setLoading(false);
        }
    };

    const filteredPuntos = puntosDisponibles.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo.includes(searchTerm) ||
        p.sucursal.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Asignar Puntos de Emisión</h2>
                        <p className="text-sm text-slate-500">Usuario: <span className="font-medium text-slate-900">{usuario.nombre}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Progress Steps */}
                    <div className="flex items-center justify-center mb-8">
                        <div className={`flex items-center gap-2 ${step === 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 1 ? 'bg-blue-100' : 'bg-slate-100'}`}>1</div>
                            <span className="text-sm font-medium">Selección</span>
                        </div>
                        <div className="w-16 h-px bg-slate-200 mx-4" />
                        <div className={`flex items-center gap-2 ${step === 2 ? 'text-blue-600' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? 'bg-blue-100' : 'bg-slate-100'}`}>2</div>
                            <span className="text-sm font-medium">Configuración</span>
                        </div>
                    </div>

                    {step === 1 ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar puntos de emisión..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div className="grid gap-3">
                                {filteredPuntos.map(punto => {
                                    const isSelected = selectedPuntos.includes(punto.id);
                                    return (
                                        <div
                                            key={punto.id}
                                            onClick={() => handleTogglePunto(punto.id)}
                                            className={`
                                                flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all
                                                ${isSelected
                                                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                                                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`
                                                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                                    ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300'}
                                                `}>
                                                    {isSelected && <CheckCircle2 size={14} />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-slate-900">{punto.codigo}</span>
                                                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                                            {punto.sucursal}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-500">{punto.nombre}</p>
                                                </div>
                                            </div>
                                            <Building2 className={isSelected ? 'text-blue-400' : 'text-slate-300'} size={20} />
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between items-center mt-4 text-sm text-slate-500">
                                <span>{selectedPuntos.length} puntos seleccionados</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start">
                                <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                                <div className="text-sm text-blue-800">
                                    <p className="font-bold mb-1">Configuración de Preferencias</p>
                                    <p>Define cuál será el punto principal (se activa al iniciar sesión) y si el usuario puede cambiar entre puntos.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {selectedPuntos.map(id => {
                                    const punto = puntosDisponibles.find(p => p.id === id);
                                    const config = configuraciones[id];
                                    if (!punto || !config) return null;

                                    return (
                                        <div key={id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                                                <div className="p-2 bg-slate-100 rounded-lg">
                                                    <Building2 size={18} className="text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{punto.nombre}</p>
                                                    <p className="text-xs text-slate-500 font-mono">{punto.codigo} - {punto.sucursal}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="flex items-center justify-between cursor-pointer group">
                                                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                                                        Marcar como Principal
                                                    </span>
                                                    <input
                                                        type="radio"
                                                        name="principal"
                                                        checked={config.esPrincipal}
                                                        onChange={() => handleConfigChange(id, 'esPrincipal', true)}
                                                        className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                    />
                                                </label>

                                                <label className="flex items-center justify-between cursor-pointer group">
                                                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                                                        Permitir cambiar
                                                    </span>
                                                    <input
                                                        type="checkbox"
                                                        checked={config.puedeCambiar}
                                                        onChange={(e) => handleConfigChange(id, 'puedeCambiar', e.target.checked)}
                                                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex justify-between bg-slate-50 rounded-b-2xl">
                    {step === 1 ? (
                        <>
                            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                            <Button
                                onClick={() => setStep(2)}
                                disabled={selectedPuntos.length === 0}
                                className="gap-2"
                            >
                                Siguiente <ArrowRight size={18} />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                                <ArrowLeft size={18} /> Atrás
                            </Button>
                            <Button onClick={handleSave} disabled={loading} className="gap-2">
                                {loading ? 'Guardando...' : 'Guardar Asignaciones'}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
