'use client';

import { X } from 'lucide-react';
import { FacturaForm } from './FacturaForm';
import { FacturaViewModel } from '../../application/models/FacturaViewModel';

interface NuevaFacturaModalProps {
    onClose: () => void;
    onSave: (factura: FacturaViewModel) => void;
}

export function NuevaFacturaModal({ onClose, onSave }: NuevaFacturaModalProps) {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Emitir Nueva Factura</h2>
                        <p className="text-xs text-slate-500 text-balance">Complete los datos para generar un nuevo comprobante electrónico.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-200 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <FacturaForm
                        onSubmit={(factura) => {
                            onSave(factura);
                            onClose();
                        }}
                        onCancel={onClose}
                    />
                </div>
            </div>
        </div>
    );
}
