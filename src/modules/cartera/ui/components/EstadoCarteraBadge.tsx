'use client';

import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export const EstadoCarteraBadge = ({ diasVencidos }: { diasVencidos: number }) => {
    if (diasVencidos > 0) {
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700"><AlertCircle size={10} /> Vencido ({diasVencidos}d)</span>;
    } else if (diasVencidos > -5) {
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={10} /> Vence pronto</span>;
    } else {
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 size={10} /> Al día</span>;
    }
};
