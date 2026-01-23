'use client';

import { useState } from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { formatearDinero } from '@/shared/utils/formatearDinero';
import { SriStandardizer } from '../../domain/services/SriStandardizer';
import { FacturacionUseCases, ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { AMBIENTE, TIPO_EMISION } from '../../domain/catalogos';
import { Modal } from '@/shared/ui/Modal';
import { useConfiguracion } from '@/modules/configuracion/hooks/useConfiguracion';
import { useEffect } from 'react';

interface ItemNotaCredito {
    id: string;
    nombre: string;
    cantidadOriginal: number;
    precio: number;
    cantidadDevolver: number;
    codigoIVA: string;
}

interface NotaCreditoModalProps {
    factura: any; // Factura original a la que se aplica la NC
    onClose: () => void;
    onSave: () => void;
}

export function NotaCreditoModal({ factura, onClose, onSave }: NotaCreditoModalProps) {
    const { currentEmpresa } = useEmpresa();
    const { parametros, cargarParametros } = useConfiguracion();

    useEffect(() => {
        cargarParametros();
    }, []);

    const [motivo, setMotivo] = useState('');
    const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
    const [secuencial, setSecuencial] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

    const [items, setItems] = useState<ItemNotaCredito[]>(
        factura.detalles?.map((item: any, index: number) => ({
            id: item.id || `item-${index}`,
            nombre: item.descripcion,
            cantidadOriginal: item.cantidad,
            precio: item.precioUnitario,
            cantidadDevolver: 0,
            codigoIVA: item.codigoIVA || '2' // Default 12%/15%
        })) || []
    );

    const handleCantidadChange = (id: string, val: number) => {
        setItems((prev: ItemNotaCredito[]) => prev.map(item =>
            item.id === id ? { ...item, cantidadDevolver: Math.min(Math.max(0, val), item.cantidadOriginal) } : item
        ));
        if (errorValidacion) setErrorValidacion(null);
    };

    const subtotalDevolucion = items.reduce((acc, item) => acc + (item.cantidadDevolver * item.precio), 0);
    const ivaDevolucion = items.reduce((acc, item) => {
        const tarifa = SriStandardizer.getTarifaValue(item.codigoIVA, parametros?.iva || 15) / 100;
        return acc + (item.cantidadDevolver * item.precio * tarifa);
    }, 0);
    const totalDevolucion = subtotalDevolucion + ivaDevolucion;

    const handleEmitirNC = async () => {
        if (!currentEmpresa) return;
        if (!motivo || totalDevolucion === 0 || !secuencial) {
            setErrorValidacion("Debe ingresar un motivo, secuencial y devolver al menos un ítem.");
            return;
        }

        setGuardando(true);
        setErrorValidacion(null);
        try {
            const dataNC = {
                ambiente: AMBIENTE.PRUEBAS,
                tipoEmision: TIPO_EMISION.NORMAL,
                razonSocial: currentEmpresa.razonSocial,
                nombreComercial: currentEmpresa.nombreComercial,
                ruc: currentEmpresa.ruc,
                estab: '001',
                ptoEmi: '001',
                secuencial: secuencial,
                dirMatriz: currentEmpresa.direccionMatriz,
                fechaEmision,
                tipoIdentificacionAdquirente: factura.tipoIdentificacionAdquirente,
                razonSocialAdquirente: factura.razonSocialAdquirente,
                identificacionAdquirente: factura.identificacionAdquirente,
                codDocModificado: '01',
                numDocModificado: factura.secuencial,
                fechaEmisionDocSustento: factura.fechaEmision,
                totalSinImpuestos: subtotalDevolucion,
                valorModificacion: totalDevolucion,
                motivo,
                detalles: items.filter(i => i.cantidadDevolver > 0).map(i => ({
                    codigoPrincipal: i.id,
                    descripcion: i.nombre,
                    cantidad: i.cantidadDevolver,
                    precioUnitario: i.precio,
                    descuento: 0,
                    baseImponible: i.cantidadDevolver * i.precio,
                    valorIVA: i.cantidadDevolver * i.precio * (SriStandardizer.getTarifaValue(i.codigoIVA, parametros?.iva || 15) / 100),
                    codigoIVA: i.codigoIVA
                }))
            };

            const jsonSri = SriStandardizer.standardizeNotaCredito(dataNC, parametros?.iva || 15);

            let sriResult = {
                success: false,
                status: 'BORRADOR',
                numeroAutorizacion: null as string | null,
                claveAcceso: null as string | null
            };

            try {
                const emisionRes = await FacturacionUseCases.emitirFactura(jsonSri);
                sriResult = {
                    success: true,
                    status: emisionRes.status || 'AUTORIZADO',
                    numeroAutorizacion: emisionRes.numeroAutorizacion,
                    claveAcceso: emisionRes.claveAcceso
                };
            } catch (sriError: any) {
                console.error('Error SRI:', sriError);
                sriResult.status = 'ERROR SRI';
            }

            await FacturacionUseCases.registrarComprobante({
                tipoComprobante: 'NOTA_CREDITO',
                fechaEmision,
                clienteId: factura.identificacionAdquirente,
                clienteNombre: factura.razonSocialAdquirente,
                clienteIdentificacion: factura.identificacionAdquirente,
                subtotal: subtotalDevolucion,
                iva: ivaDevolucion,
                total: totalDevolucion,
                detalles: dataNC.detalles,
                secuencial: parseInt(secuencial),
                claveAcceso: sriResult.claveAcceso,
                numeroAutorizacion: sriResult.numeroAutorizacion,
                estado: sriResult.status
            });

            await ContabilidadUseCases.registrarAsiento({
                numero: `AS-NC-${secuencial}`,
                fecha: fechaEmision,
                glosa: `P/R Nota de Crédito ${secuencial} s/Factura ${factura.secuencial} - ${factura.razonSocialAdquirente}`,
                tipo: 'EGRESO',
                detalles: [
                    { cuentaCodigo: '4.1.01.02', debe: subtotalDevolucion, haber: 0 },
                    { cuentaCodigo: '2.1.05.01', debe: ivaDevolucion, haber: 0 },
                    { cuentaCodigo: '1.1.02.01', debe: 0, haber: totalDevolucion }
                ]
            });

            if (sriResult.success) {
                alert(`Nota de Crédito emitida y autorizada: ${sriResult.numeroAutorizacion}`);
            } else {
                alert(`Nota de Crédito guardada localmente. Error SRI: ${sriResult.status}`);
            }

            onSave();
            onClose();
        } catch (error: any) {
            console.error('Error al emitir NC:', error);
            setErrorValidacion(`Error: ${error.message}`);
        } finally {
            setGuardando(false);
        }
    };

    const footer = (
        <>
            <Button onClick={onClose} variant="secondary" disabled={guardando}>Cancelar</Button>
            <Button onClick={handleEmitirNC} className="flex items-center gap-2" disabled={guardando}>
                {guardando ? 'Procesando...' : <><RotateCcw size={18} /> Emitir y Autorizar SRI</>}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Emisión de Nota de Crédito"
            description={`Sobre Factura: ${factura.secuencial}`}
            icon={<RotateCcw size={24} />}
            footer={footer}
            size="lg"
        >
            <div className="space-y-6">
                {errorValidacion && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-sm font-medium">{errorValidacion}</p>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Secuencial NC *</label>
                        <input
                            type="text"
                            value={secuencial}
                            onChange={e => setSecuencial(e.target.value.replace(/\D/g, ''))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-mono"
                            placeholder="000000001"
                            maxLength={9}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Fecha Emisión *</label>
                        <input type="date" value={fechaEmision} onChange={e => setFechaEmision(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Motivo *</label>
                        <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all" placeholder="Ej: Devolución mercadería" />
                    </div>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100/50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="p-4 text-left">Producto</th>
                                <th className="p-4 text-right">Facturado</th>
                                <th className="p-4 text-right">Devolver</th>
                                <th className="p-4 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-white/50 transition-colors">
                                    <td className="p-4 font-medium text-slate-700">{item.nombre}</td>
                                    <td className="p-4 text-right text-slate-500">{item.cantidadOriginal}</td>
                                    <td className="p-4 text-right">
                                        <input
                                            type="number"
                                            min="0"
                                            max={item.cantidadOriginal}
                                            value={item.cantidadDevolver}
                                            onChange={e => handleCantidadChange(item.id, Number(e.target.value))}
                                            className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-center font-bold bg-white text-sri-blue focus:ring-2 focus:ring-sri-blue/20 outline-none"
                                            step="0.01"
                                        />
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-slate-700">{formatearDinero(item.cantidadDevolver * item.precio)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <div className="w-64 space-y-2 text-right">
                        <div className="flex justify-between text-slate-500 font-medium text-sm">
                            <span>Subtotal Devolución:</span>
                            <span>{formatearDinero(subtotalDevolucion)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium text-sm">
                            <span>IVA Devolución ({parametros?.iva || 15}%):</span>
                            <span>{formatearDinero(ivaDevolucion)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl text-sri-blue pt-2 mt-2 border-t border-slate-100">
                            <span>Total NC:</span>
                            <span>{formatearDinero(totalDevolucion)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
