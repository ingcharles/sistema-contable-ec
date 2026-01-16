import { Auditable } from '../../../types';

export interface CentroCosto extends Auditable {
    id: string;
    empresaId: string;
    codigo: string; // Ej: 01.001
    nombre: string;
    nivel: number;
    activo: boolean;
}

export interface DetalleAsiento {
    cuentaCodigo: string;
    cuentaNombre: string;
    centroCostoId?: string; // Relación opcional
    debe: number;
    haber: number;
}

export interface AsientoContable extends Auditable {
    id: string;
    empresaId: string;
    numero: string; // Ej: CD-10-2023-001
    fecha: string;
    glosa: string;
    detalles: DetalleAsiento[];
    totalDebe: number;
    totalHaber: number;
    estado: 'MAYORIZADO' | 'BORRADOR' | 'ANULADO';
    tipo: 'DIARIO' | 'INGRESO' | 'EGRESO' | 'AJUSTE';
}

export interface ContabilidadRepository {
    getAsientos(empresaId: string): Promise<AsientoContable[]>;
    saveAsiento(asiento: AsientoContable): Promise<void>;
    getCentrosCostos(empresaId: string): Promise<CentroCosto[]>;
}
