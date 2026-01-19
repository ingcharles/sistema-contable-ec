/**
 * Utilidad para formatear valores monetarios según estándares ecuatorianos
 * Ecuador usa el dólar estadounidense (USD)
 */

export interface FormatOptions {
    incluirSimbolo?: boolean;
    decimales?: number;
    locale?: string;
}

/**
 * Formatea un número como dinero ecuatoriano
 * @param valor - Valor numérico a formatear
 * @param options - Opciones de formateo
 * @returns String formateado como moneda
 */
export function formatearDinero(
    valor: number | string,
    options: FormatOptions = {}
): string {
    const {
        incluirSimbolo = true,
        decimales = 2,
        locale = 'es-EC',
    } = options;

    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;

    if (isNaN(numero)) {
        return incluirSimbolo ? '$0.00' : '0.00';
    }

    const formateado = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
    }).format(numero);

    return incluirSimbolo ? `$${formateado}` : formateado;
}

export const formatMoney = formatearDinero;

/**
 * Parsea un string de dinero a número
 * @param valor - String con formato de dinero
 * @returns Número parseado
 */
export function parsearDinero(valor: string): number {
    // Remover símbolos de moneda, espacios y separadores de miles
    const limpio = valor
        .replace(/[$\s]/g, '')
        .replace(/,/g, '');

    return parseFloat(limpio) || 0;
}

/**
 * Calcula el IVA de un valor
 * @param subtotal - Valor sin IVA
 * @param porcentajeIVA - Porcentaje de IVA (por defecto 15%)
 * @returns Valor del IVA
 */
export function calcularIVA(subtotal: number, porcentajeIVA: number = 15): number {
    return subtotal * (porcentajeIVA / 100);
}

/**
 * Calcula el total con IVA
 * @param subtotal - Valor sin IVA
 * @param porcentajeIVA - Porcentaje de IVA (por defecto 15%)
 * @returns Total con IVA incluido
 */
export function calcularTotalConIVA(subtotal: number, porcentajeIVA: number = 15): number {
    return subtotal + calcularIVA(subtotal, porcentajeIVA);
}
