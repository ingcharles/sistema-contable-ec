/**
 * Utilidades para manejo de fechas en formato SRI
 */
import { parseISO, format, isValid } from 'date-fns';

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
 * Convierte una fecha de formato ISO o similar a formato SRI (DD/MM/YYYY)
 * @param isoDate Fecha en formato ISO, timestamp o string
 * @returns Fecha en formato DD/MM/YYYY
 */
export function isoToSriDate(isoDate: any): string {
    if (!isoDate) return '';

    try {
        // Si ya es un objeto Date
        if (isoDate instanceof Date) {
            return isValid(isoDate) ? format(isoDate, 'dd/MM/yyyy') : '';
        }

        const dateStr = String(isoDate).trim();

        // Si ya está en formato SRI (DD/MM/YYYY), no re-formatear
        if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) return dateStr.substring(0, 10);

        // Intentar parsear como ISO
        let parsed = parseISO(dateStr);
        if (isValid(parsed)) return format(parsed, 'dd/MM/yyyy');

        // Si tiene espacio (ej: '2026-02-04 22:33'), intentar parsear solo la fecha
        if (dateStr.includes(' ')) {
            const datePart = dateStr.split(' ')[0];
            parsed = parseISO(datePart);
            if (isValid(parsed)) return format(parsed, 'dd/MM/yyyy');
        }

        // Intento final con Date nativo (maneja formatos como '2026-02-04 22:33' mejor en algunos entornos)
        const nativeDate = new Date(isoDate);
        if (isValid(nativeDate)) return format(nativeDate, 'dd/MM/yyyy');

    } catch (error) {
        console.error('Error al formatear fecha para SRI:', isoDate, error);
    }

    return String(isoDate);
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
