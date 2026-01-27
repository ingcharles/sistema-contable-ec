// CertificateParser.ts - Servicio para parsear certificados digitales P12
import forge from 'node-forge';

export interface CertificateMetadata {
  certFechaEmision: Date;
  certFechaExpiracion: Date;
  certSujeto: string;
  certEmisor: string;
  certNumeroSerie: string;
}

export class CertificateParser {
  /**
   * Parsea un certificado P12 y extrae sus metadatos
   * @param p12Buffer - Buffer del archivo P12
   * @param password - Contraseña del certificado
   * @returns Metadatos del certificado
   * @throws Error si el certificado es inválido o la contraseña es incorrecta
   */
  static parseCertificateMetadata(
    p12Buffer: Buffer,
    password: string
  ): CertificateMetadata {
    try {
      // Convertir buffer a formato base64
      const p12Der = forge.util.decode64(p12Buffer.toString('base64'));
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      
      // Parsear el P12 con la contraseña
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
      
      // Obtener los bags del certificado
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag]?.[0];
      
      if (!certBag || !certBag.cert) {
        throw new Error('No se encontró certificado en el archivo P12');
      }
      
      const cert = certBag.cert;
      
      // Extraer metadatos
      const metadata: CertificateMetadata = {
        certFechaEmision: cert.validity.notBefore,
        certFechaExpiracion: cert.validity.notAfter,
        certSujeto: this.formatDistinguishedName(cert.subject),
        certEmisor: this.formatDistinguishedName(cert.issuer),
        certNumeroSerie: cert.serialNumber,
      };
      
      return metadata;
    } catch (error: any) {
      if (error.message?.includes('Invalid password')) {
        throw new Error('Contraseña del certificado incorrecta');
      }
      throw new Error(`Error al parsear certificado P12: ${error.message}`);
    }
  }
  
  /**
   * Formatea el Distinguished Name (DN) del certificado
   * @param dn - Distinguished Name del certificado
   * @returns String formateado del DN
   */
  private static formatDistinguishedName(
    dn: forge.pki.CertificateField[]
  ): string {
    return dn.attributes
      .map((attr) => `${attr.shortName || attr.name}=${attr.value}`)
      .join(', ');
  }
  
  /**
   * Valida si un certificado está vigente
   * @param fechaExpiracion - Fecha de expiración del certificado
   * @returns true si el certificado está vigente
   */
  static isCertificateValid(fechaExpiracion: Date): boolean {
    return new Date() < new Date(fechaExpiracion);
  }
  
  /**
   * Obtiene los días restantes hasta la expiración del certificado
   * @param fechaExpiracion - Fecha de expiración del certificado
   * @returns Número de días restantes (negativo si ya expiró)
   */
  static getDaysUntilExpiration(fechaExpiracion: Date): number {
    const now = new Date();
    const expiration = new Date(fechaExpiracion);
    const diffTime = expiration.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
