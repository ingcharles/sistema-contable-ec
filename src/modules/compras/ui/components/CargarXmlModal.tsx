'use client';

import { useState, useRef } from 'react';
import { FileCode2, Upload, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { ComprobanteParseado } from '@/modules/compras/domain/descargaRobotTypes';
import { DescargaRobotUseCases } from '@/modules/compras/application/useCases/DescargaRobotUseCases';
import { Button } from '@/shared/ui/Button';

interface Props {
    onConfirm: (data: ComprobanteParseado) => void;
    onClose: () => void;
}

export const CargarXmlModal: React.FC<Props> = ({ onConfirm, onClose }) => {
    const [parseado, setParseado] = useState<ComprobanteParseado | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setLoading(true);
        setError(null);
        setParseado(null);

        try {
            const contenido = await file.text();
            const resultado = await DescargaRobotUseCases.parsearXml(contenido);
            setParseado(resultado);
        } catch (err: any) {
            setError(err.message || 'Error al procesar el archivo XML');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <FileCode2 size={20} />
                        <h2 className="text-sm font-semibold">Cargar Archivo XML</h2>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* File input */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all"
                    >
                        <Upload size={24} className="mx-auto mb-2 text-slate-400" />
                        <p className="text-sm text-slate-600">
                            {fileName || 'Seleccione un archivo XML de factura electrónica SRI'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Formato: Factura, Nota de Crédito, Nota de Débito</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xml"
                            onChange={handleFile}
                            className="hidden"
                        />
                    </div>

                    {loading && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Loader2 size={14} className="animate-spin" />
                            Procesando XML...
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    {/* Preview */}
                    {parseado && (
                        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Previsualización</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-slate-400">Emisor:</span>
                                    <p className="font-medium text-slate-700">{parseado.razonSocialEmisor}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">RUC:</span>
                                    <p className="font-mono text-slate-700">{parseado.rucEmisor}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Secuencial:</span>
                                    <p className="font-mono text-slate-700">{parseado.secuencial}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Fecha:</span>
                                    <p className="text-slate-700">{parseado.fechaEmision}</p>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-slate-200 mt-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Detalles: {parseado.detalles.length} items</span>
                                    <span className="font-bold text-slate-800">Total: ${parseado.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 flex justify-end gap-2 border-t border-slate-100">
                    <Button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => parseado && onConfirm(parseado)}
                        disabled={!parseado}
                        className="px-4 py-2 text-sm bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                        <Check size={14} />
                        Confirmar y Cargar
                    </Button>
                </div>
            </div>
        </div>
    );
};
