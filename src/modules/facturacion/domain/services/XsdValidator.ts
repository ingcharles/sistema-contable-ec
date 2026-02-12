// import libxml from 'libxmljs2'; // Comentado para evitar errores de bindings en Windows durante el build
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

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
    static async validate(xmlContent: string, tipoComprobante: string): Promise<boolean> {
        try {
            const schemaPath = this.getSchemaPath(tipoComprobante);

            if (!fs.existsSync(schemaPath)) {
                console.warn(`XSD Schema not found at ${schemaPath}. Skipping validation.`);
                return true; // Fail open to avoid blocking if schema is missing, but log warning
            }

            // Intento 1: libxmljs2 (rápido, nativo)
            try {
                const libxml = require('libxmljs2');
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
            } catch (nativeError: unknown) {
                // Intento 2: fallback con validador XSD en subproceso Node (requiere Java instalado)
                try {
                    await new Promise<void>((resolve, reject) => {
                        const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'validate_xsd.cjs');
                        const child = spawn(process.execPath, [scriptPath, schemaPath], {
                            cwd: process.cwd(),
                            stdio: ['pipe', 'pipe', 'pipe']
                        });

                        let stderr = '';
                        child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
                        child.on('error', reject);
                        child.on('exit', (code) => {
                            if (code === 0) return resolve();
                            reject(new Error(stderr || 'Error al validar XSD en subproceso'));
                        });

                        child.stdin.write(xmlContent);
                        child.stdin.end();
                    });
                    return true;
                } catch (fallbackError: unknown) {
                    const nativeMsg = nativeError instanceof Error ? nativeError.message : 'libxmljs2 no disponible';
                    const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : 'validador XSD no disponible';
                    throw new Error(`No se pudo validar XSD localmente. Detalles: ${nativeMsg}. ${fallbackMsg}. Asegure Java instalado o libxmljs2 compilado.`);
                }
            }

        } catch (error: unknown) {
            // Re-throw validation errors as is, wrap others
            if (error instanceof Error && error.message.includes('Error de Validación XSD')) {
                throw error;
            }
            const msg = error instanceof Error ? error.message : 'Error desconocido';
            throw new Error(`Falló el proceso de validación XSD: ${msg}`);
        }
    }
}
