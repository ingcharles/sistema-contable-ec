'use client';

import { FileText, Send } from 'lucide-react';
import { FacturaForm } from './FacturaForm';
import { FacturaViewModel } from '../../domain/FacturaViewModel';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';

interface NuevaFacturaModalProps {
    onClose: () => void;
    onSave: (factura: FacturaViewModel) => void;
}

export function NuevaFacturaModal({ onClose, onSave }: NuevaFacturaModalProps) {
    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={onClose}>
                Cancelar
            </Button>
            <Button
                type="submit"
                form="nueva-factura-form"
                className="bg-sri-blue hover:bg-sri-light flex items-center gap-2 min-w-[200px] justify-center shadow-lg shadow-sri-blue/20"
            >
                <Send size={18} /> Emitir y Autorizar SRI
            </Button>
        </div>
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
                onSubmit={(factura) => {
                    onSave(factura);
                    onClose();
                }}
                onCancel={onClose}
                showButtons={false}
            />
        </Modal>
    );
}
