'use client';

/**
 * Componente FacturaRIDE
 * Representación Impresa de Documento Electrónico (RIDE)
 * Cumple con el formato estándar del SRI para facturas electrónicas
 */

// Remove unused React import
import { FacturaViewModel } from '../../application/models/FacturaViewModel';
import { FORMA_PAGO } from '../../domain/catalogos';

interface FacturaRIDEProps {
    factura: FacturaViewModel;
}

export function FacturaRIDE({ factura }: FacturaRIDEProps) {
    const getNombreFormaPago = (codigo: string) => {
        const entry = Object.entries(FORMA_PAGO).find(([_, val]) => val === codigo);
        return entry ? entry[0].replace(/_/g, ' ') : 'OTROS CON SISTEMA FINANCIERO';
    };

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white text-slate-800 font-sans border border-slate-200 shadow-sm print:shadow-none print:border-0">
            {/* Encabezado RIDE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Lado Izquierdo: Info Empresa */}
                <div className="space-y-4">
                    <div className="h-24 w-48 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Logo Empresa</span>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-xl font-black uppercase tracking-tight">{factura.razonSocial}</h1>
                        {factura.nombreComercial && <p className="text-sm font-bold text-slate-500">{factura.nombreComercial}</p>}
                        <div className="text-[10px] leading-tight text-slate-600 space-y-0.5">
                            <p><span className="font-bold">Dirección Matriz:</span> {factura.dirMatriz}</p>
                            <p><span className="font-bold">Dirección Establecimiento:</span> {factura.dirEstablecimiento || factura.dirMatriz}</p>
                            <p><span className="font-bold">Contribuyente Especial Nro:</span> {factura.contribuyenteEspecial || 'NO'}</p>
                            <p><span className="font-bold">Obligado a llevar contabilidad:</span> {factura.obligadoContabilidad}</p>
                        </div>
                    </div>
                </div>

                {/* Lado Derecho: Info Tributaria Comprobante */}
                <div className="border-2 border-slate-900 p-6 rounded-2xl space-y-3">
                    <div className="space-y-1">
                        <p className="text-lg font-black tracking-tighter">R.U.C.: <span className="font-mono">{factura.ruc}</span></p>
                        <p className="text-xl font-black uppercase bg-slate-900 text-white px-3 py-1 inline-block rounded-md">Factura</p>
                        <p className="text-sm font-bold">No. {factura.estab}-{factura.ptoEmi}-{factura.secuencial}</p>
                    </div>

                    <div className="text-[10px] space-y-1">
                        <p><span className="font-bold">NÚMERO DE AUTORIZACIÓN:</span></p>
                        <p className="font-mono break-all text-xs">{factura.numeroAutorizacion || 'PENDIENTE DE AUTORIZACIÓN'}</p>
                        <p><span className="font-bold">FECHA Y HORA DE AUTORIZACIÓN:</span> {factura.fechaAutorizacion || 'PENDIENTE'}</p>
                        <p><span className="font-bold">AMBIENTE:</span> {factura.ambiente === '1' ? 'PRUEBAS' : 'PRODUCCIÓN'}</p>
                        <p><span className="font-bold">EMISIÓN:</span> NORMAL</p>
                    </div>

                    <div className="space-y-1 pt-2">
                        <p className="text-[10px] font-bold">CLAVE DE ACCESO:</p>
                        <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg">
                            {/* Simulación de Código de Barras */}
                            <div className="h-8 w-full bg-slate-900 flex items-center justify-center mb-1 overflow-hidden">
                                <div className="w-full h-full flex gap-[1px]">
                                    {Array.from({ length: 100 }).map((_, i) => (
                                        <div key={i} className="bg-white" style={{ width: `${Math.random() * 3}px` }}></div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-[9px] font-mono text-center tracking-tighter">{factura.claveAcceso || '0000000000000000000000000000000000000000000000000'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Datos del Adquirente */}
            <div className="border border-slate-900 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-y-2 text-[11px]">
                <p><span className="font-bold">Razón Social / Nombres y Apellidos:</span> {factura.razonSocialAdquirente}</p>
                <p><span className="font-bold">Identificación:</span> {factura.identificacionAdquirente}</p>
                <p><span className="font-bold">Fecha Emisión:</span> {factura.fechaEmision}</p>
                <p><span className="font-bold">Guía de Remisión:</span> </p>
            </div>

            {/* Tabla de Detalles */}
            <div className="border border-slate-900 rounded-xl overflow-hidden mb-8">
                <table className="w-full text-[10px] text-left">
                    <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-3 py-2 border-r border-white/10">Cod. Principal</th>
                            <th className="px-3 py-2 border-r border-white/10">Cant</th>
                            <th className="px-3 py-2 border-r border-white/10">Descripción</th>
                            <th className="px-3 py-2 border-r border-white/10 text-right">Precio Unitario</th>
                            <th className="px-3 py-2 border-r border-white/10 text-right">Descuento</th>
                            <th className="px-3 py-2 text-right">Precio Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {factura.detalles.map((detalle, idx) => (
                            <tr key={idx}>
                                <td className="px-3 py-2 border-r border-slate-200 font-mono">{detalle.codigoPrincipal}</td>
                                <td className="px-3 py-2 border-r border-slate-200 text-center">{detalle.cantidad.toFixed(2)}</td>
                                <td className="px-3 py-2 border-r border-slate-200 font-bold">{detalle.descripcion}</td>
                                <td className="px-3 py-2 border-r border-slate-200 text-right">{detalle.precioUnitario.toFixed(2)}</td>
                                <td className="px-3 py-2 border-r border-slate-200 text-right">{detalle.descuento.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right font-bold">{detalle.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pie de Factura: Info Adicional, Pagos y Totales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                    {/* Información Adicional */}
                    <div className="border border-slate-900 p-4 rounded-xl space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Información Adicional</h3>
                        <div className="text-[9px] space-y-1">
                            <p><span className="font-bold uppercase">Dirección:</span> {factura.direccionAdquirente || 'S/N'}</p>
                            <p><span className="font-bold uppercase">Email:</span> {factura.emailAdquirente || 'S/N'}</p>
                            {factura.observaciones && <p><span className="font-bold uppercase">Observaciones:</span> {factura.observaciones}</p>}
                        </div>
                    </div>

                    {/* Formas de Pago */}
                    <div className="border border-slate-900 rounded-xl overflow-hidden">
                        <table className="w-full text-[9px] text-left">
                            <thead className="bg-slate-100 font-bold uppercase border-b border-slate-900">
                                <tr>
                                    <th className="px-3 py-1.5 border-r border-slate-900">Forma de Pago</th>
                                    <th className="px-3 py-1.5 border-r border-slate-900 text-right">Valor</th>
                                    <th className="px-3 py-1.5 border-r border-slate-900 text-center">Plazo</th>
                                    <th className="px-3 py-1.5 text-center">Tiempo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {factura.pagos.map((pago, idx) => (
                                    <tr key={idx}>
                                        <td className="px-3 py-1.5 border-r border-slate-900 uppercase">{getNombreFormaPago(pago.formaPago)}</td>
                                        <td className="px-3 py-1.5 border-r border-slate-900 text-right font-bold">{pago.total.toFixed(2)}</td>
                                        <td className="px-3 py-1.5 border-r border-slate-900 text-center">{pago.plazo || 0}</td>
                                        <td className="px-3 py-1.5 text-center uppercase">{pago.unidadTiempo || 'Dias'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totales */}
                <div className="border border-slate-900 rounded-xl overflow-hidden">
                    <table className="w-full text-[10px] text-left">
                        <tbody className="divide-y divide-slate-900">
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Subtotal Sin Impuestos</td>
                                <td className="px-3 py-1.5 text-right font-bold">{factura.totalSinImpuestos.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Subtotal 15%</td>
                                <td className="px-3 py-1.5 text-right">{factura.detalles.filter(d => d.codigoIVA === '4').reduce((acc, d) => acc + d.baseImponible, 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Subtotal 0%</td>
                                <td className="px-3 py-1.5 text-right">{factura.detalles.filter(d => d.codigoIVA === '0').reduce((acc, d) => acc + d.baseImponible, 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Subtotal No Objeto de IVA</td>
                                <td className="px-3 py-1.5 text-right">{factura.detalles.filter(d => d.codigoIVA === '6').reduce((acc, d) => acc + d.baseImponible, 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Subtotal Exento de IVA</td>
                                <td className="px-3 py-1.5 text-right">{factura.detalles.filter(d => d.codigoIVA === '7').reduce((acc, d) => acc + d.baseImponible, 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Total Descuento</td>
                                <td className="px-3 py-1.5 text-right">{(factura.totalDescuento || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">IVA 15%</td>
                                <td className="px-3 py-1.5 text-right font-bold">{(factura.totalIVA || 0).toFixed(2)}</td>
                            </tr>
                            <tr className="bg-slate-900 text-white">
                                <td className="px-3 py-2 font-black uppercase text-xs">Importe Total</td>
                                <td className="px-3 py-2 text-right font-black text-xs">{(factura.importeTotal || 0).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
