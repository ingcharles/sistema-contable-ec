'use client';

/**
 * Componente FacturaRIDE
 * Representación Impresa de Documento Electrónico (RIDE)
 * para Facturas (01)
 * Cumple con el formato estándar del SRI Ecuador
 */

// Interfaces para los datos parseados del XML de factura
export interface FacturaData {
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

    // Info Factura
    fechaEmision: string;
    dirEstablecimiento?: string;
    contribuyenteEspecial?: string;
    obligadoContabilidad: string;
    tipoIdentificacionComprador: string;
    razonSocialComprador: string;
    identificacionComprador: string;
    direccionComprador?: string;
    emailComprador?: string;
    totalSinImpuestos: number;
    totalDescuento: number;
    totalConImpuestos: TotalImpuesto[];
    propina: number;
    importeTotal: number;
    moneda: string;
    pagos: Pago[];

    // Detalles
    detalles: Detalle[];

    // Autorización
    numeroAutorizacion?: string;
    fechaAutorizacion?: string;
}

export interface TotalImpuesto {
    codigo: string;
    codigoPorcentaje: string;
    baseImponible: number;
    valor: number;
}

export interface Detalle {
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

export interface Pago {
    formaPago: string;
    total: number;
    plazo?: string;
    unidadTiempo?: string;
}

interface FacturaRIDEProps {
    xmlFirmado?: string;
    factura?: any; // Para compatibilidad con el modo antiguo
    numeroAutorizacion?: string;
    fechaAutorizacion?: string;
}

/**
 * Parsea el XML de factura firmado y extrae los datos
 */
function parseFacturaXml(xml: string): FacturaData | null {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');

        const getTextContent = (parent: Document | Element, tagName: string): string => {
            const element = parent.getElementsByTagName(tagName)[0];
            return element?.textContent || '';
        };

        const infoTributaria = doc.getElementsByTagName('infoTributaria')[0];
        const infoFactura = doc.getElementsByTagName('infoFactura')[0];
        const detallesElements = doc.getElementsByTagName('detalle');

        if (!infoTributaria || !infoFactura) {
            console.error('XML de factura inválido: falta infoTributaria o infoFactura');
            return null;
        }

        // Parsear detalles
        const detalles: Detalle[] = [];
        for (let i = 0; i < detallesElements.length; i++) {
            const det = detallesElements[i];
            const impuestosElements = det.getElementsByTagName('impuesto');
            const impuestos: ImpuestoDetalle[] = [];

            for (let j = 0; j < impuestosElements.length; j++) {
                const imp = impuestosElements[j];
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

        // Parsear Totales con Impuestos
        const totalImpuestosElements = infoFactura.getElementsByTagName('totalImpuesto');
        const totalConImpuestos: TotalImpuesto[] = [];
        for (let i = 0; i < totalImpuestosElements.length; i++) {
            const imp = totalImpuestosElements[i];
            totalConImpuestos.push({
                codigo: getTextContent(imp, 'codigo'),
                codigoPorcentaje: getTextContent(imp, 'codigoPorcentaje'),
                baseImponible: parseFloat(getTextContent(imp, 'baseImponible')) || 0,
                valor: parseFloat(getTextContent(imp, 'valor')) || 0,
            });
        }

        // Parsear Pagos
        const pagosElements = infoFactura.getElementsByTagName('pago');
        const pagos: Pago[] = [];
        for (let i = 0; i < pagosElements.length; i++) {
            const p = pagosElements[i];
            pagos.push({
                formaPago: getTextContent(p, 'formaPago'),
                total: parseFloat(getTextContent(p, 'total')) || 0,
                plazo: getTextContent(p, 'plazo'),
                unidadTiempo: getTextContent(p, 'unidadTiempo'),
            });
        }

        const parsedData: FacturaData = {
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
            fechaEmision: getTextContent(infoFactura, 'fechaEmision'),
            dirEstablecimiento: getTextContent(infoFactura, 'dirEstablecimiento'),
            contribuyenteEspecial: getTextContent(infoFactura, 'contribuyenteEspecial'),
            obligadoContabilidad: getTextContent(infoFactura, 'obligadoContabilidad'),
            tipoIdentificacionComprador: getTextContent(infoFactura, 'tipoIdentificacionComprador'),
            razonSocialComprador: getTextContent(infoFactura, 'razonSocialComprador'),
            identificacionComprador: getTextContent(infoFactura, 'identificacionComprador'),
            direccionComprador: getTextContent(infoFactura, 'direccionComprador'),
            totalSinImpuestos: parseFloat(getTextContent(infoFactura, 'totalSinImpuestos')) || 0,
            totalDescuento: parseFloat(getTextContent(infoFactura, 'totalDescuento')) || 0,
            totalConImpuestos,
            propina: parseFloat(getTextContent(infoFactura, 'propina')) || 0,
            importeTotal: parseFloat(getTextContent(infoFactura, 'importeTotal')) || 0,
            moneda: getTextContent(infoFactura, 'moneda'),
            pagos,
            detalles,
        };

        // Parsear Información Adicional
        const infoAdicionalElements = doc.getElementsByTagName('campoAdicional');
        for (let i = 0; i < infoAdicionalElements.length; i++) {
            const campo = infoAdicionalElements[i];
            const nombre = campo.getAttribute('nombre');
            const valor = campo.textContent || '';

            if (nombre === 'Direccion' && !parsedData.direccionComprador) {
                parsedData.direccionComprador = valor;
            } else if (nombre === 'Email') {
                parsedData.emailComprador = valor;
            }
        }

        return parsedData;
    } catch (error) {
        console.error('Error parseando XML de factura:', error);
        return null;
    }
}

/**
 * Obtiene el nombre de la forma de pago según el código SRI
 */
function getNombreFormaPago(codigo: string): string {
    const formas: Record<string, string> = {
        '01': 'SIN UTILIZACION DEL SISTEMA FINANCIERO',
        '16': 'TARJETA DE DEBITO',
        '17': 'DINERO ELECTRONICO',
        '18': 'TARJETA PREPAGO',
        '19': 'TARJETA DE CREDITO',
        '20': 'OTROS CON UTILIZACION DEL SISTEMA FINANCIERO',
        '21': 'ENDOSO DE TITULOS',
    };
    return formas[codigo] || 'OTROS';
}

export function FacturaRIDE({ xmlFirmado, factura: oldFactura, numeroAutorizacion, fechaAutorizacion }: FacturaRIDEProps) {
    const data = xmlFirmado ? parseFacturaXml(xmlFirmado) : null;

    // Si no hay XML pero hay objeto factura antiguo, usarlo (fallback)
    const factor = data || oldFactura;

    if (!factor) {
        return (
            <div className="max-w-4xl mx-auto p-8 bg-white text-slate-800 font-sans border border-slate-200 shadow-sm">
                <div className="text-center text-red-500">
                    <p className="font-bold text-lg">Error al cargar la factura</p>
                    <p className="text-sm mt-2">No se proporcionó un XML válido ni datos de respaldo</p>
                </div>
            </div>
        );
    }

    // Totales calculados para el pie
    const subtotal15 = data
        ? data.totalConImpuestos.find(i => i.codigoPorcentaje === '4' || i.codigoPorcentaje === '2')?.baseImponible || 0
        : oldFactura.detalles?.filter((d: any) => d.codigoIVA === '4' || d.codigoIVA === '2').reduce((acc: number, d: any) => acc + Number(d.baseImponible), 0) || 0;

    const subtotal0 = data
        ? data.totalConImpuestos.find(i => i.codigoPorcentaje === '0')?.baseImponible || 0
        : oldFactura.detalles?.filter((d: any) => d.codigoIVA === '0').reduce((acc: number, d: any) => acc + Number(d.baseImponible), 0) || 0;

    const valorIva = data
        ? data.totalConImpuestos.reduce((acc, i) => acc + i.valor, 0)
        : oldFactura.totalIVA || 0;

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white text-slate-800 font-sans border border-slate-200 shadow-sm print:shadow-none print:border-0 overflow-hidden">
            {/* Encabezado RIDE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Lado Izquierdo: Info Empresa */}
                <div className="space-y-4">
                    <div className="h-24 w-48 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Logo Empresa</span>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-xl font-black uppercase tracking-tight">{factor.razonSocial}</h1>
                        {factor.nombreComercial && <p className="text-sm font-bold text-slate-500">{factor.nombreComercial}</p>}
                        <div className="text-[10px] leading-tight text-slate-600 space-y-0.5">
                            <p><span className="font-bold">Dirección Matriz:</span> {factor.dirMatriz}</p>
                            <p><span className="font-bold">Dirección Establecimiento:</span> {factor.dirEstablecimiento || factor.dirMatriz}</p>
                            <p><span className="font-bold">Contribuyente Especial Nro:</span> {factor.contribuyenteEspecial || 'NO'}</p>
                            <p><span className="font-bold">Obligado a llevar contabilidad:</span> {factor.obligadoContabilidad}</p>
                        </div>
                    </div>
                </div>

                {/* Lado Derecho: Info Tributaria Comprobante */}
                <div className="border-2 border-slate-900 p-6 rounded-2xl space-y-3">
                    <div className="space-y-1">
                        <p className="text-lg font-black tracking-tighter">R.U.C.: <span className="font-mono">{factor.ruc}</span></p>
                        <p className="text-xl font-black uppercase bg-slate-900 text-white px-3 py-1 inline-block rounded-md">
                            FACTURA
                        </p>
                        <p className="text-sm font-bold">No. {factor.estab}-{factor.ptoEmi}-{factor.secuencial}</p>
                    </div>

                    <div className="text-[10px] space-y-1">
                        <p><span className="font-bold">NÚMERO DE AUTORIZACIÓN:</span></p>
                        <p className="font-mono break-all text-xs">{numeroAutorizacion || factor.numeroAutorizacion || factor.claveAcceso || 'PENDIENTE DE AUTORIZACIÓN'}</p>
                        <p><span className="font-bold">FECHA Y HORA DE AUTORIZACIÓN:</span> {fechaAutorizacion || factor.fechaAutorizacion || 'PENDIENTE'}</p>
                        <p><span className="font-bold">AMBIENTE:</span> {factor.ambiente === '1' ? 'PRUEBAS' : 'PRODUCCIÓN'}</p>
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
                            <p className="text-[9px] font-mono text-center tracking-tighter">{factor.claveAcceso || '0000000000000000000000000000000000000000000000000'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Datos del Cliente */}
            <div className="border border-slate-900 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-y-2 text-[11px]">
                <p><span className="font-bold">Razón Social / Nombres y Apellidos:</span> {factor.razonSocialComprador}</p>
                <p><span className="font-bold">Identificación:</span> {factor.identificacionComprador}</p>
                <p><span className="font-bold">Fecha Emisión:</span> {factor.fechaEmision}</p>
                <p><span className="font-bold">Guía de Remisión:</span> N/A</p>
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
                        {factor.detalles?.map((detalle: any, idx: number) => (
                            <tr key={idx}>
                                <td className="px-3 py-2 border-r border-slate-200 font-mono">{detalle.codigoPrincipal}</td>
                                <td className="px-3 py-2 border-r border-slate-200 text-center">{Number(detalle.cantidad).toFixed(2)}</td>
                                <td className="px-3 py-2 border-r border-slate-200 font-bold uppercase">{detalle.descripcion}</td>
                                <td className="px-3 py-2 border-r border-slate-200 text-right">{Number(detalle.precioUnitario).toFixed(2)}</td>
                                <td className="px-3 py-2 border-r border-slate-200 text-right">{Number(detalle.descuento || 0).toFixed(2)}</td>
                                <td className="px-3 py-2 text-right font-bold">${Number(detalle.precioTotalSinImpuesto || detalle.total).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pie de Factura */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                    {/* Información Adicional */}
                    <div className="border border-slate-900 p-4 rounded-xl space-y-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Información Adicional</h3>
                        <div className="text-[9px] space-y-1">
                            <p><span className="font-bold uppercase">Dirección:</span> {factor.direccionComprador || 'N/A'}</p>
                            <p><span className="font-bold uppercase">Email:</span> {factor.emailComprador || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Pagos */}
                    <div className="border border-slate-900 rounded-xl overflow-hidden">
                        <table className="w-full text-[9px] text-left">
                            <thead className="bg-slate-100 font-bold uppercase border-b border-slate-900">
                                <tr>
                                    <th className="px-3 py-1.5 border-r border-slate-900 font-bold text-slate-800">Forma de Pago</th>
                                    <th className="px-3 py-1.5 text-right font-bold text-slate-800">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {factor.pagos?.map((pago: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="px-3 py-1.5 border-r border-slate-900 uppercase">{getNombreFormaPago(pago.formaPago)}</td>
                                        <td className="px-3 py-1.5 text-right font-bold">${Number(pago.total).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totales */}
                <div className="border border-slate-900 rounded-xl overflow-hidden">
                    <table className="w-full text-[10px] text-left">
                        <tbody className="divide-y divide-slate-200">
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Subtotal Sin Impuestos</td>
                                <td className="px-3 py-1.5 text-right font-bold">${Number(factor.totalSinImpuestos).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Subtotal 15%</td>
                                <td className="px-3 py-1.5 text-right">${Number(subtotal15).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Subtotal 0%</td>
                                <td className="px-3 py-1.5 text-right">${Number(subtotal0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Total Descuento</td>
                                <td className="px-3 py-1.5 text-right text-red-600">${Number(factor.totalDescuento || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">IVA 15%</td>
                                <td className="px-3 py-1.5 text-right font-bold">${Number(valorIva).toFixed(2)}</td>
                            </tr>
                            <tr className="bg-slate-900 text-white">
                                <td className="px-3 py-2 font-black uppercase text-xs">Importe Total</td>
                                <td className="px-3 py-2 text-right font-black text-xs">${Number(factor.importeTotal).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
