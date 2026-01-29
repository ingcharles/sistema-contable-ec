'use client';

import React from 'react';
import { EstadoSRI } from '@/shared/types';
import { CheckCircle2, Clock, XCircle, RotateCcw, User, Truck, Users, Briefcase, HelpCircle } from 'lucide-react';

interface EstadoBadgeProps {
    estado: EstadoSRI | string;
}

export const EstadoBadge = ({ estado }: EstadoBadgeProps) => {
    const styles: Record<string, string> = {
        [EstadoSRI.AUTORIZADO]: 'bg-green-100 text-green-800',
        'AUTORIZADA': 'bg-green-100 text-green-800',
        'EMITIDA': 'bg-green-100 text-green-800',
        [EstadoSRI.PENDIENTE]: 'bg-yellow-100 text-yellow-800',
        'BORRADOR': 'bg-yellow-100 text-yellow-800',
        [EstadoSRI.ANULADO]: 'bg-red-100 text-red-800',
        'ANULADA': 'bg-red-100 text-red-800',
        [EstadoSRI.DEVUELTO]: 'bg-orange-100 text-orange-800',
        [EstadoSRI.RECHAZADO]: 'bg-red-100 text-red-800',
        'NO_APLICA': 'bg-slate-100 text-slate-600',
        'CLIENTE': 'bg-emerald-100 text-emerald-800',
        'PROVEEDOR': 'bg-blue-100 text-blue-800',
        'AMBOS': 'bg-purple-100 text-purple-800',
        'EMPLEADO': 'bg-cyan-100 text-cyan-800',
        'OTRO': 'bg-slate-100 text-slate-800',
    };

    const icons: Record<string, React.ReactNode> = {
        [EstadoSRI.AUTORIZADO]: <CheckCircle2 size={14} />,
        'AUTORIZADA': <CheckCircle2 size={14} />,
        'EMITIDA': <CheckCircle2 size={14} />,
        [EstadoSRI.PENDIENTE]: <Clock size={14} />,
        'BORRADOR': <Clock size={14} />,
        [EstadoSRI.ANULADO]: <XCircle size={14} />,
        'ANULADA': <XCircle size={14} />,
        [EstadoSRI.DEVUELTO]: <RotateCcw size={14} />,
        [EstadoSRI.RECHAZADO]: <XCircle size={14} />,
        'NO_APLICA': <HelpCircle size={14} />,
        'CLIENTE': <User size={14} />,
        'PROVEEDOR': <Truck size={14} />,
        'AMBOS': <Users size={14} />,
        'EMPLEADO': <Briefcase size={14} />,
        'OTRO': <HelpCircle size={14} />,
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${styles[estado] || 'bg-gray-100 text-gray-800'}`}>
            {icons[estado] || <Clock size={14} />}
            {estado}
        </span>
    );
};
