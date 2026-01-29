import * as xadesjs from 'xadesjs';
import forge from 'node-forge';
import { Crypto } from '@peculiar/webcrypto';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import * as xmlCore from 'xml-core';

// Configurar crypto para Node.js
const crypto = new Crypto();
xadesjs.Application.setEngine("NodeJS", crypto);

// Configurar dependencias DOM para Node.js
xmlCore.setNodeDependencies({
  DOMParser,
  XMLSerializer
});

/**
 * Servicio de firma XAdES-BES usando la librería xadesjs
 * Esta implementación maneja correctamente la canonicalización C14N
 */
export class SignatureServiceXades {
  
  static async signXml(xml: string, config: { p12Base64: string, passwordP12: string }): Promise<string> {
    try {
      // 1. Decodificar P12 y extraer llave/certificado
      const p12Der = forge.util.decode64(config.p12Base64);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, config.passwordP12);

      // Obtener llave privada
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      let keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
      if (!keyBag) {
        const simpleKeyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
        keyBag = simpleKeyBags[forge.pki.oids.keyBag]?.[0];
      }
      if (!keyBag) throw new Error('No se encontró llave privada');
      const privateKey = keyBag.key as forge.pki.rsa.PrivateKey;

      // Obtener certificado
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag]?.[0];
      if (!certBag?.cert) throw new Error('No se encontró certificado');
      const certificate = certBag.cert;

      // 2. Convertir llave RSA a formato PKCS8 para WebCrypto
      const rsaKey = privateKey as any;
      
      // Obtener bytes de los componentes RSA
      const nHex = rsaKey.n.toString(16);
      const eHex = rsaKey.e.toString(16);
      const dHex = rsaKey.d.toString(16);
      const pHex = rsaKey.p.toString(16);
      const qHex = rsaKey.q.toString(16);
      const dpHex = rsaKey.dP.toString(16);
      const dqHex = rsaKey.dQ.toString(16);
      const qiHex = rsaKey.qInv.toString(16);
      
      // Convertir hex a base64url
      const hexToBase64Url = (hex: string) => {
        // Asegurar longitud par
        if (hex.length % 2 !== 0) hex = '0' + hex;
        const buffer = Buffer.from(hex, 'hex');
        return buffer.toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      };

      const privateKeyJwk = {
        kty: 'RSA',
        n: hexToBase64Url(nHex),
        e: hexToBase64Url(eHex),
        d: hexToBase64Url(dHex),
        p: hexToBase64Url(pHex),
        q: hexToBase64Url(qHex),
        dp: hexToBase64Url(dpHex),
        dq: hexToBase64Url(dqHex),
        qi: hexToBase64Url(qiHex),
        alg: 'RS1', // SHA-1
        ext: true
      };

      // Importar llave privada a WebCrypto
      const cryptoKey = await crypto.subtle.importKey(
        'jwk',
        privateKeyJwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-1' },
        true,
        ['sign']
      );

      // Convertir certificado a Base64
      const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes();
      const certBase64 = forge.util.encode64(certDer);

      // 3. Parsear XML
      const xmlDoc = xadesjs.Parse(xml);

      // 4. Crear firma XAdES-BES
      const signedXml = new xadesjs.SignedXml();
      
      // Configurar la firma para XAdES-BES
      await signedXml.Sign(
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-1' },  // Algoritmo
        cryptoKey,                                      // Llave
        xmlDoc,                                         // Documento
        {
          keyValue: cryptoKey,
          references: [
            {
              id: 'Reference-' + Math.random().toString(36).slice(2),
              uri: '#comprobante',
              hash: 'SHA-1',
              transforms: ['enveloped']
            }
          ],
          x509: [certBase64],
          signingCertificate: certBase64
        }
      );

      // Agregar firma al documento
      const signatureNode = signedXml.XmlSignature.GetXml();
      if (signatureNode) {
        xmlDoc.documentElement.appendChild(signatureNode);
      }

      // 5. Serializar
      const serializer = new XMLSerializer();
      return serializer.serializeToString(xmlDoc);

    } catch (error: any) {
      console.error('Error en firma XAdES:', error);
      throw new Error(`Fallo en firma XAdES: ${error.message}`);
    }
  }
}
