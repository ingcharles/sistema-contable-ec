import { Empleado, Asistencia, Vacacion, Prestamo, Liquidacion, PagoRol } from '@/modules/nomina/domain/types';
import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: NÓMINA
 */
export class NominaUseCases extends BaseUseCase {
    static async listarEmpleados() {
        return this.request('/api/nomina/empleados');
    }
    static async generarRol(periodo: string) {
        return this.request('/api/nomina/roles', {
            method: 'POST',
            body: JSON.stringify({ periodo })
        });
    }
    static async listarRoles(periodo: string) {
        return this.request(`/api/nomina/roles?periodo=${periodo}`);
    }
    static async guardarEmpleado(empleado: Empleado) {
        return this.request('/api/nomina/empleados', {
            method: 'POST',
            body: JSON.stringify(empleado)
        });
    }
    static async pagarRol(pago: PagoRol) {
        return this.request('/api/nomina/roles', {
            method: 'PUT',
            body: JSON.stringify(pago)
        });
    }

    static async eliminarEmpleado(id: string) {
        return this.request(`/api/nomina/empleados/${id}`, {
            method: 'DELETE'
        });
    }

    // --- ASISTENCIA ---
    static async listarAsistencia(desde: string, hasta: string) {
        return this.request(`/api/nomina/asistencia?desde=${desde}&hasta=${hasta}`);
    }
    static async guardarAsistencia(asistencia: Asistencia) {
        return this.request('/api/nomina/asistencia', {
            method: 'POST',
            body: JSON.stringify(asistencia)
        });
    }

    // --- VACACIONES ---
    static async listarVacaciones() {
        return this.request('/api/nomina/vacaciones');
    }
    static async solicitarVacaciones(solicitud: Vacacion) {
        return this.request('/api/nomina/vacaciones', {
            method: 'POST',
            body: JSON.stringify(solicitud)
        });
    }

    // --- PRESTAMOS ---
    static async listarPrestamos() {
        return this.request('/api/nomina/prestamos');
    }
    static async registrarPrestamo(prestamo: Prestamo) {
        return this.request('/api/nomina/prestamos', {
            method: 'POST',
            body: JSON.stringify(prestamo)
        });
    }

    // --- LIQUIDACIONES ---
    static async listarLiquidaciones() {
        return this.request('/api/nomina/liquidaciones');
    }
    static async procesarLiquidacion(liquidacion: Liquidacion) {
        return this.request('/api/nomina/liquidaciones', {
            method: 'POST',
            body: JSON.stringify(liquidacion)
        });
    }
}
