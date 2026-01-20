import { Auditable } from '@/shared/types';

export enum TipoEvento {
    ACCESO = 'ACCESO',
    CREACION = 'CREACION',
    MODIFICACION = 'MODIFICACION',
    ELIMINACION = 'ELIMINACION',
    AUTORIZACION_SRI = 'AUTORIZACION_SRI',
    ANULACION = 'ANULACION',
    CONCILIACION = 'CONCILIACION',
    MAYORIZACION = 'MAYORIZACION',
    CRUCE_CUENTAS = 'CRUCE_CUENTAS',
    PAGO = 'PAGO',
    EXPORTACION = 'EXPORTACION',
    LOGIN = 'LOGIN',
    LOGIN_FALLIDO = 'LOGIN_FALLIDO',
    CONFIGURACION = 'CONFIGURACION',
    BACKUP = 'BACKUP',
    AJUSTE_INVENTARIO = 'AJUSTE_INVENTARIO',
    CIERRE_PERIODO = 'CIERRE_PERIODO',
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
