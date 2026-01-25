'use client';

import React from 'react';
import { Modal } from './Modal';
import { ModalFooter } from './ModalFooter';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

export type ConfirmType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    type?: ConfirmType;
    loading?: boolean;
}

export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'info',
    loading = false
}: ConfirmModalProps) => {

    const icons = {
        danger: <AlertTriangle className="text-red-600" size={24} />,
        warning: <AlertTriangle className="text-amber-600" size={24} />,
        info: <Info className="text-blue-600" size={24} />,
        success: <CheckCircle className="text-green-600" size={24} />,
    };

    const variantMap: Record<ConfirmType, 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'ghost' | 'outline'> = {
        danger: 'danger',
        warning: 'warning',
        info: 'primary',
        success: 'success',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full hidden sm:block ${type === 'danger' ? 'bg-red-50' :
                        type === 'warning' ? 'bg-amber-50' :
                            type === 'info' ? 'bg-blue-50' : 'bg-green-50'
                        }`}>
                        {icons[type]}
                    </div>
                    <div className="flex-1">
                        <div className="text-sm text-slate-600">
                            {message}
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <ModalFooter
                        onCancel={onClose}
                        onSubmit={onConfirm}
                        isLoading={loading}
                        cancelLabel={cancelText}
                        submitLabel={confirmText}
                        submitVariant={variantMap[type]}
                    />
                </div>
            </div>
        </Modal>
    );
};
