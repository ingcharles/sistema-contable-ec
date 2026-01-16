
import { Compra, CompraRepository, OrdenCompra, SustentoTributario } from '../domain/types';

const MOCK_PROVEEDORES = {
  CLARO: { id: 'p1', razonSocial: 'CONECEL S.A.', ruc: '1791256115001', esContribuyenteEspecial: true },
  TIENDA: { id: 'p2', razonSocial: 'IMPORTADORA EL ROSADO S.A.', ruc: '0990004196001', esContribuyenteEspecial: true },
  CONSULTOR: { id: 'p3', razonSocial: 'LOPEZ PEREZ JUAN CARLOS', ruc: '1718990022001', esContribuyenteEspecial: false }
};

const MOCK_COMPRAS: Compra[] = [
  {
    id: 'c1',
    empresaId: '1',
    proveedor: MOCK_PROVEEDORES.CLARO,
    tipoComprobante: '01',
    secuencial: '001-001-005699874',
    autorizacion: '2510202301179125611500120010010056998741234567815',
    fechaEmision: '2023-10-01',
    fechaRegistro: '2023-10-02',
    sustento: SustentoTributario.CREDITO_TRIBUTARIO,
    descripcion: 'Servicio de Internet Fibra Óptica - Matriz',
    subtotal15: 45.00,
    subtotal0: 0,
    montoIva: 6.75,
    total: 51.75,
    tieneRetencion: true,
    estadoRetencion: 'EMITIDA',
    nroRetencion: '001-002-000000451',
    createdAt: '2023-10-02T09:00:00Z',
    updatedAt: '2023-10-02T09:00:00Z',
    createdBy: 'admin'
  },
  {
    id: 'c2',
    empresaId: '1',
    proveedor: MOCK_PROVEEDORES.TIENDA,
    tipoComprobante: '01',
    secuencial: '045-002-000123456',
    autorizacion: '1010202301099000419600120450020001234561234567812',
    fechaEmision: '2023-10-15',
    fechaRegistro: '2023-10-15',
    sustento: SustentoTributario.COSTO_GASTO,
    descripcion: 'Suministros de oficina y cafetería',
    subtotal15: 120.50,
    subtotal0: 15.00,
    montoIva: 18.08,
    total: 153.58,
    tieneRetencion: true,
    estadoRetencion: 'PENDIENTE',
    createdAt: '2023-10-15T14:30:00Z',
    updatedAt: '2023-10-15T14:30:00Z',
    createdBy: 'asistente'
  },
  {
    id: 'c3',
    empresaId: '1',
    proveedor: MOCK_PROVEEDORES.CONSULTOR,
    tipoComprobante: '01',
    secuencial: '001-001-000000054',
    autorizacion: '1123456789', // Física
    fechaEmision: '2023-10-20',
    fechaRegistro: '2023-10-21',
    sustento: SustentoTributario.CREDITO_TRIBUTARIO,
    descripcion: 'Mantenimiento de aires acondicionados',
    subtotal15: 350.00,
    subtotal0: 0,
    montoIva: 52.50,
    total: 402.50,
    tieneRetencion: true,
    estadoRetencion: 'PENDIENTE',
    createdAt: '2023-10-21T10:00:00Z',
    updatedAt: '2023-10-21T10:00:00Z',
    createdBy: 'admin'
  }
];

const MOCK_ORDENES: OrdenCompra[] = [
    {
        id: 'oc1',
        empresaId: '1',
        secuencial: 'OC-2023-001',
        proveedor: MOCK_PROVEEDORES.TIENDA,
        fechaEmision: '2023-10-28',
        fechaEntrega: '2023-11-05',
        observacion: 'Reposición de stock de cafetería para evento anual',
        detalles: [
            { producto: 'Café Grano 1kg', cantidad: 10, precioUnitario: 15.00, subtotal: 150.00, grabaIva: true },
            { producto: 'Azúcar 5kg', cantidad: 5, precioUnitario: 4.50, subtotal: 22.50, grabaIva: false }
        ],
        subtotal: 172.50,
        iva: 22.50,
        total: 195.00,
        estado: 'PENDIENTE',
        createdAt: '2023-10-28T09:00:00Z',
        updatedAt: '2023-10-28T09:00:00Z',
        createdBy: 'bodega'
    }
];

export class InMemoryCompraRepository implements CompraRepository {
  async getAll(empresaId: string): Promise<Compra[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_COMPRAS.filter(c => c.empresaId === empresaId);
  }

  async save(compra: Compra): Promise<void> {
    MOCK_COMPRAS.push(compra);
  }

  async generarRetencion(compraId: string): Promise<void> {
    const compra = MOCK_COMPRAS.find(c => c.id === compraId);
    if (compra) {
      compra.estadoRetencion = 'EMITIDA';
      compra.nroRetencion = '001-002-' + Math.floor(Math.random() * 10000).toString().padStart(9, '0');
    }
  }

  // --- ORDENES ---
  async getOrdenes(empresaId: string): Promise<OrdenCompra[]> {
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_ORDENES.filter(o => o.empresaId === empresaId);
  }

  async saveOrden(orden: OrdenCompra): Promise<void> {
      MOCK_ORDENES.push(orden);
  }

  async actualizarEstadoOrden(id: string, estado: OrdenCompra['estado']): Promise<void> {
      const orden = MOCK_ORDENES.find(o => o.id === id);
      if (orden) {
          orden.estado = estado;
      }
  }
}
