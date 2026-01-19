import { Auditable } from '@/shared/types';

export enum TipoReporte {
    ESTADO_RESULTADOS = 'ESTADO_RESULTADOS',
    BALANCE_GENERAL = 'BALANCE_GENERAL',
    FLUJO_CAJA = 'FLUJO_CAJA',
    VENTAS_POR_PRODUCTO = 'VENTAS_POR_PRODUCTO',
    GASTOS_POR_CATEGORIA = 'GASTOS_POR_CATEGORIA'
}

export interface ReporteFinanciero extends Auditable {
    id: string;
    empresaId: string;
    tipo: TipoReporte;
    periodo: string;
    datos: any;
    urlPdf?: string;
    urlExcel?: string;
}

export interface KpiFinanciero {
    nombre: string;
    valor: number;
    tendencia: 'ALZA' | 'BAJA' | 'NEUTRAL';
    porcentajeVariacion: number;
}

export interface ReportesRepository {
    getKpis(empresaId: string, periodo: string): Promise<KpiFinanciero[]>;
    generarReporte(empresaId: string, tipo: TipoReporte, periodo: string): Promise<ReporteFinanciero>;
}
