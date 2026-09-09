import { Empleado, Asistencia, Vacacion, Prestamo, Liquidacion, PagoRol, Area, Cargo, TipoContratoEntity } from '@/modules/rrhh/domain/types';
import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: RRHH (Recursos Humanos)
 */
export class RRHHUseCases extends BaseUseCase {
    // --- EMPLEADOS ---
    static async listarEmpleados() {
        return this.request('/api/nomina/empleados');
    }
    static async guardarEmpleado(empleado: any) {
        return this.request('/api/nomina/empleados', {
            method: 'POST',
            body: JSON.stringify(empleado)
        });
    }
    static async eliminarEmpleado(id: string) {
        return this.request(`/api/nomina/empleados/${id}`, {
            method: 'DELETE'
        });
    }

    // --- CONFIGURACIÓN ORGANIZACIONAL ---

    // ÁREAS
    static async listarAreas() {
        return this.request('/api/rrhh/areas');
    }
    static async guardarArea(area: Partial<Area>) {
        return this.request('/api/rrhh/areas', {
            method: area.id ? 'PUT' : 'POST',
            body: JSON.stringify(area)
        });
    }
    static async eliminarArea(id: string) {
        return this.request(`/api/rrhh/areas?id=${id}`, {
            method: 'DELETE'
        });
    }

    // CARGOS
    static async listarCargos(areaId?: string) {
        const url = areaId ? `/api/rrhh/cargos?areaId=${areaId}` : '/api/rrhh/cargos';
        return this.request(url);
    }
    static async guardarCargo(cargo: Partial<Cargo>) {
        return this.request('/api/rrhh/cargos', {
            method: cargo.id ? 'PUT' : 'POST',
            body: JSON.stringify(cargo)
        });
    }
    static async eliminarCargo(id: string) {
        return this.request(`/api/rrhh/cargos?id=${id}`, {
            method: 'DELETE'
        });
    }

    // TIPOS DE CONTRATO
    static async listarTiposContrato() {
        return this.request('/api/rrhh/tipos-contrato');
    }
    static async guardarTipoContrato(tipo: Partial<TipoContratoEntity>) {
        return this.request('/api/rrhh/tipos-contrato', {
            method: tipo.id ? 'PUT' : 'POST',
            body: JSON.stringify(tipo)
        });
    }
    static async eliminarTipoContrato(id: string) {
        return this.request(`/api/rrhh/tipos-contrato?id=${id}`, {
            method: 'DELETE'
        });
    }

    // --- NÓMINA / ROLES DE PAGO ---
    static async generarRol(periodo: string) {
        return this.request('/api/nomina/roles', {
            method: 'POST',
            body: JSON.stringify({ periodo })
        });
    }
    static async listarRoles(periodo: string) {
        return this.request(`/api/nomina/roles?periodo=${periodo}`);
    }
    static async pagarRol(pago: PagoRol) {
        return this.request('/api/nomina/roles', {
            method: 'PUT',
            body: JSON.stringify(pago)
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
