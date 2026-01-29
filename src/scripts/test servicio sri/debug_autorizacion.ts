/**
 * Script para consultar autorización con debug completo
 * Ejecutar con: npx tsx src/scripts/debug_autorizacion.ts <claveAcceso>
 */

import { SriEnvironment, SRI_URLS } from '../../shared/sri-constants';

async function main() {
    const claveAcceso = process.argv[2] || '2701202607172203995300110010017431764831234567811';
    
    console.log('=== DEBUG CONSULTA AUTORIZACIÓN SRI ===\n');
    console.log('Clave de acceso:', claveAcceso);
    
    const url = SRI_URLS[SriEnvironment.PRUEBAS].autorizacion;
    console.log('URL:', url);

    const soapEnvelope = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
   <soapenv:Header/>
   <soapenv:Body>
      <ec:autorizacionComprobante>
         <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
      </ec:autorizacionComprobante>
   </soapenv:Body>
</soapenv:Envelope>`;

    console.log('\n=== SOAP REQUEST ===');
    console.log(soapEnvelope);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': ''
            },
            body: soapEnvelope
        });

        console.log('\n=== HTTP Status ===');
        console.log('Status:', response.status, response.statusText);

        const responseText = await response.text();
        
        console.log('\n=== RAW SOAP RESPONSE ===');
        // Formatear el XML para mejor lectura
        console.log(responseText.replace(/></g, '>\n<'));
        
    } catch (error: any) {
        console.error('\n✗ Error:', error.message);
    }
}

main();
