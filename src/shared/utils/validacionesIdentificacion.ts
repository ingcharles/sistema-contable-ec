/**
 * Utilidades para validar identificaciones ecuatorianas según estándares del SRI
 * 
 * Referencias:
 * - Algoritmo de validación de cédula y RUC del Registro Civil del Ecuador
 * - Normativa SRI para comprobantes electrónicos
 */

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Valida una cédula ecuatoriana (10 dígitos)
 * Algoritmo: Módulo 10
 */
export function validarCedula(cedula: string): ValidationResult {
    // Limpiar espacios y guiones
    const cedulaLimpia = cedula.replace(/[\s-]/g, '');

    // Verificar longitud
    if (cedulaLimpia.length !== 10) {
        return {
            isValid: false,
            error: 'La cédula debe tener 10 dígitos'
        };
    }

    // Verificar que solo contenga números
    if (!/^\d+$/.test(cedulaLimpia)) {
        return {
            isValid: false,
            error: 'La cédula debe contener solo números'
        };
    }

    // Verificar que los dos primeros dígitos correspondan a una provincia válida (01-24)
    const provincia = parseInt(cedulaLimpia.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) {
        return {
            isValid: false,
            error: 'Los dos primeros dígitos deben corresponder a una provincia válida (01-24)'
        };
    }

    // Verificar el tercer dígito (debe ser menor a 6 para personas naturales)
    const tercerDigito = parseInt(cedulaLimpia.charAt(2), 10);
    if (tercerDigito >= 6) {
        return {
            isValid: false,
            error: 'El tercer dígito debe ser menor a 6 para cédulas de personas naturales'
        };
    }

    // Algoritmo de validación del dígito verificador (Módulo 10)
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    const digitoVerificador = parseInt(cedulaLimpia.charAt(9), 10);
    let suma = 0;

    for (let i = 0; i < 9; i++) {
        let valor = parseInt(cedulaLimpia.charAt(i), 10) * coeficientes[i];
        if (valor >= 10) {
            valor -= 9;
        }
        suma += valor;
    }

    const residuo = suma % 10;
    const resultado = residuo === 0 ? 0 : 10 - residuo;

    if (resultado !== digitoVerificador) {
        return {
            isValid: false,
            error: 'El dígito verificador de la cédula es incorrecto'
        };
    }

    return { isValid: true };
}

/**
 * Valida un RUC ecuatoriano (13 dígitos)
 * Tipos de RUC:
 * - Persona Natural: 10 dígitos de cédula + 001
 * - Sociedad Privada: tercer dígito = 9
 * - Sociedad Pública: tercer dígito = 6
 */
export function validarRUC(ruc: string): ValidationResult {
    // Limpiar espacios y guiones
    const rucLimpio = ruc.replace(/[\s-]/g, '');

    // Verificar longitud
    if (rucLimpio.length !== 13) {
        return {
            isValid: false,
            error: 'El RUC debe tener 13 dígitos'
        };
    }

    // Verificar que solo contenga números
    if (!/^\d+$/.test(rucLimpio)) {
        return {
            isValid: false,
            error: 'El RUC debe contener solo números'
        };
    }

    // Verificar que los dos primeros dígitos correspondan a una provincia válida (01-24)
    const provincia = parseInt(rucLimpio.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) {
        return {
            isValid: false,
            error: 'Los dos primeros dígitos deben corresponder a una provincia válida (01-24)'
        };
    }

    const tercerDigito = parseInt(rucLimpio.charAt(2), 10);

    // RUC de Persona Natural (tercer dígito < 6)
    if (tercerDigito < 6) {
        // Validar los primeros 10 dígitos como cédula
        const cedulaValidation = validarCedula(rucLimpio.substring(0, 10));
        if (!cedulaValidation.isValid) {
            return {
                isValid: false,
                error: `RUC de persona natural inválido: ${cedulaValidation.error}`
            };
        }

        // Verificar que los últimos 3 dígitos sean 001
        const establecimiento = rucLimpio.substring(10, 13);
        if (establecimiento !== '001') {
            return {
                isValid: false,
                error: 'Para RUC de persona natural, los últimos 3 dígitos deben ser 001'
            };
        }

        return { isValid: true };
    }
    // RUC de Sociedad Pública (tercer dígito = 6)
    else if (tercerDigito === 6) {
        return validarRUCSociedadPublica(rucLimpio);
    }
    // RUC de Sociedad Privada (tercer dígito = 9)
    else if (tercerDigito === 9) {
        return validarRUCSociedadPrivada(rucLimpio);
    }
    else {
        return {
            isValid: false,
            error: 'El tercer dígito del RUC debe ser menor a 6, igual a 6 (sociedad pública) o igual a 9 (sociedad privada)'
        };
    }
}

/**
 * Valida RUC de Sociedad Privada (tercer dígito = 9)
 * Algoritmo: Módulo 11
 */
function validarRUCSociedadPrivada(ruc: string): ValidationResult {
    const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    const digitoVerificador = parseInt(ruc.charAt(9), 10);
    let suma = 0;

    for (let i = 0; i < 9; i++) {
        suma += parseInt(ruc.charAt(i), 10) * coeficientes[i];
    }

    const residuo = suma % 11;
    const resultado = residuo === 0 ? 0 : 11 - residuo;

    if (resultado !== digitoVerificador) {
        return {
            isValid: false,
            error: 'El dígito verificador del RUC de sociedad privada es incorrecto'
        };
    }

    // Verificar que los últimos 3 dígitos sean 001
    const establecimiento = ruc.substring(10, 13);
    if (establecimiento !== '001') {
        return {
            isValid: false,
            error: 'Para RUC de sociedad privada, los últimos 3 dígitos deben ser 001'
        };
    }

    return { isValid: true };
}

/**
 * Valida RUC de Sociedad Pública (tercer dígito = 6)
 * Algoritmo: Módulo 11
 */
function validarRUCSociedadPublica(ruc: string): ValidationResult {
    const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
    const digitoVerificador = parseInt(ruc.charAt(8), 10);
    let suma = 0;

    for (let i = 0; i < 8; i++) {
        suma += parseInt(ruc.charAt(i), 10) * coeficientes[i];
    }

    const residuo = suma % 11;
    const resultado = residuo === 0 ? 0 : 11 - residuo;

    if (resultado !== digitoVerificador) {
        return {
            isValid: false,
            error: 'El dígito verificador del RUC de sociedad pública es incorrecto'
        };
    }

    // Verificar que los últimos 4 dígitos sean 0001
    const establecimiento = ruc.substring(9, 13);
    if (establecimiento !== '0001') {
        return {
            isValid: false,
            error: 'Para RUC de sociedad pública, los últimos 4 dígitos deben ser 0001'
        };
    }

    return { isValid: true };
}

/**
 * Valida un pasaporte
 * Nota: No existe un algoritmo estándar para validar pasaportes internacionales
 * Se realiza una validación básica de formato
 */
export function validarPasaporte(pasaporte: string): ValidationResult {
    // Limpiar espacios
    const pasaporteLimpio = pasaporte.trim();

    // Verificar longitud mínima y máxima
    if (pasaporteLimpio.length < 5 || pasaporteLimpio.length > 20) {
        return {
            isValid: false,
            error: 'El pasaporte debe tener entre 5 y 20 caracteres'
        };
    }

    // Verificar que contenga solo letras y números
    if (!/^[A-Z0-9]+$/i.test(pasaporteLimpio)) {
        return {
            isValid: false,
            error: 'El pasaporte debe contener solo letras y números'
        };
    }

    return { isValid: true };
}

/**
 * Valida una identificación según su tipo
 */
export function validarIdentificacion(
    tipo: '04' | '05' | '06' | '07' | '08',
    identificacion: string
): ValidationResult {
    switch (tipo) {
        case '04': // RUC
            return validarRUC(identificacion);
        case '05': // Cédula
            return validarCedula(identificacion);
        case '06': // Pasaporte
            return validarPasaporte(identificacion);
        case '07': // Consumidor Final
            return {
                isValid: identificacion === '9999999999999',
                error: identificacion !== '9999999999999'
                    ? 'Para consumidor final debe ser 9999999999999'
                    : undefined
            };
        case '08': // Identificación del Exterior
            // Validación básica para identificaciones extranjeras
            if (identificacion.length < 3 || identificacion.length > 20) {
                return {
                    isValid: false,
                    error: 'La identificación del exterior debe tener entre 3 y 20 caracteres'
                };
            }
            return { isValid: true };
        default:
            return {
                isValid: false,
                error: 'Tipo de identificación no válido'
            };
    }
}

/**
 * Formatea una cédula o RUC para mostrar con guiones
 */
export function formatearIdentificacion(identificacion: string, tipo: '04' | '05'): string {
    const limpia = identificacion.replace(/[\s-]/g, '');

    if (tipo === '05' && limpia.length === 10) {
        // Formato cédula: XX-XXXXXXX-X
        return `${limpia.substring(0, 2)}-${limpia.substring(2, 9)}-${limpia.charAt(9)}`;
    } else if (tipo === '04' && limpia.length === 13) {
        // Formato RUC: XXXXXXXXXX-XXX
        return `${limpia.substring(0, 10)}-${limpia.substring(10, 13)}`;
    }

    return identificacion;
}
