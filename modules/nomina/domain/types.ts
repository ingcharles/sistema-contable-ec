
import { Auditable } from '../../../types';

export enum TipoContrato {
    INDEFINIDO = 'INDEFINIDO',
    PLAZO_FIJO = 'PLAZO_FIJO', // Ya casi no aplica pero por legado
    POR_OBRA = 'POR_OBRA',
    EVENTUAL = 'EVENTUAL'
}

export interface ProyeccionGastos {
    anio: number;
    vivienda: number;
    salud: number;
    educacion: number;
    alimentacion: number;
    vestimenta: number;
    turismo: number;
    totalGastos: number;
    rebajaImpuestoRenta: number; // Cálculo automático según cargas y canasta básica
}

export interface Empleado extends Auditable {
    id: string;
    empresaId: string;
    cedula: string;
    nombres: string;
    apellidos: string;
    cargo: string;
    fechaIngreso: string;
    sueldoUnificado: number; // Sueldo base para aporte IESS
    tipoContrato: TipoContrato;
    acumulaDecimos: boolean; // Si mensualiza o acumula (13ro y 14to)
    cargasFamiliares: number; // Para cálculo de Rebaja IR (Gastos Personales)
    proyeccionGastos?: ProyeccionGastos; // Registro anual
}

export interface DetalleRubro {
    concepto: string;
    tipo: 'INGRESO' | 'EGRESO';
    monto: number;
}

export interface RolPago extends Auditable {
    id: string;
    empresaId: string;
    empleadoId: string;
    empleadoNombre: string;
    periodo: string; // MM-YYYY
    diasLaborados: number;
    
    // Ingresos
    sueldoGanado: number;
    horasExtras: number; // Monto calculado
    comisiones: number;
    decimoTercero: number; // Si mensualiza
    decimoCuarto: number; // Si mensualiza
    fondosReserva: number; // Si aplica
    totalIngresos: number;
    
    // Egresos / Deducciones
    aporteIessPersonal: number; // 9.45%
    retencionImpuestoRenta: number; // Calculado con proyección
    prestamosQuirografarios: number;
    anticipos: number;
    totalEgresos: number;
    
    liquidoRecibir: number;
    estado: 'BORRADOR' | 'APROBADO' | 'PAGADO';
}
