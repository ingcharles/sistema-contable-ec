/**
 * Utilidad para parsear extractos bancarios en formato CSV
 * Soporta formatos comunes de bancos ecuatorianos
 */

export interface MovimientoExtracto {
    fecha: string;
    referencia: string;
    concepto: string;
    debito: number;
    credito: number;
    saldo?: number;
}

export interface ResultadoParseo {
    movimientos: MovimientoExtracto[];
    saldoFinal?: number;
    errores: string[];
}

// Formato genérico: Fecha, Referencia, Concepto, Débito, Crédito, Saldo
// const COLUMNAS_GENERICAS = ['fecha', 'referencia', 'concepto', 'debito', 'credito', 'saldo'];

// Formatos específicos por banco
// const FORMATOS_BANCO: Record<string, string[]> = {
//     'PICHINCHA': ['fecha', 'referencia', 'descripcion', 'debito', 'credito', 'saldo'],
//     'GUAYAQUIL': ['fecha', 'documento', 'concepto', 'valor_debito', 'valor_credito', 'saldo'],
//     'PACIFICO': ['fecha_movimiento', 'numero', 'detalle', 'debitos', 'creditos', 'saldo_disponible'],
//     'PRODUBANCO': ['fecha', 'numero_documento', 'descripcion', 'debito', 'credito', 'saldo'],
//     'INTERNACIONAL': ['fecha', 'referencia', 'concepto', 'debito', 'credito', 'saldo']
// };

/**
 * Parsea el contenido de un archivo CSV de extracto bancario
 */
export function parseExtractoBancario(contenido: string, banco?: string): ResultadoParseo {
    const errores: string[] = [];
    const movimientos: MovimientoExtracto[] = [];

    // Normalizar saltos de línea
    const lineas = contenido
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .filter(linea => linea.trim().length > 0);

    if (lineas.length < 2) {
        return {
            movimientos: [],
            errores: ['El archivo no contiene datos suficientes']
        };
    }

    // Detectar el delimitador
    const delimitador = detectarDelimitador(lineas[0]);

    // Obtener encabezados
    const encabezados = parsearLinea(lineas[0], delimitador)
        .map(h => normalizarEncabezado(h));

    // Mapear columnas
    const mapeoColumnas = mapearColumnas(encabezados, banco);

    if (!mapeoColumnas.fecha || (!mapeoColumnas.debito && !mapeoColumnas.credito)) {
        errores.push('No se pudieron identificar las columnas necesarias (fecha, débito/crédito)');
        return { movimientos: [], errores };
    }

    let saldoFinal: number | undefined;

    // Procesar cada línea de datos
    for (let i = 1; i < lineas.length; i++) {
        const valores = parsearLinea(lineas[i], delimitador);

        if (valores.length < encabezados.length - 1) {
            continue; // Saltar líneas incompletas
        }

        try {
            const fecha = parsearFecha(valores[mapeoColumnas.fecha!]);
            if (!fecha) {
                continue; // Saltar si no tiene fecha válida
            }

            const debito = parsearMonto(valores[mapeoColumnas.debito ?? -1] || '0');
            const credito = parsearMonto(valores[mapeoColumnas.credito ?? -1] || '0');
            const saldo = mapeoColumnas.saldo !== undefined
                ? parsearMonto(valores[mapeoColumnas.saldo] || '0')
                : undefined;

            // Si hay saldo, guardamos el último como saldo final
            if (saldo !== undefined) {
                saldoFinal = saldo;
            }

            movimientos.push({
                fecha,
                referencia: valores[mapeoColumnas.referencia ?? mapeoColumnas.fecha!]?.trim() || '',
                concepto: valores[mapeoColumnas.concepto ?? mapeoColumnas.fecha!]?.trim() || '',
                debito,
                credito,
                saldo
            });
        } catch (e) {
            errores.push(`Error en línea ${i + 1}: ${e instanceof Error ? e.message : 'Error desconocido'}`);
        }
    }

    return { movimientos, saldoFinal, errores };
}

/**
 * Detecta el delimitador usado en el CSV
 */
function detectarDelimitador(linea: string): string {
    const delimitadores = [',', ';', '\t', '|'];
    let maxCount = 0;
    let mejorDelimitador = ',';

    for (const delim of delimitadores) {
        const count = (linea.match(new RegExp(delim, 'g')) || []).length;
        if (count > maxCount) {
            maxCount = count;
            mejorDelimitador = delim;
        }
    }

    return mejorDelimitador;
}

/**
 * Parsea una línea CSV respetando comillas
 */
function parsearLinea(linea: string, delimitador: string): string[] {
    const resultado: string[] = [];
    let actual = '';
    let dentroComillas = false;

    for (let i = 0; i < linea.length; i++) {
        const char = linea[i];

        if (char === '"') {
            dentroComillas = !dentroComillas;
        } else if (char === delimitador && !dentroComillas) {
            resultado.push(actual.trim());
            actual = '';
        } else {
            actual += char;
        }
    }

    resultado.push(actual.trim());
    return resultado;
}

/**
 * Normaliza el nombre de un encabezado para facilitar el mapeo
 */
function normalizarEncabezado(encabezado: string): string {
    return encabezado
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

/**
 * Mapea las columnas del CSV a los campos requeridos
 */
function mapearColumnas(encabezados: string[], _banco?: string): Record<string, number | undefined> {
    const mapeo: Record<string, number | undefined> = {
        fecha: undefined,
        referencia: undefined,
        concepto: undefined,
        debito: undefined,
        credito: undefined,
        saldo: undefined
    };

    const patronesFecha = ['fecha', 'date', 'fecha_movimiento', 'fecha_valor', 'f_movimiento'];
    const patronesReferencia = ['referencia', 'ref', 'documento', 'numero', 'numero_documento', 'nro', 'comprobante'];
    const patronesConcepto = ['concepto', 'descripcion', 'detalle', 'descripcion_movimiento', 'glosa'];
    const patronesDebito = ['debito', 'debitos', 'valor_debito', 'egreso', 'cargo', 'retiro'];
    const patronesCredito = ['credito', 'creditos', 'valor_credito', 'ingreso', 'abono', 'deposito'];
    const patronesSaldo = ['saldo', 'saldo_disponible', 'saldo_contable', 'balance'];

    for (let i = 0; i < encabezados.length; i++) {
        const enc = encabezados[i];

        if (!mapeo.fecha && patronesFecha.some(p => enc.includes(p))) {
            mapeo.fecha = i;
        }
        if (!mapeo.referencia && patronesReferencia.some(p => enc.includes(p))) {
            mapeo.referencia = i;
        }
        if (!mapeo.concepto && patronesConcepto.some(p => enc.includes(p))) {
            mapeo.concepto = i;
        }
        if (!mapeo.debito && patronesDebito.some(p => enc.includes(p))) {
            mapeo.debito = i;
        }
        if (!mapeo.credito && patronesCredito.some(p => enc.includes(p))) {
            mapeo.credito = i;
        }
        if (!mapeo.saldo && patronesSaldo.some(p => enc.includes(p))) {
            mapeo.saldo = i;
        }
    }

    return mapeo;
}

/**
 * Parsea una fecha en varios formatos comunes
 */
function parsearFecha(valor: string): string | null {
    if (!valor || valor.trim() === '') return null;

    const limpio = valor.trim();

    // Formato: DD/MM/YYYY o DD-MM-YYYY
    const matchDMY = limpio.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (matchDMY) {
        const [, dia, mes, anio] = matchDMY;
        return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    // Formato: YYYY/MM/DD o YYYY-MM-DD
    const matchYMD = limpio.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (matchYMD) {
        const [, anio, mes, dia] = matchYMD;
        return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    // Formato: DD/MM/YY
    const matchDMYShort = limpio.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
    if (matchDMYShort) {
        const [, dia, mes, anioCorto] = matchDMYShort;
        const anio = parseInt(anioCorto) > 50 ? `19${anioCorto}` : `20${anioCorto}`;
        return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    return null;
}

/**
 * Parsea un monto monetario
 */
function parsearMonto(valor: string): number {
    if (!valor || valor.trim() === '' || valor.trim() === '-') return 0;

    // Remover símbolos de moneda y espacios
    let limpio = valor.replace(/[$€£¥]/g, '').trim();

    // Detectar formato: 1.234,56 vs 1,234.56
    const tieneComaDecimal = limpio.match(/,\d{2}$/);
    const tienePuntoDecimal = limpio.match(/\.\d{2}$/);

    if (tieneComaDecimal) {
        // Formato europeo/latinoamericano: 1.234,56
        limpio = limpio.replace(/\./g, '').replace(',', '.');
    } else if (tienePuntoDecimal) {
        // Formato americano: 1,234.56
        limpio = limpio.replace(/,/g, '');
    } else {
        // Sin decimales, solo remover separadores
        limpio = limpio.replace(/[.,]/g, '');
    }

    const numero = parseFloat(limpio);
    return isNaN(numero) ? 0 : Math.abs(numero);
}

/**
 * Compara movimientos del extracto con movimientos del sistema
 * para encontrar coincidencias automáticas
 */
export function emparejarMovimientos(
    movimientosExtracto: MovimientoExtracto[],
    movimientosSistema: Array<{
        id: string;
        fecha: string;
        monto: number;
        esEgreso: boolean;
        referencia?: string;
    }>
): Map<string, string> {
    const emparejamientos = new Map<string, string>(); // movExtractoIdx -> movSistemaId
    const sistemaMarcados = new Set<string>();

    // Ordenar por monto para mejor emparejamiento
    const extractoOrdenado = movimientosExtracto.map((m, idx) => ({ ...m, idx }));

    for (const movExtracto of extractoOrdenado) {
        const montoExtracto = movExtracto.debito > 0 ? movExtracto.debito : movExtracto.credito;
        const esEgresoExtracto = movExtracto.debito > 0;

        // Buscar coincidencia exacta: fecha, monto y tipo
        for (const movSistema of movimientosSistema) {
            if (sistemaMarcados.has(movSistema.id)) continue;

            const coincideFecha = movSistema.fecha === movExtracto.fecha;
            const coincideMonto = Math.abs(movSistema.monto - montoExtracto) < 0.01;
            const coincideTipo = movSistema.esEgreso === esEgresoExtracto;

            if (coincideFecha && coincideMonto && coincideTipo) {
                emparejamientos.set(String(movExtracto.idx), movSistema.id);
                sistemaMarcados.add(movSistema.id);
                break;
            }
        }
    }

    // Segunda pasada: coincidencias parciales (solo monto y tipo, fecha ±3 días)
    for (const movExtracto of extractoOrdenado) {
        if (emparejamientos.has(String(movExtracto.idx))) continue;

        const montoExtracto = movExtracto.debito > 0 ? movExtracto.debito : movExtracto.credito;
        const esEgresoExtracto = movExtracto.debito > 0;
        const fechaExtracto = new Date(movExtracto.fecha);

        for (const movSistema of movimientosSistema) {
            if (sistemaMarcados.has(movSistema.id)) continue;

            const fechaSistema = new Date(movSistema.fecha);
            const diffDias = Math.abs(fechaExtracto.getTime() - fechaSistema.getTime()) / (1000 * 60 * 60 * 24);

            const coincideMonto = Math.abs(movSistema.monto - montoExtracto) < 0.01;
            const coincideTipo = movSistema.esEgreso === esEgresoExtracto;
            const fechaCercana = diffDias <= 3;

            if (coincideMonto && coincideTipo && fechaCercana) {
                emparejamientos.set(String(movExtracto.idx), movSistema.id);
                sistemaMarcados.add(movSistema.id);
                break;
            }
        }
    }

    return emparejamientos;
}
