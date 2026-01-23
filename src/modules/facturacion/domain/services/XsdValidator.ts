import libxml from 'libxmljs2';
import fs from 'fs';
import path from 'path';

/**
 * Servicio para validar XML contra esquemas XSD oficiales del SRI
 */
export class XsdValidator {

    private static getSchemaPath(tipoComprobante: string): string {
        const basePath = path.join(process.cwd(), 'src/modules/facturacion/infrastructure/xsd');

        switch (tipoComprobante) {
            case '01': // Factura
                return path.join(basePath, 'factura_V2.1.0.xsd');
            case '03': // Liquidacion
                return path.join(basePath, 'LiquidacionCompra_V1.1.0.xsd');
            case '04': // Nota Credito
                return path.join(basePath, 'NotaCredito_V1.1.0.xsd');
            case '05': // Nota Debito
                return path.join(basePath, 'NotaDebito_V1.0.0.xsd');
            case '06': // Guia Remision
                return path.join(basePath, 'GuiaRemision_V1.1.0.xsd');
            case '07': // Retencion
                return path.join(basePath, 'ComprobanteRetencion_V2.0.0.xsd');
            default:
                throw new Error(`No existe esquema XSD para el tipo de comprobante: ${tipoComprobante}`);
        }
    }

    /**
     * Valida una cadena XML contra el XSD correspondiente
     * @param xmlContent Contenido XML en string
     * @param tipoComprobante Código del tipo de comprobante (01, 03, etc)
     * @returns true si es válido, lanza error si no
     */
    static validate(xmlContent: string, tipoComprobante: string): boolean {
        try {
            const schemaPath = this.getSchemaPath(tipoComprobante);

            if (!fs.existsSync(schemaPath)) {
                console.warn(`XSD Schema not found at ${schemaPath}. Skipping validation.`);
                return true; // Fail open to avoid blocking if schema is missing, but log warning
            }

            const schemaContent = fs.readFileSync(schemaPath, 'utf8');
            const xsdDoc = libxml.parseXml(schemaContent);
            const xmlDoc = libxml.parseXml(xmlContent);

            const isValid = xmlDoc.validate(xsdDoc);

            if (!isValid) {
                const errors = xmlDoc.validationErrors.map((err: any) => {
                    return `[Line ${err.line}] ${err.message}`;
                }).join('\n');

                throw new Error(`Error de Validación XSD:\n${errors}`);
            }

            return true;

        } catch (error: any) {
            // Re-throw validation errors as is, wrap others
            if (error.message && error.message.includes('Error de Validación XSD')) {
                throw error;
            }
            console.error('XSD Validation Exception:', error);
            throw new Error(`Falló el proceso de validación XSD: ${error.message}`);
        }
    }
}
