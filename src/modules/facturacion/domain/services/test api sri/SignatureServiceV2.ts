import forge from 'node-forge';
import * as xmlCrypto from 'xml-crypto';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

/**
 * Servicio para la firma electrónica de documentos XML (XAdES-BES)
 * Utiliza xml-crypto para canonicalización C14N correcta y firma RSA-SHA1
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
      // 1. Decodificar p12 y obtener clave privada + certificado
      const p12Der = forge.util.decode64(config.p12Base64);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, config.passwordP12);

      // Obtener llave privada
      let keyData: any = null;
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];

      if (keyBag) {
        keyData = keyBag;
      } else {
        const simpleKeyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
        keyData = simpleKeyBags[forge.pki.oids.keyBag]?.[0];
      }

      if (!keyData) throw new Error('No se encontró llave privada en el archivo P12');
      const privateKey = keyData.key;

      // Obtener certificado
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag]?.[0];
      if (!certBag || !certBag.cert) throw new Error('No se encontró certificado en el archivo P12');
      const certificate = certBag.cert;

      // Convertir a PEM para xml-crypto
      const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
      const certPem = forge.pki.certificateToPem(certificate);
      const certBody = certPem
        .replace('-----BEGIN CERTIFICATE-----', '')
        .replace('-----END CERTIFICATE-----', '')
        .replace(/\r\n|\n|\r/g, '');

      // Generar IDs únicos
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
      const serialNumberHex = certificate.serialNumber;
      const serialNumber = BigInt('0x' + serialNumberHex).toString(10);
      const signingTime = new Date().toISOString();

      // Crear el firmador xml-crypto
      const sig = new xmlCrypto.SignedXml({
        privateKey: privateKeyPem,
        canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
        signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
      });

      // Configurar las referencias
      sig.addReference({
        xpath: "//*[local-name()='comprobanteRetencion' or local-name()='factura' or local-name()='notaCredito' or local-name()='notaDebito' or local-name()='guiaRemision' or local-name()='liquidacionCompra']",
        transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature'],
        digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
        uri: '#comprobante',
        isEmptyUri: false
      });

      // Referencia a SignedProperties
      sig.addReference({
        xpath: `//*[@Id='${signedPropertiesId}']`,
        transforms: ['http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
        digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
        uri: `#${signedPropertiesId}`,
        isEmptyUri: false
      });

      // Definir cómo se obtiene la información del certificado
      sig.getKeyInfo = () => {
        return `<ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="${certificateId}">
        <ds:X509Data>
            <ds:X509Certificate>${certBody}</ds:X509Certificate>
        </ds:X509Data>
    </ds:KeyInfo>`;
      };

      // Crear el bloque XAdES SignedProperties
      const signedPropertiesXml = `<etsi:SignedProperties xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="${signedPropertiesId}">` +
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
        `</etsi:SignedDataObjectProperties>` +
        `</etsi:SignedProperties>`;

      // Parsear el XML original
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      
      // Agregar el Object con SignedProperties al documento temporalmente para que xml-crypto pueda encontrarlo
      const objectElement = doc.createElement('ds:Object');
      objectElement.setAttribute('xmlns:ds', 'http://www.w3.org/2000/09/xmldsig#');
      objectElement.setAttribute('Id', objectId);
      
      const qualifyingPropsElement = doc.createElement('etsi:QualifyingProperties');
      qualifyingPropsElement.setAttribute('xmlns:etsi', 'http://uri.etsi.org/01903/v1.3.2#');
      qualifyingPropsElement.setAttribute('Target', `#${signatureId}`);
      
      // Parsear SignedProperties y agregarlo
      const spDoc = new DOMParser().parseFromString(signedPropertiesXml, 'text/xml');
      const spElement = spDoc.documentElement;
      qualifyingPropsElement.appendChild(doc.importNode(spElement, true));
      objectElement.appendChild(qualifyingPropsElement);

      // Computar la firma usando xml-crypto
      sig.computeSignature(xml, {
        location: { reference: "//*[local-name()='comprobanteRetencion' or local-name()='factura' or local-name()='notaCredito' or local-name()='notaDebito' or local-name()='guiaRemision' or local-name()='liquidacionCompra']", action: 'append' },
        prefix: 'ds',
        attrs: { Id: signatureId }
      });

      // Obtener la firma generada
      let signedXml = sig.getSignedXml();

      // Ahora necesitamos insertar el Object con QualifyingProperties dentro del Signature
      const signedDoc = new DOMParser().parseFromString(signedXml, 'text/xml');
      const signatureElement = signedDoc.getElementsByTagNameNS('http://www.w3.org/2000/09/xmldsig#', 'Signature')[0];
      
      if (signatureElement) {
        // Agregar namespace etsi
        signatureElement.setAttribute('xmlns:etsi', 'http://uri.etsi.org/01903/v1.3.2#');
        
        // Crear y agregar el Object con QualifyingProperties
        const newObjectElement = signedDoc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:Object');
        newObjectElement.setAttribute('Id', objectId);
        
        const newQualifyingProps = signedDoc.createElementNS('http://uri.etsi.org/01903/v1.3.2#', 'etsi:QualifyingProperties');
        newQualifyingProps.setAttribute('Target', `#${signatureId}`);
        
        // Parsear y agregar SignedProperties sin los namespaces redundantes
        const cleanSignedPropertiesXml = `<etsi:SignedProperties Id="${signedPropertiesId}">` +
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
          `</etsi:SignedDataObjectProperties>` +
          `</etsi:SignedProperties>`;
        
        const tempDoc = new DOMParser().parseFromString(`<root xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${cleanSignedPropertiesXml}</root>`, 'text/xml');
        const importedSignedProps = signedDoc.importNode(tempDoc.documentElement.firstChild!, true);
        newQualifyingProps.appendChild(importedSignedProps);
        newObjectElement.appendChild(newQualifyingProps);
        signatureElement.appendChild(newObjectElement);
      }

      const serializer = new XMLSerializer();
      return serializer.serializeToString(signedDoc);

    } catch (error: any) {
      console.error('Error en firma electrónica:', error);
      throw new Error(`Fallo en proceso de firma: ${error.message}`);
    }
  }

  private static generateRandomId(): string {
    return Math.floor(Math.random() * 1000000).toString();
  }

  private static getIssuerString(cert: forge.pki.Certificate): string {
    // Formato RFC 2253 reverso para SRI: C=EC,O=...,OU=...,CN=...
    return cert.issuer.attributes.map(attr => {
      return `${attr.shortName}=${attr.value}`;
    }).join(',');
  }
}
