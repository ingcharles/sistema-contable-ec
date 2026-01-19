import { Empleado, RolPago, NominaRepository, EstadoEmpleado, TipoContrato } from '../domain/types';

const MOCK_EMPLEADOS: Empleado[] = [
    {
        id: 'emp1',
        empresaId: '1',
        identificacion: '1712345678',
        nombres: 'JUAN ALBERTO',
        apellidos: 'PEREZ SOSA',
        email: 'juan.perez@empresa.com',
        fechaIngreso: '2022-01-15',
        cargo: 'CONTADOR GENERAL',
        sueldoBase: 1200,
        tipoContrato: TipoContrato.INDEFINIDO,
        estado: EstadoEmpleado.ACTIVO,
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'emp2',
        empresaId: '1',
        identificacion: '0912345678',
        nombres: 'MARIA ELENA',
        apellidos: 'LOPEZ GARCIA',
        email: 'maria.lopez@empresa.com',
        fechaIngreso: '2023-03-01',
        cargo: 'ASISTENTE ADMINISTRATIVO',
        sueldoBase: 650,
        tipoContrato: TipoContrato.INDEFINIDO,
        estado: EstadoEmpleado.ACTIVO,
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

const MOCK_ROLES: RolPago[] = [];

export class InMemoryNominaRepository implements NominaRepository {
    async getEmpleados(empresaId: string): Promise<Empleado[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_EMPLEADOS.filter(e => e.empresaId === empresaId);
    }

    async saveEmpleado(empleado: Empleado): Promise<void> {
        const idx = MOCK_EMPLEADOS.findIndex(e => e.id === empleado.id);
        if (idx >= 0) MOCK_EMPLEADOS[idx] = empleado;
        else MOCK_EMPLEADOS.push(empleado);
    }

    async getRolesPago(_empresaId: string, periodo: string): Promise<RolPago[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_ROLES.filter(r => r.periodo === periodo);
    }

    async generarRoles(empresaId: string, periodo: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const empleados = MOCK_EMPLEADOS.filter(e => e.empresaId === empresaId && e.estado === EstadoEmpleado.ACTIVO);

        empleados.forEach(emp => {
            const aporte = emp.sueldoBase * 0.0945;
            MOCK_ROLES.push({
                id: Math.random().toString(36),
                empleadoId: emp.id,
                periodo,
                diasTrabajados: 30,
                sueldoGanado: emp.sueldoBase,
                horasExtras: 0,
                comisiones: 0,
                otrosIngresos: 0,
                totalIngresos: emp.sueldoBase,
                aporteIESS: aporte,
                prestamosIESS: 0,
                anticipos: 0,
                otrosDescuentos: 0,
                totalEgresos: aporte,
                netoAPagar: emp.sueldoBase - aporte,
                estado: 'BORRADOR',
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'admin'
            });
        });
    }

    async cerrarNomina(_empresaId: string, periodo: string): Promise<void> {
        MOCK_ROLES.filter(r => r.periodo === periodo).forEach(r => r.estado = 'CERRADO');
    }
}
