import { Auditable } from '@/shared/types';

export enum TipoMovimientoInventario {
    COMPRA = 'COMPRA',
    VENTA = 'VENTA',
    DEVOLUCION_COMPRA = 'DEVOLUCION_COMPRA',
    DEVOLUCION_VENTA = 'DEVOLUCION_VENTA',
    AJUSTE_INGRESO = 'AJUSTE_INGRESO',
    AJUSTE_EGRESO = 'AJUSTE_EGRESO',
    TRANSFERENCIA_BODEGA = 'TRANSFERENCIA_BODEGA'
}

export interface CategoriaProducto extends Auditable {
    id: string;
    empresaId: string;
    nombre: string; // División de Artículo
    cuentaInventario: string; // Activo
    cuentaCostoVenta: string; // Gasto
    cuentaVenta: string; // Ingreso
}

export interface Bodega extends Auditable {
    id: string;
    empresaId: string;
    sucursalId: string; // Vinculo con Sucursal (Administración)
    codigo: string;
    nombre: string;
    responsable: string;
    ubicacion: string;
}

export interface Producto extends Auditable {
    id: string;
    empresaId: string;
    codigoPrincipal: string; // Código de barras
    codigoAuxiliar: string;
    nombre: string;
    categoriaId: string; // FK Categoria
    categoriaNombre?: string; // Denormalized for list
    stockActual: number;
    costoPromedio: number;
    precioVenta: number; // Sin IVA
    grabaIva: boolean; // True 15%, False 0%
    stockMinimo: number;
    bodegaPredeterminadaId?: string;
}

export interface MovimientoKardex extends Auditable {
    id: string;
    productoId: string;
    bodegaId?: string; // Multi-bodega
    fecha: string;
    tipo: TipoMovimientoInventario;
    referenciaComprobante: string;

    // Cantidades
    cantidadEntrada: number;
    cantidadSalida: number;
    saldoCantidad: number;

    // Valores (Costo)
    costoUnitario: number;
    valorEntrada: number;
    valorSalida: number;
    saldoValor: number; // Costo total del inventario
}

export interface InventarioRepository {
    getProductos(empresaId: string): Promise<Producto[]>;
    getCategorias(empresaId: string): Promise<CategoriaProducto[]>;
    getBodegas(empresaId: string): Promise<Bodega[]>;
    getKardex(productoId: string, fechaInicio: string, fechaFin: string): Promise<MovimientoKardex[]>;
    saveProducto(producto: Producto): Promise<void>;
}
