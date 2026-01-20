'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CuentaReporte } from '@/modules/contabilidad/domain/types';
import { formatMoney } from '@/shared/utils/formatearDinero';

interface CuentaRowProps {
    cuenta: CuentaReporte;
    nivel?: number;
}

export const CuentaRow = ({ cuenta, nivel = 0 }: CuentaRowProps) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = cuenta.hijos && cuenta.hijos.length > 0;

    return (
        <>
            <tr className={`hover:bg-slate-50 transition-colors ${nivel === 0 ? 'bg-slate-50/50' : ''}`}>
                <td className="py-3 px-4">
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${nivel * 1.5}rem` }}>
                        {hasChildren && (
                            <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-sri-blue">
                                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        )}
                        {!hasChildren && <div className="w-3.5" />}
                        <span className={`font-mono text-slate-500 text-xs ${nivel === 0 ? 'font-bold text-slate-700' : ''}`}>
                            {cuenta.codigo}
                        </span>
                    </div>
                </td>
                <td className="py-3 px-4">
                    <span className={`text-sm ${nivel === 0 ? 'font-black text-slate-800 uppercase' : nivel === 1 ? 'font-bold text-slate-700' : 'text-slate-600'}`}>
                        {cuenta.nombre}
                    </span>
                </td>
                <td className="py-3 px-4 text-right">
                    <span className={`text-sm ${nivel === 0 ? 'font-black text-slate-900' : 'font-medium text-slate-700'}`}>
                        {formatMoney(cuenta.saldo)}
                    </span>
                </td>
            </tr>
            {expanded && hasChildren && cuenta.hijos?.map(hijo => (
                <CuentaRow key={hijo.codigo} cuenta={hijo} nivel={nivel + 1} />
            ))}
        </>
    );
};
