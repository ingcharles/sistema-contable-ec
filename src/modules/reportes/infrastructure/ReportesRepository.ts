import { ReporteFinanciero, TipoReporte, ReportesRepository, KpiFinanciero } from '../domain/types';

export class InMemoryReportesRepository implements ReportesRepository {
    async getKpis(_empresaId: string, _periodo: string): Promise<KpiFinanciero[]> {
        await new Promise(resolve => setTimeout(resolve, 500));
        return [
            { nombre: 'Ingresos Totales', valor: 45200.50, tendencia: 'ALZA', porcentajeVariacion: 12.5 },
            { nombre: 'Gastos Operativos', valor: 28400.20, tendencia: 'BAJA', porcentajeVariacion: 5.2 },
            { nombre: 'Utilidad Neta', valor: 16800.30, tendencia: 'ALZA', porcentajeVariacion: 18.4 },
            { nombre: 'Margen Operativo', valor: 37.2, tendencia: 'NEUTRAL', porcentajeVariacion: 0.5 }
        ];
    }

    async generarReporte(empresaId: string, tipo: TipoReporte, periodo: string): Promise<ReporteFinanciero> {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
            id: Math.random().toString(36),
            empresaId,
            tipo,
            periodo,
            datos: {},
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'admin'
        };
    }
}
