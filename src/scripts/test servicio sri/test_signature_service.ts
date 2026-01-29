/**
 * Test del SignatureService principal actualizado
 * Verificar que la firma funcione con xml-crypto C14N
 */
import fs from 'fs';
import https from 'https';
import { SignatureService } from '../../modules/facturacion/domain/services/SignatureService';
import { db } from '../../shared/infrastructure/database/postgresql';

function calcularDigitoVerificador(claveAcceso: string): string {
  const pesos = [2, 3, 4, 5, 6, 7];
  let suma = 0;
  for (let i = claveAcceso.length - 1, j = 0; i >= 0; i--, j++) {
    suma += parseInt(claveAcceso[i]) * pesos[j % 6];
  }
  const modulo = suma % 11;
  const verificador = modulo === 0 ? 0 : modulo === 1 ? 1 : 11 - modulo;
  return verificador.toString();
}

async function test() {
  console.log('=== TEST SignatureService (xml-crypto) ===\n');

  // Obtener certificado de la BD
  const result = await db.querySimple({
    text: `SELECT cert_p12_certificado, cert_clave_certificado 
           FROM configuracion.sri_certificados 
           WHERE empresa_id = $1`,
    values: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11']
  });
  
  const certRow = result.rows[0];
  if (!certRow?.cert_p12_certificado) {
    throw new Error('No se encontró certificado en la BD');
  }

  const p12Base64 = Buffer.isBuffer(certRow.cert_p12_certificado)
    ? certRow.cert_p12_certificado.toString('base64')
    : certRow.cert_p12_certificado;
  const passwordP12 = certRow.cert_clave_certificado || 'password1234';

  console.log('Certificado cargado desde BD');

  // Clave de acceso única basada en timestamp
  const fecha = new Date();
  const fechaStr = `${String(fecha.getDate()).padStart(2, '0')}${String(fecha.getMonth() + 1).padStart(2, '0')}${fecha.getFullYear()}`;
  const secuencial = String(Date.now() % 1000000000).padStart(9, '0');
  const base = `${fechaStr}0717220399530011001001${secuencial}123456781`;
  const claveConDigito = base + calcularDigitoVerificador(base);
  console.log('Clave de acceso:', claveConDigito);

  const fechaEmision = `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;
  const periodoFiscal = `${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;

  // XML de retención v2.0.0 (estructura según XSD oficial)
  // numDocSustento DEBE ser 15 dígitos sin guiones
  const xmlSinFirma = `<?xml version="1.0" encoding="UTF-8"?>
<comprobanteRetencion id="comprobante" version="2.0.0">
  <infoTributaria>
    <ambiente>1</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>PRUEBA DE EMISION DE COMPROBANTES ELECTRONICOS ECUADORIAN SOFTWARE DEVELOPMENT</razonSocial>
    <nombreComercial>PRUEBA CE</nombreComercial>
    <ruc>1722039953001</ruc>
    <claveAcceso>${claveConDigito}</claveAcceso>
    <codDoc>07</codDoc>
    <estab>001</estab>
    <ptoEmi>001</ptoEmi>
    <secuencial>${secuencial}</secuencial>
    <dirMatriz>QUITO AV. COLON Y 6 DE DICIEMBRE</dirMatriz>
  </infoTributaria>
  <infoCompRetencion>
    <fechaEmision>${fechaEmision}</fechaEmision>
    <dirEstablecimiento>QUITO AV. COLON Y 6 DE DICIEMBRE</dirEstablecimiento>
    <obligadoContabilidad>SI</obligadoContabilidad>
    <tipoIdentificacionSujetoRetenido>04</tipoIdentificacionSujetoRetenido>
    <tipoSujetoRetenido>01</tipoSujetoRetenido>
    <parteRel>NO</parteRel>
    <razonSocialSujetoRetenido>PROVEEDOR DE PRUEBA S.A.</razonSocialSujetoRetenido>
    <identificacionSujetoRetenido>1792146739001</identificacionSujetoRetenido>
    <periodoFiscal>${periodoFiscal}</periodoFiscal>
  </infoCompRetencion>
  <docsSustento>
    <docSustento>
      <codSustento>01</codSustento>
      <codDocSustento>01</codDocSustento>
      <numDocSustento>001001000000456</numDocSustento>
      <fechaEmisionDocSustento>15/01/2025</fechaEmisionDocSustento>
      <fechaRegistroContable>15/01/2025</fechaRegistroContable>
      <numAutDocSustento>1501202501179214673900110010010000004561234567819</numAutDocSustento>
      <pagoLocExt>01</pagoLocExt>
      <totalSinImpuestos>100.00</totalSinImpuestos>
      <importeTotal>115.00</importeTotal>
      <impuestosDocSustento>
        <impuestoDocSustento>
          <codImpuestoDocSustento>2</codImpuestoDocSustento>
          <codigoPorcentaje>4</codigoPorcentaje>
          <baseImponible>100.00</baseImponible>
          <tarifa>15</tarifa>
          <valorImpuesto>15.00</valorImpuesto>
        </impuestoDocSustento>
      </impuestosDocSustento>
      <retenciones>
        <retencion>
          <codigo>1</codigo>
          <codigoRetencion>303</codigoRetencion>
          <baseImponible>100.00</baseImponible>
          <porcentajeRetener>10</porcentajeRetener>
          <valorRetenido>10.00</valorRetenido>
        </retencion>
      </retenciones>
    </docSustento>
  </docsSustento>
</comprobanteRetencion>`;

  console.log('\n1. Firmando XML con SignatureService actualizado...');
  
  const xmlFirmado = await SignatureService.signXml(xmlSinFirma, {
    p12Base64,
    passwordP12
  });

  fs.writeFileSync('test_signature_service.xml', xmlFirmado);
  console.log('XML firmado guardado en test_signature_service.xml');

  // Verificar estructura
  console.log('\n2. Verificando estructura de firma...');
  console.log('  Tiene ds:Signature:', xmlFirmado.includes('<ds:Signature'));
  console.log('  Tiene SignedInfo:', xmlFirmado.includes('<ds:SignedInfo'));
  console.log('  Tiene SignatureValue:', xmlFirmado.includes('<ds:SignatureValue'));
  console.log('  Tiene X509Certificate:', xmlFirmado.includes('<ds:X509Certificate>'));
  console.log('  Tiene QualifyingProperties:', xmlFirmado.includes('<etsi:QualifyingProperties'));
  console.log('  Tiene SignedProperties:', xmlFirmado.includes('<etsi:SignedProperties'));
  console.log('  Tiene RSAKeyValue:', xmlFirmado.includes('<ds:RSAKeyValue>'));
  console.log('  Usa SHA1 en digest:', xmlFirmado.includes('xmldsig#sha1'));
  console.log('  Usa RSA-SHA1:', xmlFirmado.includes('rsa-sha1'));

  // Enviar a SRI
  console.log('\n3. Enviando a SRI (ambiente pruebas)...');
  
  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:validarComprobante>
      <xml>${Buffer.from(xmlFirmado).toString('base64')}</xml>
    </ec:validarComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;

  const response = await new Promise<string>((resolve, reject) => {
    const req = https.request({
      hostname: 'celcer.sri.gob.ec',
      port: 443,
      path: '/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': ''
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(soapEnvelope);
    req.end();
  });

  console.log('\n4. Respuesta SRI:');
  
  const estadoMatch = response.match(/<estado>(\w+)<\/estado>/);
  const estado = estadoMatch ? estadoMatch[1] : 'DESCONOCIDO';
  console.log('Estado:', estado);

  // Extraer mensajes
  const mensajesMatch = response.matchAll(/<identificador>(\d+)<\/identificador>[\s\S]*?<mensaje>([^<]+)<\/mensaje>/g);
  console.log('\nMensajes:');
  for (const m of mensajesMatch) {
    console.log(`  - Error ${m[1]}: ${m[2]}`);
  }

  if (estado === 'RECIBIDA' || response.includes('PROCESAMIENTO')) {
    console.log('\n5. Comprobante recibido! Consultando autorización...');
    
    // Esperar 3 segundos
    await new Promise(r => setTimeout(r, 3000));
    
    const authSoap = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:autorizacionComprobante>
      <claveAccesoComprobante>${claveConDigito}</claveAccesoComprobante>
    </ec:autorizacionComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;

    const authResponse = await new Promise<string>((resolve, reject) => {
      const req = https.request({
        hostname: 'celcer.sri.gob.ec',
        port: 443,
        path: '/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': ''
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.write(authSoap);
      req.end();
    });

    console.log('\n6. Resultado autorización:');
    const numMatch = authResponse.match(/<numeroComprobantes>(\d+)<\/numeroComprobantes>/);
    const numComprobantes = numMatch ? numMatch[1] : '0';
    console.log('  Número de comprobantes:', numComprobantes);
    
    const authEstadoMatch = authResponse.match(/<estado>(AUTORIZADO|NO AUTORIZADO)<\/estado>/);
    const authEstado = authEstadoMatch ? authEstadoMatch[1] : 'N/A';
    console.log('  Estado:', authEstado);

    if (authEstado === 'AUTORIZADO') {
      console.log('  ✅ FIRMA VERIFICADA - Comprobante AUTORIZADO');
    } else {
      console.log('  ❌ Firma rechazada (0 comprobantes autorizados)');
      
      // Mostrar detalles del error
      const authMsgMatch = authResponse.matchAll(/<identificador>(\d+)<\/identificador>[\s\S]*?<mensaje>([^<]+)<\/mensaje>/g);
      for (const m of authMsgMatch) {
        console.log(`  Error ${m[1]}: ${m[2]}`);
      }
    }
  }

  await db.close();
  console.log('\n=== FIN TEST ===');
}

test().catch(console.error);
