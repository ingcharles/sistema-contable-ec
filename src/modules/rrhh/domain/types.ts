import { Auditable } from '@/shared/types';

export enum EstadoEmpleado {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO',
    VACACIONES = 'VACACIONES',
    LICENCIA = 'LICENCIA'
}

// DEPRECATED: Usar TipoContrato de base de datos en lugar de enum
export enum TipoContrato {
    INDEFINIDO = 'INDEFINIDO',
    EVENTUAL = 'EVENTUAL',
    POR_OBRA = 'POR_OBRA',
    PASANTIA = 'PASANTIA'
}

// Nuevas interfaces para estructura organizacional
export interface Area extends Auditable {
    id: string;
    empresaId: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    areaPadreId?: string;
    responsableId?: string;
    activa: boolean;
    // Relaciones populadas
    areaPadre?: Area;
    responsable?: Empleado;
}

export interface Cargo extends Auditable {
    id: string;
    empresaId: string;
    areaId?: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    nivelJerarquico: number; // 1=Directivo, 2=Gerencial, 3=Supervisión, 4=Operativo
    sueldoMinimo?: number;
    sueldoMaximo?: number;
    activo: boolean;
    // Relaciones populadas
    area?: Area;
}

export interface TipoContratoEntity extends Auditable {
    id: string;
    empresaId: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    requiereFechaFin: boolean;
    activo: boolean;
}

export interface Empleado extends Auditable {
    id: string;
    empresaId: string;
    identificacion: string;
    nombres: string;
    apellidos: string;
    email: string;
    fechaIngreso: string;
    // Campos heredados (mantener por compatibilidad)
    cargo: string; // DEPRECATED: usar cargoId + relación
    tipoContrato: TipoContrato; // DEPRECATED: usar tipoContratoId + relación
    // Nuevos campos organizacionales
    areaId?: string;
    cargoId?: string;
    tipoContratoId?: string;
    banco?: string;
    numeroCuenta?: string;
    // Campos existentes
    sueldoBase: number;
    estado: EstadoEmpleado;
    cuentaBancaria?: string; // DEPRECATED: usar numeroCuenta
    // Relaciones populadas (opcionales, desde JOIN)
    area?: Area;
    cargoObj?: Cargo; // Renombrado para evitar conflicto con string 'cargo'
    tipoContratoObj?: TipoContratoEntity;
}

export interface RolPago extends Auditable {
    id: string;
    empleadoId: string;
    periodo: string; // YYYY-MM
    diasTrabajados?: number;
    sueldoGanado?: number;
    horasExtras?: number;
    comisiones?: number;
    otrosIngresos?: number;
    totalIngresos: number;
    aporteIESS?: number;
    aportePersonal: number;
    prestamosIESS?: number;
    anticipos?: number;
    otrosDescuentos?: number;
    totalEgresos: number;
    netoAPagar: number;
    // Provisiones y aportes patronales
    aportePatronal: number;
    decimoTercero: number;
    decimoCuarto: number;
    fondosReserva: number;
    vacaciones: number;
    asientoId?: string;
    estado: 'BORRADOR' | 'CERRADO' | 'PAGADO';
}

export interface Asistencia extends Auditable {
    id: string;
    empleadoId: string;
    fecha: string;
    horaEntrada?: string;
    horaSalida?: string;
    horasTrabajadas: number;
    horasExtras50: number;
    horasExtras100: number;
    novedad?: string;
    observaciones?: string;
}

export interface Vacacion extends Auditable {
    id: string;
    empleadoId: string;
    fechaInicio: string;
    fechaFin: string;
    diasSolicitados: number;
    estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'GOZADA';
    tipoSolicitud: string;
    observaciones?: string;
}

export interface Prestamo extends Auditable {
    id: string;
    empleadoId: string;
    fechaPrestamo: string;
    montoTotal: number;
    montoCuota: number;
    saldoPendiente: number;
    numeroCuotas: number;
    cuotasPagadas: number;
    estado: 'ACTIVO' | 'FINALIZADO' | 'ANULADO';
    tipoPrestamo: 'EMPRESA' | 'ANTICIPO_SUELDO';
    observaciones?: string;
    asientoId?: string;
}

export interface Liquidacion extends Auditable {
    id: string;
    empleadoId: string;
    fechaSalida: string;
    motivoSalida: string;
    totalIngresos: number;
    totalEgresos: number;
    valorLiquido: number;
    detalleCalculo: any;
    estado: 'BORRADOR' | 'CERRADA' | 'PAGADA';
    asientoId?: string;
}

export interface PagoRol {
    periodo: string;
    fechaPago: string;
    bancoId?: string;
    metodoPago: string;
}

export interface NominaRepository {
    getEmpleados(empresaId: string): Promise<Empleado[]>;
    saveEmpleado(empleado: Empleado): Promise<void>;
    getRolesPago(empresaId: string, periodo: string): Promise<RolPago[]>;
    generarRoles(empresaId: string, periodo: string): Promise<void>;
    cerrarNomina(empresaId: string, periodo: string): Promise<void>;
    deleteEmpleado(id: string): Promise<void>;
    // Nuevos métodos
    getAsistencias(empresaId: string, desde: string, hasta: string): Promise<Asistencia[]>;
    getVacaciones(empresaId: string): Promise<Vacacion[]>;
    getPrestamos(empresaId: string): Promise<Prestamo[]>;
    getLiquidaciones(empresaId: string): Promise<Liquidacion[]>;
}
