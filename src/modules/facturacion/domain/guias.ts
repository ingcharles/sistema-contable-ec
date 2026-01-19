import { EstadoSRI, Auditable } from '@/shared/types';

export enum MotivoTraslado {
    VENTA = '01',
    TRASLADO_BODEGAS = '02',
    DEVOLUCION = '04',
    COMPRA = '05',
    IMPORTACION = '06',
    EXPORTACION = '07',
    OTROS = '99'
}

export interface Transportista {
    id: string;
    razonSocial: string;
    ruc: string;
    placa: string;
    correo?: string;
}

export interface DestinatarioGuia {
    identificacion: string;
    razonSocial: string;
    direccionDestino: string;
    motivoTraslado: MotivoTraslado;
    documentoReferencia?: string; // Nro Factura
    fechaEmisionDocSustento?: string;
    ruta: string;
    items: DetalleGuia[];
}

export interface DetalleGuia {
    codigo: string;
    descripcion: string;
    cantidad: number;
}

export interface GuiaRemision extends Auditable {
    id: string;
    empresaId: string;
    secuencial: string;
    claveAcceso?: string;
    fechaEmision: string;
    fechaInicioTraslado: string;
    fechaFinTraslado: string;
    puntoPartida: string;

    transportista: Transportista;
    destinatarios: DestinatarioGuia[];

    estado: EstadoSRI;
}

export interface GuiaRemisionRepository {
    getGuias(empresaId: string): Promise<GuiaRemision[]>;
    saveGuia(guia: GuiaRemision): Promise<void>;
    getTransportistas(empresaId: string): Promise<Transportista[]>;
}
