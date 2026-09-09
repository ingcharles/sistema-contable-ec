/**
 * Tipos relacionados con certificados digitales SRI
 */

export type EstadoCertificado = 'VIGENTE' | 'PROXIMO_A_VENCER' | 'EXPIRADO' | 'SIN_CERTIFICADO';

export interface CertificadoMetadata {
    ambiente?: string;
    fechaEmision: string | null;
    fechaExpiracion: string | null;
    sujeto: string | null;
    emisor: string | null;
    numeroSerie: string | null;
    diasRestantes: number | null;
    estado: EstadoCertificado;
}

export interface CertificadoApiResponse {
    certificadoId?: string;
    ambiente: string;
    fechaEmision: string | null;
    fechaExpiracion: string | null;
    sujeto: string | null;
    emisor: string | null;
    numeroSerie: string | null;
    esVigente: boolean;
    diasRestantes: number | null;
    tieneCertificado: boolean;
    estado: EstadoCertificado;
    advertencia: string | null;
}
