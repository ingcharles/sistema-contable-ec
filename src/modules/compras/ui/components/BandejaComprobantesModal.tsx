'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bot, Search, Check, X, RefreshCw, FileText, Loader2 } from 'lucide-react';
import { ComprobanteDescargado, ComprobanteParseado, FiltroComprobantes } from '@/modules/compras/domain/descargaRobotTypes';
import { DescargaRobotUseCases } from '@/modules/compras/application/useCases/DescargaRobotUseCases';
import { Button } from '@/shared/ui/Button';
import { formatMoney } from '@/shared/utils/formatearDinero';

interface Props {
    onConfirm: (data: ComprobanteParseado) => void;
    onClose: () => void;
}

const TIPO_LABELS: Record<string, string> = {
    '01': 'Factura',
    '03': 'Liquidación',
    '04': 'Nota Crédito',
    '05': 'Nota Débito',
    '07': 'Retención'
};

export const BandejaComprobantesModal: React.FC<Props> = ({ onConfirm, onClose }) => {
    const [comprobantes, setComprobantes] = useState<ComprobanteDescargado[]>([]);
    const [loading, setLoading] = useState(true);
    const [procesando, setProcesando] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [error, setError] = useState<string | null>(null);

    const cargar = useCallback(async (filtros?: FiltroComprobantes) => {
        setLoading(true);
        try {
            const data = await DescargaRobotUseCases.listarComprobantes({
                estado: 'NUEVO',
                ...filtros
            });
            setComprobantes(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (busqueda) {
                cargar({ busqueda, estado: 'NUEVO' });
            } else {
                cargar({ estado: 'NUEVO' });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [busqueda, cargar]);

    const handleSeleccionar = async (comp: ComprobanteDescargado) => {
        setProcesando(comp.id);
        setError(null);
        try {
            // Si tiene XML, parsearlo via API
            if (comp.xmlContenido) {
                const resultado = await DescargaRobotUseCases.parsearXml(comp.xmlContenido);
                onConfirm(resultado);
            } else {
                // Crear un ComprobanteParseado básico desde los datos disponibles
                onConfirm({
                    rucEmisor: comp.rucEmisor,
                    razonSocialEmisor: comp.razonSocialEmisor,
                    tipoComprobante: comp.tipoComprobante,
                    secuencial: comp.numeroComprobante,
                    fechaEmision: comp.fechaEmision,
                    subtotal0: 0,
                    subtotalIva: comp.montoTotal / 1.15, // Estimación
                    montoIva: comp.montoTotal - (comp.montoTotal / 1.15),
                    totalDescuento: 0,
                    total: comp.montoTotal,
                    detalles: [{
                        descripcion: `COMPRA SEGÚN COMPROBANTE ${comp.numeroComprobante}`,
                        cantidad: 1,
                        precioUnitario: comp.montoTotal / 1.15,
                        descuento: 0,
                        subtotal: comp.montoTotal / 1.15,
                        porcentajeIva: 15,
                        valorIva: comp.montoTotal - (comp.montoTotal / 1.15),
                        total: comp.montoTotal
                    }]
                });
            }
        } catch (err: any) {
            setError(err.message || 'Error al procesar comprobante');
            setProcesando(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-white">
                        <Bot size={20} />
                        <h2 className="text-sm font-semibold">Bandeja IA — Comprobantes Descargados</h2>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                    {/* Search */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar por RUC, emisor o número..."
                                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
                            />
                        </div>
                        <Button
                            onClick={() => cargar({ estado: 'NUEVO' })}
                            disabled={loading}
                            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin text-slate-400' : 'text-slate-500'} />
                        </Button>
                    </div>

                    {error && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</div>
                    )}

                    {/* Results */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            Cargando comprobantes...
                        </div>
                    ) : comprobantes.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                                <FileText size={20} className="text-slate-400" />
                            </div>
                            <p className="text-xs text-slate-400">No hay comprobantes nuevos disponibles</p>
                            <p className="text-[10px] text-slate-300 mt-1">Ejecute el robot de descarga para obtener comprobantes</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {comprobantes.map(comp => (
                                <div
                                    key={comp.id}
                                    className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-violet-50/50 hover:border-violet-200 transition-all group cursor-pointer"
                                    onClick={() => handleSeleccionar(comp)}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                        {TIPO_LABELS[comp.tipoComprobante]?.substring(0, 3) || comp.tipoComprobante}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-700 truncate">{comp.razonSocialEmisor}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">{comp.rucEmisor} · {comp.numeroComprobante} · {comp.fechaEmision}</p>
                                    </div>
                                    <span className="text-xs font-bold text-slate-800 shrink-0">{formatMoney(comp.montoTotal)}</span>
                                    {procesando === comp.id ? (
                                        <Loader2 size={14} className="animate-spin text-violet-500 shrink-0" />
                                    ) : (
                                        <Check size={14} className="text-slate-300 group-hover:text-violet-500 shrink-0 transition-colors" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <span className="text-[10px] text-slate-400">{comprobantes.length} comprobantes disponibles</span>
                    <Button onClick={onClose} className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                        Cerrar
                    </Button>
                </div>
            </div>
        </div>
    );
};
