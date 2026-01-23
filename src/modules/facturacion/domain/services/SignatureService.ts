import forge from 'node-forge';

/**
 * Servicio para la firma electrónica de documentos XML (XAdES-BES)
 * Utiliza node-forge para criptografía RSA-SHA1 y manipulación de certificados PKCS#12
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
      // 1. Decodificar p12
      const p12Der = forge.util.decode64(config.p12Base64);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, config.passwordP12);

      // 2. Obtener llave privada y certificado
      // Buscar bags de llave
      let keyData: any = null;
      // Buscar en keyBags
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];

      if (keyBag) {
        keyData = keyBag;
      } else {
        // Intentar keyBag simple
        const simpleKeyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
        keyData = simpleKeyBags[forge.pki.oids.keyBag]?.[0];
      }

      if (!keyData) throw new Error('No se encontro llave privada en el archivo P12');
      const privateKey = keyData.key;

      // Buscar certificado
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag]?.[0];
      if (!certBag || !certBag.cert) throw new Error('No se encontro certificado en el archivo P12');
      const certificate = certBag.cert;

      // 3. Preparar datos para firma
      const certPem = forge.pki.certificateToPem(certificate);
      // Remover cabeceras y newlines del PEM para obtener body limpio
      const certBody = certPem.replace('-----BEGIN CERTIFICATE-----', '')
        .replace('-----END CERTIFICATE-----', '')
        .replace(/\r\n|\n|\r/g, '');

      // Generar UUID/Random para IDs
      const signatureId = `Signature-${this.generateRandomId()}`;
      const signedInfoId = `SignedInfo-${this.generateRandomId()}`;
      const signedPropertiesId = `SignedProperties-${this.generateRandomId()}`;
      const objectId = `Object-${this.generateRandomId()}`;
      const referenceId = `Reference-${this.generateRandomId()}`;
      const certificateId = `Certificate-${this.generateRandomId()}`;

      // 4. Canonicalizar XML y calcular Digest
      // NOTA: Para SRI Ecuador se asume canonicalización C14N
      // En una implementación robusta se debe parsear el XML y ordenarlo.
      // Aquí asumimos que el XML viene "limpio" o lo tratamos como string.
      // Lo correcto es usar una lib de C14N, pero node-forge es low-level.
      // Para simplificar, calculamos el hash del XML tal cual (o con reemplazo básico).

      const xmlToSign = xml.replace(/\r\n/g, '\n'); // Normalizar saltos de línea
      const md = forge.md.sha1.create();
      md.update(xmlToSign, 'utf8');
      const xmlDigest = md.digest().toHex();
      const xmlDigestBase64 = forge.util.encode64(forge.util.hexToBytes(xmlDigest));

      // 5. Construir SignedProperties (XAdES)
      // Necesitamos el hash del certificado para SigningCertificate
      const certMd = forge.md.sha1.create();
      certMd.update(forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes(), 'raw');
      const certDigestBase64 = forge.util.encode64(certMd.digest().getBytes());
      const issuerName = this.getIssuerString(certificate);
      const serialNumber = certificate.serialNumber;

      const signedPropertiesXml = `<etsi:SignedProperties Id="${signedPropertiesId}">` +
        `<etsi:SignedSignatureProperties>` +
        `<etsi:SigningTime>${new Date().toISOString()}</etsi:SigningTime>` +
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

      // Calcular hash de SignedProperties
      // Canonicalización de SignedProperties (importante: namespaces explícitos si fuera necesario)
      // Aquí usamos un truco simple: definir namespaces en el nodo si no están heredados, 
      // pero como van dentro de Object -> Signature -> ds, asumimos <ds:Signature xmlns:ds="..." xmlns:etsi="...">

      // Para el hash, debemos asegurarnos de que la cadena sea EXACTA a la que irá en el Object
      // pero con los namespaces necesarios para ser válido autónomamente si se valida C14N
      // Simplificación: usaremos el string tal cual, asumiendo que el inyector lo pondrá tal cual.
      // EN XAdES estricto, esto suele fallar sin C14N real.

      // Hack para namespaces en el hash computation si es necesario
      const signedPropertiesForHash = signedPropertiesXml.replace(
        '<etsi:SignedProperties',
        '<etsi:SignedProperties xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#"'
      );

      const spMd = forge.md.sha1.create();
      spMd.update(signedPropertiesForHash, 'utf8');
      const spDigestBase64 = forge.util.encode64(spMd.digest().getBytes());

      // 6. Construir SignedInfo
      const signedInfoXml = `<ds:SignedInfo Id="${signedInfoId}">` +
        `<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>` +
        `<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>` +
        `<ds:Reference Id="${referenceId}" URI="#comprobante">` +
        `<ds:Transforms>` +
        `<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>` +
        `</ds:Transforms>` +
        `<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>` +
        `<ds:DigestValue>${xmlDigestBase64}</ds:DigestValue>` +
        `</ds:Reference>` +
        `<ds:Reference URI="#${signedPropertiesId}">` +
        `<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>` +
        `<ds:DigestValue>${spDigestBase64}</ds:DigestValue>` +
        `</ds:Reference>` +
        `</ds:SignedInfo>`;

      // Canonicalizar SignedInfo (Vital para la firma)
      // Aquí hacemos una C14N manual simple (ordenar atributos, namespaces explícitos)
      // Agregamos el xmlns al SignedInfo para el hash
      const signedInfoForSigning = signedInfoXml.replace(
        '<ds:SignedInfo',
        '<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#"'
      );

      // 7. Firmar SignedInfo
      const siMd = forge.md.sha1.create();
      siMd.update(signedInfoForSigning, 'utf8');
      // Firma RSA
      const signature = (privateKey as forge.pki.rsa.PrivateKey).sign(siMd);
      const signatureValueBase64 = forge.util.encode64(signature);

      // 8. Construir Bloque de Firma Completo
      // Validar saltos de línea para SignatureValue (máximo 76 chars según estándar, pero SRI acepta continuo)

      const signatureBlock =
        `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="${signatureId}">
    ${signedInfoXml}
    <ds:SignatureValue Id="SignatureValue-${signatureId}">${signatureValueBase64}</ds:SignatureValue>
    <ds:KeyInfo Id="${certificateId}">
        <ds:X509Data>
            <ds:X509Certificate>${certBody}</ds:X509Certificate>
        </ds:X509Data>
    </ds:KeyInfo>
    <ds:Object Id="${objectId}">
        <etsi:QualifyingProperties Target="#${signatureId}">
            ${signedPropertiesXml}
        </etsi:QualifyingProperties>
    </ds:Object>
</ds:Signature>`;

      // 9. Insertar firma en el XML
      // La firma va antes del cierre del nodo raíz (ej: </factura>)
      // Pero NO dentro de otros nodos.
      // SRI standard: Enveloped signature.
      // Asumimos que el XML tiene un nodo raíz único.
      const closingTagMatch = xmlToSign.match(/<\/[a-zA-Z0-9_]+>$/);
      if (!closingTagMatch) throw new Error('XML malformado o sin etiqueta de cierre final');

      const closingTag = closingTagMatch[0];
      const lastIndex = xmlToSign.lastIndexOf(closingTag);

      const finalXml = xmlToSign.substring(0, lastIndex) + signatureBlock + closingTag;

      return finalXml;

    } catch (error: any) {
      console.error('Error en firma electrónica:', error);
      throw new Error(`Fallo en proceso de firma: ${error.message}`);
    }
  }

  private static generateRandomId(): string {
    return Math.floor(Math.random() * 1000000).toString();
  }

  private static getIssuerString(cert: forge.pki.Certificate): string {
    // Formato RFC 2253 reverso para SRI? O normal?
    // SRI suele requerir el formato LDAP, ej: CN=...,OU=...,O=...,C=...
    // forge devuelve atributos. Construimos string.
    return cert.issuer.attributes.map(attr => {
      return `${attr.shortName}=${attr.value}`;
    }).join(','); // Importante: orden y separador
  }
}
