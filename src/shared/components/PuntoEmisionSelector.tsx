'use client';

import { useState } from 'react';
import { usePuntoEmision } from '@/shared/context/PuntoEmisionContext';
import { ChevronDown, Building2, CheckCircle2, AlertCircle } from 'lucide-react';

export function PuntoEmisionSelector() {
    const { puntoActivo, puntosDisponibles, loading, cambiarPuntoActivo, tienePuntosAsignados } = usePuntoEmision();
    const [isOpen, setIsOpen] = useState(false);

    // Si no tiene puntos asignados, mostrar advertencia
    if (!tienePuntosAsignados && !loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
                <AlertCircle size={16} />
                <span className="font-medium">Sin punto asignado</span>
            </div>
        );
    }

    // Si está cargando
    if (loading && !puntoActivo) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-slate-500 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent"></div>
                <span>Cargando...</span>
            </div>
        );
    }

    // Si no hay punto activo pero sí puntos disponibles
    if (!puntoActivo && tienePuntosAsignados) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                <AlertCircle size={16} />
                <span className="font-medium">Seleccione punto de emisión</span>
            </div>
        );
    }

    const handleCambiarPunto = async (puntoId: string) => {
        setIsOpen(false);
        const success = await cambiarPuntoActivo(puntoId);
        if (!success) {
            alert('Error al cambiar punto de emisión');
        }
    };

    return (
        <div className="relative">
            {/* Botón del selector */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={puntosDisponibles.length <= 1}
                className={`
                    flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-lg
                    hover:bg-slate-50 hover:border-slate-300 transition-all
                    ${puntosDisponibles.length <= 1 ? 'cursor-default' : 'cursor-pointer'}
                    ${isOpen ? 'ring-2 ring-sri-blue ring-opacity-20' : ''}
                `}
            >
                {/* Icono */}
                <div className="p-1.5 bg-sri-blue bg-opacity-10 rounded-lg">
                    <Building2 size={18} className="text-sri-blue" />
                </div>

                {/* Info del punto activo */}
                <div className="flex flex-col items-start">
                    <span className="text-xs text-slate-500 font-medium">{puntoActivo?.nombrePunto}</span>
                    <span className="text-sm font-bold text-slate-800">
                        {puntoActivo?.codigoCompleto || 'N/A'}
                    </span>
                </div>

                {/* Flecha solo si hay múltiples puntos */}
                {puntosDisponibles.length > 1 && (
                    <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                )}
            </button>

            {/* Dropdown */}
            {isOpen && puntosDisponibles.length > 1 && (
                <>
                    {/* Overlay para cerrar */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                            <h3 className="text-sm font-bold text-slate-800">Puntos de Emisión Disponibles</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{puntosDisponibles.length} punto(s) asignado(s)</p>
                        </div>

                        {/* Lista de puntos */}
                        <div className="max-h-96 overflow-y-auto">
                            {puntosDisponibles.map((punto) => (
                                <button
                                    key={punto.puntoEmisionId}
                                    onClick={() => handleCambiarPunto(punto.puntoEmisionId)}
                                    disabled={punto.activo}
                                    className={`
                                        w-full px-4 py-3 flex items-center gap-3 text-left transition-colors
                                        ${punto.activo
                                            ? 'bg-sri-blue bg-opacity-5 cursor-default'
                                            : 'hover:bg-slate-50 cursor-pointer'
                                        }
                                        border-b border-slate-100 last:border-b-0
                                    `}
                                >
                                    {/* Check icon si está activo */}
                                    <div className="flex-shrink-0">
                                        {punto.activo ? (
                                            <CheckCircle2 size={20} className="text-sri-blue" />
                                        ) : (
                                            <div className="w-5 h-5 border-2 border-slate-300 rounded-full" />
                                        )}
                                    </div>

                                    {/* Info del punto */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`
                                                font-mono font-bold text-sm
                                                ${punto.activo ? 'text-sri-blue' : 'text-slate-800'}
                                            `}>
                                                {punto.codigoCompleto}
                                            </span>
                                            {punto.esPrincipal && (
                                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                                                    Principal
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-600 truncate mt-0.5">
                                            {punto.nombrePunto}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {punto.nombreSucursal}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer con info */}
                        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
                            <p className="text-xs text-slate-500">
                                ℹ️ El punto activo se usa para emitir comprobantes
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
