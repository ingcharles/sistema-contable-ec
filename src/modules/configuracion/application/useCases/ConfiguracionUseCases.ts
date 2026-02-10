import { Sucursal, PuntoEmision, CodigoRetencion, ParametrosContables, AmbienteSRI } from '@/modules/configuracion/domain/types';
import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: CONFIGURACIÓN
 */
export class ConfiguracionUseCases extends BaseUseCase {
    static async listarSucursales() {
        return this.request('/api/configuracion/sucursales');
    }

    static async guardarSucursal(sucursal: Sucursal) {
        return this.request('/api/configuracion/sucursales', {
            method: 'POST',
            body: JSON.stringify(sucursal)
        });
    }

    static async actualizarSucursal(sucursal: Sucursal) {
        return this.request('/api/configuracion/sucursales', {
            method: 'PUT',
            body: JSON.stringify(sucursal)
        });
    }

    static async listarPuntosEmision() {
        return this.request('/api/configuracion/puntos-emision');
    }

    static async guardarPuntoEmision(punto: PuntoEmision) {
        if (punto.id) {
            return this.request('/api/configuracion/puntos-emision', {
                method: 'PUT',
                body: JSON.stringify(punto)
            });
        }
        return this.request('/api/configuracion/puntos-emision', {
            method: 'POST',
            body: JSON.stringify(punto)
        });
    }

    static async listarRetenciones() {
        return this.request('/api/configuracion/retenciones');
    }

    static async guardarRetencion(retencion: CodigoRetencion) {
        return this.request('/api/configuracion/retenciones', {
            method: 'POST',
            body: JSON.stringify(retencion)
        });
    }

    static async obtenerParametros() {
        return this.request('/api/configuracion/parametros');
    }

    static async obtenerParametrosConContexto(empresaId: string) {
        return this.request('/api/configuracion/parametros', {
            headers: { 'x-empresa-id': empresaId }
        });
    }

    static async guardarParametros(params: ParametrosContables) {
        return this.request('/api/configuracion/parametros', {
            method: 'POST',
            body: JSON.stringify(params)
        });
    }

    static async actualizarEmpresa(empresa: any) {
        return this.request(`/api/empresas/${empresa.id}`, {
            method: 'PUT',
            body: JSON.stringify(empresa)
        });
    }

    static async crearEmpresa(empresa: any) {
        return this.request('/api/empresas', {
            method: 'POST',
            body: JSON.stringify(empresa)
        });
    }

    static async listarEmpresas() {
        return this.request('/api/empresas');
    }

    static async obtenerMenu() {
        return this.request('/api/configuracion/menu');
    }

    static async obtenerMisPuntos() {
        return this.request('/api/configuracion/puntos-emision/mis-puntos');
    }

    static async activarPuntoEmision(puntoEmisionId: string) {
        return this.request('/api/configuracion/puntos-emision/activar', {
            method: 'POST',
            body: JSON.stringify({ puntoEmisionId })
        });
    }

    static async obtenerCatalogo(tipo: string) {
        return this.request(`/api/configuracion/catalogos?tipo=${tipo}`);
    }

    static async obtenerAmbientesSRI(): Promise<AmbienteSRI[]> {
        return this.request('/api/configuracion/sri/ambientes');
    }
}
