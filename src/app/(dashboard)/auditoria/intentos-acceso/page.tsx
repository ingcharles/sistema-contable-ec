'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, User, MapPin, Calendar, AlertTriangle, RefreshCw } from 'lucide-react';

interface IntentoAcceso {
    id: string;
    fecha_intento: string;
    accion: string;
    ip_address: string | null;
    usuario_nombre: string;
    usuario_email: string;
    punto_codigo: string;
    sucursal_nombre: string;
    detalles: any;
}

export default function IntentosAccesoPage() {
    const [intentos, setIntentos] = useState<IntentoAcceso[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRecientes, setTotalRecientes] = useState(0);

    useEffect(() => {
        cargarIntentos();
    }, []);

    const cargarIntentos = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/auditoria/intentos-acceso');
            if (!response.ok) throw new Error('Error al cargar intentos');
            const data = await response.json();
            setIntentos(data.intentos);
            setTotalRecientes(data.totalRecientes30Dias || 0);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleString('es-EC', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getAccionColor = (accion: string) => {
        const colores: Record<string, string> = {
            'EMITIR_FACTURA': 'bg-blue-100 text-blue-800',
            'EMITIR_RETENCION': 'bg-red-100 text-red-800',
            'EMITIR_NOTA_CREDITO': 'bg-yellow-100 text-yellow-800',
            'EMITIR_GUIA': 'bg-green-100 text-green-800'
        };
        return colores[accion] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <ShieldAlert className="text-red-600" size={28} />
                        Intentos de Acceso No Autorizado
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Registro de intentos de uso de puntos de emisión no asignados
                    </p>
                </div>
                <button
                    onClick={cargarIntentos}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Actualizar
                </button>
            </div>

            {/* Alert Summary */}
            {totalRecientes > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
                    <div>
                        <p className="font-bold text-red-900">
                            {totalRecientes} intento{totalRecientes !== 1 ? 's' : ''} en los últimos 30 días
                        </p>
                        <p className="text-sm text-red-700">
                            Revisa los intentos de acceso no autorizado y toma las medidas necesarias
                        </p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Fecha/Hora
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Usuario
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Punto de Emisión
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Acción
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    IP
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-2 text-slate-500">
                                            <RefreshCw size={20} className="animate-spin" />
                                            Cargando intentos...
                                        </div>
                                    </td>
                                </tr>
                            ) : intentos.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-500">
                                            <ShieldAlert size={48} className="text-slate-300" />
                                            <p className="font-medium">No hay intentos de acceso no autorizado registrados</p>
                                            <p className="text-sm">Esto es una buena señal - el sistema está seguro</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                intentos.map((intento) => (
                                    <tr key={intento.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-slate-400" />
                                                <span className="font-medium text-slate-900">
                                                    {formatearFecha(intento.fecha_intento)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User size={16} className="text-slate-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {intento.usuario_nombre}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{intento.usuario_email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-slate-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {intento.punto_codigo}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{intento.sucursal_nombre}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccionColor(intento.accion)}`}>
                                                {intento.accion.replace('EMITIR_', '')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                                            {intento.ip_address || 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Info */}
            {intentos.length > 0 && (
                <div className="text-sm text-slate-500 text-center">
                    Mostrando {intentos.length} registro{intentos.length !== 1 ? 's' : ''} más reciente{intentos.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
