/**
 * Script para ver respuesta SOAP raw de recepción
 */

import { SRI_URLS, SriEnvironment } from '../../shared/sri-constants';
import { SignatureService } from '../../modules/facturacion/domain/services/test api sri/SignatureServiceFixed';
import { db } from '../../shared/infrastructure/database/postgresql';
import fs from 'fs';

// Generador de clave de acceso
function generarClaveAcceso(data: any): string {
    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    
    const fechaEmision = `${dia}${mes}${anio}`;
    const claveBase = `${fechaEmision}${data.codDoc}${data.ruc}${data.ambiente}${data.estab}${data.ptoEmi}${data.secuencial}12345678${data.tipoEmision}`;
    
    const coeficientes = [2, 3, 4, 5, 6, 7];
    let suma = 0;
    let j = 0;
    for (let i = claveBase.length - 1; i >= 0; i--) {
        suma += parseInt(claveBase[i]) * coeficientes[j % 6];
        j++;
    }
    let digitoVerificador = 11 - (suma % 11);
    if (digitoVerificador === 10) digitoVerificador = 1;
    if (digitoVerificador === 11) digitoVerificador = 0;
    
    return claveBase + digitoVerificador;
}

async function main() {
    console.log('=== DEBUG RECEPCIÓN SRI ===\n');

    const secuencial = String(Math.floor(Math.random() * 999999999)).padStart(9, '0');
    const fechaHoy = new Date();
    const dia = String(fechaHoy.getDate()).padStart(2, '0');
    const mes = String(fechaHoy.getMonth() + 1).padStart(2, '0');
    const anio = fechaHoy.getFullYear();
    const fechaEmision = `${dia}/${mes}/${anio}`;
    const periodoFiscal = `${mes}/${anio}`;

    const datosComprobante = {
        ambiente: '1',
        tipoEmision: '1',
        ruc: '1722039953001',
        codDoc: '07',
        estab: '001',
        ptoEmi: '001',
        secuencial: secuencial
    };

    const claveAcceso = generarClaveAcceso(datosComprobante);
    console.log('Clave de acceso:', claveAcceso);

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
        // Obtener certificado
        const empresa_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
        const certResult = await db.query(
            {
                text: `SELECT cert_p12_certificado, cert_clave_certificado FROM configuracion.sri_certificados WHERE empresa_id = $1 AND activo = true LIMIT 1`,
                values: [empresa_id]
            },
            { empresaId: empresa_id, usuarioId: empresa_id }
        );
        const config = certResult.rows[0];

        // Firmar
        console.log('Firmando XML...');
        const signedXml = await SignatureService.signXml(xml, {
            p12Base64: config.cert_p12_certificado.toString('base64'),
            passwordP12: config.cert_clave_certificado
        });

        fs.writeFileSync('debug_recepcion.xml', signedXml);
        console.log('XML guardado en debug_recepcion.xml');

        // Enviar con SOAP manual para ver respuesta completa
        const url = SRI_URLS[SriEnvironment.PRUEBAS].recepcion;
        const xmlBase64 = Buffer.from(signedXml).toString('base64');

        const soapEnvelope = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
   <soapenv:Header/>
   <soapenv:Body>
      <ec:validarComprobante>
         <xml>${xmlBase64}</xml>
      </ec:validarComprobante>
   </soapenv:Body>
</soapenv:Envelope>`;

        console.log('\nEnviando a:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': ''
            },
            body: soapEnvelope
        });

        console.log('HTTP Status:', response.status);
        const responseText = await response.text();
        
        console.log('\n=== RAW SOAP RESPONSE ===');
        console.log(responseText.replace(/></g, '>\n<'));

        // Esperar y consultar autorización
        console.log('\n\nEsperando 10 segundos antes de consultar autorización...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        const authUrl = SRI_URLS[SriEnvironment.PRUEBAS].autorizacion;
        const authSoap = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
   <soapenv:Header/>
   <soapenv:Body>
      <ec:autorizacionComprobante>
         <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
      </ec:autorizacionComprobante>
   </soapenv:Body>
</soapenv:Envelope>`;

        const authResponse = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/xml;charset=UTF-8', 'SOAPAction': '' },
            body: authSoap
        });

        console.log('\n=== RAW AUTORIZACIÓN RESPONSE ===');
        console.log((await authResponse.text()).replace(/></g, '>\n<'));

        await db.close();

    } catch (error: any) {
        console.error('Error:', error.message);
        await db.close();
    }
}

main();
