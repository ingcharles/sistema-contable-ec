/**
 * Script de test para firma v3 con C14N correcto
 * Usa xml-crypto para canonicalización
 * Ejecutar con: npx tsx src/scripts/test_firma_v3_final.ts
 */

import { db } from '../../shared/infrastructure/database/postgresql';
import { SignatureService } from '../../modules/facturacion/domain/services/test api sri/SignatureServiceV3';
import fs from 'fs';

// URLs del SRI
const SRI_URLS = {
    recepcion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline',
    autorizacion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline'
};

function generarClaveAcceso(data: any): string {
    const fecha = new Date();
    const fechaEmision = `${String(fecha.getDate()).padStart(2, '0')}${String(fecha.getMonth() + 1).padStart(2, '0')}${fecha.getFullYear()}`;
    const claveBase = `${fechaEmision}${data.codDoc}${data.ruc}${data.ambiente}${data.estab}${data.ptoEmi}${data.secuencial}12345678${data.tipoEmision}`;
    
    const coeficientes = [2, 3, 4, 5, 6, 7];
    let suma = 0, j = 0;
    for (let i = claveBase.length - 1; i >= 0; i--) {
        suma += parseInt(claveBase[i]) * coeficientes[j++ % 6];
    }
    let digito = 11 - (suma % 11);
    if (digito === 10) digito = 1;
    if (digito === 11) digito = 0;
    
    return claveBase + digito;
}

async function enviarRecepcion(xmlFirmado: string): Promise<any> {
    const xmlBase64 = Buffer.from(xmlFirmado, 'utf-8').toString('base64');
    
    const soap = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:validarComprobante>
      <xml>${xmlBase64}</xml>
    </ec:validarComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;

    const response = await fetch(SRI_URLS.recepcion, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '' },
        body: soap
    });
    
    return response.text();
}

async function consultarAutorizacion(claveAcceso: string): Promise<any> {
    const soap = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
  <soapenv:Header/>
  <soapenv:Body>
    <ec:autorizacionComprobante>
      <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
    </ec:autorizacionComprobante>
  </soapenv:Body>
</soapenv:Envelope>`;

    const response = await fetch(SRI_URLS.autorizacion, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '' },
        body: soap
    });
    
    return response.text();
}

async function main() {
    console.log('=== TEST FIRMA V3 CON C14N ===\n');

    const secuencial = String(Math.floor(Math.random() * 999999999)).padStart(9, '0');
    const fechaHoy = new Date();
    const fechaEmision = `${String(fechaHoy.getDate()).padStart(2, '0')}/${String(fechaHoy.getMonth() + 1).padStart(2, '0')}/${fechaHoy.getFullYear()}`;
    const periodoFiscal = `${String(fechaHoy.getMonth() + 1).padStart(2, '0')}/${fechaHoy.getFullYear()}`;

    const datosComprobante = {
        ambiente: '1',
        tipoEmision: '1',
        ruc: '1722039953001',
        codDoc: '07',
        estab: '001',
        ptoEmi: '001',
        secuencial
    };

    const claveAcceso = generarClaveAcceso(datosComprobante);
    console.log('🔑 Clave de acceso:', claveAcceso);

    // XML retención v2.0.0
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<comprobanteRetencion id="comprobante" version="2.0.0">
  <infoTributaria>
    <ambiente>1</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>EMPRESA DEMO S.A.</razonSocial>
    <nombreComercial>ECUCONTABLE STORE</nombreComercial>
    <ruc>1722039953001</ruc>
    <claveAcceso>${claveAcceso}</claveAcceso>
    <codDoc>07</codDoc>
    <estab>001</estab>
    <ptoEmi>001</ptoEmi>
    <secuencial>${secuencial}</secuencial>
    <dirMatriz>Av. Amazonas y Naciones Unidas, Quito</dirMatriz>
  </infoTributaria>
  <infoCompRetencion>
    <fechaEmision>${fechaEmision}</fechaEmision>
    <dirEstablecimiento>Av. Amazonas y Naciones Unidas, Quito</dirEstablecimiento>
    <obligadoContabilidad>SI</obligadoContabilidad>
    <tipoIdentificacionSujetoRetenido>04</tipoIdentificacionSujetoRetenido>
    <parteRel>NO</parteRel>
    <razonSocialSujetoRetenido>PROVEEDOR DE PRUEBA</razonSocialSujetoRetenido>
    <identificacionSujetoRetenido>1722039953001</identificacionSujetoRetenido>
    <periodoFiscal>${periodoFiscal}</periodoFiscal>
  </infoCompRetencion>
  <docsSustento>
    <docSustento>
      <codSustento>01</codSustento>
      <codDocSustento>01</codDocSustento>
      <numDocSustento>001001000000001</numDocSustento>
      <fechaEmisionDocSustento>${fechaEmision}</fechaEmisionDocSustento>
      <numAutDocSustento>1111111111111111111111111111111111111111111111111</numAutDocSustento>
      <pagoLocExt>01</pagoLocExt>
      <totalSinImpuestos>100.00</totalSinImpuestos>
      <importeTotal>100.00</importeTotal>
      <impuestosDocSustento>
        <impuestoDocSustento>
          <codImpuestoDocSustento>2</codImpuestoDocSustento>
          <codigoPorcentaje>0</codigoPorcentaje>
          <baseImponible>100.00</baseImponible>
          <tarifa>0.00</tarifa>
          <valorImpuesto>0.00</valorImpuesto>
        </impuestoDocSustento>
      </impuestosDocSustento>
      <retenciones>
        <retencion>
          <codigo>1</codigo>
          <codigoRetencion>303</codigoRetencion>
          <baseImponible>100.00</baseImponible>
          <porcentajeRetener>10.00</porcentajeRetener>
          <valorRetenido>10.00</valorRetenido>
        </retencion>
      </retenciones>
      <pagos>
        <pago>
          <formaPago>20</formaPago>
          <total>100.00</total>
        </pago>
      </pagos>
    </docSustento>
  </docsSustento>
</comprobanteRetencion>`;

    try {
        // 1. Obtener certificado de BD
        console.log('\n1. Obteniendo certificado...');
        const empresa_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
        const certResult = await db.query(
            {
                text: `SELECT cert_p12_certificado, cert_clave_certificado
                       FROM configuracion.sri_certificados
                       WHERE empresa_id = $1 AND activo = true LIMIT 1`,
                values: [empresa_id]
            },
            { empresaId: empresa_id, usuarioId: empresa_id }
        );
        
        if (certResult.rows.length === 0) {
            throw new Error('No se encontró certificado activo');
        }
        
        const certRow = certResult.rows[0];
        const p12Base64 = Buffer.isBuffer(certRow.cert_p12_certificado) 
            ? certRow.cert_p12_certificado.toString('base64')
            : certRow.cert_p12_certificado;
        const password = certRow.cert_clave_certificado;
        
        console.log('✅ Certificado obtenido');

        // 2. Firmar con SignatureServiceV3 (C14N)
        console.log('\n2. Firmando XML con C14N...');
        const xmlFirmado = await SignatureService.signXml(xml, {
            p12Base64,
            passwordP12: password
        });
        
        fs.writeFileSync('test_v3_firmado.xml', xmlFirmado);
        console.log('✅ XML firmado guardado en test_v3_firmado.xml');

        // 3. Enviar al SRI
        console.log('\n3. Enviando al SRI...');
        const respRecepcion = await enviarRecepcion(xmlFirmado);
        console.log('\n=== RESPUESTA RECEPCIÓN ===');
        console.log(respRecepcion);
        
        fs.writeFileSync('test_v3_resp_recepcion.xml', respRecepcion);

        // Parsear estado
        const estadoMatch = respRecepcion.match(/<estado>([^<]+)<\/estado>/);
        const estado = estadoMatch ? estadoMatch[1] : 'UNKNOWN';
        console.log(`\n📊 Estado: ${estado}`);
        
        // Extraer mensajes de error
        const mensajes = [...respRecepcion.matchAll(/<mensaje>([\s\S]*?)<\/mensaje>/g)].map(m => {
            const id = m[1].match(/<identificador>([^<]+)<\/identificador>/)?.[1] || '';
            const msg = m[1].match(/<mensaje>([^<]+)<\/mensaje>/)?.[1] || m[1];
            const info = m[1].match(/<informacionAdicional>([^<]+)<\/informacionAdicional>/)?.[1] || '';
            return { id, msg, info };
        });
        
        if (mensajes.length > 0) {
            console.log('\n📋 Mensajes:');
            mensajes.forEach(m => {
                console.log(`  [${m.id}] ${m.msg}`);
                if (m.info) console.log(`      ↳ ${m.info}`);
            });
        }

        // Si RECIBIDA, consultar autorización
        if (estado === 'RECIBIDA') {
            console.log('\n⏳ Esperando 10s para consultar autorización...');
            await new Promise(r => setTimeout(r, 10000));
            
            const respAutorizacion = await consultarAutorizacion(claveAcceso);
            console.log('\n=== RESPUESTA AUTORIZACIÓN ===');
            console.log(respAutorizacion);
            
            fs.writeFileSync('test_v3_resp_autorizacion.xml', respAutorizacion);
            
            const estadoAuth = respAutorizacion.match(/<estado>([^<]+)<\/estado>/)?.[1];
            const numAuth = respAutorizacion.match(/<numeroAutorizacion>([^<]+)<\/numeroAutorizacion>/)?.[1];
            
            console.log(`\n📊 Estado autorización: ${estadoAuth}`);
            if (numAuth) {
                console.log(`🎉 ¡AUTORIZADO! Número: ${numAuth}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.close();
    }
}

main();
