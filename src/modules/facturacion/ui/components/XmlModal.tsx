'use client';

import { useState } from 'react';
import { X, Copy, Check, FileCode } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

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

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-white/10">
                <div className="p-4 bg-[#252526] flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <FileCode size={20} className="text-blue-400" />
                        </div>
                        <h2 className="text-white font-bold">{title}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleCopy}
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                        >
                            {copied ? <Check size={16} className="text-green-500 mr-2" /> : <Copy size={16} className="mr-2" />}
                            {copied ? 'Copiado' : 'Copiar'}
                        </Button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-6 font-mono text-sm">
                    <pre className="text-blue-300 whitespace-pre-wrap break-all">
                        {xml.split('\n').map((line, i) => (
                            <div key={i} className="table-row">
                                <span className="table-cell pr-4 text-slate-600 select-none text-right w-10">{i + 1}</span>
                                <span className="table-cell">{line}</span>
                            </div>
                        ))}
                    </pre>
                </div>
            </div>
        </div>
    );
};
