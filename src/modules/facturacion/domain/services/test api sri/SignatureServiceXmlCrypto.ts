import forge from 'node-forge';
import * as xmlCrypto from 'xml-crypto';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

/**
 * Implementación de firma XAdES-BES usando xml-crypto directamente
 * Esta versión usa el framework de xml-crypto para la firma completa
 */

// Callback para proporcionar la llave privada
class KeyInfoProvider implements xmlCrypto.KeyInfoProvider {
  private certPem: string;
  
  constructor(certPem: string) {
    this.certPem = certPem;
  }
  
  getKeyInfo(): string {
    const certBody = this.certPem
      .replace('-----BEGIN CERTIFICATE-----', '')
      .replace('-----END CERTIFICATE-----', '')
      .replace(/\r\n|\n|\r/g, '');
    return `<ds:X509Data><ds:X509Certificate>${certBody}</ds:X509Certificate></ds:X509Data>`;
  }
  
  getKey(): Buffer | null {
    return null;
  }
}

export class SignatureServiceXmlCrypto {
  
  static async signXml(xml: string, config: { p12Base64: string, passwordP12: string }): Promise<string> {
    try {
      // 1. Decodificar p12
      const p12Der = forge.util.decode64(config.p12Base64);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, config.passwordP12);

      // 2. Obtener llave privada y certificado
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      let keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
      if (!keyBag) {
        const simpleKeyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
        keyBag = simpleKeyBags[forge.pki.oids.keyBag]?.[0];
      }
      if (!keyBag) throw new Error('No se encontró llave privada');
      const privateKey = keyBag.key as forge.pki.rsa.PrivateKey;
      const privateKeyPem = forge.pki.privateKeyToPem(privateKey);

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag]?.[0];
      if (!certBag?.cert) throw new Error('No se encontró certificado');
      const certificate = certBag.cert;
      const certPem = forge.pki.certificateToPem(certificate);
      
      const certBody = certPem
        .replace('-----BEGIN CERTIFICATE-----', '')
        .replace('-----END CERTIFICATE-----', '')
        .replace(/\r\n|\n|\r/g, '');

      // IDs únicos
      const signatureId = `Signature-${Math.random().toString().slice(2, 8)}`;
      const signedInfoId = `SignedInfo-${Math.random().toString().slice(2, 8)}`;
      const signedPropertiesId = `SignedProperties-${Math.random().toString().slice(2, 8)}`;
      const referenceId = `Reference-${Math.random().toString().slice(2, 8)}`;
      const certificateId = `Certificate-${Math.random().toString().slice(2, 8)}`;
      const objectId = `Object-${Math.random().toString().slice(2, 8)}`;

      // Datos del certificado para XAdES
      const certMd = forge.md.sha1.create();
      certMd.update(forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes(), 'raw');
      const certDigestBase64 = forge.util.encode64(certMd.digest().getBytes());
      const issuerName = certificate.issuer.attributes.map(attr => `${attr.shortName}=${attr.value}`).join(',');
      const serialNumber = BigInt('0x' + certificate.serialNumber).toString(10);
      const signingTime = new Date().toISOString();

      // 3. Usar xml-crypto para firmar
      const sig = new xmlCrypto.SignedXml({
        privateKey: privateKeyPem
      });
      
      // Configurar la referencia al documento - xpath que apunta al elemento con id
      sig.addReference({
        xpath: "//*[@id='comprobante']",
        transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature'],
        digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1'
      });
      
      // Configurar algoritmo de canonicalización y firma
      sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
      sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
      
      // Configurar KeyInfo
      sig.keyInfoProvider = new KeyInfoProvider(certPem);

      // Parsear documento
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      
      // Calcular firma - usar xpath simple
      sig.computeSignature(xml, {
        prefix: 'ds',
        location: { reference: "/*", action: 'append' }
      });
      
      // Obtener firma generada
      let signedXml = sig.getSignedXml();
      
      // Ahora necesitamos modificar la firma para agregar XAdES
      // El bloque Object con QualifyingProperties
      const signedPropertiesContent = 
        `<etsi:SignedSignatureProperties>` +
        `<etsi:SigningTime>${signingTime}</etsi:SigningTime>` +
        `<etsi:SigningCertificate>` +
        `<etsi:Cert>` +
        `<etsi:CertDigest>` +
        `<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>` +
        `<ds:DigestValue>${certDigestBase64}</ds:DigestValue>` +
        `</etsi:CertDigest>` +
        `<etsi:IssuerSerial>` +
        `<ds:X509IssuerName>${issuerName}</ds:X509IssuerName>` +
        `<ds:X509SerialNumber>${serialNumber}</ds:X509SerialNumber>` +
        `</etsi:IssuerSerial>` +
        `</etsi:Cert>` +
        `</etsi:SigningCertificate>` +
        `</etsi:SignedSignatureProperties>` +
        `<etsi:SignedDataObjectProperties>` +
        `<etsi:DataObjectFormat ObjectReference="#${referenceId}">` +
        `<etsi:Description>contenido comprobante</etsi:Description>` +
        `<etsi:MimeType>text/xml</etsi:MimeType>` +
        `</etsi:DataObjectFormat>` +
        `</etsi:SignedDataObjectProperties>`;

      const objectBlock = 
        `<ds:Object xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="${objectId}">` +
        `<etsi:QualifyingProperties Target="#${signatureId}">` +
        `<etsi:SignedProperties Id="${signedPropertiesId}">` +
        signedPropertiesContent +
        `</etsi:SignedProperties>` +
        `</etsi:QualifyingProperties>` +
        `</ds:Object>`;

      // Insertar el Object antes del cierre de ds:Signature
      signedXml = signedXml.replace('</ds:Signature>', `${objectBlock}</ds:Signature>`);
      
      // Agregar namespace etsi a la firma
      signedXml = signedXml.replace(
        '<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#"',
        `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="${signatureId}"`
      );

      return signedXml;
      
    } catch (error: any) {
      console.error('Error en firma:', error);
      throw new Error(`Fallo en firma: ${error.message}`);
    }
  }
}
