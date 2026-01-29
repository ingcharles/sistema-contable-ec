/**
 * Script de test completo para firma y envío al SRI
 * Ejecutar con: npx tsx src/scripts/test_firma_sri_completo.ts
 */

import * as xmlCrypto from 'xml-crypto';
import forge from 'node-forge';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { SriWebService } from '../../modules/facturacion/domain/services/SriWebService';
import { SriEnvironment } from '../../shared/sri-constants';
import { db } from '../../shared/infrastructure/database/postgresql';
import { SignatureService } from '../../modules/facturacion/domain/services/test api sri/SignatureServiceFixed';
import fs from 'fs';

// Generador de clave de acceso
function generarClaveAcceso(data: any): string {
    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    
    const fechaEmision = `${dia}${mes}${anio}`;
    const tipoComprobante = data.codDoc;
    const ruc = data.ruc;
    const ambiente = data.ambiente;
    const serie = data.estab + data.ptoEmi;
    const secuencial = data.secuencial;
    const codigoNumerico = '12345678';
    const tipoEmision = data.tipoEmision;
    
    const claveBase = `${fechaEmision}${tipoComprobante}${ruc}${ambiente}${serie}${secuencial}${codigoNumerico}${tipoEmision}`;
    
    // Calcular dígito verificador módulo 11
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
    console.log('=== TEST FIRMA COMPLETO CON SRI ===\n');

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
    console.log('Secuencial:', secuencial);

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
                text: `
                    SELECT sc.cert_p12_certificado, sc.cert_clave_certificado
                    FROM configuracion.sri_certificados sc
                    WHERE sc.empresa_id = $1 AND sc.activo = true
                    LIMIT 1
                `,
                values: [empresa_id]
            },
            { empresaId: empresa_id, usuarioId: empresa_id }
        );

        if (certResult.rows.length === 0) {
            throw new Error('No se encontró certificado activo');
        }

        const config = certResult.rows[0];
        const archivo_p12 = config.cert_p12_certificado?.toString('base64');
        const password_p12 = config.cert_clave_certificado;
        console.log('   ✓ Certificado obtenido');

        // 2. Extraer clave privada y certificado
        console.log('\n2. Extrayendo clave privada y certificado...');
        const p12Der = forge.util.decode64(archivo_p12);
        const p12Asn1 = forge.asn1.fromDer(p12Der);
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password_p12);

        const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
        if (!keyBag) throw new Error('No se encontró llave privada');
        const privateKey = keyBag.key;
        const privateKeyPem = forge.pki.privateKeyToPem(privateKey);

        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
        const certBag = certBags[forge.pki.oids.certBag]?.[0];
        if (!certBag?.cert) throw new Error('No se encontró certificado');
        const certificate = certBag.cert;
        const certPem = forge.pki.certificateToPem(certificate);
        const certBody = certPem.replace('-----BEGIN CERTIFICATE-----', '').replace('-----END CERTIFICATE-----', '').replace(/\r\n|\n|\r/g, '');
        
        console.log('   ✓ Clave privada y certificado extraídos');

        // 3. Crear firma XAdES-BES con xml-crypto
        console.log('\n3. Firmando XML con xml-crypto (XAdES-BES)...');
        
        // IDs únicos
        const signatureId = 'Signature-' + Math.floor(Math.random() * 1000000);
        const signedPropertiesId = 'SignedProperties-' + Math.floor(Math.random() * 1000000);
        const referenceId = 'Reference-' + Math.floor(Math.random() * 1000000);
        const objectId = 'Object-' + Math.floor(Math.random() * 1000000);
        const certificateId = 'Certificate-' + Math.floor(Math.random() * 1000000);

        // Datos XAdES
        const certMd = forge.md.sha1.create();
        certMd.update(forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes(), 'raw');
        const certDigestBase64 = forge.util.encode64(certMd.digest().getBytes());
        const issuerName = certificate.issuer.attributes.map((attr: any) => `${attr.shortName}=${attr.value}`).join(',');
        const serialNumber = BigInt('0x' + certificate.serialNumber).toString(10);
        const signingTime = new Date().toISOString();

        // Crear SignedProperties XML para el hash
        const signedPropertiesContent = `<etsi:SignedSignatureProperties><etsi:SigningTime>${signingTime}</etsi:SigningTime><etsi:SigningCertificate><etsi:Cert><etsi:CertDigest><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><ds:DigestValue>${certDigestBase64}</ds:DigestValue></etsi:CertDigest><etsi:IssuerSerial><ds:X509IssuerName>${issuerName}</ds:X509IssuerName><ds:X509SerialNumber>${serialNumber}</ds:X509SerialNumber></etsi:IssuerSerial></etsi:Cert></etsi:SigningCertificate></etsi:SignedSignatureProperties><etsi:SignedDataObjectProperties><etsi:DataObjectFormat ObjectReference="#${referenceId}"><etsi:Description>contenido comprobante</etsi:Description><etsi:MimeType>text/xml</etsi:MimeType></etsi:DataObjectFormat></etsi:SignedDataObjectProperties>`;

        // Para calcular el digest de SignedProperties necesitamos la versión con namespaces explícitos
        const signedPropertiesForHash = `<etsi:SignedProperties xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="${signedPropertiesId}">${signedPropertiesContent}</etsi:SignedProperties>`;
        
        // Calcular hash de SignedProperties
        const spMd = forge.md.sha1.create();
        spMd.update(signedPropertiesForHash, 'utf8');
        const spDigestBase64 = forge.util.encode64(spMd.digest().getBytes());

        // Usar xml-crypto para la firma del documento
        const sig = new xmlCrypto.SignedXml({ privateKey: privateKeyPem });

        sig.addReference({
            xpath: "//*[@id='comprobante']",
            transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature'],
            digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
            uri: '#comprobante',
            isEmptyUri: false
        });

        sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
        sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';

        sig.getKeyInfoContent = function() {
            return `<ds:X509Data><ds:X509Certificate>${certBody}</ds:X509Certificate></ds:X509Data>`;
        };

        // Computar firma
        sig.computeSignature(xml, {
            location: { reference: "//*[local-name()='comprobanteRetencion']", action: 'append' },
            prefix: 'ds',
            attrs: { 
                'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
                'xmlns:etsi': 'http://uri.etsi.org/01903/v1.3.2#',
                'Id': signatureId
            }
        });

        let signedXml = sig.getSignedXml();

        // Ahora inyectar el Object con QualifyingProperties antes del cierre de </ds:Signature>
        const objectXml = `<ds:Object Id="${objectId}"><etsi:QualifyingProperties Target="#${signatureId}"><etsi:SignedProperties Id="${signedPropertiesId}">${signedPropertiesContent}</etsi:SignedProperties></etsi:QualifyingProperties></ds:Object>`;

        signedXml = signedXml.replace('</ds:Signature>', objectXml + '</ds:Signature>');

        console.log('   ✓ XML firmado con XAdES-BES');

        // Guardar XML firmado
        fs.writeFileSync('test_firma_xades.xml', signedXml);
        console.log('   ✓ Guardado en: test_firma_xades.xml');

        // 4. Enviar al SRI
        console.log('\n4. Enviando XML FIRMADO al SRI...');
        const recepcionResult = await SriWebService.enviarComprobante(signedXml, SriEnvironment.PRUEBAS);
        
        console.log('\n=== RESPUESTA SRI (RECEPCIÓN) ===');
        console.log(JSON.stringify(recepcionResult, null, 2));

        if (recepcionResult.estado === 'RECIBIDA' || 
            (recepcionResult.estado === 'DEVUELTA' && recepcionResult.mensajes?.some((m: any) => m.identificador === '70'))) {
            console.log('\n✓ Comprobante RECIBIDO o EN PROCESAMIENTO');
            
            // 5. Consultar autorización
            console.log('\n5. Consultando autorización (espera 5 segundos)...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const autorizacionResult = await SriWebService.autorizarComprobante(claveAcceso, SriEnvironment.PRUEBAS);
            console.log('\n=== RESPUESTA SRI (AUTORIZACIÓN) ===');
            console.log(JSON.stringify(autorizacionResult, null, 2));

            if (autorizacionResult.estado === 'AUTORIZADO') {
                console.log('\n🎉 ¡¡COMPROBANTE AUTORIZADO!!');
            } else {
                console.log('\n✗ Comprobante NO AUTORIZADO');
            }
        } else {
            console.log('\n✗ Comprobante RECHAZADO');
        }

        await db.close();

    } catch (error: any) {
        console.error('\n✗ Error:', error.message);
        console.error(error.stack);
        await db.close();
    }
}

main();
