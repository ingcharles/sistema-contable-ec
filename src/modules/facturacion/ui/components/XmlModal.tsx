'use client';

import { useState } from 'react';
import { Copy, Check, FileCode, Download } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { Modal } from '@/shared/ui/Modal';

interface XmlModalProps {
    xml: string;
    onClose: () => void;
    title?: string;
}

export const XmlModal = ({ xml, onClose, title = 'XML Comprobante Electrónico' }: XmlModalProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(xml);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([xml], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'comprobante.xml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const footer = (
    const footer = (
            <ModalFooter
                onCancel={onClose}
                cancelLabel="Cerrar"
                onSubmit={handleCopy}
                submitLabel={copied ? 'Copiado' : 'Copiar XML'}
                submitIcon={copied ? <Check size={18} className="text-white" /> : <Copy size={18} />}
                className="w-full justify-between"
            >
                <Button
                    variant="secondary"
                    onClick={handleDownload}
                    className="flex items-center gap-2"
                >
                    <Download size={18} /> Descargar XML
                </Button>
            </ModalFooter>
        );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={title}
            description="Visualización del archivo XML generado según el esquema XSD del SRI."
            icon={<FileCode size={24} />}
            footer={footer}
            size="2xl"
        >
            <div className="bg-[#1e1e1e] rounded-2xl overflow-hidden border border-white/10 shadow-inner">
                <div className="bg-[#252526] px-4 py-2 border-b border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Editor de Código</span>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                    </div>
                </div>
                <div className="p-6 font-mono text-xs max-h-[50vh] overflow-y-auto">
                    <pre className="text-emerald-400 whitespace-pre-wrap break-all leading-relaxed">
                        {xml.split('\n').map((line, i) => (
                            <div key={i} className="flex gap-6 group hover:bg-white/5">
                                <span className="text-slate-600 select-none text-right w-8 border-r border-white/5 pr-4">
                                    {i + 1}
                                </span>
                                <span className="flex-1">{line}</span>
                            </div>
                        ))}
                    </pre>
                </div>
            </div>
        </Modal>
    );
};
