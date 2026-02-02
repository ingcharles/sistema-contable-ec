'use client';

import { Construction } from 'lucide-react';

export default function GenericPlaceholderPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                <Construction size={40} className="text-amber-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-2">Página en Construcción</h1>
            <p className="text-slate-500 max-w-md mx-auto">
                Estamos trabajando para traerle esta funcionalidad lo más pronto posible.
            </p>
        </div>
    );
}
