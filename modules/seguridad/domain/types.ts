
import { Auditable } from '../../../types';

export enum TipoAccion {
    CREAR = 'CREAR',
    MODIFICAR = 'MODIFICAR',
    ELIMINAR = 'ELIMINAR',
    ANULAR = 'ANULAR',
    LOGIN = 'LOGIN',
    EXPORTAR = 'EXPORTAR',
    APROBAR = 'APROBAR'
}

export enum ModuloSistema {
    FACTURACION = 'FACTURACION',
    COMPRAS = 'COMPRAS',
    CONTABILIDAD = 'CONTABILIDAD',
    INVENTARIO = 'INVENTARIO',
    NOMINA = 'NOMINA',
    CONFIGURACION = 'CONFIGURACION',
    SEGURIDAD = 'SEGURIDAD'
}

export interface LogAuditoria extends Auditable {
    id: string;
    empresaId: string;
    usuarioId: string;
    usuarioNombre: string;
    fecha: string; // ISO Timestamp
    modulo: ModuloSistema;
    accion: TipoAccion;
    descripcion: string;
    ip?: string;
    recursoId?: string; // ID del objeto afectado
    datosAnteriores?: string; // JSON stringify
    datosNuevos?: string; // JSON stringify
}
