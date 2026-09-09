import { Auditable } from '@/shared/types';

export interface CentroCosto extends Auditable {
    id: string;
    empresaId: string;
    codigo: string;
    nombre: string;
    nivel: number;
    activo: boolean;
}

export interface DetalleAsiento {
    cuentaCodigo: string;
    cuentaNombre: string;
    debe: number;
    haber: number;
    glosa?: string;
    centroCostoId?: string;
}

export interface AsientoContable extends Auditable {
    id: string;
    empresaId: string;
    numero: string;
    fecha: string;
    glosa: string;
    tipo: 'INGRESO' | 'EGRESO' | 'DIARIO';
    estado: 'BORRADOR' | 'MAYORIZADO' | 'ANULADO';
    detalles: DetalleAsiento[];
    totalDebe: number;
    totalHaber: number;
}

export interface CuentaReporte {
    codigo: string;
    nombre: string;
    saldo: number;
    nivel: number;
    tipo: string;
    hijos?: CuentaReporte[];
}

export interface BalanceGeneral {
    activos: CuentaReporte;
    pasivos: CuentaReporte;
    patrimonio: CuentaReporte;
    totalActivos: number;
    totalPasivos: number;
    totalPatrimonio: number;
    ecuacionContable: boolean;
}

export interface EstadoResultados {
    ingresos: CuentaReporte;
    gastos: CuentaReporte;
    utilidadOperativa: number;
    utilidadNeta: number;
}

export interface CuentaContable extends Auditable {
    id: string;
    empresaId: string;
    codigo: string;
    nombre: string;
    tipo: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'GASTO';
    nivel: number;
    padreCodigo?: string;
    activo: boolean;
    saldo: number;
}

export interface ContabilidadRepository {
    getAsientos(empresaId: string): Promise<AsientoContable[]>;
    saveAsiento(asiento: AsientoContable): Promise<void>;
    getCentrosCostos(empresaId: string): Promise<CentroCosto[]>;
    getPlanCuentas(empresaId: string): Promise<CuentaContable[]>;
    saveCuenta(cuenta: CuentaContable): Promise<void>;
    deleteCuenta(codigo: string): Promise<void>;
    getBalanceGeneral(empresaId: string, fechaCorte: string): Promise<BalanceGeneral>;
    getEstadoResultados(empresaId: string, fechaInicio: string, fechaFin: string): Promise<EstadoResultados>;
}
