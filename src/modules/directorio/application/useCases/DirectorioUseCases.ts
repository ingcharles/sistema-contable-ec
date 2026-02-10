import { Tercero } from '@/modules/directorio/domain/types';
import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: DIRECTORIO (TERCEROS)
 */
export class DirectorioUseCases extends BaseUseCase {
    private static mapTercero(t: any) {
        return {
            id: t.id,
            empresaId: t.empresa_id,
            tipoIdentificacion: t.tipo_identificacion,
            identificacion: t.identificacion,
            razonSocial: t.razon_social,
            nombreComercial: t.nombre_comercial,
            tipo: t.tipo_tercero,
            esContribuyenteEspecial: t.es_contribuyente_especial,
            llevaContabilidad: t.es_obligado_contabilidad,
            email: t.email,
            telefono: t.telefono,
            celular: t.celular,
            direccion: t.direccion,
            provincia: t.provincia,
            ciudad: t.ciudad,
            codigoPostal: t.codigo_postal,
            limiteCredito: Number(t.limite_credito),
            diasCredito: Number(t.dias_credito),
            descuentoPorcentaje: Number(t.descuento_porcentaje),
            activo: t.activo,
            createdAt: t.created_at,
            updatedAt: t.updated_at
        };
    }

    static async listarTerceros(tipo?: string, buscar?: string) {
        const params = new URLSearchParams();
        if (tipo) params.set('tipo', tipo);
        if (buscar) params.set('buscar', buscar);
        params.set('activo', 'true');

        const query = params.toString();
        const data = await this.request(`/api/directorio/terceros${query ? '?' + query : ''}`);
        return data.map(this.mapTercero);
    }

    static async obtenerTercero(id: string) {
        const data = await this.request(`/api/directorio/terceros/${id}`);
        return this.mapTercero(data);
    }

    static async guardarTercero(tercero: Tercero) {
        return this.request('/api/directorio/terceros', {
            method: tercero.id ? 'PUT' : 'POST',
            body: JSON.stringify(tercero)
        });
    }

    static async actualizarTercero(id: string, tercero: Tercero) {
        return this.request('/api/directorio/terceros', {
            method: 'PUT',
            body: JSON.stringify({ ...tercero, id })
        });
    }

    static async eliminarTercero(id: string) {
        return this.request(`/api/directorio/terceros/${id}`, {
            method: 'DELETE'
        });
    }
}
