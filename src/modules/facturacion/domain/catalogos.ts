/**
 * Catálogos oficiales del SRI según Ficha Técnica Comprobantes Electrónicos Offline v2.1.0
 */

export const TIPO_COMPROBANTE = {
    FACTURA: '01',
    LIQUIDACION_COMPRA: '03',
    NOTA_CREDITO: '04',
    NOTA_DEBITO: '05',
    GUIA_REMISION: '06',
    COMPROBANTE_RETENCION: '07',
};

export const TIPO_IDENTIFICACION = {
    RUC: '04',
    CEDULA: '05',
    PASAPORTE: '06',
    CONSUMIDOR_FINAL: '07',
    IDENTIFICACION_EXTERIOR: '08',
};

export const CODIGO_IMPUESTO = {
    IVA: '2',
    ICE: '3',
    IRBPNR: '5',
};

export const TARIFA_IVA = {
    IVA_0: '0',
    IVA_12: '2',
    IVA_14: '3', // Deprecated
    IVA_15: '4', // Tarifa actual 2024
    NO_OBJETO: '6',
    EXENTO: '7',
};

export const FORMA_PAGO = {
    SIN_SISTEMA_FINANCIERO: '01',
    TARJETA_DEBITO: '16',
    DINERO_ELECTRONICO: '17',
    TARJETA_PREPAGO: '18',
    TARJETA_CREDITO: '19',
    OTROS_CON_SISTEMA_FINANCIERO: '20',
    ENDOSO_TITULOS: '21',
};

export const AMBIENTE = {
    PRUEBAS: '1',
    PRODUCCION: '2',
};

export const TIPO_EMISION = {
    NORMAL: '1',
};
