import https from 'https';

const claveAcceso = process.argv[2] || '2701202607172203995300110010014980020071234567811';

const authSoap = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:autorizacionComprobante>
      <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
    </ec:autorizacionComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;

const req = https.request({
  hostname: 'celcer.sri.gob.ec',
  port: 443,
  path: '/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
  method: 'POST',
  headers: { 'Content-Type': 'text/xml; charset=utf-8' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Clave consultada:', claveAcceso);
    console.log('Estado:', data.match(/<estado>([^<]+)<\/estado>/)?.[1] || 'N/A');
    console.log('Num Comprobantes:', data.match(/<numeroComprobantes>([^<]+)<\/numeroComprobantes>/)?.[1] || '0');
    const numAut = data.match(/<numeroAutorizacion>([^<]+)<\/numeroAutorizacion>/)?.[1];
    if (numAut) {
      console.log('✅ AUTORIZADO! Numero:', numAut);
    } else {
      const mensajes = data.match(/<mensajes>([\s\S]*?)<\/mensajes>/);
      if (mensajes) console.log('Mensajes:', mensajes[1]);
    }
  });
});
req.on('error', console.error);
req.write(authSoap);
req.end();
