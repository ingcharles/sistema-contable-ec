import forge from 'node-forge';
import * as xmlCrypto from 'xml-crypto';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import * as xpath from 'xpath';

/**
 * Servicio para la firma electrónica de documentos XML (XAdES-BES)
 * Usando xml-crypto para canonicalización C14N correcta
 */
export class SignatureService {
  /**
   * Firma un documento XML siguiendo el estándar XAdES-BES v1.3.2
   */
  static async signXml(xml: string, config: { p12Base64: string, passwordP12: string }): Promise<string> {
    if (!config.p12Base64 || !config.passwordP12) {
      throw new Error('Certificado o contraseña no encontrados para la firma.');
    }

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
      if (!keyBag) throw new Error('No se encontró llave privada en el archivo P12');
      const privateKey = keyBag.key as forge.pki.rsa.PrivateKey;
      const privateKeyPem = forge.pki.privateKeyToPem(privateKey);

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag]?.[0];
      if (!certBag?.cert) throw new Error('No se encontró certificado en el archivo P12');
      const certificate = certBag.cert;

      const certPem = forge.pki.certificateToPem(certificate);
      const certBody = certPem
        .replace('-----BEGIN CERTIFICATE-----', '')
        .replace('-----END CERTIFICATE-----', '')
        .replace(/\r\n|\n|\r/g, '');

      // IDs únicos
      const signatureId = `Signature-${this.generateRandomId()}`;
      const signedInfoId = `SignedInfo-${this.generateRandomId()}`;
      const signedPropertiesId = `SignedProperties-${this.generateRandomId()}`;
      const objectId = `Object-${this.generateRandomId()}`;
      const referenceId = `Reference-${this.generateRandomId()}`;
      const certificateId = `Certificate-${this.generateRandomId()}`;

      // Datos del certificado para XAdES
      const certMd = forge.md.sha1.create();
      certMd.update(forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes(), 'raw');
      const certDigestBase64 = forge.util.encode64(certMd.digest().getBytes());
      const issuerName = this.getIssuerString(certificate);
      const serialNumber = BigInt('0x' + certificate.serialNumber).toString(10);
      const signingTime = new Date().toISOString();

      // 3. Calcular digest del documento usando canonicalización C14N
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const rootElement = doc.documentElement;
      
      // Usar xml-crypto para canonicalizar
      const c14n = new xmlCrypto.C14nCanonicalization();
      const canonicalizedXml = c14n.process(rootElement, { defaultNsForPrefix: {} }).toString();
      
      // Calcular digest SHA1
      const xmlMd = forge.md.sha1.create();
      xmlMd.update(canonicalizedXml, 'utf8');
      const xmlDigestBase64 = forge.util.encode64(xmlMd.digest().getBytes());

      // 4. Construir SignedProperties
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

      // SignedProperties para calcular digest (con namespaces explícitos para C14N)
      const signedPropertiesXml = 
        `<etsi:SignedProperties xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="${signedPropertiesId}">` +
        signedPropertiesContent +
        `</etsi:SignedProperties>`;

      // Canonicalizar SignedProperties
      const spDoc = new DOMParser().parseFromString(signedPropertiesXml, 'text/xml');
      const canonicalizedSp = c14n.process(spDoc.documentElement, { defaultNsForPrefix: {} }).toString();
      
      const spMd = forge.md.sha1.create();
      spMd.update(canonicalizedSp, 'utf8');
      const spDigestBase64 = forge.util.encode64(spMd.digest().getBytes());

      // 5. Construir SignedInfo
      const signedInfoContent = 
        `<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>` +
        `<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>` +
        `<ds:Reference Id="${referenceId}" URI="#comprobante">` +
        `<ds:Transforms>` +
        `<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>` +
        `</ds:Transforms>` +
        `<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>` +
        `<ds:DigestValue>${xmlDigestBase64}</ds:DigestValue>` +
        `</ds:Reference>` +
        `<ds:Reference Type="http://uri.etsi.org/01903#SignedProperties" URI="#${signedPropertiesId}">` +
        `<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>` +
        `<ds:DigestValue>${spDigestBase64}</ds:DigestValue>` +
        `</ds:Reference>`;

      // SignedInfo para firmar (con namespaces para C14N)
      const signedInfoXml = 
        `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="${signedInfoId}">` +
        signedInfoContent +
        `</ds:SignedInfo>`;

      // Canonicalizar SignedInfo antes de firmar
      const siDoc = new DOMParser().parseFromString(signedInfoXml, 'text/xml');
      const canonicalizedSi = c14n.process(siDoc.documentElement, { defaultNsForPrefix: {} }).toString();

      // 6. Firmar SignedInfo
      const siMd = forge.md.sha1.create();
      siMd.update(canonicalizedSi, 'utf8');
      const signature = privateKey.sign(siMd);
      const signatureValueBase64 = forge.util.encode64(signature).replace(/[\r\n]/g, '');

      // 7. Construir bloque de firma completo
      const signatureBlock = 
        `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="${signatureId}">` +
        `<ds:SignedInfo Id="${signedInfoId}">` +
        signedInfoContent +
        `</ds:SignedInfo>` +
        `<ds:SignatureValue Id="SignatureValue-${signatureId}">${signatureValueBase64}</ds:SignatureValue>` +
        `<ds:KeyInfo Id="${certificateId}">` +
        `<ds:X509Data>` +
        `<ds:X509Certificate>${certBody}</ds:X509Certificate>` +
        `</ds:X509Data>` +
        `</ds:KeyInfo>` +
        `<ds:Object Id="${objectId}">` +
        `<etsi:QualifyingProperties Target="#${signatureId}">` +
        `<etsi:SignedProperties Id="${signedPropertiesId}">` +
        signedPropertiesContent +
        `</etsi:SignedProperties>` +
        `</etsi:QualifyingProperties>` +
        `</ds:Object>` +
        `</ds:Signature>`;

      // 8. Insertar firma antes del cierre del nodo raíz
      const xmlNormalized = xml.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const closingTagMatch = xmlNormalized.match(/<\/[a-zA-Z0-9_]+>\s*$/);
      if (!closingTagMatch) throw new Error('XML malformado');
      
      const closingTag = closingTagMatch[0].trim();
      const lastIndex = xmlNormalized.lastIndexOf(closingTag);
      
      return xmlNormalized.substring(0, lastIndex) + signatureBlock + closingTag;

    } catch (error: any) {
      console.error('Error en firma electrónica:', error);
      throw new Error(`Fallo en proceso de firma: ${error.message}`);
    }
  }

  private static generateRandomId(): string {
    return Math.floor(Math.random() * 1000000).toString();
  }

  private static getIssuerString(cert: forge.pki.Certificate): string {
    return cert.issuer.attributes.map(attr => `${attr.shortName}=${attr.value}`).join(',');
  }
}
