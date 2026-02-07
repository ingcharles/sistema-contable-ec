import { Factura } from '@/shared/types';
import { useBrandColors } from '@/shared/hooks/useBrandColors';
import { useEmpresa } from '@/shared/context/EmpresaContext';

/**
 * Componente NotaDebitoRIDE
 * Representación Impresa de Documento Electrónico (RIDE)
 * para Notas de Débito (05)
 * Cumple con el formato estándar del SRI Ecuador
 */

// Interfaces para los datos parseados del XML
export interface NotaDebitoData {
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

    // Info Nota Débito
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
    valorTotal: number;

    // Impuestos
    impuestos: ImpuestoND[];

    // Motivos
    motivos: MotivoND[];

    // Pagos
    pagos: PagoND[];

    // Autorización
    numeroAutorizacion?: string;
    fechaAutorizacion?: string;
}

export interface ImpuestoND {
    codigo: string;
    codigoPorcentaje: string;
    tarifa: number;
    baseImponible: number;
    valor: number;
}

export interface MotivoND {
    razon: string;
    valor: number;
}

export interface PagoND {
    formaPago: string;
    total: number;
    plazo?: number;
    unidadTiempo?: string;
}

interface NotaDebitoRIDEProps {
    comprobante: Factura;
}

/**
 * Parsea el XML de nota de débito firmado y extrae los datos
 */
function parseNotaDebitoXml(xml: string): NotaDebitoData | null {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');

        const getTextContent = (parent: Document | Element, tagName: string): string => {
            const element = parent.getElementsByTagName(tagName)[0];
            return element?.textContent || '';
        };

        const infoTributaria = doc.getElementsByTagName('infoTributaria')[0];
        const infoNotaDebito = doc.getElementsByTagName('infoNotaDebito')[0];
        const motivosElement = doc.getElementsByTagName('motivos')[0];

        if (!infoTributaria || !infoNotaDebito) {
            console.error('XML de nota de débito inválido');
            return null;
        }

        // Parsear impuestos
        const impuestos: ImpuestoND[] = [];
        const impuestoElements = infoNotaDebito.getElementsByTagName('totalImpuesto');
        if (impuestoElements.length === 0) {
            // Reintentar con 'impuesto' si 'totalImpuesto' no existe
            const reTryImpuestos = infoNotaDebito.getElementsByTagName('impuesto');
            for (let i = 0; i < reTryImpuestos.length; i++) {
                const imp = reTryImpuestos[i];
                impuestos.push({
                    codigo: getTextContent(imp, 'codigo'),
                    codigoPorcentaje: getTextContent(imp, 'codigoPorcentaje'),
                    tarifa: parseFloat(getTextContent(imp, 'tarifa')) || 0,
                    baseImponible: parseFloat(getTextContent(imp, 'baseImponible')) || 0,
                    valor: parseFloat(getTextContent(imp, 'valor')) || 0,
                });
            }
        } else {
            for (let i = 0; i < impuestoElements.length; i++) {
                const imp = impuestoElements[i];
                impuestos.push({
                    codigo: getTextContent(imp, 'codigo'),
                    codigoPorcentaje: getTextContent(imp, 'codigoPorcentaje'),
                    tarifa: parseFloat(getTextContent(imp, 'tarifa')) || 0,
                    baseImponible: parseFloat(getTextContent(imp, 'baseImponible')) || 0,
                    valor: parseFloat(getTextContent(imp, 'valor')) || 0,
                });
            }
        }

        // Parsear motivos
        const motivos: MotivoND[] = [];
        if (motivosElement) {
            const motivoElements = motivosElement.getElementsByTagName('motivo');
            for (let i = 0; i < motivoElements.length; i++) {
                const mot = motivoElements[i];
                motivos.push({
                    razon: getTextContent(mot, 'razon'),
                    valor: parseFloat(getTextContent(mot, 'valor')) || 0,
                });
            }
        }

        // Parsear pagos
        const pagos: PagoND[] = [];
        const pagoElements = infoNotaDebito.getElementsByTagName('pago');
        for (let i = 0; i < pagoElements.length; i++) {
            const pago = pagoElements[i];
            pagos.push({
                formaPago: getTextContent(pago, 'formaPago'),
                total: parseFloat(getTextContent(pago, 'total')) || 0,
                plazo: parseInt(getTextContent(pago, 'plazo')) || undefined,
                unidadTiempo: getTextContent(pago, 'unidadTiempo') || undefined,
            });
        }

        const parsedData: NotaDebitoData = {
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
            fechaEmision: getTextContent(infoNotaDebito, 'fechaEmision'),
            dirEstablecimiento: getTextContent(infoNotaDebito, 'dirEstablecimiento'),
            contribuyenteEspecial: getTextContent(infoNotaDebito, 'contribuyenteEspecial'),
            obligadoContabilidad: getTextContent(infoNotaDebito, 'obligadoContabilidad'),
            tipoIdentificacionComprador: getTextContent(infoNotaDebito, 'tipoIdentificacionComprador'),
            razonSocialComprador: getTextContent(infoNotaDebito, 'razonSocialComprador'),
            identificacionComprador: getTextContent(infoNotaDebito, 'identificacionComprador'),
            codDocModificado: getTextContent(infoNotaDebito, 'codDocModificado'),
            numDocModificado: getTextContent(infoNotaDebito, 'numDocModificado'),
            fechaEmisionDocSustento: getTextContent(infoNotaDebito, 'fechaEmisionDocSustento'),
            totalSinImpuestos: parseFloat(getTextContent(infoNotaDebito, 'totalSinImpuestos')) || 0,
            valorTotal: parseFloat(getTextContent(infoNotaDebito, 'valorTotal')) || 0,
            impuestos,
            motivos,
            pagos,
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
        console.error('Error parseando XML de nota de débito:', error);
        return null;
    }
}


// Eliminado getNombreTipoDocumento anterior

export function NotaDebitoRIDE({ comprobante }: NotaDebitoRIDEProps) {
    const colors = useBrandColors();
    const { currentEmpresa } = useEmpresa();
    const xmlFirmado = comprobante.xmlFirmado;
    const notaDebito = xmlFirmado ? parseNotaDebitoXml(xmlFirmado) : null;

    if (!notaDebito) {
        return (
            <div className="max-w-4xl mx-auto p-8 bg-white text-slate-800 font-sans border border-slate-200 shadow-sm">
                <div className="text-center text-red-500">
                    <p className="font-bold text-lg">Error al parsear la Nota de Débito</p>
                    <p className="text-sm mt-2">El XML proporcionado no tiene un formato válido</p>
                </div>
            </div>
        );
    }

    // Calcular totales
    const totalIVA = notaDebito.impuestos.filter(i => i.codigo === '2').reduce((acc, i) => acc + i.valor, 0);
    const subtotalIVA = notaDebito.impuestos.filter(i => i.codigo === '2' && i.codigoPorcentaje !== '0').reduce((acc, i) => acc + i.baseImponible, 0);
    const subtotal0 = notaDebito.impuestos.filter(i => i.codigo === '2' && i.codigoPorcentaje === '0').reduce((acc, i) => acc + i.baseImponible, 0);

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white text-slate-800 font-sans border border-slate-200 shadow-sm print:shadow-none print:border-0">
            {/* Encabezado RIDE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Lado Izquierdo: Info Empresa */}
                <div className="space-y-4">
                    <div className="h-24 w-48 flex items-center justify-center overflow-hidden">
                        {currentEmpresa?.logo ? (
                            <img
                                src={`data:image/png;base64,${currentEmpresa.logo}`}
                                alt="Logo Empresa"
                                className="h-full w-full object-contain object-left"
                            />
                        ) : (
                            <div className="h-full w-full bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sin Logo</span>
                            </div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-xl font-black uppercase tracking-tight">{notaDebito.razonSocial}</h1>
                        {notaDebito.nombreComercial && <p className="text-sm font-bold text-slate-500">{notaDebito.nombreComercial}</p>}
                        <div className="text-[10px] leading-tight text-slate-600 space-y-0.5">
                            <p><span className="font-bold">Dirección Matriz:</span> {notaDebito.dirMatriz}</p>
                            <p><span className="font-bold">Dirección Establecimiento:</span> {notaDebito.dirEstablecimiento || notaDebito.dirMatriz}</p>
                            <p><span className="font-bold">Contribuyente Especial Nro:</span> {notaDebito.contribuyenteEspecial || 'NO'}</p>
                            <p><span className="font-bold">Obligado a llevar contabilidad:</span> {notaDebito.obligadoContabilidad}</p>
                        </div>
                    </div>
                </div>

                {/* Lado Derecho: Info Tributaria Comprobante */}
                <div className="border-2 p-6 rounded-2xl space-y-3" style={{ borderColor: colors.primary }}>
                    <div className="space-y-1">
                        <p className="text-lg font-black tracking-tighter">R.U.C.: <span className="font-mono">{notaDebito.ruc}</span></p>
                        <p className="text-xl font-black uppercase text-white px-3 py-1 inline-block rounded-md" style={{ backgroundColor: colors.primary }}>
                            NOTA DE DÉBITO
                        </p>
                        <p className="text-sm font-bold">No. {notaDebito.estab}-{notaDebito.ptoEmi}-{notaDebito.secuencial}</p>
                    </div>

                    <div className="text-[10px] space-y-1">
                        <p><span className="font-bold">NÚMERO DE AUTORIZACIÓN:</span></p>
                        <p className="font-mono break-all text-xs">{comprobante.numeroAutorizacion || notaDebito.claveAcceso || 'PENDIENTE DE AUTORIZACIÓN'}</p>
                        <p><span className="font-bold">FECHA Y HORA DE AUTORIZACIÓN:</span> {comprobante.fechaAutorizacion || 'PENDIENTE'}</p>
                        <p><span className="font-bold">AMBIENTE:</span> {notaDebito.ambiente === '1' ? 'PRUEBAS' : 'PRODUCCIÓN'}</p>
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
                            <p className="text-[9px] font-mono text-center tracking-tighter">{notaDebito.claveAcceso}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Datos del Adquirente y Documento Modificado */}
            <div className="border border-slate-900 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-y-2 text-[11px]">
                <p><span className="font-bold">Razón Social / Nombres:</span> {notaDebito.razonSocialComprador}</p>
                <p><span className="font-bold">Identificación:</span> {notaDebito.identificacionComprador}</p>
                <p><span className="font-bold">Fecha Emisión:</span> {notaDebito.fechaEmision}</p>
                <p></p>
                <p className="col-span-2 mt-2 pt-2 border-t border-slate-200">
                    <span className="font-bold">Comprobante que modifica:</span>{' '}
                    <span className="px-2 py-0.5 rounded font-mono" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                        DOCUMENTO {notaDebito.numDocModificado}
                    </span>
                    <span className="text-slate-500 ml-2">(Emitido: {notaDebito.fechaEmisionDocSustento})</span>
                </p>
            </div>

            {/* Tabla de Motivos */}
            <div className="border border-slate-900 rounded-xl overflow-hidden mb-8">
                <table className="w-full text-[10px] text-left">
                    <thead className="text-white font-bold uppercase tracking-wider" style={{ backgroundColor: colors.primary }}>
                        <tr>
                            <th className="px-3 py-2 border-r border-white/10">Razón / Motivo</th>
                            <th className="px-3 py-2 text-right w-32">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {notaDebito.motivos.map((motivo, idx) => (
                            <tr key={idx}>
                                <td className="px-3 py-2 border-r border-slate-200">{motivo.razon}</td>
                                <td className="px-3 py-2 text-right font-bold">${motivo.valor.toFixed(2)}</td>
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
                        <p><span className="font-bold uppercase">Dirección:</span> {notaDebito.direccionComprador || 'N/A'}</p>
                        <p><span className="font-bold uppercase">Email:</span> {notaDebito.emailComprador || 'N/A'}</p>
                    </div>
                </div>

                <div className="border border-slate-900 rounded-xl overflow-hidden">
                    <table className="w-full text-[10px] text-left">
                        <tbody className="divide-y divide-slate-900">
                            <tr>
                                <td className="px-3 py-1.5 font-bold uppercase bg-slate-50">Subtotal Sin Impuestos</td>
                                <td className="px-3 py-1.5 text-right font-bold">{notaDebito.totalSinImpuestos.toFixed(2)}</td>
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
                                <td className="px-3 py-2 font-black uppercase text-xs">Valor Total</td>
                                <td className="px-3 py-2 text-right font-black text-xs">{notaDebito.valorTotal.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
