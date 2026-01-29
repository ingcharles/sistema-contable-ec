import { PrismaClient } from '@prisma/client';
import { SignatureService } from '../../modules/facturacion/domain/services/test api sri/SignatureServiceV3';
import * as fs from 'fs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:admin@localhost:5435/ecucontabledb'
    }
  }
});

// URLs del SRI
const SRI_URLS = {
  pruebas: {
    recepcion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
    autorizacion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
  },
  produccion: {
    recepcion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
    autorizacion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
  }
};

interface DatosRetencion {
  razonSocialComprador: string;
  identificacionComprador: string;
  tipoIdentificadorComprador: string;
  periodoFiscal: string;
  fechaEmision: string;
  impuestos: Array<{
    codigo: string;
    codigoRetencion: string;
    baseImponible: number;
    porcentajeRetener: number;
    valorRetenido: number;
    codDocSustento: string;
    numDocSustento: string;
    fechaEmisionDocSustento: string;
  }>;
}

function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

function generarClaveAcceso(
  fechaEmision: string,
  tipoComprobante: string,
  ruc: string,
  ambiente: string,
  serie: string,
  numeroComprobante: string,
  codigoNumerico: string,
  tipoEmision: string
): string {
  const fechaParts = fechaEmision.split('/');
  const fechaFormateada = fechaParts[0] + fechaParts[1] + fechaParts[2];

  const base = 
    fechaFormateada +          // 8 dígitos
    tipoComprobante +          // 2 dígitos
    ruc +                      // 13 dígitos
    ambiente +                 // 1 dígito
    serie +                    // 6 dígitos
    numeroComprobante +        // 9 dígitos
    codigoNumerico +           // 8 dígitos
    tipoEmision;               // 1 dígito

  // Módulo 11
  const coeficientes = [2, 3, 4, 5, 6, 7];
  let suma = 0;
  let coefIndex = 0;
  
  for (let i = base.length - 1; i >= 0; i--) {
    suma += parseInt(base[i]) * coeficientes[coefIndex];
    coefIndex = (coefIndex + 1) % 6;
  }

  let digitoVerificador = 11 - (suma % 11);
  if (digitoVerificador === 11) digitoVerificador = 0;
  if (digitoVerificador === 10) digitoVerificador = 1;

  return base + digitoVerificador.toString();
}

function generarXmlRetencionV2(
  claveAcceso: string,
  empresa: any,
  establecimiento: any,
  puntoEmision: any,
  datosRetencion: DatosRetencion
): string {
  const ambiente = empresa.sriAmbiente === 'PRODUCCION' ? '2' : '1';
  
  // Generar impuestos con estructura v2.0.0
  const impuestosXml = datosRetencion.impuestos.map(imp => `
    <docSustento>
      <codSustento>${imp.codDocSustento}</codSustento>
      <codDocSustento>${imp.codDocSustento}</codDocSustento>
      <numDocSustento>${imp.numDocSustento}</numDocSustento>
      <fechaEmisionDocSustento>${imp.fechaEmisionDocSustento}</fechaEmisionDocSustento>
      <pagoLocExt>01</pagoLocExt>
      <totalSinImpuestos>${formatNumber(imp.baseImponible)}</totalSinImpuestos>
      <importeTotal>${formatNumber(imp.baseImponible * 1.12)}</importeTotal>
      <impuestosDocSustento>
        <impuestoDocSustento>
          <codImpuestoDocSustento>2</codImpuestoDocSustento>
          <codigoPorcentaje>2</codigoPorcentaje>
          <baseImponible>${formatNumber(imp.baseImponible)}</baseImponible>
          <tarifa>12.00</tarifa>
          <valorImpuesto>${formatNumber(imp.baseImponible * 0.12)}</valorImpuesto>
        </impuestoDocSustento>
      </impuestosDocSustento>
      <retenciones>
        <retencion>
          <codigo>${imp.codigo}</codigo>
          <codigoRetencion>${imp.codigoRetencion}</codigoRetencion>
          <baseImponible>${formatNumber(imp.baseImponible)}</baseImponible>
          <porcentajeRetener>${formatNumber(imp.porcentajeRetener)}</porcentajeRetener>
          <valorRetenido>${formatNumber(imp.valorRetenido)}</valorRetenido>
        </retencion>
      </retenciones>
      <pagos>
        <pago>
          <formaPago>01</formaPago>
          <total>${formatNumber(imp.baseImponible * 1.12)}</total>
        </pago>
      </pagos>
    </docSustento>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<comprobanteRetencion id="comprobante" version="2.0.0">
  <infoTributaria>
    <ambiente>${ambiente}</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>${empresa.razonSocial}</razonSocial>
    <nombreComercial>${empresa.nombreComercial || empresa.razonSocial}</nombreComercial>
    <ruc>${empresa.ruc}</ruc>
    <claveAcceso>${claveAcceso}</claveAcceso>
    <codDoc>07</codDoc>
    <estab>${establecimiento.codigo}</estab>
    <ptoEmi>${puntoEmision.codigo}</ptoEmi>
    <secuencial>${puntoEmision.secuencialRetencion.toString().padStart(9, '0')}</secuencial>
    <dirMatriz>${empresa.direccionMatriz || 'N/A'}</dirMatriz>
  </infoTributaria>
  <infoCompRetencion>
    <fechaEmision>${datosRetencion.fechaEmision}</fechaEmision>
    <contribuyenteEspecial>${empresa.contribuyenteEspecial || '000'}</contribuyenteEspecial>
    <obligadoContabilidad>${empresa.obligadoContabilidad || 'SI'}</obligadoContabilidad>
    <tipoIdentificacionSujetoRetenido>${datosRetencion.tipoIdentificadorComprador}</tipoIdentificacionSujetoRetenido>
    <parteRel>NO</parteRel>
    <razonSocialSujetoRetenido>${datosRetencion.razonSocialComprador}</razonSocialSujetoRetenido>
    <identificacionSujetoRetenido>${datosRetencion.identificacionComprador}</identificacionSujetoRetenido>
    <periodoFiscal>${datosRetencion.periodoFiscal}</periodoFiscal>
  </infoCompRetencion>
  <docsSustento>${impuestosXml}
  </docsSustento>
  <infoAdicional>
    <campoAdicional nombre="Direccion">Quito - Ecuador</campoAdicional>
    <campoAdicional nombre="Email">test@test.com</campoAdicional>
  </infoAdicional>
</comprobanteRetencion>`;
}

async function enviarSRI(xmlFirmado: string, ambiente: 'pruebas' | 'produccion') {
  const urls = SRI_URLS[ambiente];
  
  // Codificar en base64
  const xmlBase64 = Buffer.from(xmlFirmado, 'utf-8').toString('base64');
  
  // Preparar SOAP request
  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:validarComprobante>
      <xml>${xmlBase64}</xml>
    </ec:validarComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;

  console.log('\n📤 Enviando al SRI (recepción)...');
  
  const response = await fetch(urls.recepcion.replace('?wsdl', ''), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': ''
    },
    body: soapEnvelope
  });

  const responseText = await response.text();
  console.log('\n=== RESPUESTA RECEPCIÓN ===');
  console.log(responseText);
  
  // Parse response
  const estadoMatch = responseText.match(/<estado>([^<]+)<\/estado>/);
  const estado = estadoMatch ? estadoMatch[1] : 'UNKNOWN';
  
  const claveMatch = responseText.match(/<claveAccesoConsultada>([^<]+)<\/claveAccesoConsultada>/);
  const claveConsultada = claveMatch ? claveMatch[1] : null;
  
  console.log(`\n📊 Estado: ${estado}`);
  
  // Extraer mensajes de error si hay
  const mensajes: any[] = [];
  const mensajeMatches = responseText.matchAll(/<mensaje>([\s\S]*?)<\/mensaje>/g);
  for (const match of mensajeMatches) {
    const idMatch = match[1].match(/<identificador>([^<]+)<\/identificador>/);
    const msgMatch = match[1].match(/<mensaje>([^<]+)<\/mensaje>/);
    const infoMatch = match[1].match(/<informacionAdicional>([^<]+)<\/informacionAdicional>/);
    const tipoMatch = match[1].match(/<tipo>([^<]+)<\/tipo>/);
    
    mensajes.push({
      identificador: idMatch?.[1] || '',
      mensaje: msgMatch?.[1] || match[1],
      informacionAdicional: infoMatch?.[1] || '',
      tipo: tipoMatch?.[1] || ''
    });
  }
  
  if (mensajes.length > 0) {
    console.log('\n📋 Mensajes:');
    mensajes.forEach(m => {
      console.log(`  [${m.identificador}] ${m.mensaje}`);
      if (m.informacionAdicional) console.log(`      ↳ ${m.informacionAdicional}`);
    });
  }
  
  return {
    estado,
    claveConsultada,
    mensajes,
    responseXml: responseText
  };
}

async function consultarAutorizacion(claveAcceso: string, ambiente: 'pruebas' | 'produccion') {
  const urls = SRI_URLS[ambiente];
  
  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:autorizacionComprobante>
      <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
    </ec:autorizacionComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;

  console.log('\n📤 Consultando autorización...');
  
  const response = await fetch(urls.autorizacion.replace('?wsdl', ''), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': ''
    },
    body: soapEnvelope
  });

  const responseText = await response.text();
  console.log('\n=== RESPUESTA AUTORIZACIÓN ===');
  console.log(responseText);
  
  // Parse estado
  const estadoMatch = responseText.match(/<estado>([^<]+)<\/estado>/);
  const autorizacionMatch = responseText.match(/<numeroAutorizacion>([^<]+)<\/numeroAutorizacion>/);
  
  return {
    estado: estadoMatch?.[1] || 'UNKNOWN',
    numeroAutorizacion: autorizacionMatch?.[1] || null,
    responseXml: responseText
  };
}

async function main() {
  try {
    console.log('🚀 Test de firma v3 con C14N correcto\n');
    
    // 1. Obtener empresa y certificado
    const empresa = await prisma.empresa.findFirst({
      where: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
      include: {
        sucursales: {
          include: {
            puntosEmision: true
          }
        }
      }
    });

    if (!empresa) throw new Error('Empresa no encontrada');
    if (!empresa.certificadoDigitalP12 || !empresa.certificadoPassword) {
      throw new Error('Certificado digital no configurado');
    }

    console.log(`✅ Empresa: ${empresa.razonSocial}`);
    console.log(`   RUC: ${empresa.ruc}`);
    console.log(`   Ambiente SRI: ${empresa.sriAmbiente}`);

    const establecimiento = empresa.sucursales[0];
    const puntoEmision = establecimiento?.puntosEmision[0];

    if (!establecimiento || !puntoEmision) {
      throw new Error('No hay establecimiento/punto de emisión');
    }

    // 2. Generar datos de prueba
    const fechaEmision = new Date().toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const now = new Date();
    const periodoFiscal = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    // Incrementar secuencial
    const nuevoSecuencial = puntoEmision.secuencialRetencion + 1;
    await prisma.puntoEmision.update({
      where: { id: puntoEmision.id },
      data: { secuencialRetencion: nuevoSecuencial }
    });

    // 3. Generar clave de acceso
    const ambiente = empresa.sriAmbiente === 'PRODUCCION' ? '2' : '1';
    const codigoNumerico = Math.floor(10000000 + Math.random() * 90000000).toString();

    const claveAcceso = generarClaveAcceso(
      fechaEmision,
      '07',
      empresa.ruc,
      ambiente,
      establecimiento.codigo + puntoEmision.codigo,
      nuevoSecuencial.toString().padStart(9, '0'),
      codigoNumerico,
      '1'
    );

    console.log(`\n🔑 Clave de acceso: ${claveAcceso}`);

    // 4. Generar XML - usar RUC registrado en SRI pruebas
    const datosRetencion: DatosRetencion = {
      razonSocialComprador: 'PROVEEDOR TEST SRI',
      identificacionComprador: '1722039953001', // RUC registrado
      tipoIdentificadorComprador: '04', // RUC
      periodoFiscal,
      fechaEmision,
      impuestos: [{
        codigo: '1', // Renta
        codigoRetencion: '303', // 10%
        baseImponible: 100.00,
        porcentajeRetener: 10.00,
        valorRetenido: 10.00,
        codDocSustento: '01', // Factura
        numDocSustento: '001-001-000000001',
        fechaEmisionDocSustento: fechaEmision
      }]
    };

    const xmlSinFirma = generarXmlRetencionV2(
      claveAcceso,
      empresa,
      establecimiento,
      puntoEmision,
      datosRetencion
    );

    console.log('\n📄 XML sin firma generado');
    fs.writeFileSync('test_firma_v3_sin_firmar.xml', xmlSinFirma);

    // 5. Firmar XML
    console.log('\n🔐 Firmando XML con C14N...');
    const xmlFirmado = await SignatureService.signXml(xmlSinFirma, {
      p12Base64: empresa.certificadoDigitalP12,
      passwordP12: empresa.certificadoPassword
    });

    fs.writeFileSync('test_firma_v3_firmado.xml', xmlFirmado);
    console.log('✅ XML firmado guardado en test_firma_v3_firmado.xml');

    // 6. Enviar al SRI
    const resultadoRecepcion = await enviarSRI(xmlFirmado, 'pruebas');

    // Si fue RECIBIDA, esperar y consultar autorización
    if (resultadoRecepcion.estado === 'RECIBIDA') {
      console.log('\n⏳ Esperando 10 segundos para consultar autorización...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const resultadoAutorizacion = await consultarAutorizacion(claveAcceso, 'pruebas');
      console.log(`\n📊 Estado autorización: ${resultadoAutorizacion.estado}`);
      
      if (resultadoAutorizacion.numeroAutorizacion) {
        console.log(`🎉 ¡AUTORIZADO! Número: ${resultadoAutorizacion.numeroAutorizacion}`);
      }
    }

    console.log('\n✅ Test completado');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
