import { Auditable } from '@/shared/types';

export enum TipoMovimientoCaja {
    INGRESO = 'INGRESO',
    EGRESO = 'EGRESO'
}

export enum EstadoVale {
    PENDIENTE = 'PENDIENTE',
    LIQUIDADO = 'LIQUIDADO',
    ANULADO = 'ANULADO'
}

export interface ValeCajaChica extends Auditable {
    id: string;
    empresaId: string;
    numero: string;
    fecha: string;
    beneficiario: string;
    concepto: string;
    monto: number;
    tipo: TipoMovimientoCaja;
    estado: EstadoVale;
    categoria?: string;
}

export interface CajaChicaInfo {
    id: string;
    empresaId: string;
    nombre: string;
    responsable: string;
    montoAsignado: number;
    saldoActual: number;
    ultimaReposicion?: string;
}

export interface CajaChicaRepository {
    getCajaInfo(empresaId: string): Promise<CajaChicaInfo>;
    getVales(empresaId: string): Promise<ValeCajaChica[]>;
    saveVale(vale: ValeCajaChica): Promise<void>;
    liquidarVales(ids: string[]): Promise<void>;
    anularVale(id: string): Promise<void>;
}
