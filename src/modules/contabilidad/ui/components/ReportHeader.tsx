'use client';

import React from 'react';
import { Empresa } from '@/shared/types';

interface ReportHeaderProps {
    empresa: Empresa;
    titulo: string;
    subtitulo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    fechaCorte?: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
    empresa,
    titulo,
    subtitulo = "(Cifras expresadas en Dólares de los Estados Unidos de América)",
    fechaInicio,
    fechaFin,
    fechaCorte
}) => {
    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-EC', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="text-center p-8 pb-6 border-b border-slate-100 bg-slate-50/10 print:border-b-2 print:p-4">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-tight print:text-xl">
                {empresa.razonSocial}
            </h2>
            <div className="flex flex-col items-center gap-0.5 mt-1">
                <p className="text-xs text-slate-500 font-bold">RUC: {empresa.ruc}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{empresa.direccionMatriz}</p>
            </div>

            <h3 className="text-lg font-black text-indigo-600 uppercase mt-4 tracking-tighter print:text-base print:mt-2">
                {titulo}
            </h3>

            <div className="mt-1">
                {fechaCorte ? (
                    <p className="text-slate-600 font-bold text-xs uppercase tracking-widest">
                        Al {formatDate(fechaCorte)}
                    </p>
                ) : (fechaInicio && fechaFin) ? (
                    <p className="text-slate-600 font-bold text-xs uppercase tracking-widest">
                        Del {formatDate(fechaInicio)} al {formatDate(fechaFin)}
                    </p>
                ) : null}
            </div>

            {subtitulo && (
                <p className="text-[10px] text-slate-400 font-bold mt-2 italic">
                    {subtitulo}
                </p>
            )}
        </div>
    );
};
