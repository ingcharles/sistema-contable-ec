'use client';

import React, { useEffect, useState } from 'react';
import { FileText, AlertTriangle, CheckCircle } from 'lucide-react';

interface UsageData {
    nombre: string;
    usado: number;
    limite: number;
    restante: number;
    porcentaje: number;
}

interface UsageResponse {
    periodo: string;
    uso: Record<string, UsageData>;
}

export const UsageStatsWidget: React.FC = () => {
    const [usageData, setUsageData] = useState<UsageResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsageStats();
    }, []);

    const fetchUsageStats = async () => {
        try {
            const usuarioId = localStorage.getItem('current_usuario_id');
            const res = await fetch('/api/users/me/usage', {
                headers: { 'x-usuario-id': usuarioId || '' }
            });

            if (res.ok) {
                const data = await res.json();
                setUsageData(data);
            }
        } catch (error) {
            console.error('Error fetching usage stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-8 bg-gray-200 rounded"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!usageData) {
        return null;
    }

    const getProgressColor = (porcentaje: number) => {
        if (porcentaje >= 90) return 'bg-red-500';
        if (porcentaje >= 75) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getIcon = (porcentaje: number) => {
        if (porcentaje >= 90) return <AlertTriangle className="text-red-500" size={20} />;
        if (porcentaje >= 75) return <AlertTriangle className="text-yellow-500" size={20} />;
        return <CheckCircle className="text-green-500" size={20} />;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="text-sri-blue" size={24} />
                    Uso de Documentos - {usageData.periodo}
                </h3>
            </div>

            <div className="space-y-4">
                {Object.entries(usageData.uso).map(([codigo, data]) => (
                    <div key={codigo} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                {getIcon(data.porcentaje)}
                                <span className="font-medium text-gray-700">
                                    {data.nombre}
                                    <span className="text-xs text-gray-400 ml-1">({codigo})</span>
                                </span>
                            </div>
                            <span className="text-gray-600">
                                {data.usado} / {data.limite === 999999 ? '∞' : data.limite}
                            </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className={`h-2.5 rounded-full transition-all ${getProgressColor(data.porcentaje)}`}
                                style={{ width: `${Math.min(data.porcentaje, 100)}%` }}
                            ></div>
                        </div>

                        {data.porcentaje >= 80 && data.limite < 999999 && (
                            <p className="text-xs text-yellow-600">
                                ⚠️ Te quedan {data.restante} documentos disponibles
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {Object.values(usageData.uso).some(d => d.porcentaje >= 90) && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                        <strong>Atención:</strong> Estás cerca del límite de tu plan.
                        Considera actualizar tu suscripción.
                    </p>
                </div>
            )}
        </div>
    );
};
