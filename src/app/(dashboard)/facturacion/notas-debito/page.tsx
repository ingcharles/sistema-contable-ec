'use client';

import { useState, useEffect } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Factura, TipoComprobante } from '@/shared/types';
import { Receipt, RotateCw, X } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

// Modals y Componentes
import { FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { ComprobantesEmitidosTable } from '@/modules/facturacion/ui/components/ComprobantesEmitidosTable';
import { NotaDebitoRIDE } from '@/modules/facturacion/ui/components/NotaDebitoRIDE';
import { XmlModal } from '@/modules/facturacion/ui/components/XmlModal';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';

export default function NotasDebitoPage() {
    const { currentEmpresa } = useEmpresa();
    const [loading, setLoading] = useState(true);
    const [notas, setNotas] = useState<Factura[]>([]);
    const [facturaVerRide, setFacturaVerRide] = useState<Factura | null>(null);
    const [xmlVer, setXmlVer] = useState<string | null>(null);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const result = await FacturacionUseCases.listarComprobantes();
            const allComprobantes = result?.data || result || [];
            // Filtrar solo notas de débito (Código 05)
            const filteredND = allComprobantes.filter((c: Factura) =>
                c.tipoComprobante === '05' || c.tipo === TipoComprobante.NOTA_DEBITO
            );
            setNotas(filteredND);
        } catch (error) {
            console.error('Error al cargar notas de débito:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentEmpresa?.id]);

    const handleReemitir = async (row: any) => {
        try {
            setLoading(true);
            const dataSri = SriStandardizer.standardizeNotaDebito(row);
            const res = await FacturacionUseCases.emitirFactura(dataSri);

            if (res.estado === 'AUTORIZADO') {
                alert('¡Nota de Débito autorizada exitosamente!');
                loadData();
            } else {
                alert('Error SRI: ' + JSON.stringify(res.error || res.detalles));
            }
        } catch (err: any) {
            alert('Error al re-emitir: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl text-white">
                            <Receipt size={24} />
                        </div>
                        Notas de Débito (Ventas)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Historial de notas de débito emitidas y autorizadas</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadData} className="gap-2">
                        <RotateCw size={18} className={loading ? 'animate-spin' : ''} />
                        Actualizar
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <ComprobantesEmitidosTable
                    facturas={notas}
                    loading={loading}
                    onReemitir={handleReemitir}
                    onNuevaNotaCredito={() => { }}
                    onNuevaNotaDebito={() => { }}
                    onNuevaGuia={() => { }}
                    onVerRide={(factura) => setFacturaVerRide(factura)}
                    onVerXml={(xml) => setXmlVer(xml)}
                />
            </div>

            {facturaVerRide && (
                <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Vista Previa RIDE</h3>
                            <button onClick={() => setFacturaVerRide(null)} className="p-2 hover:bg-slate-200 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
                            <div className="bg-white shadow-lg mx-auto max-w-[21cm] min-h-[29.7cm]">
                                <NotaDebitoRIDE comprobante={facturaVerRide} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {xmlVer && (
                <XmlModal
                    xml={xmlVer}
                    onClose={() => setXmlVer(null)}
                />
            )}
        </div>
    );
}
