'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast, Toast as ToastType } from '@/shared/context/ToastContext';

const ToastItem: React.FC<{ toast: ToastType }> = ({ toast }) => {
    const { removeToast } = useToast();
    const [isExiting, setIsExiting] = useState(false);

    const icons = {
        success: <CheckCircle2 className="text-green-500" size={20} />,
        error: <AlertCircle className="text-rose-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />,
        warning: <AlertTriangle className="text-amber-500" size={20} />,
    };

    const bgColors = {
        success: 'bg-green-50/90 border-green-100',
        error: 'bg-rose-50/90 border-rose-100',
        info: 'bg-blue-50/90 border-blue-100',
        warning: 'bg-amber-50/90 border-amber-100',
    };

    const handleRemove = () => {
        setIsExiting(true);
        setTimeout(() => removeToast(toast.id), 300);
    };

    return (
        <div
            className={`
                flex items-center gap-4 p-4 rounded-2xl border shadow-lg backdrop-blur-md
                transition-all duration-300 ease-out
                ${bgColors[toast.type]}
                ${isExiting ? 'opacity-0 translate-x-10 scale-95' : 'opacity-100 translate-x-0 scale-100'}
                animate-in slide-in-from-right-8 duration-500
            `}
        >
            <div className="flex-shrink-0">
                {icons[toast.type]}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-tight">
                    {toast.message}
                </p>
            </div>
            <button
                onClick={handleRemove}
                className="p-1 hover:bg-slate-200/50 rounded-full transition-colors"
            >
                <X size={16} className="text-slate-400" />
            </button>

            {/* Progress Bar */}
            {toast.duration && toast.duration > 0 && (
                <div className="absolute bottom-0 left-0 h-1 bg-slate-200/30 w-full rounded-b-2xl overflow-hidden">
                    <div
                        className={`h-full transition-all linear ${toast.type === 'success' ? 'bg-green-500' :
                                toast.type === 'error' ? 'bg-rose-500' :
                                    toast.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                        style={{
                            animation: `toast-progress ${toast.duration}ms linear forwards`
                        }}
                    />
                </div>
            )}

            <style jsx>{`
                @keyframes toast-progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const { toasts } = useToast();

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastItem toast={toast} />
                </div>
            ))}
        </div>
    );
};
