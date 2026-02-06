import { Auditable } from '@/shared/types';

export enum EstadoEmpleado {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO',
    VACACIONES = 'VACACIONES',
    LICENCIA = 'LICENCIA'
}

export enum TipoContrato {
    INDEFINIDO = 'INDEFINIDO',
    EVENTUAL = 'EVENTUAL',
    POR_OBRA = 'POR_OBRA',
    PASANTIA = 'PASANTIA'
}

export interface Empleado extends Auditable {
    id: string;
    empresaId: string;
    identificacion: string;
    nombres: string;
    apellidos: string;
    email: string;
    fechaIngreso: string;
    cargo: string;
    sueldoBase: number;
    tipoContrato: TipoContrato;
    estado: EstadoEmpleado;
    cuentaBancaria?: string;
    banco?: string;
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
