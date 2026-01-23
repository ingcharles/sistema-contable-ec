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
    SUCCESS = 'SUCCESS',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL'
}

export interface LogAuditoria extends Auditable {
    id: string;
    empresaId: string;
    usuario: string; // ID usuario
    usuario_nombre?: string;
    evento: TipoEvento;
    modulo: string;
    descripcion: string;
    ip: string;
    ip_address?: string; // API alias
    severidad: NivelSeveridad;
    detalles?: string;
    datos_antes?: any;
    datos_despues?: any;
    metodo_http?: string;
    ruta?: string;
}

export interface AuditoriaRepository {
    getLogs(empresaId: string, filtros?: any): Promise<LogAuditoria[]>;
    registrarLog(log: Partial<LogAuditoria>): Promise<void>;
}
