import { Factura } from '@/shared/types';
import { useBrandColors } from '@/shared/hooks/useBrandColors';

/**
 * Componente GuiaRemisionRIDE
 * Representación Impresa de Documento Electrónico (RIDE)
 * para Guía de Remisión (06)
 * Cumple con el formato estándar del SRI Ecuador
 */

// Interfaces para los datos parseados del XML
export interface GuiaRemisionData {
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

    // Info Guía Remisión
    dirEstablecimiento?: string;
    dirPartida: string;
    razonSocialTransportista: string;
    tipoIdentificacionTransportista: string;
    rucTransportista: string;
    rise?: string;
    obligadoContabilidad: string;
    contribuyenteEspecial?: string;
    fechaIniTransporte: string;
    fechaFinTransporte: string;
    placa: string;

    // Destinatarios
    destinatarios: Destinatario[];

    // Autorización
    numeroAutorizacion?: string;
    fechaAutorizacion?: string;
}

export interface Destinatario {
    identificacionDestinatario: string;
    razonSocialDestinatario: string;
    dirDestinatario: string;
    motivoTraslado: string;
    docAduaneroUnico?: string;
    codEstabDestino?: string;
    ruta?: string;
    codDocSustento?: string;
    numDocSustento?: string;
    numAutDocSustento?: string;
    fechaEmisionDocSustento?: string;
    detalles: DetalleGuia[];
}

export interface DetalleGuia {
    codigoInterno: string;
    codigoAdicional?: string;
    descripcion: string;
    cantidad: number;
}

interface GuiaRemisionRIDEProps {
    comprobante: Factura;
}

/**
 * Mapeo local de tipos de identificación (Fallback)
 */
const getNombreTipoIdentificacionLocal = (tipo: string) => {
    const tipos: Record<string, string> = {
        '04': 'RUC',
        '05': 'CEDULA',
        '06': 'PASAPORTE',
        '07': 'VENTA A CONSUMIDOR FINAL',
        '08': 'IDENTIFICACION DE EXTERIOR',
    };
    return tipos[tipo] || 'OTROS';
};

/**
 * Parsea el XML de guía de remisión firmado y extrae los datos
 */
function parseGuiaRemisionXml(xml: string): GuiaRemisionData | null {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');

        const getTextContent = (parent: Document | Element, tagName: string): string => {
            const element = parent.getElementsByTagName(tagName)[0];
            return element?.textContent || '';
        };

        const infoTributaria = doc.getElementsByTagName('infoTributaria')[0];
        const infoGuiaRemision = doc.getElementsByTagName('infoGuiaRemision')[0];
        const destinatariosElement = doc.getElementsByTagName('destinatarios')[0];

        if (!infoTributaria || !infoGuiaRemision) {
            console.error('XML de guía de remisión inválido');
            return null;
        }

        // Parsear destinatarios
        const destinatarios: Destinatario[] = [];
        if (destinatariosElement) {
            const destinatarioElements = destinatariosElement.getElementsByTagName('destinatario');
            for (let i = 0; i < destinatarioElements.length; i++) {
                const dest = destinatarioElements[i];

                // Parsear detalles del destinatario
                const detalles: DetalleGuia[] = [];
                const detalleElements = dest.getElementsByTagName('detalle');
                for (let j = 0; j < detalleElements.length; j++) {
                    const det = detalleElements[j];
                    detalles.push({
                        codigoInterno: getTextContent(det, 'codigoInterno'),
                        codigoAdicional: getTextContent(det, 'codigoAdicional'),
                        descripcion: getTextContent(det, 'descripcion'),
                        cantidad: parseFloat(getTextContent(det, 'cantidad')) || 0,
                    });
                }

                destinatarios.push({
                    identificacionDestinatario: getTextContent(dest, 'identificacionDestinatario'),
                    razonSocialDestinatario: getTextContent(dest, 'razonSocialDestinatario'),
                    dirDestinatario: getTextContent(dest, 'dirDestinatario'),
                    motivoTraslado: getTextContent(dest, 'motivoTraslado'),
                    docAduaneroUnico: getTextContent(dest, 'docAduaneroUnico'),
                    codEstabDestino: getTextContent(dest, 'codEstabDestino'),
                    ruta: getTextContent(dest, 'ruta'),
                    codDocSustento: getTextContent(dest, 'codDocSustento'),
                    numDocSustento: getTextContent(dest, 'numDocSustento'),
                    numAutDocSustento: getTextContent(dest, 'numAutDocSustento'),
                    fechaEmisionDocSustento: getTextContent(dest, 'fechaEmisionDocSustento'),
                    detalles,
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
            dirEstablecimiento: getTextContent(infoGuiaRemision, 'dirEstablecimiento'),
            dirPartida: getTextContent(infoGuiaRemision, 'dirPartida'),
            razonSocialTransportista: getTextContent(infoGuiaRemision, 'razonSocialTransportista'),
            tipoIdentificacionTransportista: getTextContent(infoGuiaRemision, 'tipoIdentificacionTransportista'),
            rucTransportista: getTextContent(infoGuiaRemision, 'rucTransportista'),
            rise: getTextContent(infoGuiaRemision, 'rise'),
            obligadoContabilidad: getTextContent(infoGuiaRemision, 'obligadoContabilidad'),
            contribuyenteEspecial: getTextContent(infoGuiaRemision, 'contribuyenteEspecial'),
            fechaIniTransporte: getTextContent(infoGuiaRemision, 'fechaIniTransporte'),
            fechaFinTransporte: getTextContent(infoGuiaRemision, 'fechaFinTransporte'),
            placa: getTextContent(infoGuiaRemision, 'placa'),
            destinatarios,
        };
    } catch (error) {
        console.error('Error parseando XML de guía de remisión:', error);
        return null;
    }
}

/**
 * Obtiene el nombre del tipo de documento según el código SRI
 */
function getNombreTipoDocumento(codigo: string): string {
    const tipos: Record<string, string> = {
        '01': 'FACTURA',
        '03': 'LIQUIDACIÓN DE COMPRA',
        '04': 'NOTA DE CRÉDITO',
        '05': 'NOTA DE DÉBITO',
        '06': 'GUÍA DE REMISIÓN',
    };
    return tipos[codigo] || 'DOCUMENTO';
}

export function GuiaRemisionRIDE({ comprobante }: GuiaRemisionRIDEProps) {
    const colors = useBrandColors();
    const xmlFirmado = comprobante.xmlFirmado;
    const guia = xmlFirmado ? parseGuiaRemisionXml(xmlFirmado) : null;

    if (!guia) {
        return (
            <div className="max-w-4xl mx-auto p-8 bg-white text-slate-800 font-sans border border-slate-200 shadow-sm">
                <div className="text-center text-red-500">
                    <p className="font-bold text-lg">Error al parsear la Guía de Remisión</p>
                    <p className="text-sm mt-2">El XML proporcionado no tiene un formato válido</p>
                </div>
            </div>
        );
    }

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
                        <h1 className="text-xl font-black uppercase tracking-tight">{guia.razonSocial}</h1>
                        {guia.nombreComercial && <p className="text-sm font-bold text-slate-500">{guia.nombreComercial}</p>}
                        <div className="text-[10px] leading-tight text-slate-600 space-y-0.5">
                            <p><span className="font-bold">Dirección Matriz:</span> {guia.dirMatriz}</p>
                            <p><span className="font-bold">Dirección Establecimiento:</span> {guia.dirEstablecimiento || guia.dirMatriz}</p>
                            <p><span className="font-bold">Contribuyente Especial Nro:</span> {guia.contribuyenteEspecial || 'NO'}</p>
                            <p><span className="font-bold">Obligado a llevar contabilidad:</span> {guia.obligadoContabilidad}</p>
                        </div>
                    </div>
                </div>

                {/* Lado Derecho: Info Tributaria Comprobante */}
                <div className="border-2 p-6 rounded-2xl space-y-3" style={{ borderColor: colors.primary }}>
                    <div className="space-y-1">
                        <p className="text-lg font-black tracking-tighter">R.U.C.: <span className="font-mono">{guia.ruc}</span></p>
                        <p className="text-xl font-black uppercase text-white px-3 py-1 inline-block rounded-md" style={{ backgroundColor: colors.primary }}>
                            GUÍA DE REMISIÓN
                        </p>
                        <p className="text-sm font-bold">No. {guia.estab}-{guia.ptoEmi}-{guia.secuencial}</p>
                    </div>

                    <div className="text-[10px] space-y-1">
                        <p><span className="font-bold">NÚMERO DE AUTORIZACIÓN:</span></p>
                        <p className="font-mono break-all text-xs">{comprobante.numeroAutorizacion || guia.claveAcceso || 'PENDIENTE DE AUTORIZACIÓN'}</p>
                        <p><span className="font-bold">FECHA Y HORA DE AUTORIZACIÓN:</span> {comprobante.fechaAutorizacion || 'PENDIENTE'}</p>
                        <p><span className="font-bold">AMBIENTE:</span> {guia.ambiente === '1' ? 'PRUEBAS' : 'PRODUCCIÓN'}</p>
                        <p><span className="font-bold">EMISIÓN:</span> NORMAL</p>
                    </div>

                    <div className="space-y-1 pt-2">
                        <p className="text-[10px] font-bold">CLAVE DE ACCESO:</p>
                        <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg">
                            <div className="h-8 w-full flex items-center justify-center mb-1 overflow-hidden" style={{ backgroundColor: colors.primary }}>
                                <div className="w-full h-full flex gap-[1px]">
                                    {Array.from({ length: 100 }).map((_, i) => (
                                        <div key={i} className="bg-white" style={{ width: `${Math.random() * 3}px` }}></div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-[9px] font-mono text-center tracking-tighter">{guia.claveAcceso}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Datos del Transporte */}
            <div className="border p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-y-2 text-[11px]" style={{ borderColor: colors.primary, backgroundColor: `${colors.primary}10` }}>
                <p className="col-span-2 font-bold text-xs mb-2 pb-1" style={{ color: colors.primary, borderBottom: `1px solid ${colors.primary}30` }}>DATOS DEL TRANSPORTE</p>
                <p><span className="font-bold">Razón Social Transportista:</span> {guia.razonSocialTransportista}</p>
                <p><span className="font-bold">RUC/CI Transportista:</span> {guia.rucTransportista}</p>
                <p><span className="font-bold">Placa:</span> <span className="text-white px-2 py-0.5 rounded font-mono font-bold" style={{ backgroundColor: colors.primary }}>{guia.placa}</span></p>
                <p><span className="font-bold">Fecha Inicio Transporte:</span> {guia.fechaIniTransporte}</p>
                <p><span className="font-bold">Fecha Fin Transporte:</span> {guia.fechaFinTransporte}</p>
                <p className="col-span-2"><span className="font-bold">Dirección Partida:</span> {guia.dirPartida}</p>
            </div>

            {/* Destinatarios */}
            {guia.destinatarios.map((dest, destIdx) => (
                <div key={destIdx} className="border border-slate-900 rounded-xl overflow-hidden mb-6">
                    {/* Encabezado del destinatario */}
                    <div className="bg-slate-100 p-3 border-b border-slate-900">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                            <p><span className="font-bold">Destinatario:</span> {dest.razonSocialDestinatario}</p>
                            <p><span className="font-bold">Identificación:</span> {dest.identificacionDestinatario}</p>
                            <p className="col-span-2"><span className="font-bold">Dirección:</span> {dest.dirDestinatario}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] mt-2">
                            <p className="col-span-2"><span className="font-bold">Motivo Traslado:</span> {dest.motivoTraslado}</p>
                            {dest.ruta && <p><span className="font-bold">Ruta:</span> {dest.ruta}</p>}
                            {dest.codDocSustento && (
                                <p>
                                    <span className="font-bold">Doc. Sustento:</span>{' '}
                                    <span className="bg-slate-200 px-1 rounded font-mono text-[9px]">
                                        {getNombreTipoDocumento(dest.codDocSustento)} {dest.numDocSustento}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Tabla de Detalles */}
                    <table className="w-full text-[10px] text-left">
                        <thead className="text-white font-bold uppercase tracking-wider" style={{ backgroundColor: colors.primary }}>
                            <tr>
                                <th className="px-3 py-2 border-r border-white/10 w-28">Código</th>
                                <th className="px-3 py-2 border-r border-white/10">Descripción</th>
                                <th className="px-3 py-2 text-right w-24">Cantidad</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {dest.detalles.map((detalle, idx) => (
                                <tr key={idx}>
                                    <td className="px-3 py-2 border-r border-slate-200 font-mono">{detalle.codigoInterno}</td>
                                    <td className="px-3 py-2 border-r border-slate-200 font-bold">{detalle.descripcion}</td>
                                    <td className="px-3 py-2 text-right font-bold">{detalle.cantidad.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}

            {/* Información Adicional */}
            <div className="border border-slate-900 p-4 rounded-xl space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Información Adicional</h3>
                <div className="text-[9px] space-y-1">
                    <p><span className="font-bold uppercase">Tipo Identificación Transportista:</span> {
                        getNombreTipoIdentificacionLocal(guia.tipoIdentificacionTransportista)
                    }</p>
                    {guia.rise && <p><span className="font-bold uppercase">RISE:</span> {guia.rise}</p>}
                </div>
            </div>
        </div>
    );
}
