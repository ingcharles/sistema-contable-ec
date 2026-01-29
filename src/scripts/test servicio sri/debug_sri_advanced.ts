/**
 * Script de debug avanzado para probar diferentes formatos de envío al SRI
 */
import { SriEnvironment, SRI_URLS } from '../../shared/sri-constants';
import { DOMParser } from '@xmldom/xmldom';

async function main() {
    console.log('=== DEBUG AVANZADO SRI ===\n');

    // Fecha actual
    const fechaHoy = new Date();
    const dia = String(fechaHoy.getDate()).padStart(2, '0');
    const mes = String(fechaHoy.getMonth() + 1).padStart(2, '0');
    const anio = fechaHoy.getFullYear();
    const fechaEmision = `${dia}/${mes}/${anio}`;
    const periodoFiscal = `${mes}/${anio}`;

    // Generar clave de acceso
    const fechaSinSeparadores = `${dia}${mes}${anio}`;
    const codDoc = '07';
    const ruc = '1722039953001'; // RUC de la empresa configurada
    const ambiente = '1';
    const estab = '001';
    const ptoEmi = '001';
    const secuencial = '000000102'; // Nuevo secuencial
    const codigoNumerico = '12345678';
    const tipoEmision = '1';

    const cadena = fechaSinSeparadores + codDoc + ruc + ambiente + estab + ptoEmi + secuencial + codigoNumerico + tipoEmision;
    let suma = 0;
    let factor = 2;
    for (let i = cadena.length - 1; i >= 0; i--) {
        suma += parseInt(cadena[i]) * factor;
        factor = factor === 7 ? 2 : factor + 1;
    }
    let digitoVerificador = 11 - (suma % 11);
    if (digitoVerificador === 11) digitoVerificador = 0;
    if (digitoVerificador === 10) digitoVerificador = 1;
    
    const claveAcceso = cadena + digitoVerificador;

    // XML de comprobante
    const xml = `<?xml version="1.0" encoding="UTF-8"?><comprobanteRetencion id="comprobante" version="1.0.0"><infoTributaria><ambiente>1</ambiente><tipoEmision>1</tipoEmision><razonSocial>EMPRESA DEMO</razonSocial><ruc>${ruc}</ruc><claveAcceso>${claveAcceso}</claveAcceso><codDoc>07</codDoc><estab>001</estab><ptoEmi>001</ptoEmi><secuencial>${secuencial}</secuencial><dirMatriz>Quito</dirMatriz></infoTributaria><infoCompRetencion><fechaEmision>${fechaEmision}</fechaEmision><obligadoContabilidad>SI</obligadoContabilidad><tipoIdentificacionSujetoRetenido>04</tipoIdentificacionSujetoRetenido><razonSocialSujetoRetenido>PROVEEDOR</razonSocialSujetoRetenido><identificacionSujetoRetenido>1722039953001</identificacionSujetoRetenido><periodoFiscal>${periodoFiscal}</periodoFiscal></infoCompRetencion><impuestos><impuesto><codigo>1</codigo><codigoRetencion>303</codigoRetencion><baseImponible>100.00</baseImponible><porcentajeRetener>10.00</porcentajeRetener><valorRetenido>10.00</valorRetenido><codDocSustento>01</codDocSustento><numDocSustento>001001000000001</numDocSustento><fechaEmisionDocSustento>${fechaEmision}</fechaEmisionDocSustento></impuesto></impuestos></comprobanteRetencion>`;

    console.log('Clave de acceso:', claveAcceso);
    console.log('XML length:', xml.length);

    // Método 1: Base64 standard
    const base64Standard = Buffer.from(xml, 'utf8').toString('base64');
    
    // Método 2: Base64 con saltos de línea cada 76 caracteres (formato MIME)
    const base64Mime = base64Standard.match(/.{1,76}/g)?.join('\n') || base64Standard;

    console.log('\n=== TEST 1: Base64 estándar (sin saltos) ===');
    await testEnvio(base64Standard);

    console.log('\n=== TEST 2: XML directo (sin Base64) ===');
    await testEnvioDirecto(xml);
}

async function testEnvio(base64Xml: string) {
    const url = SRI_URLS[SriEnvironment.PRUEBAS].recepcion;
    
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
   <soapenv:Header/>
   <soapenv:Body>
      <ec:validarComprobante>
         <xml>${base64Xml}</xml>
      </ec:validarComprobante>
   </soapenv:Body>
</soapenv:Envelope>`;

    console.log('Enviando a:', url);
    console.log('SOAP length:', soapEnvelope.length);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': ''
            },
            body: soapEnvelope
        });

        const responseText = await response.text();
        console.log('Status:', response.status);
        console.log('Response:');
        console.log(responseText.substring(0, 2000));
        
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

async function testEnvioDirecto(xml: string) {
    const url = SRI_URLS[SriEnvironment.PRUEBAS].recepcion;
    
    // Escape XML para enviarlo directamente dentro del SOAP
    const xmlEscaped = xml
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
   <soapenv:Header/>
   <soapenv:Body>
      <ec:validarComprobante>
         <xml>${xmlEscaped}</xml>
      </ec:validarComprobante>
   </soapenv:Body>
</soapenv:Envelope>`;

    console.log('Enviando (XML directo escapado) a:', url);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': ''
            },
            body: soapEnvelope
        });

        const responseText = await response.text();
        console.log('Status:', response.status);
        console.log('Response:');
        console.log(responseText.substring(0, 2000));
        
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

main();
