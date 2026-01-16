
import { Auditable } from '../../../types';

export enum EstadoCaja {
    ABIERTA = 'ABIERTA',
    CERRADA = 'CERRADA',
    EN_REPOSICION = 'EN_REPOSICION'
}

export interface FondoCaja extends Auditable {
    id: string;
    empresaId: string;
    nombre: string; // Ej: Caja Chica Administración
    responsable: string;
    montoAsignado: number; // Límite del fondo
    saldoActual: number;
    estado: EstadoCaja;
    cuentaContableId: string; // 1.1.01.03
}

export interface GastoCaja extends Auditable {
    id: string;
    fondoCajaId: string;
    fecha: string;
    concepto: string;
    proveedor: string; // Opcional si es vale simple
    nroComprobante?: string;
    monto: number;
    centroCostoId?: string; // Importante para contabilidad de costos
    categoriaGasto: string; // Ej: Movilización, Suministros
    estado: 'REGISTRADO' | 'REPUESTO' | 'ANULADO';
}

export interface ReposicionCaja extends Auditable {
    id: string;
    fondoCajaId: string;
    fecha: string;
    montoTotal: number;
    gastosIncluidosIds: string[];
    estado: 'PENDIENTE' | 'APROBADA';
    asientoContableId?: string;
}
