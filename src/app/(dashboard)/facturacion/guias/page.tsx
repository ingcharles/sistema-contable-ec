'use client';

import { useState, useEffect } from 'react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Factura } from '@/shared/types';
import { Plus, Receipt, X } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

// Modals
import { GuiaRemisionModal } from '@/modules/facturacion/ui/components/GuiaRemisionModal';
import { GuiaRemision } from '@/modules/facturacion/domain/guias';
import { FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { XmlModal } from '@/modules/facturacion/ui/components/XmlModal';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';

// Componentes de Tablas
import { GuiasRemisionTable } from '@/modules/facturacion/ui/components/GuiasRemisionTable';

export default function GuiasRemisionPage() {
    const { currentEmpresa } = useEmpresa();
    const [xmlVer, setXmlVer] = useState<string | null>(null);
    const [guias, setGuias] = useState<GuiaRemision[]>([]);
    const [showModalGuia, setShowModalGuia] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!currentEmpresa) return;
        setLoading(true);
        try {
            const dataGuias = await FacturacionUseCases.listarGuias();
            setGuias(dataGuias?.data || dataGuias || []);
        } catch (error) {
            console.error('Error al cargar datos:', error);
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
            const dataSri = SriStandardizer.standardizeFactura(row);
            const res = await FacturacionUseCases.emitirFactura(dataSri);

            if (res.estado === 'AUTORIZADO') {
                alert('¡Documento autorizado exitosamente!');
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
                        <div className="p-2 bg-sri-blue rounded-xl text-white">
                            <Receipt size={24} />
                        </div>
                        Guías de Remisión
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión de traslados de mercadería con documentos electrónicos.</p>
                </div>
                <Button onClick={() => setShowModalGuia(true)} className="gap-2">
                    <Plus size={18} />
                    Nueva Guía
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <GuiasRemisionTable
                    guias={guias}
                    loading={loading}
                    currentEmpresa={currentEmpresa}
                    onReemitir={handleReemitir}
                    onVerXml={(xml) => setXmlVer(xml)}
                />
            </div>

            {showModalGuia && (
                <GuiaRemisionModal
                    onClose={() => setShowModalGuia(false)}
                    onSave={() => { loadData(); setShowModalGuia(false); }}
                    empresaId={currentEmpresa?.id || ''}
                />
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
