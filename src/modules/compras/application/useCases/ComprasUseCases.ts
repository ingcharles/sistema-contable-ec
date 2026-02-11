import { Compra, OrdenCompra, RegistrarCompraConRetencionInput } from '@/modules/compras/domain/types';
import { SriLiquidacionInput } from '@/modules/facturacion/domain/SriTypes';
import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: COMPRAS
 */
export class ComprasUseCases extends BaseUseCase {
    static async listarCompras() {
        return this.request('/api/compras');
    }

    static async registrarCompra(compra: Compra) {
        return this.request('/api/compras', {
            method: 'POST',
            body: JSON.stringify(compra)
        });
    }

    static async registrarCompraConRetencion(data: RegistrarCompraConRetencionInput) {
        return this.request('/api/compras/registrar-con-retencion', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async listarOrdenes() {
        return this.request('/api/compras/ordenes');
    }

    static async registrarOrden(orden: OrdenCompra) {
        return this.request('/api/compras/ordenes', {
            method: 'POST',
            body: JSON.stringify(orden)
        });
    }

    static async registrarLiquidacion(liquidacion: SriLiquidacionInput) {
        return this.request('/api/compras/liquidaciones', {
            method: 'POST',
            body: JSON.stringify(liquidacion)
        });
    }

    static async generarRetencion(compraId: string) {
        return this.request('/api/compras', {
            method: 'POST',
            body: JSON.stringify({ action: 'retencion', compraId })
        });
    }
}
