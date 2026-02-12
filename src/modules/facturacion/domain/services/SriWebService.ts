import { DOMParser } from '@xmldom/xmldom';
import { SriRespuesta, SriMensaje } from '../SriTypes';

/**
 * Servicio para consumir los Web Services del SRI (Ecuador)
 * Maneja Recepción y Autorización de comprobantes electrónicos.
 */
export class SriWebService {

    /**
     * Envía un XML firmado al WS de Recepción del SRI
     */
    static async enviarComprobante(xmlSigned: string, url: string): Promise<SriRespuesta> {
        const base64Xml = Buffer.from(xmlSigned).toString('base64');

        const soapEnvelope = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
               <soapenv:Header/>
               <soapenv:Body>
                  <ec:validarComprobante>
                     <xml>${base64Xml}</xml>
                  </ec:validarComprobante>
               </soapenv:Body>
            </soapenv:Envelope>
        `;

        try {
            // Nota: En un entorno real de Next.js, 'fetch' puede tener restricciones de CORS si se llama desde el cliente.
            // Esta función SIEMPRE debe ejecutarse desde el Servidor (API Route).
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': ''
                },
                body: soapEnvelope
            });

            const responseText = await response.text();
            return this.parseRecepcionResponse(responseText);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Error de red desconocido';
            throw new Error(`Error de conexión con SRI (Recepción): ${msg}`);
        }
    }

    /**
     * Consulta el estado de autorización de un comprobante por su Clave de Acceso
     */
    static async autorizarComprobante(claveAcceso: string, url: string): Promise<SriRespuesta> {
        const soapEnvelope = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
               <soapenv:Header/>
               <soapenv:Body>
                  <ec:autorizacionComprobante>
                     <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
                  </ec:autorizacionComprobante>
               </soapenv:Body>
            </soapenv:Envelope>
        `;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': ''
                },
                body: soapEnvelope
            });

            const responseText = await response.text();
            return this.parseAutorizacionResponse(responseText);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Error de red desconocido';
            throw new Error(`Error de conexión con SRI (Autorización): ${msg}`);
        }
    }

    private static parseRecepcionResponse(xml: string): SriRespuesta {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');

        const estado = doc.getElementsByTagName('estado')[0]?.textContent || 'ERROR';
        const mensajesNodes = doc.getElementsByTagName('mensaje');
        const mensajes: SriMensaje[] = [];

        for (let i = 0; i < mensajesNodes.length; i++) {
            mensajes.push({
                identificador: mensajesNodes[i].getElementsByTagName('identificador')[0]?.textContent || '',
                mensaje: mensajesNodes[i].getElementsByTagName('mensaje')[0]?.textContent || '',
                informacionAdicional: mensajesNodes[i].getElementsByTagName('informacionAdicional')[0]?.textContent || '',
                tipo: mensajesNodes[i].getElementsByTagName('tipo')[0]?.textContent || ''
            });
        }

        return {
            estado: estado as any,
            mensajes
        };
    }

    private static parseAutorizacionResponse(xml: string): SriRespuesta {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        // La estructura de respuesta de autorización es más compleja, puede tener múltiples autorizaciones
        const autorizacion = doc.getElementsByTagName('autorizacion')[0];
        if (!autorizacion) {
            return { estado: 'NO AUTORIZADO' }; // O error de proceso
        }

        const estado = autorizacion.getElementsByTagName('estado')[0]?.textContent;
        const numeroAutorizacion = autorizacion.getElementsByTagName('numeroAutorizacion')[0]?.textContent || undefined;
        const fechaAutorizacion = autorizacion.getElementsByTagName('fechaAutorizacion')[0]?.textContent || undefined;
        const ambiente = autorizacion.getElementsByTagName('ambiente')[0]?.textContent || undefined;

        const mensajesNodes = autorizacion.getElementsByTagName('mensaje');
        const mensajes: SriMensaje[] = [];
        for (let i = 0; i < mensajesNodes.length; i++) {
            mensajes.push({
                identificador: mensajesNodes[i].getElementsByTagName('identificador')[0]?.textContent || '',
                mensaje: mensajesNodes[i].getElementsByTagName('mensaje')[0]?.textContent || '',
                informacionAdicional: mensajesNodes[i].getElementsByTagName('informacionAdicional')[0]?.textContent || '',
                tipo: mensajesNodes[i].getElementsByTagName('tipo')[0]?.textContent || ''
            });
        }

        return {
            estado: estado as any,
            numeroAutorizacion,
            fechaAutorizacion,
            ambiente,
            mensajes
        };
    }
}
