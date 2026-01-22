import { Auditable } from '@/shared/types';

export enum TipoCuenta {
    CORRIENTE = 'CORRIENTE',
    AHORROS = 'AHORROS'
}

export enum TipoMovimientoBancario {
    DEPOSITO = 'DEPOSITO',
    TRANSFERENCIA_ENVIADA = 'TRANSFERENCIA_ENVIADA', // SPI
    TRANSFERENCIA_RECIBIDA = 'TRANSFERENCIA_RECIBIDA',
    CHEQUE = 'CHEQUE',
    NOTA_DEBITO = 'NOTA_DEBITO',
    NOTA_CREDITO = 'NOTA_CREDITO'
}

export interface CuentaBancaria extends Auditable {
    id: string;
    empresaId: string;
    banco: string; // Pichincha, Guayaquil, Pacifico
    numeroCuenta: string;
    tipo: TipoCuenta;
    saldoContable: number;
    saldoDisponible: number;
    moneda: string;
    cuentaContableCodigo?: string;
}

export interface MovimientoBancario extends Auditable {
    id: string;
    cuentaId: string;
    fecha: string;
    tipo: TipoMovimientoBancario;
    referencia: string; // Nro cheque o comprobante
    beneficiario: string;
    concepto: string;
    monto: number;
    esEgreso: boolean; // True si resta, False si suma
    conciliado: boolean;
    conciliacionId?: string;
}

export enum EstadoConciliacion {
    BORRADOR = 'BORRADOR',
    CUADRADO = 'CUADRADO',
    PENDIENTE = 'PENDIENTE'
}

export interface BancoConciliacion extends Auditable {
    id: string;
    empresaId: string;
    cuentaId: string;
    fechaCorte: string;
    saldoLibro: number;
    saldoExtracto: number;
    chequesNoCobrados: number;
    depositosEnTransito: number;
    diferencia: number;
    estado: EstadoConciliacion;
    observaciones?: string;
}


export interface BancosRepository {
    getCuentas(empresaId: string): Promise<CuentaBancaria[]>;
    getMovimientos(cuentaId: string, fechaInicio: string, fechaFin: string): Promise<MovimientoBancario[]>;
    saveMovimiento(movimiento: MovimientoBancario): Promise<void>;

    // Conciliación
    getConciliaciones(cuentaId: string): Promise<BancoConciliacion[]>;
    getConciliacion(id: string): Promise<BancoConciliacion | null>;
    saveConciliacion(conciliacion: BancoConciliacion): Promise<BancoConciliacion>;
    updateMovimientosConciliados(movimientoIds: string[], conciliacionId: string): Promise<void>;
}

