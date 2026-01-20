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
    diasTrabajados: number;
    sueldoGanado: number;
    horasExtras: number;
    comisiones: number;
    otrosIngresos: number;
    totalIngresos: number;
    aporteIESS: number;
    prestamosIESS: number;
    anticipos: number;
    otrosDescuentos: number;
    totalEgresos: number;
    netoAPagar: number;
    estado: 'BORRADOR' | 'CERRADO' | 'PAGADO';
}

export interface NominaRepository {
    getEmpleados(empresaId: string): Promise<Empleado[]>;
    saveEmpleado(empleado: Empleado): Promise<void>;
    getRolesPago(empresaId: string, periodo: string): Promise<RolPago[]>;
    generarRoles(empresaId: string, periodo: string): Promise<void>;
    cerrarNomina(empresaId: string, periodo: string): Promise<void>;
    deleteEmpleado(id: string): Promise<void>;
}
