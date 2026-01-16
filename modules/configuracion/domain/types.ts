
import { Auditable } from '../../../types';

export interface Sucursal extends Auditable {
    id: string;
    empresaId: string;
    codigo: string; // Ej: 001 (Establecimiento SRI)
    nombre: string; // Ej: Matriz, Sucursal Centro
    direccion: string;
    telefono?: string;
    esMatriz: boolean;
    activa: boolean;
}

export interface SecuencialDocumento {
    tipoComprobante: string; // '01' Factura, '07' Retención
    secuencialActual: number; // Último número usado
}

export interface PuntoEmision extends Auditable {
    id: string;
    sucursalId: string;
    codigo: string; // Ej: 001, 002 (Punto de Emisión)
    nombre: string; // Ej: Caja Principal, Caja Secundaria
    secuenciales: SecuencialDocumento[];
    activo: boolean;
}

export interface UsuarioSistema extends Auditable {
    id: string;
    empresaId: string; // Empresa activa
    nombreCompleto: string;
    email: string;
    rol: 'ADMINISTRADOR' | 'CONTADOR' | 'CAJERO' | 'AUDITOR';
    estado: 'ACTIVO' | 'INACTIVO';
    sucursalAsignadaId?: string; // Para restringir facturación a una sucursal
}

export interface CodigoRetencion extends Auditable {
    id: string;
    empresaId: string;
    codigo: string; // Ej: 312, 303
    concepto: string; // Ej: Transferencia bienes muebles
    porcentaje: number; // Ej: 1.75
    tipo: 'RENTA' | 'IVA'; 
    activo: boolean;
}
