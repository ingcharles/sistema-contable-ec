/**
 * Catálogos del SRI y otros
 * Basados en configuracion.catalogos_items
 */

export const TIPO_COMPROBANTE_SRI: Record<string, string> = {
    '01': 'FACTURA',
    '03': 'LIQUIDACIÓN DE KOMPRA',
    '04': 'NOTA DE CRÉDITO',
    '05': 'NOTA DE DÉBITO',
    '06': 'GUÍA DE REMISIÓN',
    '07': 'COMPROBANTE DE RETENCIÓN'
};

export const getTipoComprobanteNombre = (codigo: string): string => {
    return TIPO_COMPROBANTE_SRI[codigo] || codigo;
};
