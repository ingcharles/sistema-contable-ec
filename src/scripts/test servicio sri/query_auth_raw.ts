/**
 * Consulta RAW de autorización 
 */

async function main() {
    const claveAcceso = process.argv[2] || '2701202607172203995300110010016549889911234567812';
    
    console.log(`Consultando clave: ${claveAcceso}\n`);
    
    const soap = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
  <soapenv:Body>
    <ec:autorizacionComprobante>
      <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
    </ec:autorizacionComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;

    const response = await fetch('https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline', {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
        body: soap
    });
    
    const text = await response.text();
    console.log('=== RESPUESTA RAW ===\n');
    console.log(text);
}

main();
