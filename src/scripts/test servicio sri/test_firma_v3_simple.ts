import { SignatureService } from '../../modules/facturacion/domain/services/test api sri/SignatureServiceV3';
import * as fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

// Pool de conexión PostgreSQL
const pool = new Pool({
  host: 'localhost',
  port: 5435,
  database: 'ecucontabledb',
  user: 'postgres',
  password: 'admin'
});

// URLs del SRI
const SRI_URLS = {
  pruebas: {
    recepcion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline',
    autorizacion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline'
  }
};

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
    fechaFormateada +
    tipoComprobante +
    ruc +
    ambiente +
    serie +
    numeroComprobante +
    codigoNumerico +
    tipoEmision;

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
  secuencial: number,
  datosRetencion: any
): string {
  const ambiente = empresa.sri_ambiente === 'PRODUCCION' ? '2' : '1';

  const impuestosXml = datosRetencion.impuestos.map((imp: any) => `
    <docSustento>
      <codSustento>${imp.codDocSustento}</codSustento>
      <codDocSustento>${imp.codDocSustento}</codDocSustento>
      <numDocSustento>${imp.numDocSustento}</numDocSustento>
      <fechaEmisionDocSustento>${imp.fechaEmisionDocSustento}</fechaEmisionDocSustento>
      <pagoLocExt>01</pagoLocExt>
      <totalSinImpuestos>${formatNumber(imp.baseImponible)}</totalSinImpuestos>
      <importeTotal>${formatNumber(imp.baseImponible * 1.15)}</importeTotal>
      <impuestosDocSustento>
        <impuestoDocSustento>
          <codImpuestoDocSustento>2</codImpuestoDocSustento>
          <codigoPorcentaje>4</codigoPorcentaje>
          <baseImponible>${formatNumber(imp.baseImponible)}</baseImponible>
          <tarifa>15.00</tarifa>
          <valorImpuesto>${formatNumber(imp.baseImponible * 0.15)}</valorImpuesto>
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
          <total>${formatNumber(imp.baseImponible * 1.15)}</total>
        </pago>
      </pagos>
    </docSustento>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<comprobanteRetencion id="comprobante" version="2.0.0">
  <infoTributaria>
    <ambiente>${ambiente}</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>${empresa.razon_social}</razonSocial>
    <nombreComercial>${empresa.nombre_comercial || empresa.razon_social}</nombreComercial>
    <ruc>${empresa.ruc}</ruc>
    <claveAcceso>${claveAcceso}</claveAcceso>
    <codDoc>07</codDoc>
    <estab>${establecimiento.codigo}</estab>
    <ptoEmi>${puntoEmision.codigo}</ptoEmi>
    <secuencial>${secuencial.toString().padStart(9, '0')}</secuencial>
    <dirMatriz>${empresa.direccion || 'N/A'}</dirMatriz>
  </infoTributaria>
  <infoCompRetencion>
    <fechaEmision>${datosRetencion.fechaEmision}</fechaEmision>
    <contribuyenteEspecial>${empresa.contribuyente_especial || '000'}</contribuyenteEspecial>
    <obligadoContabilidad>${empresa.obligado_contabilidad ? 'SI' : 'NO'}</obligadoContabilidad>
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

async function enviarSRI(xmlFirmado: string, ambiente: 'pruebas' | 'produccion' = 'pruebas') {
  const urls = SRI_URLS[ambiente];
  const xmlBase64 = Buffer.from(xmlFirmado, 'utf-8').toString('base64');

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

  const response = await fetch(urls.recepcion, {
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

  const estadoMatch = responseText.match(/<estado>([^<]+)<\/estado>/);
  const estado = estadoMatch ? estadoMatch[1] : 'UNKNOWN';

  console.log(`\n📊 Estado: ${estado}`);

  const mensajes: any[] = [];
  const mensajeMatches = responseText.matchAll(/<mensaje>([\s\S]*?)<\/mensaje>/g);
  for (const match of mensajeMatches) {
    const idMatch = match[1].match(/<identificador>([^<]+)<\/identificador>/);
    const msgMatch = match[1].match(/<mensaje>([^<]+)<\/mensaje>/);
    const infoMatch = match[1].match(/<informacionAdicional>([^<]+)<\/informacionAdicional>/);

    mensajes.push({
      identificador: idMatch?.[1] || '',
      mensaje: msgMatch?.[1] || match[1],
      informacionAdicional: infoMatch?.[1] || ''
    });
  }

  if (mensajes.length > 0) {
    console.log('\n📋 Mensajes:');
    mensajes.forEach(m => {
      console.log(`  [${m.identificador}] ${m.mensaje}`);
      if (m.informacionAdicional) console.log(`      ↳ ${m.informacionAdicional}`);
    });
  }

  return { estado, mensajes, responseXml: responseText };
}

async function consultarAutorizacion(claveAcceso: string, ambiente: 'pruebas' | 'produccion' = 'pruebas') {
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

  const response = await fetch(urls.autorizacion, {
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

  const estadoMatch = responseText.match(/<estado>([^<]+)<\/estado>/);
  const autorizacionMatch = responseText.match(/<numeroAutorizacion>([^<]+)<\/numeroAutorizacion>/);

  return {
    estado: estadoMatch?.[1] || 'UNKNOWN',
    numeroAutorizacion: autorizacionMatch?.[1] || null,
    responseXml: responseText
  };
}

async function main() {
  let client;

  try {
    console.log('🚀 Test de firma v3 con C14N correcto\n');

    client = await pool.connect();

    // 1. Obtener empresa y certificado
    const empresaResult = await client.query(`
      SELECT e.*, s.id as sucursal_id, s.codigo as sucursal_codigo, s.nombre as sucursal_nombre,
             p.id as punto_id, p.codigo as punto_codigo, p.secuencial_retencion
      FROM empresas e
      LEFT JOIN sucursales s ON s.empresa_id = e.id
      LEFT JOIN puntos_emision p ON p.sucursal_id = s.id
      WHERE e.id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      LIMIT 1
    `);

    if (empresaResult.rows.length === 0) throw new Error('Empresa no encontrada');

    const row = empresaResult.rows[0];
    const empresa = {
      id: row.id,
      ruc: row.ruc,
      razon_social: row.razon_social,
      nombre_comercial: row.nombre_comercial,
      direccion: row.direccion,
      sri_ambiente: row.sri_ambiente,
      contribuyente_especial: row.contribuyente_especial,
      obligado_contabilidad: row.obligado_contabilidad,
      certificado_digital_p12: row.certificado_digital_p12,
      certificado_password: row.certificado_password
    };

    const establecimiento = {
      id: row.sucursal_id,
      codigo: row.sucursal_codigo || '001'
    };

    const puntoEmision = {
      id: row.punto_id,
      codigo: row.punto_codigo || '001',
      secuencial_retencion: row.secuencial_retencion || 0
    };

    if (!empresa.certificado_digital_p12 || !empresa.certificado_password) {
      throw new Error('Certificado digital no configurado');
    }

    console.log(`✅ Empresa: ${empresa.razon_social}`);
    console.log(`   RUC: ${empresa.ruc}`);
    console.log(`   Ambiente SRI: ${empresa.sri_ambiente}`);

    // 2. Generar datos de prueba
    const fechaEmision = new Date().toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const now = new Date();
    const periodoFiscal = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    // Incrementar secuencial
    const nuevoSecuencial = (puntoEmision.secuencial_retencion || 0) + 1;
    await client.query(
      'UPDATE puntos_emision SET secuencial_retencion = $1 WHERE id = $2',
      [nuevoSecuencial, puntoEmision.id]
    );

    // 3. Generar clave de acceso
    const ambiente = empresa.sri_ambiente === 'PRODUCCION' ? '2' : '1';
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
    const datosRetencion = {
      razonSocialComprador: 'PROVEEDOR TEST SRI',
      identificacionComprador: '1722039953001',
      tipoIdentificadorComprador: '04',
      periodoFiscal,
      fechaEmision,
      impuestos: [{
        codigo: '1',
        codigoRetencion: '303',
        baseImponible: 100.00,
        porcentajeRetener: 10.00,
        valorRetenido: 10.00,
        codDocSustento: '01',
        numDocSustento: '001-001-000000001',
        fechaEmisionDocSustento: fechaEmision
      }]
    };

    const xmlSinFirma = generarXmlRetencionV2(
      claveAcceso,
      empresa,
      establecimiento,
      puntoEmision,
      nuevoSecuencial,
      datosRetencion
    );

    console.log('\n📄 XML sin firma generado');
    fs.writeFileSync('test_firma_v3_sin_firmar.xml', xmlSinFirma);

    // 5. Firmar XML
    console.log('\n🔐 Firmando XML con C14N...');
    const xmlFirmado = await SignatureService.signXml(xmlSinFirma, {
      p12Base64: empresa.certificado_digital_p12,
      passwordP12: empresa.certificado_password
    });

    fs.writeFileSync('test_firma_v3_firmado.xml', xmlFirmado);
    console.log('✅ XML firmado guardado');

    // 6. Enviar al SRI
    const resultadoRecepcion = await enviarSRI(xmlFirmado, 'pruebas');

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
    if (client) client.release();
    await pool.end();
  }
}

main();
