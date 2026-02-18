'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { ComprobanteParseado } from '@/modules/compras/domain/descargaRobotTypes';
import { Button } from '@/shared/ui/Button';

interface Props {
    onParsearXml: (xml: string) => Promise<ComprobanteParseado | null>;
    error: string | null;
}

interface ArchivoProcessado {
    nombre: string;
    estado: 'cargando' | 'exitoso' | 'error';
    resultado?: ComprobanteParseado;
    error?: string;
}

export const CargaMasivaTab: React.FC<Props> = ({ onParsearXml, error }) => {
    const [archivos, setArchivos] = useState<ArchivoProcessado[]>([]);
    const [procesando, setProcesando] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setProcesando(true);
        const nuevosArchivos: ArchivoProcessado[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const archivoEntry: ArchivoProcessado = {
                nombre: file.name,
                estado: 'cargando'
            };
            nuevosArchivos.push(archivoEntry);
        }

        setArchivos(prev => [...prev, ...nuevosArchivos]);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const contenido = await file.text();
                const resultado = await onParsearXml(contenido);

                setArchivos(prev =>
                    prev.map(a =>
                        a.nombre === file.name
                            ? { ...a, estado: resultado ? 'exitoso' : 'error', resultado: resultado || undefined, error: resultado ? undefined : 'No se pudo parsear' }
                            : a
                    )
                );
            } catch (err: any) {
                setArchivos(prev =>
                    prev.map(a =>
                        a.nombre === file.name
                            ? { ...a, estado: 'error', error: err.message }
                            : a
                    )
                );
            }
        }

        setProcesando(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length === 0) return;

        const input = fileInputRef.current;
        if (input) {
            const dt = new DataTransfer();
            Array.from(files).forEach(f => dt.items.add(f));
            input.files = dt.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const limpiar = () => {
        setArchivos([]);
    };

    const exitosos = archivos.filter(a => a.estado === 'exitoso').length;
    const errores = archivos.filter(a => a.estado === 'error').length;

    return (
        <div className="space-y-6">
            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all group"
            >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                    <Upload size={28} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                    Arrastre archivos XML aquí o <span className="text-teal-600 underline">haga clic para seleccionar</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">Soporte para múltiples archivos XML de facturas electrónicas del SRI</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xml"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Resumen */}
            {archivos.length > 0 && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-500">Total: <strong>{archivos.length}</strong></span>
                        {exitosos > 0 && (
                            <span className="text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 size={12} /> {exitosos} exitosos
                            </span>
                        )}
                        {errores > 0 && (
                            <span className="text-red-500 flex items-center gap-1">
                                <AlertCircle size={12} /> {errores} errores
                            </span>
                        )}
                        {procesando && (
                            <span className="text-blue-500 flex items-center gap-1">
                                <Loader2 size={12} className="animate-spin" /> Procesando...
                            </span>
                        )}
                    </div>
                    <Button
                        onClick={limpiar}
                        className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
                    >
                        <X size={12} /> Limpiar
                    </Button>
                </div>
            )}

            {/* Lista de archivos procesados */}
            {archivos.length > 0 && (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {archivos.map((archivo, i) => (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border text-sm transition-all
                            ${archivo.estado === 'exitoso' ? 'bg-emerald-50/60 border-emerald-200'
                                : archivo.estado === 'error' ? 'bg-red-50/60 border-red-200'
                                    : 'bg-blue-50/60 border-blue-200'
                            }`}
                        >
                            {archivo.estado === 'cargando' && <Loader2 size={16} className="animate-spin text-blue-500 shrink-0" />}
                            {archivo.estado === 'exitoso' && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
                            {archivo.estado === 'error' && <AlertCircle size={16} className="text-red-500 shrink-0" />}

                            <FileText size={14} className="text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-700 truncate flex-1">{archivo.nombre}</span>

                            {archivo.resultado && (
                                <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                                    <span>{archivo.resultado.rucEmisor}</span>
                                    <span>{archivo.resultado.razonSocialEmisor?.substring(0, 25)}</span>
                                    <span className="font-semibold text-slate-700">${archivo.resultado.total?.toFixed(2)}</span>
                                </div>
                            )}

                            {archivo.error && (
                                <span className="text-xs text-red-500 shrink-0">{archivo.error}</span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}
        </div>
    );
};
