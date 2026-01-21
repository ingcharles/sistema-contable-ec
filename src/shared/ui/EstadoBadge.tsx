'use client';

import React from 'react';
import { EstadoSRI } from '@/shared/types';
import { CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react';

interface EstadoBadgeProps {
    estado: EstadoSRI | string;
}

export const EstadoBadge = ({ estado }: EstadoBadgeProps) => {
    const styles: Record<string, string> = {
        [EstadoSRI.AUTORIZADO]: 'bg-green-100 text-green-800',
        'AUTORIZADA': 'bg-green-100 text-green-800',
        [EstadoSRI.PENDIENTE]: 'bg-yellow-100 text-yellow-800',
        'BORRADOR': 'bg-yellow-100 text-yellow-800',
        [EstadoSRI.ANULADO]: 'bg-red-100 text-red-800',
        'ANULADA': 'bg-red-100 text-red-800',
        [EstadoSRI.DEVUELTO]: 'bg-orange-100 text-orange-800',
        [EstadoSRI.RECHAZADO]: 'bg-red-100 text-red-800',
    };

    const icons: Record<string, React.ReactNode> = {
        [EstadoSRI.AUTORIZADO]: <CheckCircle2 size={14} />,
        'AUTORIZADA': <CheckCircle2 size={14} />,
        [EstadoSRI.PENDIENTE]: <Clock size={14} />,
        'BORRADOR': <Clock size={14} />,
        [EstadoSRI.ANULADO]: <XCircle size={14} />,
        'ANULADA': <XCircle size={14} />,
        [EstadoSRI.DEVUELTO]: <RotateCcw size={14} />,
        [EstadoSRI.RECHAZADO]: <XCircle size={14} />,
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${styles[estado] || 'bg-gray-100 text-gray-800'}`}>
            {icons[estado] || <Clock size={14} />}
            {estado}
        </span>
    );
};
