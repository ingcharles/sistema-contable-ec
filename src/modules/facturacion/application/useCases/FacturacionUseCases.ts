import { FacturaViewModel, Proforma, Transportista } from '@/modules/facturacion/domain/types';
import { SriRespuesta, SriNotaCreditoInput, SriNotaDebitoInput, SriGuiaInput } from '@/modules/facturacion/domain/SriTypes';
import { GuiaRemision } from '@/modules/facturacion/domain/guias';
import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';
import { ConfiguracionUseCases } from '@/modules/configuracion/application/useCases/ConfiguracionUseCases';

/**
 * MÓDULO: FACTURACIÓN / SRI
 */
export class FacturacionUseCases extends BaseUseCase {
    static async vender(data: FacturaViewModel) {
        return this.request('/api/facturacion/vender', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async emitirNotaCredito(data: SriNotaCreditoInput) {
        return this.request('/api/facturacion/notas-credito/emitir', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async emitirNotaDebito(data: SriNotaDebitoInput) {
        return this.request('/api/facturacion/notas-debito/emitir', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async emitirGuia(data: SriGuiaInput) {
        return this.request('/api/facturacion/guias/emitir', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async emitirFactura(data: FacturaViewModel) {
        return this.request('/api/facturacion/emitir', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async registrarComprobante(comprobante: SriRespuesta) {
        return this.request('/api/facturacion/comprobantes', {
            method: 'POST',
            body: JSON.stringify(comprobante)
        });
    }

    static async autorizar(comprobanteId: string) {
        return this.request('/api/facturacion/autorizar', {
            method: 'POST',
            body: JSON.stringify({ comprobanteId })
        });
    }

    static async reemitir(comprobanteId: string, tipoComprobante: string) {
        const endpoints: Record<string, string> = {
            '01': '/api/facturacion/vender/reemitir',
            '03': '/api/compras/liquidaciones/reemitir',
            '04': '/api/facturacion/notas-credito/reemitir',
            '05': '/api/facturacion/notas-debito/reemitir',
            '06': '/api/facturacion/guias/reemitir',
            '07': '/api/compras/registrar-con-retencion/reemitir'
        };

        const endpoint = endpoints[tipoComprobante];
        if (!endpoint) {
            throw new Error(`Tipo de comprobante ${tipoComprobante} no soportado para re-emisión`);
        }

        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify({ comprobanteId })
        });
    }

    static async listarComprobantes() {
        return this.request('/api/facturacion/comprobantes');
    }
    static async listarGuias() {
        return this.request('/api/facturacion/guias');
    }

    static async obtenerGuia(id: string) {
        return this.request(`/api/facturacion/guias/${id}`);
    }

    static async obtenerRetencion(id: string) {
        return this.request(`/api/facturacion/retenciones/${id}`);
    }

    // PROFORMAS
    static async listarProformas() {
        return this.request('/api/facturacion/proformas');
    }

    static async guardarProforma(proforma: Proforma) {
        return this.request('/api/facturacion/proformas', {
            method: proforma.id ? 'PUT' : 'POST',
            body: JSON.stringify(proforma)
        });
    }

    static async facturarProforma(id: string) {
        return this.request(`/api/facturacion/proformas/${id}/facturar`, {
            method: 'POST'
        });
    }
    static async guardarGuiaRemision(guia: GuiaRemision) {
        return this.request('/api/facturacion/guias', {
            method: 'POST',
            body: JSON.stringify(guia)
        });
    }
    static async actualizarGuia(guia: GuiaRemision) {
        return this.request('/api/facturacion/guias', {
            method: 'PUT',
            body: JSON.stringify(guia)
        });
    }
    static async listarTransportistas() {
        return this.request('/api/transportistas');
    }
    static async guardarTransportista(transportista: Transportista) {
        return this.request('/api/transportistas', {
            method: 'POST',
            body: JSON.stringify(transportista)
        });
    }

    static async listarPuntosEmision() {
        return ConfiguracionUseCases.listarPuntosEmision();
    }

    static async obtenerSiguienteSecuencial(puntoEmisionId: string, tipoComprobante: string) {
        return this.request(`/api/facturacion/secuencial?puntoEmisionId=${puntoEmisionId}&tipoComprobante=${tipoComprobante}`);
    }
}
