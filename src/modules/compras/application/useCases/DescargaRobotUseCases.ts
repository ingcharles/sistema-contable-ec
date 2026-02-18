import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';
import {
    DescargaRobot, ComprobanteDescargado, ComprobanteParseado,
    FiltroDescarga, FiltroComprobantes
} from '@/modules/compras/domain/descargaRobotTypes';

/**
 * MÓDULO: DESCARGA POR ROBOT
 * Use cases para descargas automatizadas y parseo de comprobantes SRI
 */
export class DescargaRobotUseCases extends BaseUseCase {

    /** Listar historial de descargas */
    static async listarDescargas(filtros?: { anio?: number; mes?: number; razonSocial?: string }): Promise<DescargaRobot[]> {
        const params = new URLSearchParams();
        if (filtros?.anio) params.set('anio', filtros.anio.toString());
        if (filtros?.mes) params.set('mes', filtros.mes.toString());
        if (filtros?.razonSocial) params.set('razonSocial', filtros.razonSocial);
        const query = params.toString();
        return this.request(`/api/compras/descarga-robot${query ? '?' + query : ''}`);
    }

    /** Iniciar nueva descarga del robot */
    static async iniciarDescarga(filtro: FiltroDescarga): Promise<DescargaRobot> {
        return this.request('/api/compras/descarga-robot', {
            method: 'POST',
            body: JSON.stringify(filtro)
        });
    }

    /** Listar comprobantes descargados */
    static async listarComprobantes(filtros?: FiltroComprobantes): Promise<ComprobanteDescargado[]> {
        const params = new URLSearchParams();
        if (filtros?.anio) params.set('anio', filtros.anio.toString());
        if (filtros?.mes) params.set('mes', filtros.mes.toString());
        if (filtros?.tipo) params.set('tipo', filtros.tipo);
        if (filtros?.estado) params.set('estado', filtros.estado);
        if (filtros?.busqueda) params.set('busqueda', filtros.busqueda);
        if (filtros?.limite) params.set('limite', filtros.limite.toString());
        const query = params.toString();
        return this.request(`/api/compras/descarga-robot/comprobantes${query ? '?' + query : ''}`);
    }

    /** Cambiar estado de un comprobante descargado */
    static async actualizarComprobante(id: string, estado: string): Promise<void> {
        return this.request('/api/compras/descarga-robot/comprobantes', {
            method: 'PATCH',
            body: JSON.stringify({ id, estado })
        });
    }

    /** Parsear XML subido por el usuario */
    static async parsearXml(xmlContent: string): Promise<ComprobanteParseado> {
        return this.request('/api/compras/cargar-xml', {
            method: 'POST',
            body: JSON.stringify({ tipo: 'xml', contenido: xmlContent })
        });
    }

    /** Parsear TXT subido por el usuario */
    static async parsearTxt(txtContent: string): Promise<ComprobanteParseado> {
        return this.request('/api/compras/cargar-xml', {
            method: 'POST',
            body: JSON.stringify({ tipo: 'txt', contenido: txtContent })
        });
    }
}
