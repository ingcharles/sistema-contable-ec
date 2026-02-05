/**
 * Utilidades para manejo de fechas en formato SRI
 */

/**
 * Formatea una fecha en formato DD/MM/YYYY (estándar SRI Ecuador)
 * @param date Fecha a formatear (opcional, por defecto fecha actual)
 * @returns Fecha en formato DD/MM/YYYY
 */
export function formatearFechaSri(date: Date = new Date()): string {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

/**
 * Obtiene el período fiscal en formato MM/YYYY
 * @param date Fecha de referencia (opcional, por defecto fecha actual)
 * @returns Período fiscal en formato MM/YYYY
 */
export function obtenerPeriodoFiscal(date: Date = new Date()): string {
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    return `${mes}/${anio}`;
}

/**
 * Convierte una fecha de formato ISO (YYYY-MM-DD) a formato SRI (DD/MM/YYYY)
 * @param isoDate Fecha en formato ISO (YYYY-MM-DD)
 * @returns Fecha en formato DD/MM/YYYY
 */
export function isoToSriDate(isoDate: string): string {
    const date = new Date(isoDate + 'T00:00:00');
    return formatearFechaSri(date);
}

/**
 * Convierte una fecha de formato SRI (DD/MM/YYYY) a formato ISO (YYYY-MM-DD)
 * @param sriDate Fecha en formato DD/MM/YYYY
 * @returns Fecha en formato ISO (YYYY-MM-DD)
 */
export function sriToIsoDate(sriDate: string): string {
    const [dia, mes, anio] = sriDate.split('/');
    return `${anio}-${mes}-${dia}`;
}

/**
 * Obtiene la fecha actual en formato ISO local (YYYY-MM-DD)
 * Evita problemas de zona horaria (UTC vs Local)
 */
export function getLocalDateIso(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
