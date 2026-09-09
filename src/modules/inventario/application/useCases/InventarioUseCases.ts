import { Producto, CategoriaProducto, Bodega, MovimientoKardex, TransferenciaInventario } from '@/modules/inventario/domain/types';
import { BaseUseCase } from '@/modules/shared/application/useCases/BaseUseCase';

/**
 * MÓDULO: INVENTARIO
 */
export class InventarioUseCases extends BaseUseCase {
    static async listarProductos(query: string = '') {
        return this.request(`/api/inventario/productos${query}`);
    }
    static async ajustarStock(ajuste: MovimientoKardex) {
        return this.request('/api/inventario/kardex', {
            method: 'POST',
            body: JSON.stringify(ajuste)
        });
    }
    static async listarCategorias() {
        return this.request('/api/inventario/categorias');
    }
    static async listarTodasCategorias() {
        return this.request('/api/inventario/categorias?all=true');
    }
    static async listarCategoriasPaginado(page: number = 1, limit: number = 10) {
        return this.request(`/api/inventario/categorias?page=${page}&limit=${limit}`);
    }
    static async guardarCategoria(categoria: CategoriaProducto) {
        return this.request('/api/inventario/categorias', {
            method: 'POST',
            body: JSON.stringify(categoria)
        });
    }

    static async actualizarCategoria(id: string, categoria: CategoriaProducto) {
        return this.request(`/api/inventario/categorias`, {
            method: 'PUT',
            body: JSON.stringify({ ...categoria, id })
        });
    }
    static async listarBodegas() {
        return this.request('/api/inventario/bodegas');
    }
    static async guardarProducto(producto: Producto) {
        return this.request('/api/inventario/productos', {
            method: 'POST',
            body: JSON.stringify(producto)
        });
    }
    static async guardarBodega(bodega: Bodega) {
        return this.request('/api/inventario/bodegas', {
            method: 'POST',
            body: JSON.stringify(bodega)
        });
    }
    static async eliminarBodega(id: string) {
        return this.request(`/api/inventario/bodegas/${id}`, {
            method: 'DELETE'
        });
    }
    static async listarKardex(productoId: string, fechaInicio: string, fechaFin: string) {
        const queryParams = new URLSearchParams({
            productoId,
            desde: fechaInicio,
            hasta: fechaFin
        });
        return this.request(`/api/inventario/kardex?${queryParams.toString()}`);
    }

    static async listarTransferencias() {
        return this.request('/api/inventario/transferencias');
    }

    static async registrarTransferencia(transferencia: TransferenciaInventario) {
        return this.request('/api/inventario/transferencias', {
            method: 'POST',
            body: JSON.stringify(transferencia)
        });
    }
}
