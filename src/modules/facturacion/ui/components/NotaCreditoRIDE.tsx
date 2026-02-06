import { Factura } from '@/shared/types';
import { useBrandColors } from '@/shared/hooks/useBrandColors';

/**
 * Componente NotaCreditoRIDE
 * Representación Impresa de Documento Electrónico (RIDE)
 * para Notas de Crédito (04)
 * Cumple con el formato estándar del SRI Ecuador
 */

// Interfaces para los datos parseados del XML
export interface NotaCreditoData {
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

    // Info Nota Crédito
    fechaEmision: string;
    dirEstablecimiento?: string;
    contribuyenteEspecial?: string;
    obligadoContabilidad: string;
    tipoIdentificacionComprador: string;
    razonSocialComprador: string;
    identificacionComprador: string;
    direccionComprador?: string;
    emailComprador?: string;
    codDocModificado: string;
    numDocModificado: string;
    fechaEmisionDocSustento: string;
    totalSinImpuestos: number;
    valorModificacion: number;
    moneda: string;
    motivo: string;

    // Impuestos
    totalConImpuestos: TotalImpuesto[];

    // Detalles
    detalles: DetalleNC[];

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

export interface DetalleNC {
    codigoInterno: string;
    codigoAdicional?: string;
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

interface NotaCreditoRIDEProps {
    comprobante: Factura;
}

/**
 * Parsea el XML de nota de crédito firmado y extrae los datos
 */
function parseNotaCreditoXml(xml: string): NotaCreditoData | null {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');

        const getTextContent = (parent: Document | Element, tagName: string): string => {
            const element = parent.getElementsByTagName(tagName)[0];
            return element?.textContent || '';
        };

        const infoTributaria = doc.getElementsByTagName('infoTributaria')[0];
        const infoNotaCredito = doc.getElementsByTagName('infoNotaCredito')[0];
        const detallesElement = doc.getElementsByTagName('detalles')[0];

        if (!infoTributaria || !infoNotaCredito) {
            console.error('XML de nota de crédito inválido');
            return null;
        }

        // Parsear totalConImpuestos
        const totalConImpuestos: TotalImpuesto[] = [];
        const totalImpuestoElements = infoNotaCredito.getElementsByTagName('totalImpuesto');
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
        const detalles: DetalleNC[] = [];
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
                    codigoInterno: getTextContent(det, 'codigoInterno'),
                    codigoAdicional: getTextContent(det, 'codigoAdicional'),
                    descripcion: getTextContent(det, 'descripcion'),
                    cantidad: parseFloat(getTextContent(det, 'cantidad')) || 0,
                    precioUnitario: parseFloat(getTextContent(det, 'precioUnitario')) || 0,
                    descuento: parseFloat(getTextContent(det, 'descuento')) || 0,
                    precioTotalSinImpuesto: parseFloat(getTextContent(det, 'precioTotalSinImpuesto')) || 0,
                    impuestos,
                });
            }
        }

        const parsedData: NotaCreditoData = {
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
            fechaEmision: getTextContent(infoNotaCredito, 'fechaEmision'),
            dirEstablecimiento: getTextContent(infoNotaCredito, 'dirEstablecimiento'),
            contribuyenteEspecial: getTextContent(infoNotaCredito, 'contribuyenteEspecial'),
            obligadoContabilidad: getTextContent(infoNotaCredito, 'obligadoContabilidad'),
            tipoIdentificacionComprador: getTextContent(infoNotaCredito, 'tipoIdentificacionComprador'),
            razonSocialComprador: getTextContent(infoNotaCredito, 'razonSocialComprador'),
            identificacionComprador: getTextContent(infoNotaCredito, 'identificacionComprador'),
            codDocModificado: getTextContent(infoNotaCredito, 'codDocModificado'),
            numDocModificado: getTextContent(infoNotaCredito, 'numDocModificado'),
            fechaEmisionDocSustento: getTextContent(infoNotaCredito, 'fechaEmisionDocSustento'),
            totalSinImpuestos: parseFloat(getTextContent(infoNotaCredito, 'totalSinImpuestos')) || 0,
            valorModificacion: parseFloat(getTextContent(infoNotaCredito, 'valorModificacion')) || 0,
            moneda: getTextContent(infoNotaCredito, 'moneda') || 'DOLAR',
            motivo: getTextContent(infoNotaCredito, 'motivo'),
            totalConImpuestos,
            detalles,
        };

        // Parsear Información Adicional
        const infoAdicionalElements = doc.getElementsByTagName('campoAdicional');
        for (let i = 0; i < infoAdicionalElements.length; i++) {
            const campo = infoAdicionalElements[i];
            const nombre = campo.getAttribute('nombre');
            const valor = campo.textContent || '';

            if (nombre === 'Direccion' || nombre === 'Dirección' || nombre === 'DIRECCION') {
                parsedData.direccionComprador = valor;
            } else if (nombre === 'Email' || nombre === 'EMAIL' || nombre === 'E-mail' || nombre === 'Mail') {
                parsedData.emailComprador = valor;
            }
        }

        return parsedData;
    } catch (error) {
        console.error('Error parseando XML de nota de crédito:', error);
        return null;
    }
}


export function NotaCreditoRIDE({ comprobante }: NotaCreditoRIDEProps) {
    const colors = useBrandColors();
    const xmlFirmado = comprobante.xmlFirmado;
    const notaCredito = xmlFirmado ? parseNotaCreditoXml(xmlFirmado) : null;

    if (!notaCredito) {
        return (
            <div className="max-w-4xl mx-auto p-8 bg-white text-slate-800 font-sans border border-slate-200 shadow-sm">
                <div className="text-center text-red-500">
                    <p className="font-bold text-lg">Error al parsear la Nota de Crédito</p>
                    <p className="text-sm mt-2">El XML proporcionado no tiene un formato válido</p>
                </div>
            </div>
        );
    }

    // Calcular totales
    const subtotal0 = notaCredito.totalConImpuestos.filter(i => i.codigoPorcentaje === '0').reduce((acc, i) => acc + i.baseImponible, 0);
    const subtotalIVA = notaCredito.totalConImpuestos.filter(i => i.codigoPorcentaje !== '0' && i.codigo === '2').reduce((acc, i) => acc + i.baseImponible, 0);
    const totalIVA = notaCredito.totalConImpuestos.filter(i => i.codigo === '2').reduce((acc, i) => acc + i.valor, 0);

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
                        <h1 className="text-xl font-black uppercase tracking-tight">{notaCredito.razonSocial}</h1>
                        {notaCredito.nombreComercial && <p className="text-sm font-bold text-slate-500">{notaCredito.nombreComercial}</p>}
                        <div className="text-[10px] leading-tight text-slate-600 space-y-0.5">
                            <p><span className="font-bold">Dirección Matriz:</span> {notaCredito.dirMatriz}</p>
                            <p><span className="font-bold">Dirección Establecimiento:</span> {notaCredito.dirEstablecimiento || notaCredito.dirMatriz}</p>
                            <p><span className="font-bold">Contribuyente Especial Nro:</span> {notaCredito.contribuyenteEspecial || 'NO'}</p>
                            <p><span className="font-bold">Obligado a llevar contabilidad:</span> {notaCredito.obligadoContabilidad}</p>
                        </div>
                    </div>
                </div>

                {/* Lado Derecho: Info Tributaria Comprobante */}
                <div className="border-2 p-6 rounded-2xl space-y-3" style={{ borderColor: colors.primary }}>
                    <div className="space-y-1">
                        <p className="text-lg font-black tracking-tighter">R.U.C.: <span className="font-mono">{notaCredito.ruc}</span></p>
                        <p className="text-xl font-black uppercase text-white px-3 py-1 inline-block rounded-md" style={{ backgroundColor: colors.primary }}>
                            NOTA DE CRÉDITO
                        </p>
                        <p className="text-sm font-bold">No. {notaCredito.estab}-{notaCredito.ptoEmi}-{notaCredito.secuencial}</p>
                    </div>

                    <div className="text-[10px] space-y-1">
                        <p><span className="font-bold">NÚMERO DE AUTORIZACIÓN:</span></p>
                        <p className="font-mono break-all text-xs">{comprobante.numeroAutorizacion || notaCredito.claveAcceso || 'PENDIENTE DE AUTORIZACIÓN'}</p>
                        <p><span className="font-bold">FECHA Y HORA DE AUTORIZACIÓN:</span> {comprobante.fechaAutorizacion || 'PENDIENTE'}</p>
                        <p><span className="font-bold">AMBIENTE:</span> {notaCredito.ambiente === '1' ? 'PRUEBAS' : 'PRODUCCIÓN'}</p>
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
                            <p className="text-[9px] font-mono text-center tracking-tighter">{notaCredito.claveAcceso}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Datos del Adquirente y Documento Modificado */}
            <div className="border border-slate-900 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-y-2 text-[11px]">
                <p><span className="font-bold">Razón Social / Nombres:</span> {notaCredito.razonSocialComprador}</p>
                <p><span className="font-bold">Identificación:</span> {notaCredito.identificacionComprador}</p>
                <p><span className="font-bold">Fecha Emisión:</span> {notaCredito.fechaEmision}</p>
                <p><span className="font-bold">Moneda:</span> {notaCredito.moneda}</p>
                <p className="col-span-2 mt-2 pt-2 border-t border-slate-200">
                    <span className="font-bold">Comprobante que modifica:</span>{' '}
                    <span className="px-2 py-0.5 rounded font-mono" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                        DOCUMENTO {notaCredito.numDocModificado}
                    </span>
                    <span className="text-slate-500 ml-2">(Emitido: {notaCredito.fechaEmisionDocSustento})</span>
                </p>
            </div>

            {/* Motivo */}
            <div className="border p-4 rounded-xl mb-6 text-[11px]" style={{ borderColor: colors.primary, backgroundColor: `${colors.primary}10` }}>
                <p><span className="font-bold" style={{ color: colors.primary }}>Motivo de la Nota de Crédito:</span></p>
                <p className="mt-1">{notaCredito.motivo}</p>
            </div>

            {/* Tabla de Detalles */}
            <div className="border border-slate-900 rounded-xl overflow-hidden mb-8">
                <table className="w-full text-[10px] text-left">
                    <thead className="text-white font-bold uppercase tracking-wider" style={{ backgroundColor: colors.primary }}>
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
                        {notaCredito.detalles.map((detalle, idx) => (
                            <tr key={idx}>
                                <td className="px-3 py-2 border-r border-slate-200 font-mono">{detalle.codigoInterno}</td>
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
                        <p><span className="font-bold uppercase">Tipo Identificación:</span> {
                            comprobante.tipoIdentificacionCompradorNombre || 'N/A'
                        }</p>
                        <p><span className="font-bold uppercase">Dirección:</span> {notaCredito.direccionComprador || 'N/A'}</p>
                        <p><span className="font-bold uppercase">Email:</span> {notaCredito.emailComprador || 'N/A'}</p>
                    </div>
                </div>

                <div className="border border-slate-900 rounded-xl overflow-hidden">
                    <table className="w-full text-[10px] text-left">
                        <tbody className="divide-y divide-slate-900">
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Subtotal Sin Impuestos</td>
                                <td className="px-3 py-1.5 text-right font-bold">{notaCredito.totalSinImpuestos.toFixed(2)}</td>
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
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">IVA 15%</td>
                                <td className="px-3 py-1.5 text-right font-bold">{totalIVA.toFixed(2)}</td>
                            </tr>
                            <tr className="text-white" style={{ backgroundColor: colors.primary }}>
                                <td className="px-3 py-2 font-black uppercase text-xs">Valor de Modificación</td>
                                <td className="px-3 py-2 text-right font-black text-xs">{notaCredito.valorModificacion.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
