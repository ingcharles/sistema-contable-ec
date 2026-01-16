
import { Empleado, TipoContrato, RolPago } from '../domain/types';

const MOCK_EMPLEADOS: Empleado[] = [
    {
        id: 'e1',
        empresaId: '1',
        cedula: '1712345678',
        nombres: 'Carlos Andrés',
        apellidos: 'Mina López',
        cargo: 'Contador General',
        fechaIngreso: '2020-01-15',
        sueldoUnificado: 1200.00,
        tipoContrato: TipoContrato.INDEFINIDO,
        acumulaDecimos: true,
        cargasFamiliares: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin'
    },
    {
        id: 'e2',
        empresaId: '1',
        cedula: '0987654321',
        nombres: 'María Fernanda',
        apellidos: 'Vargas Torres',
        cargo: 'Asistente Administrativa',
        fechaIngreso: '2022-05-01',
        sueldoUnificado: 600.00, // SBU Referencial aprox
        tipoContrato: TipoContrato.INDEFINIDO,
        acumulaDecimos: false, // Mensualiza
        cargasFamiliares: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin'
    }
];

// Mock de roles históricos para reporte 103
const MOCK_ROLES: RolPago[] = [
    {
        id: 'r1',
        empresaId: '1',
        empleadoId: 'e1',
        empleadoNombre: 'Carlos Andrés Mina López',
        periodo: '2023-10',
        diasLaborados: 30,
        sueldoGanado: 1200.00,
        horasExtras: 0,
        comisiones: 0,
        decimoTercero: 0,
        decimoCuarto: 0,
        fondosReserva: 100,
        totalIngresos: 1300,
        aporteIessPersonal: 113.40,
        retencionImpuestoRenta: 25.50, // Dato clave para Form 103 (Cod 302)
        prestamosQuirografarios: 0,
        anticipos: 0,
        totalEgresos: 138.90,
        liquidoRecibir: 1161.10,
        estado: 'PAGADO',
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'r2',
        empresaId: '1',
        empleadoId: 'e2',
        empleadoNombre: 'María Fernanda Vargas Torres',
        periodo: '2023-10',
        diasLaborados: 30,
        sueldoGanado: 600.00,
        horasExtras: 50,
        comisiones: 0,
        decimoTercero: 50,
        decimoCuarto: 37.5,
        fondosReserva: 0,
        totalIngresos: 737.5,
        aporteIessPersonal: 56.70,
        retencionImpuestoRenta: 0,
        prestamosQuirografarios: 0,
        anticipos: 0,
        totalEgresos: 56.70,
        liquidoRecibir: 680.80,
        estado: 'PAGADO',
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

export class InMemoryNominaRepository {
    async getEmpleados(empresaId: string): Promise<Empleado[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_EMPLEADOS.filter(e => e.empresaId === empresaId);
    }

    async getRolesPago(empresaId: string, periodo: string): Promise<RolPago[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        // periodo formato YYYY-MM
        return MOCK_ROLES.filter(r => r.empresaId === empresaId && r.periodo === periodo);
    }
}
