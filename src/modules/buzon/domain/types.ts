import { Auditable } from '@/shared/types';

export enum TipoComprobanteBuzon {
    FACTURA = '01',
    LIQUIDACION_COMPRA = '03',
    NOTA_CREDITO = '04',
    NOTA_DEBITO = '05',
    GUIA_REMISION = '06',
    RETENCION = '07'
}

export interface ComprobanteRecibido extends Auditable {
    id: string;
    empresaId: string;
    tipo: TipoComprobanteBuzon;
    secuencial: string;
    rucEmisor: string;
    razonSocialEmisor: string;
    fechaEmision: string;
    fechaRecepcion: string;
    montoTotal: number;
    claveAcceso: string;
    estado: 'RECIBIDO' | 'PROCESADO' | 'RECHAZADO';
    asociadoA?: string; // ID de la compra o gasto asociado
}

export interface BuzonRepository {
    getComprobantes(empresaId: string, filtros?: any): Promise<ComprobanteRecibido[]>;
    importarDesdeSRI(empresaId: string, fechaInicio: string, fechaFin: string): Promise<number>;
    procesarComprobante(id: string): Promise<void>;
}
