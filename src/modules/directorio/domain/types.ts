import { Auditable, TipoIdentificacion } from '@/shared/types';

export enum TipoTercero {
    CLIENTE = 'CLIENTE',
    PROVEEDOR = 'PROVEEDOR',
    AMBOS = 'AMBOS'
}

export interface Tercero extends Auditable {
    id: string;
    empresaId: string;
    tipo: TipoTercero;
    tipoIdentificacion: TipoIdentificacion;
    identificacion: string;
    razonSocial: string;
    nombreComercial?: string;
    direccion: string;
    telefono?: string;
    email: string;
    esContribuyenteEspecial: boolean;
    llevaContabilidad: boolean;
    parteRelacionada: boolean;
}

export interface DirectorioRepository {
    getTerceros(empresaId: string, tipo?: TipoTercero): Promise<Tercero[]>;
    saveTercero(tercero: Tercero): Promise<void>;
    deleteTercero(id: string): Promise<void>;
}
