'use client';

import { ReactNode } from 'react';
import { Button } from './Button';

interface ModalFooterProps {
    /** Callback for the cancel/close action */
    onCancel?: () => void;
    /** Callback for the primary action (Save, Submit, etc.) */
    onSubmit?: () => void;
    /** Text for the cancel button. Defaults to 'Cancelar' */
    cancelLabel?: string;
    /** Text for the submit button. Defaults to 'Guardar' */
    submitLabel?: string;
    /** Whether the submit button should show a loading state */
    isLoading?: boolean;
    /** Whether the buttons should be disabled */
    isDisabled?: boolean;
    /** Optional icon for the submit button */
    submitIcon?: ReactNode;
    /** Variant for the submit button. Defaults to 'primary' */
    submitVariant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'ghost' | 'outline';
    /** Whether to show the cancel button. Defaults to true */
    showCancel?: boolean;
    /** Whether to show the submit button. Defaults to true */
    showSubmit?: boolean;
    /** Additional classes for the container */
    className?: string;
    /** Additional content typically shown on the left of the buttons */
    children?: ReactNode;
}

/**
 * Standardized footer for modals with common action buttons.
 */
export const ModalFooter = ({
    onCancel,
    onSubmit,
    cancelLabel = 'Cancelar',
    submitLabel = 'Guardar',
    isLoading = false,
    isDisabled = false,
    submitIcon,
    submitVariant = 'primary',
    showCancel = true,
    showSubmit = true,
    className = "",
    children
}: ModalFooterProps) => {
    return (
        <div className={`flex items-center justify-end gap-3 pt-4 border-t border-slate-100 ${className}`}>
            <div className="flex-1">
                {children}
            </div>
            <div className="flex items-center gap-3">
                {showCancel && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isDisabled || isLoading}
                    >
                        {cancelLabel}
                    </Button>
                )}
                {showSubmit && (
                    <Button
                        type="button"
                        variant={submitVariant}
                        onClick={onSubmit}
                        isLoading={isLoading}
                        disabled={isDisabled}
                        className="flex items-center gap-2"
                    >
                        {submitIcon && !isLoading && submitIcon}
                        <span>{isLoading ? 'Procesando...' : submitLabel}</span>
                    </Button>
                )}
            </div>
        </div>
    );
};
