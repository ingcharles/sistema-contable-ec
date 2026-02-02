'use client';

/**
 * Componente LiquidacionCompraRIDE
 * Representación Impresa de Documento Electrónico (RIDE)
 * para Liquidación de Compra de Bienes y Prestación de Servicios (03)
 * Cumple con el formato estándar del SRI Ecuador
 */

// Interfaces para los datos parseados del XML
export interface LiquidacionCompraData {
    // Info Tributaria
    ambiente: string;
    tipoEmision: string;
    razonSocial: string;
    nombreComercial?: string;
    ruc: string;
    claveAcceso: string;
    codDoc: string;
    estab: string;
    ptoEmi: string;
    secuencial: string;
    dirMatriz: string;

    // Info Liquidación Compra
    fechaEmision: string;
    dirEstablecimiento?: string;
    contribuyenteEspecial?: string;
    obligadoContabilidad: string;
    tipoIdentificacionProveedor: string;
    razonSocialProveedor: string;
    identificacionProveedor: string;
    direccionProveedor?: string;
    totalSinImpuestos: number;
    totalDescuento: number;
    codDocReembolso?: string;
    totalComprobantesReembolso?: number;
    totalBaseImponibleReembolso?: number;
    totalImpuestoReembolso?: number;
    importeTotal: number;
    moneda: string;

    // Impuestos
    totalConImpuestos: TotalImpuesto[];

    // Detalles
    detalles: DetalleLiq[];

    // Pagos
    pagos: PagoLiq[];

    // Autorización
    numeroAutorizacion?: string;
    fechaAutorizacion?: string;
}

export interface TotalImpuesto {
    codigo: string;
    codigoPorcentaje: string;
    baseImponible: number;
    tarifa?: number;
    valor: number;
}

export interface DetalleLiq {
    codigoPrincipal: string;
    codigoAuxiliar?: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    precioTotalSinImpuesto: number;
    impuestos: ImpuestoDetalle[];
}

export interface ImpuestoDetalle {
    codigo: string;
    codigoPorcentaje: string;
    tarifa: number;
    baseImponible: number;
    valor: number;
}

export interface PagoLiq {
    formaPago: string;
    total: number;
    plazo?: number;
    unidadTiempo?: string;
}

interface LiquidacionCompraRIDEProps {
    xmlFirmado: string;
    numeroAutorizacion?: string;
    fechaAutorizacion?: string;
}

/**
 * Parsea el XML de liquidación de compra firmado y extrae los datos
 */
function parseLiquidacionCompraXml(xml: string): LiquidacionCompraData | null {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');

        const getTextContent = (parent: Document | Element, tagName: string): string => {
            const element = parent.getElementsByTagName(tagName)[0];
            return element?.textContent || '';
        };

        const infoTributaria = doc.getElementsByTagName('infoTributaria')[0];
        const infoLiquidacionCompra = doc.getElementsByTagName('infoLiquidacionCompra')[0];
        const detallesElement = doc.getElementsByTagName('detalles')[0];

        if (!infoTributaria || !infoLiquidacionCompra) {
            console.error('XML de liquidación de compra inválido');
            return null;
        }

        // Parsear totalConImpuestos
        const totalConImpuestos: TotalImpuesto[] = [];
        const totalImpuestoElements = infoLiquidacionCompra.getElementsByTagName('totalImpuesto');
        for (let i = 0; i < totalImpuestoElements.length; i++) {
            const imp = totalImpuestoElements[i];
            totalConImpuestos.push({
                codigo: getTextContent(imp, 'codigo'),
                codigoPorcentaje: getTextContent(imp, 'codigoPorcentaje'),
                baseImponible: parseFloat(getTextContent(imp, 'baseImponible')) || 0,
                tarifa: parseFloat(getTextContent(imp, 'tarifa')) || 0,
                valor: parseFloat(getTextContent(imp, 'valor')) || 0,
            });
        }

        // Parsear detalles
        const detalles: DetalleLiq[] = [];
        if (detallesElement) {
            const detalleElements = detallesElement.getElementsByTagName('detalle');
            for (let i = 0; i < detalleElements.length; i++) {
                const det = detalleElements[i];

                const impuestos: ImpuestoDetalle[] = [];
                const impuestoElements = det.getElementsByTagName('impuesto');
                for (let j = 0; j < impuestoElements.length; j++) {
                    const imp = impuestoElements[j];
                    impuestos.push({
                        codigo: getTextContent(imp, 'codigo'),
                        codigoPorcentaje: getTextContent(imp, 'codigoPorcentaje'),
                        tarifa: parseFloat(getTextContent(imp, 'tarifa')) || 0,
                        baseImponible: parseFloat(getTextContent(imp, 'baseImponible')) || 0,
                        valor: parseFloat(getTextContent(imp, 'valor')) || 0,
                    });
                }

                detalles.push({
                    codigoPrincipal: getTextContent(det, 'codigoPrincipal'),
                    codigoAuxiliar: getTextContent(det, 'codigoAuxiliar'),
                    descripcion: getTextContent(det, 'descripcion'),
                    cantidad: parseFloat(getTextContent(det, 'cantidad')) || 0,
                    precioUnitario: parseFloat(getTextContent(det, 'precioUnitario')) || 0,
                    descuento: parseFloat(getTextContent(det, 'descuento')) || 0,
                    precioTotalSinImpuesto: parseFloat(getTextContent(det, 'precioTotalSinImpuesto')) || 0,
                    impuestos,
                });
            }
        }

        // Parsear pagos
        const pagos: PagoLiq[] = [];
        const pagosElement = doc.getElementsByTagName('pagos')[0];
        if (pagosElement) {
            const pagoElements = pagosElement.getElementsByTagName('pago');
            for (let i = 0; i < pagoElements.length; i++) {
                const pago = pagoElements[i];
                pagos.push({
                    formaPago: getTextContent(pago, 'formaPago'),
                    total: parseFloat(getTextContent(pago, 'total')) || 0,
                    plazo: parseInt(getTextContent(pago, 'plazo')) || undefined,
                    unidadTiempo: getTextContent(pago, 'unidadTiempo') || undefined,
                });
            }
        }

        return {
            ambiente: getTextContent(infoTributaria, 'ambiente'),
            tipoEmision: getTextContent(infoTributaria, 'tipoEmision'),
            razonSocial: getTextContent(infoTributaria, 'razonSocial'),
            nombreComercial: getTextContent(infoTributaria, 'nombreComercial'),
            ruc: getTextContent(infoTributaria, 'ruc'),
            claveAcceso: getTextContent(infoTributaria, 'claveAcceso'),
            codDoc: getTextContent(infoTributaria, 'codDoc'),
            estab: getTextContent(infoTributaria, 'estab'),
            ptoEmi: getTextContent(infoTributaria, 'ptoEmi'),
            secuencial: getTextContent(infoTributaria, 'secuencial'),
            dirMatriz: getTextContent(infoTributaria, 'dirMatriz'),
            fechaEmision: getTextContent(infoLiquidacionCompra, 'fechaEmision'),
            dirEstablecimiento: getTextContent(infoLiquidacionCompra, 'dirEstablecimiento'),
            contribuyenteEspecial: getTextContent(infoLiquidacionCompra, 'contribuyenteEspecial'),
            obligadoContabilidad: getTextContent(infoLiquidacionCompra, 'obligadoContabilidad'),
            tipoIdentificacionProveedor: getTextContent(infoLiquidacionCompra, 'tipoIdentificacionProveedor'),
            razonSocialProveedor: getTextContent(infoLiquidacionCompra, 'razonSocialProveedor'),
            identificacionProveedor: getTextContent(infoLiquidacionCompra, 'identificacionProveedor'),
            direccionProveedor: getTextContent(infoLiquidacionCompra, 'direccionProveedor'),
            totalSinImpuestos: parseFloat(getTextContent(infoLiquidacionCompra, 'totalSinImpuestos')) || 0,
            totalDescuento: parseFloat(getTextContent(infoLiquidacionCompra, 'totalDescuento')) || 0,
            importeTotal: parseFloat(getTextContent(infoLiquidacionCompra, 'importeTotal')) || 0,
            moneda: getTextContent(infoLiquidacionCompra, 'moneda') || 'DOLAR',
            totalConImpuestos,
            detalles,
            pagos,
        };
    } catch (error) {
        console.error('Error parseando XML de liquidación de compra:', error);
        return null;
    }
}

export function LiquidacionCompraRIDE({ xmlFirmado, numeroAutorizacion, fechaAutorizacion }: LiquidacionCompraRIDEProps) {
    const liquidacion = parseLiquidacionCompraXml(xmlFirmado);

    if (!liquidacion) {
        return (
            <div className="max-w-4xl mx-auto p-8 bg-white text-slate-800 font-sans border border-slate-200 shadow-sm">
                <div className="text-center text-red-500">
                    <p className="font-bold text-lg">Error al parsear la Liquidación de Compra</p>
                    <p className="text-sm mt-2">El XML proporcionado no tiene un formato válido</p>
                </div>
            </div>
        );
    }

    // Calcular totales
    const subtotal0 = liquidacion.totalConImpuestos.filter(i => i.codigoPorcentaje === '0').reduce((acc, i) => acc + i.baseImponible, 0);
    const subtotalIVA = liquidacion.totalConImpuestos.filter(i => i.codigoPorcentaje !== '0' && i.codigo === '2').reduce((acc, i) => acc + i.baseImponible, 0);
    const totalIVA = liquidacion.totalConImpuestos.filter(i => i.codigo === '2').reduce((acc, i) => acc + i.valor, 0);

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
                        <h1 className="text-xl font-black uppercase tracking-tight">{liquidacion.razonSocial}</h1>
                        {liquidacion.nombreComercial && <p className="text-sm font-bold text-slate-500">{liquidacion.nombreComercial}</p>}
                        <div className="text-[10px] leading-tight text-slate-600 space-y-0.5">
                            <p><span className="font-bold">Dirección Matriz:</span> {liquidacion.dirMatriz}</p>
                            <p><span className="font-bold">Dirección Establecimiento:</span> {liquidacion.dirEstablecimiento || liquidacion.dirMatriz}</p>
                            <p><span className="font-bold">Contribuyente Especial Nro:</span> {liquidacion.contribuyenteEspecial || 'NO'}</p>
                            <p><span className="font-bold">Obligado a llevar contabilidad:</span> {liquidacion.obligadoContabilidad}</p>
                        </div>
                    </div>
                </div>

                {/* Lado Derecho: Info Tributaria Comprobante */}
                <div className="border-2 border-purple-600 p-6 rounded-2xl space-y-3">
                    <div className="space-y-1">
                        <p className="text-lg font-black tracking-tighter">R.U.C.: <span className="font-mono">{liquidacion.ruc}</span></p>
                        <p className="text-lg font-black uppercase bg-purple-600 text-white px-3 py-1 inline-block rounded-md">
                            LIQUIDACIÓN DE COMPRA
                        </p>
                        <p className="text-sm font-bold">No. {liquidacion.estab}-{liquidacion.ptoEmi}-{liquidacion.secuencial}</p>
                    </div>

                    <div className="text-[10px] space-y-1">
                        <p><span className="font-bold">NÚMERO DE AUTORIZACIÓN:</span></p>
                        <p className="font-mono break-all text-xs">{numeroAutorizacion || liquidacion.claveAcceso || 'PENDIENTE DE AUTORIZACIÓN'}</p>
                        <p><span className="font-bold">FECHA Y HORA DE AUTORIZACIÓN:</span> {fechaAutorizacion || 'PENDIENTE'}</p>
                        <p><span className="font-bold">AMBIENTE:</span> {liquidacion.ambiente === '1' ? 'PRUEBAS' : 'PRODUCCIÓN'}</p>
                        <p><span className="font-bold">EMISIÓN:</span> NORMAL</p>
                    </div>

                    <div className="space-y-1 pt-2">
                        <p className="text-[10px] font-bold">CLAVE DE ACCESO:</p>
                        <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg">
                            <div className="h-8 w-full bg-slate-900 flex items-center justify-center mb-1 overflow-hidden">
                                <div className="w-full h-full flex gap-[1px]">
                                    {Array.from({ length: 100 }).map((_, i) => (
                                        <div key={i} className="bg-white" style={{ width: `${Math.random() * 3}px` }}></div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-[9px] font-mono text-center tracking-tighter">{liquidacion.claveAcceso}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Datos del Proveedor */}
            <div className="border border-slate-900 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-y-2 text-[11px]">
                <p><span className="font-bold">Razón Social / Nombres Proveedor:</span> {liquidacion.razonSocialProveedor}</p>
                <p><span className="font-bold">Identificación:</span> {liquidacion.identificacionProveedor}</p>
                <p><span className="font-bold">Fecha Emisión:</span> {liquidacion.fechaEmision}</p>
                <p><span className="font-bold">Moneda:</span> {liquidacion.moneda}</p>
                {liquidacion.direccionProveedor && (
                    <p className="col-span-2"><span className="font-bold">Dirección Proveedor:</span> {liquidacion.direccionProveedor}</p>
                )}
            </div>

            {/* Tabla de Detalles */}
            <div className="border border-slate-900 rounded-xl overflow-hidden mb-8">
                <table className="w-full text-[10px] text-left">
                    <thead className="bg-purple-600 text-white font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-3 py-2 border-r border-white/10">Cod. Principal</th>
                            <th className="px-3 py-2 border-r border-white/10">Cant</th>
                            <th className="px-3 py-2 border-r border-white/10">Descripción</th>
                            <th className="px-3 py-2 border-r border-white/10 text-right">Precio Unit.</th>
                            <th className="px-3 py-2 border-r border-white/10 text-right">Descuento</th>
                            <th className="px-3 py-2 text-right">Precio Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {liquidacion.detalles.map((detalle, idx) => (
                            <tr key={idx}>
                                <td className="px-3 py-2 border-r border-slate-200 font-mono">{detalle.codigoPrincipal}</td>
                                <td className="px-3 py-2 border-r border-slate-200 text-center">{detalle.cantidad.toFixed(2)}</td>
                                <td className="px-3 py-2 border-r border-slate-200 font-bold">{detalle.descripcion}</td>
                                <td className="px-3 py-2 border-r border-slate-200 text-right">{detalle.precioUnitario.toFixed(2)}</td>
                                <td className="px-3 py-2 border-r border-slate-200 text-right">{detalle.descuento.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right font-bold">{detalle.precioTotalSinImpuesto.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="border border-slate-900 p-4 rounded-xl space-y-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Información Adicional</h3>
                    <div className="text-[9px] space-y-1">
                        <p><span className="font-bold uppercase">Tipo Identificación Proveedor:</span> {
                            liquidacion.tipoIdentificacionProveedor === '04' ? 'RUC' :
                                liquidacion.tipoIdentificacionProveedor === '05' ? 'CÉDULA' :
                                    liquidacion.tipoIdentificacionProveedor === '06' ? 'PASAPORTE' : 'OTRO'
                        }</p>
                    </div>
                </div>

                <div className="border border-slate-900 rounded-xl overflow-hidden">
                    <table className="w-full text-[10px] text-left">
                        <tbody className="divide-y divide-slate-900">
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Subtotal Sin Impuestos</td>
                                <td className="px-3 py-1.5 text-right font-bold">{liquidacion.totalSinImpuestos.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Subtotal IVA 15%</td>
                                <td className="px-3 py-1.5 text-right">{subtotalIVA.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Subtotal 0%</td>
                                <td className="px-3 py-1.5 text-right">{subtotal0.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Total Descuento</td>
                                <td className="px-3 py-1.5 text-right">{liquidacion.totalDescuento.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">IVA 15%</td>
                                <td className="px-3 py-1.5 text-right font-bold">{totalIVA.toFixed(2)}</td>
                            </tr>
                            <tr className="bg-purple-600 text-white">
                                <td className="px-3 py-2 font-black uppercase text-xs">Total</td>
                                <td className="px-3 py-2 text-right font-black text-xs">{liquidacion.importeTotal.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
