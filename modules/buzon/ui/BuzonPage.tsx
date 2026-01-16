
import React, { useState, useRef } from 'react';
import { UploadCloud, FileCode, CheckCircle2, AlertTriangle, ArrowRight, Trash2, Save, FilePlus, Search, FileSpreadsheet } from 'lucide-react';
import { ComprobanteImportado } from '../domain/types';
import { parseSriXml } from '../services/xmlParser';
import { formatMoney } from '../../../services/sriService';
import { InMemoryCompraRepository } from '../../compras/infrastructure/CompraRepository';
import { Compra, SustentoTributario } from '../../compras/domain/types';
import { useOutletContext } from 'react-router-dom';
import { Empresa } from '../../../types';

export const BuzonPage: React.FC = () => {
    const { currentEmpresa } = useOutletContext<{ currentEmpresa: Empresa }>();
    const [archivos, setArchivos] = useState<ComprobanteImportado[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const excelInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = async (fileList: FileList | null) => {
        if (!fileList) return;
        
        const nuevos: ComprobanteImportado[] = [];
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            if (file.name.endsWith('.xml')) {
                try {
                    const parsed = await parseSriXml(file);
                    nuevos.push(parsed);
                } catch (e) {
                    console.error("Error parsing", file.name);
                }
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
                // Simulación de lectura de Excel
                const itemsExcel = Array.from({length: 3}).map((_, idx) => ({
                    id: Math.random().toString(36),
                    archivoNombre: file.name,
                    claveAcceso: 'EXCEL-IMPORT-' + Math.floor(Math.random() * 1000000),
                    rucEmisor: '9999999999001',
                    razonSocialEmisor: `PROVEEDOR EXCEL ${idx + 1}`,
                    fechaEmision: new Date().toISOString().split('T')[0],
                    tipoComprobante: '01',
                    secuencial: `001-001-${Math.floor(Math.random() * 1000000)}`,
                    subtotal15: 100,
                    subtotal0: 0,
                    iva: 15,
                    total: 115,
                    estadoImportacion: 'PENDIENTE' as any,
                    existeProveedor: true
                }));
                nuevos.push(...itemsExcel);
            }
        }
        setArchivos(prev => [...prev, ...nuevos]);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const removeFile = (id: string) => {
        setArchivos(archivos.filter(a => a.id !== id));
    };

    const procesarLote = async () => {
        setProcessing(true);
        const repoCompras = new InMemoryCompraRepository();
        
        // Simulamos procesamiento
        const updatedArchivos = [...archivos];
        
        for (const archivo of updatedArchivos) {
            if (archivo.estadoImportacion === 'PENDIENTE') {
                if (archivo.tipoComprobante === '01') {
                    // Crear Compra
                    const nuevaCompra: Compra = {
                        id: Math.random().toString(36),
                        empresaId: currentEmpresa.id,
                        proveedor: {
                            id: Math.random().toString(36),
                            razonSocial: archivo.razonSocialEmisor,
                            ruc: archivo.rucEmisor,
                            esContribuyenteEspecial: false
                        },
                        tipoComprobante: '01',
                        secuencial: archivo.secuencial,
                        autorizacion: archivo.claveAcceso,
                        fechaEmision: archivo.fechaEmision,
                        fechaRegistro: new Date().toISOString().split('T')[0],
                        sustento: SustentoTributario.CREDITO_TRIBUTARIO, // Default
                        descripcion: `Imp. XML/Excel: ${archivo.archivoNombre}`,
                        subtotal15: archivo.subtotal15,
                        subtotal0: archivo.subtotal0,
                        montoIva: archivo.iva,
                        total: archivo.total,
                        tieneRetencion: true,
                        estadoRetencion: 'PENDIENTE',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        createdBy: 'importador'
                    };
                    await repoCompras.save(nuevaCompra);
                    archivo.estadoImportacion = 'PROCESADO';
                }
                // Aquí se procesarían Retenciones Recibidas (Cartera) y Notas de Crédito
            }
        }
        
        setTimeout(() => {
            setArchivos(updatedArchivos);
            setProcessing(false);
            alert('Lote procesado. Las facturas válidas se han registrado en el módulo de Compras.');
        }, 1500);
    };

    const pendientes = archivos.filter(a => a.estadoImportacion === 'PENDIENTE').length;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Buzón Electrónico</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Importación masiva de comprobantes XML y Excel.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => excelInputRef.current?.click()}
                        className="px-4 py-2 bg-white border border-green-200 text-green-700 hover:bg-green-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <FileSpreadsheet size={16} /> Cargar Excel
                    </button>
                    <input 
                        type="file" 
                        accept=".xlsx,.csv" 
                        className="hidden" 
                        ref={excelInputRef}
                        onChange={(e) => handleFiles(e.target.files)}
                    />
                    <button 
                        onClick={() => setArchivos([])}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                        disabled={archivos.length === 0}
                    >
                        Limpiar Todo
                    </button>
                    <button 
                        onClick={procesarLote}
                        disabled={processing || pendientes === 0}
                        className="px-6 py-2 bg-sri-blue text-white rounded-lg text-sm font-bold hover:bg-sri-light shadow-lg shadow-blue-900/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {processing ? 'Procesando...' : `Procesar ${pendientes} Documentos`} <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* Dropzone */}
            <div 
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                    isDragging 
                        ? 'border-sri-blue bg-blue-50' 
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                }`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input 
                    type="file" 
                    multiple 
                    accept=".xml" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-white rounded-full shadow-sm">
                        <UploadCloud size={48} className={isDragging ? 'text-sri-blue' : 'text-slate-400'} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-700">Arrastra tus archivos XML aquí</h3>
                        <p className="text-slate-500 text-sm mt-1">o haz clic para seleccionar desde tu carpeta de descargas SRI</p>
                    </div>
                </div>
            </div>

            {/* Lista de Archivos */}
            {archivos.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <FileCode size={18} className="text-slate-500" />
                            Archivos Cargados ({archivos.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Tipo</th>
                                    <th className="px-6 py-3">Emisor / RUC</th>
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3">Clave Acceso / Archivo</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                    <th className="px-6 py-3 text-center">Estado</th>
                                    <th className="px-6 py-3 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {archivos.map((archivo) => (
                                    <tr key={archivo.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                archivo.tipoComprobante === '01' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {archivo.tipoComprobante === '01' ? 'FACTURA' : 'RETENCIÓN'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-800">{archivo.razonSocialEmisor}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500">{archivo.rucEmisor}</span>
                                                    {!archivo.existeProveedor && (
                                                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded border border-yellow-200" title="Se creará automáticamente">Nuevo</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{archivo.fechaEmision}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-mono text-slate-500 truncate max-w-[150px]" title={archivo.claveAcceso}>{archivo.claveAcceso}</span>
                                                <span className="text-[10px] text-slate-400">{archivo.archivoNombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-800">
                                            {formatMoney(archivo.total)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {archivo.estadoImportacion === 'PROCESADO' ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                    <CheckCircle2 size={12} /> Guardado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                                    <FilePlus size={12} /> Pendiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {archivo.estadoImportacion === 'PENDIENTE' && (
                                                <button onClick={() => removeFile(archivo.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
