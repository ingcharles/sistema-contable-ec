import { Producto, MovimientoKardex, TipoMovimientoInventario, CategoriaProducto, Bodega, InventarioRepository } from '../domain/types';

const MOCK_CATEGORIAS: CategoriaProducto[] = [
    {
        id: 'cat1', empresaId: '1', nombre: 'TECNOLOGIA',
        cuentaInventario: '1.1.03.01', cuentaCostoVenta: '5.1.01.01', cuentaVenta: '4.1.01.01',
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'cat2', empresaId: '1', nombre: 'ACCESORIOS',
        cuentaInventario: '1.1.03.02', cuentaCostoVenta: '5.1.01.02', cuentaVenta: '4.1.01.02',
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

const MOCK_BODEGAS: Bodega[] = [
    {
        id: 'bod1', empresaId: '1', sucursalId: 's1', codigo: 'B001', nombre: 'BODEGA CENTRAL', responsable: 'Carlos Bodeguero', ubicacion: 'Quito Norte',
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'bod2', empresaId: '1', sucursalId: 's2', codigo: 'B002', nombre: 'BODEGA GUAYAQUIL', responsable: 'Luis Almacén', ubicacion: 'Centro GYE',
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

const MOCK_PRODUCTOS: Producto[] = [
    {
        id: 'prod1',
        empresaId: '1',
        codigoPrincipal: '78610001',
        codigoAuxiliar: 'LAP-HP-001',
        nombre: 'LAPTOP HP PAVILION 15"',
        categoriaId: 'cat1',
        categoriaNombre: 'TECNOLOGIA',
        stockActual: 15,
        costoPromedio: 650.00,
        precioVenta: 890.00,
        grabaIva: true,
        stockMinimo: 5,
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'prod2',
        empresaId: '1',
        codigoPrincipal: '78610002',
        codigoAuxiliar: 'MOU-LOG-002',
        nombre: 'MOUSE LOGITECH WIRELESS',
        categoriaId: 'cat2',
        categoriaNombre: 'ACCESORIOS',
        stockActual: 4,
        costoPromedio: 12.50,
        precioVenta: 25.00,
        grabaIva: true,
        stockMinimo: 10,
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

const MOCK_KARDEX: MovimientoKardex[] = [
    {
        id: 'k1',
        productoId: 'prod1',
        bodegaId: 'bod1',
        fecha: '2023-10-01',
        tipo: TipoMovimientoInventario.AJUSTE_INGRESO,
        referenciaComprobante: 'INV-INI-2023',
        cantidadEntrada: 10,
        cantidadSalida: 0,
        saldoCantidad: 10,
        costoUnitario: 650.00,
        valorEntrada: 6500.00,
        valorSalida: 0,
        saldoValor: 6500.00,
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'k2',
        productoId: 'prod1',
        bodegaId: 'bod1',
        fecha: '2023-10-05',
        tipo: TipoMovimientoInventario.COMPRA,
        referenciaComprobante: 'FAC-001-998',
        cantidadEntrada: 10,
        cantidadSalida: 0,
        saldoCantidad: 20,
        costoUnitario: 650.00,
        valorEntrada: 6500.00,
        valorSalida: 0,
        saldoValor: 13000.00,
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'k3',
        productoId: 'prod1',
        bodegaId: 'bod1',
        fecha: '2023-10-10',
        tipo: TipoMovimientoInventario.VENTA,
        referenciaComprobante: 'FAC-001-002-4521',
        cantidadEntrada: 0,
        cantidadSalida: 5,
        saldoCantidad: 15,
        costoUnitario: 650.00,
        valorEntrada: 0,
        valorSalida: 3250.00,
        saldoValor: 9750.00,
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

export class InMemoryInventarioRepository implements InventarioRepository {
    async getProductos(empresaId: string): Promise<Producto[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_PRODUCTOS.filter(p => p.empresaId === empresaId);
    }

    async getKardex(productoId: string, fechaInicio: string, fechaFin: string): Promise<MovimientoKardex[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_KARDEX.filter(k => k.productoId === productoId && k.fecha >= fechaInicio && k.fecha <= fechaFin);
    }

    async getCategorias(empresaId: string): Promise<CategoriaProducto[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return MOCK_CATEGORIAS.filter(c => c.empresaId === empresaId);
    }

    async getBodegas(empresaId: string): Promise<Bodega[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return MOCK_BODEGAS.filter(b => b.empresaId === empresaId);
    }

    async saveProducto(producto: Producto): Promise<void> {
        const idx = MOCK_PRODUCTOS.findIndex(p => p.id === producto.id);
        if (idx >= 0) MOCK_PRODUCTOS[idx] = producto;
        else MOCK_PRODUCTOS.push(producto);
    }

    async saveCategoria(categoria: CategoriaProducto): Promise<void> {
        const idx = MOCK_CATEGORIAS.findIndex(c => c.id === categoria.id);
        if (idx >= 0) MOCK_CATEGORIAS[idx] = categoria;
        else MOCK_CATEGORIAS.push(categoria);
    }

    async saveBodega(bodega: Bodega): Promise<void> {
        const idx = MOCK_BODEGAS.findIndex(b => b.id === bodega.id);
        if (idx >= 0) MOCK_BODEGAS[idx] = bodega;
        else MOCK_BODEGAS.push(bodega);
    }

    async deleteBodega(id: string): Promise<void> {
        const idx = MOCK_BODEGAS.findIndex(b => b.id === id);
        if (idx >= 0) MOCK_BODEGAS.splice(idx, 1);
    }
}
