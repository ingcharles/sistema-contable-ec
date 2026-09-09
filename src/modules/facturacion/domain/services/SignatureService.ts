import forge from 'node-forge';
import * as xmlCrypto from 'xml-crypto';
import { DOMParser } from '@xmldom/xmldom';

/**
 * Servicio para la firma electrónica de documentos XML (XAdES-BES)
 * Utiliza node-forge para criptografía y xml-crypto para canonicalización C14N
 * Compatible con SRI Ecuador
 */
export class SignatureService {
  /**
   * Firma un documento XML siguiendo el estándar XAdES-BES v1.3.2
   * @param xml XML en crudo sin firmar
   * @param config Configuración que contiene el certificado (.p12 en base64) y password
   */
  static async signXml(xml: string, config: { p12Base64: string, passwordP12: string }): Promise<string> {
    if (!config.p12Base64 || !config.passwordP12) {
      throw new Error('Certificado o contraseña no encontrados para la firma.');
    }

    try {
      // 1. Decodificar p12 y extraer llave privada y certificado
      const p12Der = forge.util.decode64(config.p12Base64);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, config.passwordP12);

      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      let keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
      if (!keyBag) {
        const simpleKeyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
        keyBag = simpleKeyBags[forge.pki.oids.keyBag]?.[0];
      }
      if (!keyBag) throw new Error('No se encontró llave privada');
      const privateKey = keyBag.key as forge.pki.rsa.PrivateKey;

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag]?.[0];
      if (!certBag?.cert) throw new Error('No se encontró certificado');
      const certificate = certBag.cert;

      // Certificado en base64 limpio
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
      const keyInfoId = `KeyInfo-${this.generateRandomId()}`;

      // Datos del certificado
      const certMd = forge.md.sha1.create();
      certMd.update(forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes(), 'raw');
      const certDigest = forge.util.encode64(certMd.digest().getBytes());
      
      const issuerName = certificate.issuer.attributes
        .map(attr => `${attr.shortName}=${attr.value}`)
        .join(',');
      const serialNumber = BigInt('0x' + certificate.serialNumber).toString(10);
      const signingTime = new Date().toISOString();

      // 2. Parsear XML y calcular digest usando C14N real
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const rootElement = doc.documentElement;
      
      // Usar xml-crypto para canonicalización C14N
      const c14n = new xmlCrypto.C14nCanonicalization();
      const canonicalizedDoc = c14n.process(rootElement, {}).toString();
      
      // Calcular digest SHA1 del documento canonicalizado
      const docMd = forge.md.sha1.create();
      docMd.update(canonicalizedDoc, 'utf8');
      const docDigest = forge.util.encode64(docMd.digest().getBytes());

      // 3. Construir SignedProperties (XAdES)
      const signedPropertiesInner = 
        `<etsi:SignedSignatureProperties>` +
        `<etsi:SigningTime>${signingTime}</etsi:SigningTime>` +
        `<etsi:SigningCertificate>` +
        `<etsi:Cert>` +
        `<etsi:CertDigest>` +
        `<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>` +
        `<ds:DigestValue>${certDigest}</ds:DigestValue>` +
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

      // SignedProperties con namespaces para C14N independiente
      const signedPropertiesForHash = 
        `<etsi:SignedProperties xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="${signedPropertiesId}">` +
        signedPropertiesInner +
        `</etsi:SignedProperties>`;

      // Canonicalizar SignedProperties
      const spDoc = new DOMParser().parseFromString(signedPropertiesForHash, 'text/xml');
      const canonicalizedSp = c14n.process(spDoc.documentElement, {}).toString();
      
      const spMd = forge.md.sha1.create();
      spMd.update(canonicalizedSp, 'utf8');
      const spDigest = forge.util.encode64(spMd.digest().getBytes());

      // 4. Construir SignedInfo
      const signedInfoInner = 
        `<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>` +
        `<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>` +
        `<ds:Reference Id="${referenceId}" URI="#comprobante">` +
        `<ds:Transforms>` +
        `<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>` +
        `</ds:Transforms>` +
        `<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>` +
        `<ds:DigestValue>${docDigest}</ds:DigestValue>` +
        `</ds:Reference>` +
        `<ds:Reference Type="http://uri.etsi.org/01903#SignedProperties" URI="#${signedPropertiesId}">` +
        `<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>` +
        `<ds:DigestValue>${spDigest}</ds:DigestValue>` +
        `</ds:Reference>`;

      // SignedInfo con namespaces para C14N
      const signedInfoForSigning = 
        `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="${signedInfoId}">` +
        signedInfoInner +
        `</ds:SignedInfo>`;

      // Canonicalizar SignedInfo
      const siDoc = new DOMParser().parseFromString(signedInfoForSigning, 'text/xml');
      const canonicalizedSi = c14n.process(siDoc.documentElement, {}).toString();

      // 5. Firmar SignedInfo canonicalizado
      const siMd = forge.md.sha1.create();
      siMd.update(canonicalizedSi, 'utf8');
      const signature = privateKey.sign(siMd);
      const signatureValue = forge.util.encode64(signature).replace(/[\r\n]/g, '');

      // 6. Construir bloque de firma completo
      const signatureBlock = 
        `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="${signatureId}">` +
        `<ds:SignedInfo Id="${signedInfoId}">` +
        signedInfoInner +
        `</ds:SignedInfo>` +
        `<ds:SignatureValue Id="SignatureValue-${signatureId}">${signatureValue}</ds:SignatureValue>` +
        `<ds:KeyInfo Id="${keyInfoId}">` +
        `<ds:X509Data>` +
        `<ds:X509Certificate>${certBody}</ds:X509Certificate>` +
        `</ds:X509Data>` +
        `<ds:KeyValue>` +
        `<ds:RSAKeyValue>` +
        `<ds:Modulus>${this.getModulusBase64(certificate)}</ds:Modulus>` +
        `<ds:Exponent>AQAB</ds:Exponent>` +
        `</ds:RSAKeyValue>` +
        `</ds:KeyValue>` +
        `</ds:KeyInfo>` +
        `<ds:Object Id="${objectId}">` +
        `<etsi:QualifyingProperties Target="#${signatureId}">` +
        `<etsi:SignedProperties Id="${signedPropertiesId}">` +
        signedPropertiesInner +
        `</etsi:SignedProperties>` +
        `</etsi:QualifyingProperties>` +
        `</ds:Object>` +
        `</ds:Signature>`;

      // 7. Insertar firma antes del cierre del nodo raíz
      const closingTagMatch = xml.match(/<\/[a-zA-Z0-9_]+>\s*$/);
      if (!closingTagMatch) throw new Error('XML malformado');
      
      const closingTag = closingTagMatch[0].trim();
      const lastIndex = xml.lastIndexOf(closingTag);
      
      return xml.substring(0, lastIndex) + signatureBlock + closingTag;

    } catch (error: any) {
      console.error('Error en firma electrónica:', error);
      throw new Error(`Fallo en proceso de firma: ${error.message}`);
    }
  }

  private static generateRandomId(): string {
    return Math.floor(Math.random() * 1000000).toString();
  }

  private static getModulusBase64(cert: forge.pki.Certificate): string {
    const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;
    const nHex = (publicKey as any).n.toString(16);
    const nBytes = forge.util.hexToBytes(nHex.length % 2 === 0 ? nHex : '0' + nHex);
    return forge.util.encode64(nBytes);
  }
}
