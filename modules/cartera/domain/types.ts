
import { Auditable } from '../../../types';

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

export interface TransaccionCartera {
    documentoId: string;
    fecha: string;
    valorEfectivo: number; // Lo que entra/sale de banco/caja
    valorRetencion: number; // Retención recibida (solo CxC) o aplicada (CxP ya descontada)
    formaPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE';
    bancoId?: string; // Cuenta afectada
    referencia: string; // Nro cheque / comprobante
    nroRetencionRecibida?: string; // Solo para CxC
}
