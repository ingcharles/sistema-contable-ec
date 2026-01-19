import { Auditable } from '@/shared/types';

export enum TipoImpuesto {
    IVA = 'IVA',
    RENTA = 'RENTA',
    ICE = 'ICE'
}

export interface FormularioSRI extends Auditable {
    id: string;
    empresaId: string;
    tipo: '103' | '104';
    periodo: string; // YYYY-MM
    totalVentas: number;
    totalCompras: number;
    impuestoCausado: number;
    retencionesRecibidas: number;
    saldoAFavor: number;
    valorAPagar: number;
    estado: 'BORRADOR' | 'PRESENTADO';
}

export interface AnexoTransaccional extends Auditable {
    id: string;
    empresaId: string;
    periodo: string; // YYYY-MM
    xmlGenerado?: string;
    estado: 'PENDIENTE' | 'GENERADO' | 'VALIDADO';
}

export interface ImpuestosRepository {
    getFormularios(empresaId: string, tipo: string): Promise<FormularioSRI[]>;
    generarFormulario(empresaId: string, tipo: string, periodo: string): Promise<FormularioSRI>;
    getAnexos(empresaId: string): Promise<AnexoTransaccional[]>;
    generarATS(empresaId: string, periodo: string): Promise<void>;
}
