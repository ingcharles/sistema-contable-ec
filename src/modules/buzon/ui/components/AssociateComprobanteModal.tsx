import { ShoppingBag, Wallet } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { ComprobanteRecibido } from '../../domain/types';

interface AssociateComprobanteModalProps {
    isOpen: boolean;
    onClose: () => void;
    comprobante: ComprobanteRecibido | null;
    onSelect: (tipo: 'COMPRA' | 'CAJA_CHICA') => void;
}

export function AssociateComprobanteModal({ isOpen, onClose, comprobante, onSelect }: AssociateComprobanteModalProps) {
    if (!comprobante) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Asociar Comprobante"
            description={`Documento ${comprobante.secuencial} de ${comprobante.razonSocialEmisor}`}
            size="md"
        >
            <div className="space-y-6">
                <p className="text-sm font-medium text-slate-500 text-center">
                    ¿Cómo desea registrar este comprobante en el sistema?
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => onSelect('COMPRA')}
                        className="flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-100 rounded-3xl hover:border-sri-blue hover:bg-blue-50 transition-all group shadow-sm"
                    >
                        <div className="p-4 bg-blue-100 text-sri-blue rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                            <ShoppingBag size={32} />
                        </div>
                        <span className="font-black text-slate-800 tracking-tight">Factura de Compra</span>
                        <span className="text-[10px] uppercase font-black text-slate-400 mt-2">Módulo Compras</span>
                    </button>

                    <button
                        onClick={() => onSelect('CAJA_CHICA')}
                        className="flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group shadow-sm"
                    >
                        <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                            <Wallet size={32} />
                        </div>
                        <span className="font-black text-slate-800 tracking-tight">Gasto de Caja Chica</span>
                        <span className="text-[10px] uppercase font-black text-slate-400 mt-2">Módulo Financiero</span>
                    </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                    <span className="text-[10px] uppercase font-black text-slate-400 mb-1">Total a Procesar</span>
                    <span className="text-2xl font-black text-slate-800 tracking-tighter">
                        {new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(comprobante.montoTotal)}
                    </span>
                </div>
            </div>
        </Modal>
    );
}
