import { Auditable } from '@/shared/types';

export enum TipoCartera {
    CXC = 'CXC', // Cuentas por Cobrar (Clientes)
    CXP = 'CXP'  // Cuentas por Pagar (Proveedores)
}

export interface DocumentoPendiente extends Auditable {
    id: string;
    empresaId: string;
    tipo: TipoCartera;
    terceroId: string; // RUC/Cedula
    terceroNombre: string;
    nroComprobante: string; // Secuencial Factura
    fechaEmision: string;
    fechaVencimiento: string;
    diasCredito: number;

    // Valores
    montoTotal: number;
    totalPagado: number;
    saldoPendiente: number;

    // Estado calculado
    diasVencidos: number; // > 0 Vencido, < 0 Por Vencer
}

export interface Anticipo extends Auditable {
    id: string;
    empresaId: string;
    tipo: TipoCartera; // CXC = Anticipo Cliente (Pasivo), CXP = Anticipo Proveedor (Activo)
    terceroId: string;
    terceroNombre: string;
    fecha: string;
    referencia: string; // Cheque o Transferencia
    montoOriginal: number;
    montoUsado: number; // Monto cruzado
    saldoDisponible: number;
    estado: 'DISPONIBLE' | 'AGOTADO';
}

export interface TransaccionCartera {
    id: string;
    empresaId: string;
    documentoId?: string; // Opcional si es solo registro de anticipo
    anticipoId?: string; // Si es cruce
    fecha: string;
    valorEfectivo: number; // Lo que entra/sale de banco/caja
    valorRetencion?: number; // Retención recibida (solo CxC) o aplicada (CxP ya descontada)
    valorCruce?: number; // Valor usado del anticipo
    formaPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'CRUCE_ANTICIPO';
    bancoId?: string; // Cuenta afectada
    referencia: string; // Nro cheque / comprobante
    nroRetencionRecibida?: string; // Solo para CxC
}

export interface CarteraRepository {
    getDocumentosPendientes(empresaId: string, tipo: TipoCartera): Promise<DocumentoPendiente[]>;
    getAnticiposDisponibles(empresaId: string, tipo: TipoCartera, terceroId?: string): Promise<Anticipo[]>;
    savePago(pago: TransaccionCartera): Promise<void>;
    saveAnticipo(anticipo: Anticipo): Promise<void>;
}
