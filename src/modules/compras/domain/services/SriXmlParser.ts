import { DOMParser } from '@xmldom/xmldom';
import { ComprobanteParseado, DetalleParseado } from '../descargaRobotTypes';

/**
 * Servicio para parsear XML de comprobantes electrónicos del SRI
 * Soporta: Factura (01), Nota de Crédito (04), Nota de Débito (05)
 */
export class SriXmlParser {

    /**
     * Parsea un XML string de comprobante electrónico SRI
     * Detecta automáticamente el tipo de documento
     */
    static parse(xmlString: string): ComprobanteParseado {
        const doc = new DOMParser().parseFromString(xmlString, 'text/xml');

        // Detectar tipo de documento
        const rootElement = doc.documentElement;
        const rootName = rootElement?.nodeName || '';

        if (rootName === 'factura' || rootName === 'autorizacion') {
            // Si es una respuesta de autorización, extraer el comprobante interno
            if (rootName === 'autorizacion') {
                const comprobanteXml = this.getTextContent(doc, 'comprobante');
                if (comprobanteXml) {
                    const innerDoc = new DOMParser().parseFromString(comprobanteXml, 'text/xml');
                    return this.parseDocument(innerDoc);
                }
            }
            return this.parseDocument(doc);
        }

        // Intentar parsear directamente
        return this.parseDocument(doc);
    }

    /**
     * Parsea un documento XML ya parseado
     */
    private static parseDocument(doc: Document): ComprobanteParseado {
        const rootName = doc.documentElement?.nodeName || '';

        // Extraer infoTributaria (común a todos los tipos)
        const rucEmisor = this.getTextContent(doc, 'ruc') || '';
        const razonSocialEmisor = this.getTextContent(doc, 'razonSocial') || '';
        const nombreComercial = this.getTextContent(doc, 'nombreComercial') || '';
        const claveAcceso = this.getTextContent(doc, 'claveAcceso') || '';
        const codDoc = this.getTextContent(doc, 'codDoc') || '01';
        const estab = this.getTextContent(doc, 'estab') || '001';
        const ptoEmi = this.getTextContent(doc, 'ptoEmi') || '001';
        const secuencial = this.getTextContent(doc, 'secuencial') || '';
        const dirMatriz = this.getTextContent(doc, 'dirMatriz') || '';

        const numComprobante = `${estab}-${ptoEmi}-${secuencial}`;

        // Extraer fechaEmision según tipo de doc
        let fechaEmisionRaw = '';
        if (rootName === 'factura') {
            fechaEmisionRaw = this.getNestedTextContent(doc, 'infoFactura', 'fechaEmision') || '';
        } else if (rootName === 'notaCredito') {
            fechaEmisionRaw = this.getNestedTextContent(doc, 'infoNotaCredito', 'fechaEmision') || '';
        } else if (rootName === 'notaDebito') {
            fechaEmisionRaw = this.getNestedTextContent(doc, 'infoNotaDebito', 'fechaEmision') || '';
        } else {
            // Fallback: buscar cualquier fechaEmision
            fechaEmisionRaw = this.getTextContent(doc, 'fechaEmision') || '';
        }

        const fechaEmision = this.sriDateToIso(fechaEmisionRaw);

        // Extraer totales
        const totalSinImpuestos = this.getNumber(doc, 'totalSinImpuestos');
        const totalDescuento = this.getNumber(doc, 'totalDescuento');
        const importeTotal = this.getNumber(doc, 'importeTotal') || this.getNumber(doc, 'valorModificacion') || this.getNumber(doc, 'valorTotal');

        // Calcular subtotales por tarifa IVA
        let subtotal0 = 0;
        let subtotalIva = 0;
        let montoIva = 0;

        // Extraer totalConImpuestos
        const totalConImpuestos = doc.getElementsByTagName('totalImpuesto');
        if (totalConImpuestos.length > 0) {
            for (let i = 0; i < totalConImpuestos.length; i++) {
                const imp = totalConImpuestos[i];
                const codigoPorcentaje = this.getChildText(imp, 'codigoPorcentaje');
                const baseImponible = parseFloat(this.getChildText(imp, 'baseImponible') || '0');
                const valor = parseFloat(this.getChildText(imp, 'valor') || '0');

                if (codigoPorcentaje === '0') {
                    subtotal0 += baseImponible;
                } else {
                    subtotalIva += baseImponible;
                    montoIva += valor;
                }
            }
        } else {
            // Fallback: calcular desde detalles
            subtotalIva = totalSinImpuestos;
            montoIva = importeTotal - totalSinImpuestos;
        }

        // Extraer detalles
        const detalles = this.parseDetalles(doc);

        return {
            rucEmisor,
            razonSocialEmisor,
            nombreComercialEmisor: nombreComercial || undefined,
            direccionEmisor: dirMatriz || undefined,
            tipoComprobante: codDoc,
            claveAcceso: claveAcceso || undefined,
            secuencial: numComprobante,
            fechaEmision,
            subtotal0,
            subtotalIva,
            montoIva,
            totalDescuento,
            total: importeTotal,
            detalles
        };
    }

    /**
     * Extrae los detalles (productos/servicios) de un XML
     */
    private static parseDetalles(doc: Document): DetalleParseado[] {
        const detalles: DetalleParseado[] = [];
        const detalleNodes = doc.getElementsByTagName('detalle');

        for (let i = 0; i < detalleNodes.length; i++) {
            const node = detalleNodes[i];
            const codigoPrincipal = this.getChildText(node, 'codigoPrincipal') || this.getChildText(node, 'codigoInterno') || '';
            const descripcion = this.getChildText(node, 'descripcion') || '';
            const cantidad = parseFloat(this.getChildText(node, 'cantidad') || '1');
            const precioUnitario = parseFloat(this.getChildText(node, 'precioUnitario') || '0');
            const descuento = parseFloat(this.getChildText(node, 'descuento') || '0');
            const precioTotalSinImpuesto = parseFloat(this.getChildText(node, 'precioTotalSinImpuesto') || '0');

            // Extraer IVA del detalle
            let porcentajeIva = 0;
            let valorIva = 0;
            const impuestos = node.getElementsByTagName('impuesto');
            if (impuestos.length > 0) {
                const imp = impuestos[0]; // Primer impuesto (generalmente IVA)
                const tarifa = parseFloat(this.getChildText(imp, 'tarifa') || '0');
                const valor = parseFloat(this.getChildText(imp, 'valor') || '0');
                porcentajeIva = tarifa;
                valorIva = valor;
            }

            const subtotal = precioTotalSinImpuesto || (cantidad * precioUnitario - descuento);

            detalles.push({
                codigoPrincipal: codigoPrincipal || undefined,
                descripcion,
                cantidad,
                precioUnitario,
                descuento,
                subtotal,
                porcentajeIva,
                valorIva,
                total: subtotal + valorIva
            });
        }

        return detalles;
    }

    /**
     * Parsea contenido TXT con formato de factura electrónica
     * Formato esperado:
     * FACTURA|001-001-000000001|2026-01-15
     * EMISOR|0601975972001|AVILES ALARCON TANYA CARROLL
     * TOTALES|39.99|6.00|45.99
     * DETALLE|PROD001|Servicio de consultoria|1|39.99|0|39.99|15|6.00|45.99
     */
    static parseTxt(txtString: string): ComprobanteParseado {
        const lines = txtString.trim().split('\n').map(l => l.trim()).filter(l => l);

        let rucEmisor = '';
        let razonSocialEmisor = '';
        let secuencial = '';
        let fechaEmision = '';
        let tipoComprobante = '01';
        let subtotal0 = 0;
        let subtotalIva = 0;
        let montoIva = 0;
        let total = 0;
        let totalDescuento = 0;
        const detalles: DetalleParseado[] = [];

        for (const line of lines) {
            const parts = line.split('|');
            const tipo = parts[0]?.toUpperCase();

            switch (tipo) {
                case 'FACTURA':
                case 'NOTA_CREDITO':
                case 'NOTA_DEBITO':
                    tipoComprobante = tipo === 'FACTURA' ? '01' : tipo === 'NOTA_CREDITO' ? '04' : '05';
                    secuencial = parts[1] || '';
                    fechaEmision = parts[2] || '';
                    break;

                case 'EMISOR':
                    rucEmisor = parts[1] || '';
                    razonSocialEmisor = parts[2] || '';
                    break;

                case 'TOTALES':
                    subtotalIva = parseFloat(parts[1] || '0');
                    montoIva = parseFloat(parts[2] || '0');
                    total = parseFloat(parts[3] || '0');
                    subtotal0 = parseFloat(parts[4] || '0');
                    totalDescuento = parseFloat(parts[5] || '0');
                    break;

                case 'DETALLE': {
                    const codigo = parts[1] || '';
                    const desc = parts[2] || '';
                    const cant = parseFloat(parts[3] || '1');
                    const precio = parseFloat(parts[4] || '0');
                    const desc2 = parseFloat(parts[5] || '0');
                    const subtotalDet = parseFloat(parts[6] || '0');
                    const porcIva = parseFloat(parts[7] || '0');
                    const valIva = parseFloat(parts[8] || '0');
                    const totalDet = parseFloat(parts[9] || '0');

                    detalles.push({
                        codigoPrincipal: codigo || undefined,
                        descripcion: desc,
                        cantidad: cant,
                        precioUnitario: precio,
                        descuento: desc2,
                        subtotal: subtotalDet || (cant * precio - desc2),
                        porcentajeIva: porcIva,
                        valorIva: valIva,
                        total: totalDet || (subtotalDet + valIva)
                    });
                    break;
                }
            }
        }

        return {
            rucEmisor,
            razonSocialEmisor,
            tipoComprobante,
            secuencial,
            fechaEmision,
            subtotal0,
            subtotalIva,
            montoIva,
            totalDescuento,
            total: total || (subtotalIva + subtotal0 + montoIva),
            detalles
        };
    }


    // ========== Utilidades privadas ==========

    private static getTextContent(doc: Document, tagName: string): string | null {
        const elements = doc.getElementsByTagName(tagName);
        if (elements.length > 0) {
            return elements[0].textContent?.trim() || null;
        }
        return null;
    }

    private static getNestedTextContent(doc: Document, parentTag: string, childTag: string): string | null {
        const parents = doc.getElementsByTagName(parentTag);
        if (parents.length > 0) {
            const children = parents[0].getElementsByTagName(childTag);
            if (children.length > 0) {
                return children[0].textContent?.trim() || null;
            }
        }
        return null;
    }

    private static getChildText(node: Element, tagName: string): string {
        const elements = node.getElementsByTagName(tagName);
        if (elements.length > 0) {
            return elements[0].textContent?.trim() || '';
        }
        return '';
    }

    private static getNumber(doc: Document, tagName: string): number {
        const text = this.getTextContent(doc, tagName);
        return text ? parseFloat(text) : 0;
    }

    /**
     * Convierte fecha SRI (DD/MM/YYYY) a ISO (YYYY-MM-DD)
     */
    private static sriDateToIso(dateStr: string): string {
        if (!dateStr) return '';
        // Si ya está en formato ISO
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.substring(0, 10);
        // Formato SRI: DD/MM/YYYY
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return dateStr;
    }
}
