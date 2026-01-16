
import { FacturaRepository, Factura, GuiaRemision } from '../domain/types';
import { EstadoSRI, TipoComprobante } from '../../../types';

// MOCK DATA - En producción esto conectaría a una API REST/GraphQL
const MOCK_FACTURAS: Factura[] = [
  {
    id: 'f1',
    empresaId: '1',
    tipo: TipoComprobante.FACTURA,
    secuencial: '001-002-000004521',
    fechaEmision: '2023-10-25',
    terceroNombre: 'CORPORACIÓN FAVORITA C.A.',
    terceroId: '1790016919001',
    terceroEmail: 'recepcion@favorita.com',
    subtotal: 1500.00,
    descuento: 0,
    totalImpuestos: 180.00,
    importeTotal: 1680.00,
    estado: EstadoSRI.AUTORIZADO,
    claveAcceso: '2510202301179001691900120010020000045211234567819',
    createdAt: '2023-10-25T10:00:00Z',
    updatedAt: '2023-10-25T10:05:00Z',
    createdBy: 'user1'
  },
  {
    id: 'f2',
    empresaId: '1',
    tipo: TipoComprobante.RETENCION,
    secuencial: '001-002-000000123',
    fechaEmision: '2023-10-26',
    terceroNombre: 'JUAN PEREZ CONSULTING',
    terceroId: '1712345678001',
    terceroEmail: 'juan@perez.com',
    subtotal: 500.00,
    descuento: 0,
    totalImpuestos: 0,
    importeTotal: 500.00,
    estado: EstadoSRI.PENDIENTE,
    claveAcceso: '2610202307171234567800120010020000001231234567811',
    createdAt: '2023-10-26T09:00:00Z',
    updatedAt: '2023-10-26T09:00:00Z',
    createdBy: 'user1'
  },
  {
    id: 'f3',
    empresaId: '2', // Otra empresa
    tipo: TipoComprobante.FACTURA,
    secuencial: '001-010-000009988',
    fechaEmision: '2023-10-27',
    terceroNombre: 'IMPORTADORA ANDINA',
    terceroId: '0990004445001',
    terceroEmail: 'facturacion@andina.com',
    subtotal: 3200.50,
    descuento: 100.50,
    totalImpuestos: 384.06,
    importeTotal: 3484.06,
    estado: EstadoSRI.ANULADO,
    claveAcceso: '2710202301099000444500120010100000099881234567812',
    createdAt: '2023-10-27T11:00:00Z',
    updatedAt: '2023-10-28T14:00:00Z',
    createdBy: 'user2'
  }
];

const MOCK_GUIAS: GuiaRemision[] = [
    {
        id: 'g1',
        empresaId: '1',
        tipo: TipoComprobante.GUIA_REMISION,
        secuencial: '001-002-000000056',
        fechaEmision: '2023-10-25',
        fechaInicioTransporte: '2023-10-25',
        fechaFinTransporte: '2023-10-26',
        nroFactura: '001-002-000004521',
        destinatarioNombre: 'CORPORACIÓN FAVORITA C.A.',
        destinatarioId: '1790016919001',
        transportista: {
            ruc: '1722334455001',
            razonSocial: 'TRANSPORTES VELOCES S.A.',
            placa: 'PBA-4567'
        },
        direccionPartida: 'Av. Amazonas y NN.UU',
        direccionLlegada: 'Bodegas Supermaxi Cumbayá',
        motivoTraslado: 'VENTA',
        estado: EstadoSRI.AUTORIZADO,
        claveAcceso: '2510202306179001122300120010020000000561234567811',
        itemsDescripcion: 'VARIOS ITEMS DE SUPERMERCADO',
        createdAt: '2023-10-25T11:00:00Z',
        updatedAt: '2023-10-25T11:00:00Z',
        createdBy: 'bodega'
    }
];

export class InMemoryFacturaRepository implements FacturaRepository {
  async getAll(empresaId: string): Promise<Factura[]> {
    // Simula latencia de red
    await new Promise(resolve => setTimeout(resolve, 400));
    return MOCK_FACTURAS.filter(f => f.empresaId === empresaId);
  }

  async getById(id: string): Promise<Factura | null> {
    const factura = MOCK_FACTURAS.find(f => f.id === id);
    return factura || null;
  }

  async save(factura: Factura): Promise<void> {
    const index = MOCK_FACTURAS.findIndex(f => f.id === factura.id);
    if (index >= 0) {
      MOCK_FACTURAS[index] = factura;
    } else {
      MOCK_FACTURAS.push(factura);
    }
  }

  async anular(id: string, razon: string): Promise<void> {
    const index = MOCK_FACTURAS.findIndex(f => f.id === id);
    if (index >= 0) {
      MOCK_FACTURAS[index] = {
        ...MOCK_FACTURAS[index],
        estado: EstadoSRI.ANULADO,
        mensajeError: `Anulado por usuario: ${razon}`
      };
    }
  }

  // --- MÉTODOS GUÍAS ---
  async getGuias(empresaId: string): Promise<GuiaRemision[]> {
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_GUIAS.filter(g => g.empresaId === empresaId);
  }

  async saveGuia(guia: GuiaRemision): Promise<void> {
      MOCK_GUIAS.push(guia);
  }
}
