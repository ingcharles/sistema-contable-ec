/**
 * Test de firma SRI con canonicalización xml-crypto
 * Enfocado en SHA-1 en todos los digests
 */
import fs from 'fs';
import https from 'https';
import { SignatureServiceSRI } from '../../modules/facturacion/domain/services/test api sri/SignatureServiceSRI';
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
  console.log('=== TEST FIRMA SRI ===\n');

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

  // Clave de acceso única basada en timestamp y código aleatorio
  const fecha = new Date();
  const fechaStr = `${String(fecha.getDate()).padStart(2, '0')}${String(fecha.getMonth() + 1).padStart(2, '0')}${fecha.getFullYear()}`;
  const secuencial = String(Date.now() % 1000000000).padStart(9, '0');
  const codigoNum = Math.floor(10000000 + Math.random() * 89999999).toString(); // 8 dígitos aleatorios
  const base = `${fechaStr}0717220399530011001001${secuencial}${codigoNum}1`;
  const claveConDigito = base + calcularDigitoVerificador(base);
  console.log('Clave de acceso:', claveConDigito);

  const fechaEmision = `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;
  const periodoFiscal = `${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;

  // XML de retención v2.0.0 (estructura según XSD oficial)
  // IMPORTANTE: tipoSujetoRetenido NO debe incluirse cuando el tipo de identificación es RUC (04)
  // Los códigos de retención IVA deben corresponder con los porcentajes parametrizados por SRI
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
        <retencion>
          <codigo>2</codigo>
          <codigoRetencion>1</codigoRetencion>
          <baseImponible>15.00</baseImponible>
          <porcentajeRetener>10</porcentajeRetener>
          <valorRetenido>1.50</valorRetenido>
        </retencion>
      </retenciones>
      <pagos>
        <pago>
          <formaPago>01</formaPago>
          <total>103.50</total>
        </pago>
      </pagos>
    </docSustento>
  </docsSustento>
  <infoAdicional>
    <campoAdicional nombre="Correo">prueba@test.com</campoAdicional>
  </infoAdicional>
</comprobanteRetencion>`;

  console.log('\n1. Firmando XML...');
  
  const xmlFirmado = await SignatureServiceSRI.signXml(xmlSinFirma, {
    p12Base64,
    passwordP12
  });

  // Guardar para inspección
  fs.writeFileSync('test_sri_firmado.xml', xmlFirmado);
  console.log('XML firmado guardado en test_sri_firmado.xml');

  // Verificar estructura
  console.log('\n2. Verificando estructura de firma...');
  console.log('  Tiene ds:Signature:', xmlFirmado.includes('<ds:Signature'));
  console.log('  Tiene SignedInfo:', xmlFirmado.includes('<ds:SignedInfo'));
  console.log('  Tiene SignatureValue:', xmlFirmado.includes('<ds:SignatureValue'));
  console.log('  Tiene X509Certificate:', xmlFirmado.includes('<ds:X509Certificate'));
  console.log('  Tiene QualifyingProperties:', xmlFirmado.includes('<etsi:QualifyingProperties'));
  console.log('  Tiene SignedProperties:', xmlFirmado.includes('<etsi:SignedProperties'));
  console.log('  Tiene 2 References:', (xmlFirmado.match(/<ds:Reference/g) || []).length === 2);
  console.log('  Usa SHA1 en digest:', xmlFirmado.includes('http://www.w3.org/2000/09/xmldsig#sha1'));
  console.log('  Usa RSA-SHA1:', xmlFirmado.includes('http://www.w3.org/2000/09/xmldsig#rsa-sha1'));

  // Enviar a SRI
  console.log('\n3. Enviando a SRI...');
  const xmlEncoded = Buffer.from(xmlFirmado).toString('base64');
  const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:validarComprobante>
      <xml>${xmlEncoded}</xml>
    </ec:validarComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;

  const sriResponse = await new Promise<string>((resolve, reject) => {
    const options = {
      hostname: 'celcer.sri.gob.ec',
      port: 443,
      path: '/comprobantes-electronicos-ws/RecepcionComprobantesOffline',
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': ''
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.write(soapRequest);
    req.end();
  });

  console.log('\n4. Respuesta SRI:');
  
  // Extraer campos importantes
  const estadoMatch = sriResponse.match(/<estado>([^<]+)<\/estado>/);
  const mensajes = sriResponse.match(/<mensaje>([\s\S]*?)<\/mensaje>/g) || [];
  
  console.log('Estado:', estadoMatch?.[1] || 'No encontrado');
  
  if (mensajes.length > 0) {
    console.log('\nMensajes:');
    for (const msg of mensajes) {
      const identificador = msg.match(/<identificador>([^<]+)<\/identificador>/)?.[1];
      const mensaje = msg.match(/<mensaje>([^<]+)<\/mensaje>/)?.[1];
      const informacionAdicional = msg.match(/<informacionAdicional>([^<]+)<\/informacionAdicional>/)?.[1];
      const tipo = msg.match(/<tipo>([^<]+)<\/tipo>/)?.[1];
      
      if (identificador) console.log(`  - Error ${identificador}: ${mensaje || ''}`);
      if (informacionAdicional) console.log(`    Info: ${informacionAdicional}`);
      if (tipo) console.log(`    Tipo: ${tipo}`);
    }
  }

  // Si fue RECIBIDA o Error 70 (en procesamiento), esperar y consultar autorización
  if (estadoMatch?.[1] === 'RECIBIDA' || sriResponse.includes('Error 70') || sriResponse.includes('CLAVE DE ACCESO EN PROCESAMIENTO')) {
    console.log('\n5. Comprobante en procesamiento! Esperando autorización...');
    await new Promise(resolve => setTimeout(resolve, 25000));
    
    // Consultar autorización
    const authSoap = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:autorizacionComprobante>
      <claveAccesoComprobante>${claveConDigito}</claveAccesoComprobante>
    </ec:autorizacionComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;

    const authResult = await new Promise<string>((resolve, reject) => {
      const options = {
        hostname: 'celcer.sri.gob.ec',
        port: 443,
        path: '/comprobantes-electronicos-ws/AutorizacionComprobantesOffline',
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': ''
        }
      };

      const req = https.request(options, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });

      req.on('error', reject);
      req.write(authSoap);
      req.end();
    });

    const numComprobantes = authResult.match(/<numeroComprobantes>([^<]+)<\/numeroComprobantes>/)?.[1];
    const estadoAuth = authResult.match(/<estado>([^<]+)<\/estado>/)?.[1];
    const numAut = authResult.match(/<numeroAutorizacion>([^<]+)<\/numeroAutorizacion>/)?.[1];
    
    console.log('\n6. Resultado autorización:');
    console.log('  Número de comprobantes:', numComprobantes);
    console.log('  Estado:', estadoAuth || 'N/A');
    
    if (numAut) {
      console.log('  ✅ AUTORIZADO! Número:', numAut);
    } else {
      // Extraer todos los mensajes de error
      const authMensajes = authResult.match(/<mensaje>([^<]+)<\/mensaje>/g) || [];
      const authInfos = authResult.match(/<informacionAdicional>([^<]+)<\/informacionAdicional>/g) || [];
      const identificadores = authResult.match(/<identificador>([^<]+)<\/identificador>/g) || [];
      
      console.log('  ❌ NO AUTORIZADO');
      console.log('  Detalles del error:');
      
      identificadores.forEach((id, idx) => {
        const codigo = id.match(/<identificador>([^<]+)<\/identificador>/)?.[1];
        const msg = authMensajes[idx]?.match(/<mensaje>([^<]+)<\/mensaje>/)?.[1];
        const info = authInfos[idx]?.match(/<informacionAdicional>([^<]+)<\/informacionAdicional>/)?.[1];
        console.log(`    Error ${codigo}: ${msg}`);
        if (info) console.log(`      Info: ${info}`);
      });

      // Mostrar respuesta completa para debug
      console.log('\n  Respuesta completa (debug):');
      const mensajesSection = authResult.match(/<mensajes>([\s\S]*?)<\/mensajes>/)?.[1];
      if (mensajesSection) {
        console.log(mensajesSection);
      }
    }
  }

  console.log('\n=== FIN TEST ===');
  await db.close();
}

test().catch(console.error);
