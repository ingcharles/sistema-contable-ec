'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    icon?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    icon,
    children,
    footer,
    size = 'md'
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeStyles = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-6xl',
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
                ref={modalRef}
                className={`bg-white rounded-2xl shadow-2xl w-full ${sizeStyles[size]} overflow-hidden animate-in zoom-in-95 duration-200`}
            >
                {/* Header */}
                <div className="bg-sri-blue p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className="p-2 bg-white/10 rounded-lg">
                                {icon}
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold">{title}</h2>
                            {description && (
                                <p className="text-blue-100 text-xs">{description}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
