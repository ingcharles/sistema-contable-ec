import { Auditable } from '../../../types';

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
}
