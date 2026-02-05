'use client';

import { FileText, Send } from 'lucide-react';
import { FacturaForm } from './FacturaForm';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';

interface NuevaFacturaModalProps {
    onClose: () => void;
    onSave: () => void;
}

export function NuevaFacturaModal({ onClose, onSave }: NuevaFacturaModalProps) {
    const footer = (
        <ModalFooter
            onCancel={onClose}
            cancelLabel="Cancelar"
            onSubmit={() => { }} // onSubmit is handled by the form, but ModalFooter requires a handler or we rely on type="submit"
            // Actually ModalFooter renders a button with onClick={onSubmit}.
            // If we use type="submit", we might not need onClick if it's inside a form.
            // But here the button is OUTSIDE the form (footer vs body). 
            // So we need 'form' attribute on the button, which we added support for.
            // And we can pass undefined or empty function to onClick if the button type handles it?
            // Wait, if onClick is passed, it might be called.
            // If type="submit" and form="id" is set, clicking it submits the form.
            // We should ensure onSubmit (onClick) doesn't prevent default or interfere if it's meant to be a form submit.
            // But usually ModalFooter logic is: onClick={onSubmit}.
            // If I omit onSubmit, ModalFooter types says it's optional?
            // "onSubmit?: () => void". yes.
            // But I want specific styling for the submit button.
            submitLabel="Emitir y Autorizar SRI"
            submitIcon={<Send size={18} />}
            submitButtonType="submit"
            submitButtonForm="nueva-factura-form"
            className="w-full"
            submitVariant="primary" // The original had 'bg-sri-blue ...' which is likely 'primary' styles or similar.
        />
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Emitir Nueva Factura"
            description="Documento Electrónico 01 - Factura de Venta autorizada por el SRI."
            icon={<FileText size={24} />}
            footer={footer}
            size="2xl"
        >
            <FacturaForm
                id="nueva-factura-form"
                onSubmit={() => {
                    onSave();
                    onClose();
                }}
                onCancel={onClose}
                showButtons={false}
            />
        </Modal>
    );
}
