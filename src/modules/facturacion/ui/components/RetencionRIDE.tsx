import { Factura } from '@/shared/types';
import { useBrandColors } from '@/shared/hooks/useBrandColors';

/**
 * Componente RetencionRIDE
 * Representación Impresa de Documento Electrónico (RIDE)
 * para Comprobantes de Retención (07)
 * Cumple con el formato estándar del SRI Ecuador
 */

// Interfaces para los datos parseados del XML de retención
export interface RetencionData {
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

    // Info Comp Retención
    fechaEmision: string;
    dirEstablecimiento?: string;
    contribuyenteEspecial?: string;
    obligadoContabilidad: string;
    tipoIdentificacionSujetoRetenido: string;
    parteRel: string;
    razonSocialSujetoRetenido: string;
    identificacionSujetoRetenido: string;
    periodoFiscal: string;

    // Documentos Sustento
    docsSustento: DocSustento[];

    // Autorización
    numeroAutorizacion?: string;
    fechaAutorizacion?: string;
}

export interface DocSustento {
    codSustento: string;
    codDocSustento: string;
    numDocSustento: string;
    fechaEmisionDocSustento: string;
    numAutDocSustento?: string;
    pagoLocExt: string;
    totalSinImpuestos: number;
    importeTotal: number;
    impuestosDocSustento: ImpuestoDocSustento[];
    retenciones: Retencion[];
    pagos: Pago[];
}

export interface ImpuestoDocSustento {
    codImpuestoDocSustento: string;
    codigoPorcentaje: string;
    baseImponible: number;
    tarifa: number;
    valorImpuesto: number;
}

export interface Retencion {
    codigo: string; // 1 = Renta, 2 = IVA, 6 = ISD
    codigoRetencion: string;
    baseImponible: number;
    porcentajeRetener: number;
    valorRetenido: number;
}

export interface Pago {
    formaPago: string;
    total: number;
}

interface RetencionRIDEProps {
    comprobante: Factura;
}

/**
 * Parsea el XML de retención firmado y extrae los datos
 */
function parseRetencionXml(xml: string): RetencionData | null {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');

        const getTextContent = (parent: Document | Element, tagName: string): string => {
            const element = parent.getElementsByTagName(tagName)[0];
            return element?.textContent || '';
        };

        const infoTributaria = doc.getElementsByTagName('infoTributaria')[0];
        const infoCompRetencion = doc.getElementsByTagName('infoCompRetencion')[0];
        const docsSustentoElements = doc.getElementsByTagName('docSustento');

        if (!infoTributaria || !infoCompRetencion) {
            console.error('XML de retención inválido: falta infoTributaria o infoCompRetencion');
            return null;
        }

        // Parsear documentos sustento
        const docsSustento: DocSustento[] = [];
        for (let i = 0; i < docsSustentoElements.length; i++) {
            const docSustento = docsSustentoElements[i];

            // Parsear impuestos del documento sustento
            const impuestosElements = docSustento.getElementsByTagName('impuestoDocSustento');
            const impuestosDocSustento: ImpuestoDocSustento[] = [];
            for (let j = 0; j < impuestosElements.length; j++) {
                const imp = impuestosElements[j];
                impuestosDocSustento.push({
                    codImpuestoDocSustento: getTextContent(imp, 'codImpuestoDocSustento'),
                    codigoPorcentaje: getTextContent(imp, 'codigoPorcentaje'),
                    baseImponible: parseFloat(getTextContent(imp, 'baseImponible')) || 0,
                    tarifa: parseFloat(getTextContent(imp, 'tarifa')) || 0,
                    valorImpuesto: parseFloat(getTextContent(imp, 'valorImpuesto')) || 0,
                });
            }

            // Parsear retenciones
            const retencionesElements = docSustento.getElementsByTagName('retencion');
            const retenciones: Retencion[] = [];
            for (let j = 0; j < retencionesElements.length; j++) {
                const ret = retencionesElements[j];
                retenciones.push({
                    codigo: getTextContent(ret, 'codigo'),
                    codigoRetencion: getTextContent(ret, 'codigoRetencion'),
                    baseImponible: parseFloat(getTextContent(ret, 'baseImponible')) || 0,
                    porcentajeRetener: parseFloat(getTextContent(ret, 'porcentajeRetener')) || 0,
                    valorRetenido: parseFloat(getTextContent(ret, 'valorRetenido')) || 0,
                });
            }

            // Parsear pagos
            const pagosElements = docSustento.getElementsByTagName('pago');
            const pagos: Pago[] = [];
            for (let j = 0; j < pagosElements.length; j++) {
                const pago = pagosElements[j];
                pagos.push({
                    formaPago: getTextContent(pago, 'formaPago'),
                    total: parseFloat(getTextContent(pago, 'total')) || 0,
                });
            }

            docsSustento.push({
                codSustento: getTextContent(docSustento, 'codSustento'),
                codDocSustento: getTextContent(docSustento, 'codDocSustento'),
                numDocSustento: getTextContent(docSustento, 'numDocSustento'),
                fechaEmisionDocSustento: getTextContent(docSustento, 'fechaEmisionDocSustento'),
                numAutDocSustento: getTextContent(docSustento, 'numAutDocSustento'),
                pagoLocExt: getTextContent(docSustento, 'pagoLocExt'),
                totalSinImpuestos: parseFloat(getTextContent(docSustento, 'totalSinImpuestos')) || 0,
                importeTotal: parseFloat(getTextContent(docSustento, 'importeTotal')) || 0,
                impuestosDocSustento,
                retenciones,
                pagos,
            });
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
            fechaEmision: getTextContent(infoCompRetencion, 'fechaEmision'),
            dirEstablecimiento: getTextContent(infoCompRetencion, 'dirEstablecimiento'),
            contribuyenteEspecial: getTextContent(infoCompRetencion, 'contribuyenteEspecial'),
            obligadoContabilidad: getTextContent(infoCompRetencion, 'obligadoContabilidad'),
            tipoIdentificacionSujetoRetenido: getTextContent(infoCompRetencion, 'tipoIdentificacionSujetoRetenido'),
            parteRel: getTextContent(infoCompRetencion, 'parteRel'),
            razonSocialSujetoRetenido: getTextContent(infoCompRetencion, 'razonSocialSujetoRetenido'),
            identificacionSujetoRetenido: getTextContent(infoCompRetencion, 'identificacionSujetoRetenido'),
            periodoFiscal: getTextContent(infoCompRetencion, 'periodoFiscal'),
            docsSustento,
        };
    } catch (error) {
        console.error('Error parseando XML de retención:', error);
        return null;
    }
}

/**
 * Obtiene el nombre del tipo de documento según el código SRI
 */
function getNombreTipoDocumento(codigo: string): string {
    const tipos: Record<string, string> = {
        '01': 'FACTURA',
        '02': 'NOTA O BOLETA DE VENTA',
        '03': 'LIQUIDACIÓN DE COMPRA',
        '04': 'NOTA DE CRÉDITO',
        '05': 'NOTA DE DÉBITO',
        '06': 'GUÍA DE REMISIÓN',
        '07': 'COMPROBANTE DE RETENCIÓN',
        '11': 'PASAJES EXPEDIDOS POR TRANSPORTE',
        '12': 'DOCUMENTOS EMITIDOS POR IFIs',
        '15': 'COMPROBANTE DE VENTA LIQ. COMPRA',
        '18': 'DOCUMENTOS AUTORIZADOS CP PÚBLICO',
        '19': 'COMPROBANTES DE PAGO CUOTAS',
        '20': 'NOTA DE CRÉDITO TC',
        '21': 'NOTA DE DÉBITO TC',
        '41': 'COMPROBANTE DE VENTA LIQ. COMPRA BIENES',
        '47': 'NOTAS DE CRÉDITO POR RETENCIONES',
        '48': 'NOTAS DE DÉBITO POR RETENCIONES',
    };
    return tipos[codigo] || 'DOCUMENTO';
}

/**
 * Obtiene el nombre del tipo de impuesto según el código
 */
function getNombreImpuesto(codigo: string): string {
    const impuestos: Record<string, string> = {
        '1': 'RENTA',
        '2': 'IVA',
        '6': 'ISD',
    };
    return impuestos[codigo] || 'OTRO';
}

/**
 * Formatea el número de documento sustento (ej: 001001000000010 -> 001-001-000000010)
 */
function formatNumDocSustento(num: string): string {
    if (num.length === 15) {
        return `${num.substring(0, 3)}-${num.substring(3, 6)}-${num.substring(6)}`;
    }
    return num;
}

export function RetencionRIDE({ comprobante }: RetencionRIDEProps) {
    const colors = useBrandColors();
    const xmlFirmado = comprobante.xmlFirmado;
    const retencion = xmlFirmado ? parseRetencionXml(xmlFirmado) : null;

    if (!retencion) {
        return (
            <div className="max-w-4xl mx-auto p-8 bg-white text-slate-800 font-sans border border-slate-200 shadow-sm">
                <div className="text-center text-red-500">
                    <p className="font-bold text-lg">Error al parsear el comprobante de retención</p>
                    <p className="text-sm mt-2">El XML proporcionado no tiene un formato válido</p>
                </div>
            </div>
        );
    }

    // Calcular totales de retenciones
    const totalRetencionRenta = retencion.docsSustento.reduce(
        (acc, doc) => acc + doc.retenciones.filter(r => r.codigo === '1').reduce((sum, r) => sum + r.valorRetenido, 0),
        0
    );
    const totalRetencionIVA = retencion.docsSustento.reduce(
        (acc, doc) => acc + doc.retenciones.filter(r => r.codigo === '2').reduce((sum, r) => sum + r.valorRetenido, 0),
        0
    );
    const totalRetenciones = totalRetencionRenta + totalRetencionIVA;

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white text-slate-800 font-sans border border-slate-200 shadow-sm print:shadow-none print:border-0">
            {/* Encabezado RIDE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Lado Izquierdo: Info Empresa (Agente de Retención) */}
                <div className="space-y-4">
                    <div className="h-24 w-48 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Logo Empresa</span>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-xl font-black uppercase tracking-tight">{retencion.razonSocial}</h1>
                        {retencion.nombreComercial && <p className="text-sm font-bold text-slate-500">{retencion.nombreComercial}</p>}
                        <div className="text-[10px] leading-tight text-slate-600 space-y-0.5">
                            <p><span className="font-bold">Dirección Matriz:</span> {retencion.dirMatriz}</p>
                            <p><span className="font-bold">Dirección Establecimiento:</span> {retencion.dirEstablecimiento || retencion.dirMatriz}</p>
                            <p><span className="font-bold">Contribuyente Especial Nro:</span> {retencion.contribuyenteEspecial || 'NO'}</p>
                            <p><span className="font-bold">Obligado a llevar contabilidad:</span> {retencion.obligadoContabilidad}</p>
                        </div>
                    </div>
                </div>

                {/* Lado Derecho: Info Tributaria Comprobante */}
                <div className="border-2 p-6 rounded-2xl space-y-3" style={{ borderColor: colors.primary }}>
                    <div className="space-y-1">
                        <p className="text-lg font-black tracking-tighter">R.U.C.: <span className="font-mono">{retencion.ruc}</span></p>
                        <p className="text-xl font-black uppercase text-white px-3 py-1 inline-block rounded-md" style={{ backgroundColor: colors.primary }}>
                            COMPROBANTE DE RETENCIÓN
                        </p>
                        <p className="text-sm font-bold">No. {retencion.estab}-{retencion.ptoEmi}-{retencion.secuencial}</p>
                    </div>

                    <div className="text-[10px] space-y-1">
                        <p><span className="font-bold">NÚMERO DE AUTORIZACIÓN:</span></p>
                        <p className="font-mono break-all text-xs">{comprobante.numeroAutorizacion || retencion.claveAcceso || 'PENDIENTE DE AUTORIZACIÓN'}</p>
                        <p><span className="font-bold">FECHA Y HORA DE AUTORIZACIÓN:</span> {comprobante.fechaAutorizacion || 'PENDIENTE'}</p>
                        <p><span className="font-bold">AMBIENTE:</span> {retencion.ambiente === '1' ? 'PRUEBAS' : 'PRODUCCIÓN'}</p>
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
                            <p className="text-[9px] font-mono text-center tracking-tighter">{retencion.claveAcceso || '0000000000000000000000000000000000000000000000000'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Datos del Sujeto Retenido */}
            <div className="border border-slate-900 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-y-2 text-[11px]">
                <p><span className="font-bold">Razón Social / Nombres y Apellidos:</span> {retencion.razonSocialSujetoRetenido}</p>
                <p><span className="font-bold">Identificación:</span> {retencion.identificacionSujetoRetenido}</p>
                <p><span className="font-bold">Fecha Emisión:</span> {retencion.fechaEmision}</p>
                <p><span className="font-bold">Período Fiscal:</span> {retencion.periodoFiscal}</p>
            </div>

            {/* Documentos Sustento con Retenciones */}
            {retencion.docsSustento.map((doc, docIdx) => (
                <div key={docIdx} className="border border-slate-900 rounded-xl overflow-hidden mb-6">
                    {/* Encabezado del documento sustento */}
                    <div className="bg-slate-100 p-3 border-b border-slate-900">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                            <p><span className="font-bold">Tipo Comprobante:</span> {getNombreTipoDocumento(doc.codDocSustento)}</p>
                            <p><span className="font-bold">Número:</span> {formatNumDocSustento(doc.numDocSustento)}</p>
                            <p><span className="font-bold">Fecha Emisión:</span> {doc.fechaEmisionDocSustento}</p>
                            <p><span className="font-bold">Autorización:</span> <span className="text-[8px] break-all">{doc.numAutDocSustento || 'N/A'}</span></p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] mt-2">
                            <p><span className="font-bold">Total Sin Impuestos:</span> ${doc.totalSinImpuestos.toFixed(2)}</p>
                            <p><span className="font-bold">Importe Total:</span> ${doc.importeTotal.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Tabla de Retenciones */}
                    <table className="w-full text-[10px] text-left">
                        <thead className="text-white font-bold uppercase tracking-wider" style={{ backgroundColor: colors.primary }}>
                            <tr>
                                <th className="px-3 py-2 border-r border-white/10">Ejercicio Fiscal</th>
                                <th className="px-3 py-2 border-r border-white/10">Base Imponible</th>
                                <th className="px-3 py-2 border-r border-white/10">Impuesto</th>
                                <th className="px-3 py-2 border-r border-white/10">Código Ret.</th>
                                <th className="px-3 py-2 border-r border-white/10 text-right">Porcentaje</th>
                                <th className="px-3 py-2 text-right">Valor Retenido</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {doc.retenciones.map((ret, retIdx) => (
                                <tr key={retIdx}>
                                    <td className="px-3 py-2 border-r border-slate-200 text-center">{retencion.periodoFiscal}</td>
                                    <td className="px-3 py-2 border-r border-slate-200 text-right">${ret.baseImponible.toFixed(2)}</td>
                                    <td className="px-3 py-2 border-r border-slate-200 text-center font-bold">
                                        <span className={`px-2 py-0.5 rounded text-xs ${ret.codigo === '1' ? 'bg-amber-100 text-amber-700' : ret.codigo === '2' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                                            {getNombreImpuesto(ret.codigo)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 border-r border-slate-200 text-center font-mono">{ret.codigoRetencion}</td>
                                    <td className="px-3 py-2 border-r border-slate-200 text-right">{ret.porcentajeRetener}%</td>
                                    <td className="px-3 py-2 text-right font-bold">${ret.valorRetenido.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}

            {/* Pie de Retención: Totales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Información Adicional */}
                <div className="border border-slate-900 p-4 rounded-xl space-y-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Información Adicional</h3>
                    <div className="text-[9px] space-y-1">
                        <p><span className="font-bold uppercase">Parte Relacionada:</span> {retencion.parteRel}</p>
                        <p><span className="font-bold uppercase">Tipo Identificación:</span> {
                            comprobante.tipoIdentificacionCompradorNombre || 'N/A'
                        }</p>
                    </div>
                </div>

                {/* Totales de Retención */}
                <div className="border border-slate-900 rounded-xl overflow-hidden">
                    <table className="w-full text-[10px] text-left">
                        <tbody className="divide-y divide-slate-900">
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Total Retención Renta</td>
                                <td className="px-3 py-1.5 text-right font-bold">${totalRetencionRenta.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Total Retención IVA</td>
                                <td className="px-3 py-1.5 text-right font-bold">${totalRetencionIVA.toFixed(2)}</td>
                            </tr>
                            <tr className="text-white" style={{ backgroundColor: colors.primary }}>
                                <td className="px-3 py-2 font-black uppercase text-xs">Total Retenciones</td>
                                <td className="px-3 py-2 text-right font-black text-xs">${totalRetenciones.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
