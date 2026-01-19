import { Auditable } from '@/shared/types';

export enum TipoEvento {
    ACCESO = 'ACCESO',
    CREACION = 'CREACION',
    MODIFICACION = 'MODIFICACION',
    ELIMINACION = 'ELIMINACION',
    AUTORIZACION_SRI = 'AUTORIZACION_SRI',
    ERROR = 'ERROR'
}

export enum NivelSeveridad {
    INFO = 'INFO',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL'
}

export interface LogAuditoria extends Auditable {
    id: string;
    empresaId: string;
    usuario: string;
    evento: TipoEvento;
    modulo: string;
    descripcion: string;
    ip: string;
    severidad: NivelSeveridad;
    detalles?: string;
}

export interface AuditoriaRepository {
    getLogs(empresaId: string, filtros?: any): Promise<LogAuditoria[]>;
    registrarLog(log: Partial<LogAuditoria>): Promise<void>;
}
