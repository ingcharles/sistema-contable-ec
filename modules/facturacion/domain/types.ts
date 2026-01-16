
import { EstadoSRI, TipoComprobante, Auditable } from '../../../types';

// DOMAIN ENTITY
export interface Factura extends Auditable {
  id: string;
  empresaId: string; // Multiempresa tenant
  tipo: TipoComprobante;
  secuencial: string; // Formato: 001-001-000000001
  fechaEmision: string;
  
  // Datos del Cliente/Proveedor
  terceroNombre: string;
  terceroId: string;
  terceroEmail: string;
  
  // Valores Económicos
  subtotal: number;
  descuento: number;
  totalImpuestos: number; // IVA + ICE + IRBPNR
  importeTotal: number;
  
  // Datos Tributarios
  estado: EstadoSRI;
  claveAcceso: string; // 49 dígitos
  autorizacionFecha?: string;
  mensajeError?: string;

  // Nota de Crédito
  documentoModificadoId?: string; // ID de la factura que modifica
  motivoModificacion?: string;
}

export interface Transportista {
    ruc: string;
    razonSocial: string;
    placa: string;
}

export interface GuiaRemision extends Auditable {
    id: string;
    empresaId: string;
    tipo: TipoComprobante; // '06'
    secuencial: string;
    fechaEmision: string;
    fechaInicioTransporte: string;
    fechaFinTransporte: string;
    
    // Vinculación
    facturaId?: string;
    nroFactura?: string;
    
    // Actores
    destinatarioNombre: string;
    destinatarioId: string;
    transportista: Transportista;
    
    // Ruta
    direccionPartida: string;
    direccionLlegada: string;
    motivoTraslado: string;
    
    estado: EstadoSRI;
    claveAcceso: string;
    itemsDescripcion: string; // Resumen de carga
}

// REPOSITORY INTERFACE (Port)
export interface FacturaRepository {
  getAll(empresaId: string): Promise<Factura[]>;
  getById(id: string): Promise<Factura | null>;
  save(factura: Factura): Promise<void>;
  anular(id: string, razon: string): Promise<void>;
  
  // Métodos para Guías
  getGuias(empresaId: string): Promise<GuiaRemision[]>;
  saveGuia(guia: GuiaRemision): Promise<void>;
}
