/**
 * Ejemplos de uso de las validaciones de identificación ecuatoriana
 * Este archivo puede ser usado para testing manual o como referencia
 */

import {
    validarCedula,
    validarRUC,
    validarPasaporte,
    validarIdentificacion,
    formatearIdentificacion
} from './validacionesIdentificacion';

// ============================================
// EJEMPLOS DE CÉDULAS VÁLIDAS
// ============================================

console.log('=== VALIDACIÓN DE CÉDULAS ===\n');

// Cédula válida de ejemplo
const cedulaValida = '1714567890';
console.log(`Cédula: ${cedulaValida}`);
console.log('Resultado:', validarCedula(cedulaValida));
console.log('Formateada:', formatearIdentificacion(cedulaValida, '05'));
console.log('');

// Cédula inválida (dígito verificador incorrecto)
const cedulaInvalida = '1714567891';
console.log(`Cédula: ${cedulaInvalida}`);
console.log('Resultado:', validarCedula(cedulaInvalida));
console.log('');

// Cédula con longitud incorrecta
const cedulaCorta = '171456789';
console.log(`Cédula: ${cedulaCorta}`);
console.log('Resultado:', validarCedula(cedulaCorta));
console.log('');

// ============================================
// EJEMPLOS DE RUC VÁLIDOS
// ============================================

console.log('=== VALIDACIÓN DE RUC ===\n');

// RUC de Persona Natural (cédula + 001)
const rucPersonaNatural = '1714567890001';
console.log(`RUC Persona Natural: ${rucPersonaNatural}`);
console.log('Resultado:', validarRUC(rucPersonaNatural));
console.log('Formateado:', formatearIdentificacion(rucPersonaNatural, '04'));
console.log('');

// RUC de Sociedad Privada (tercer dígito = 9)
const rucSociedadPrivada = '1790016919001';
console.log(`RUC Sociedad Privada: ${rucSociedadPrivada}`);
console.log('Resultado:', validarRUC(rucSociedadPrivada));
console.log('');

// RUC de Sociedad Pública (tercer dígito = 6)
const rucSociedadPublica = '1760001550001';
console.log(`RUC Sociedad Pública: ${rucSociedadPublica}`);
console.log('Resultado:', validarRUC(rucSociedadPublica));
console.log('');

// RUC inválido
const rucInvalido = '1790016919002'; // Últimos dígitos incorrectos
console.log(`RUC Inválido: ${rucInvalido}`);
console.log('Resultado:', validarRUC(rucInvalido));
console.log('');

// ============================================
// EJEMPLOS DE PASAPORTES
// ============================================

console.log('=== VALIDACIÓN DE PASAPORTES ===\n');

const pasaporteValido = 'AB123456';
console.log(`Pasaporte: ${pasaporteValido}`);
console.log('Resultado:', validarPasaporte(pasaporteValido));
console.log('');

const pasaporteInvalido = 'AB@123'; // Contiene caracteres especiales
console.log(`Pasaporte: ${pasaporteInvalido}`);
console.log('Resultado:', validarPasaporte(pasaporteInvalido));
console.log('');

// ============================================
// VALIDACIÓN GENÉRICA POR TIPO
// ============================================

console.log('=== VALIDACIÓN GENÉRICA ===\n');

// Validar RUC usando función genérica
console.log('Validar RUC (tipo 04):', validarIdentificacion('04', '1790016919001'));
console.log('');

// Validar Cédula usando función genérica
console.log('Validar Cédula (tipo 05):', validarIdentificacion('05', '1714567890'));
console.log('');

// Validar Pasaporte usando función genérica
console.log('Validar Pasaporte (tipo 06):', validarIdentificacion('06', 'AB123456'));
console.log('');

// Validar Consumidor Final
console.log('Validar Consumidor Final (tipo 07):', validarIdentificacion('07', '9999999999999'));
console.log('');

// Validar Identificación del Exterior
console.log('Validar ID Exterior (tipo 08):', validarIdentificacion('08', 'EXT123456'));
console.log('');

// ============================================
// CASOS DE USO EN FORMULARIOS
// ============================================

console.log('=== CASOS DE USO EN FORMULARIOS ===\n');

/**
 * Ejemplo de cómo usar en un formulario React
 */
function ejemploFormulario() {
    const tipoIdentificacion = '05'; // Cédula
    const identificacion = '1714567890';

    const resultado = validarIdentificacion(
        tipoIdentificacion as '04' | '05' | '06' | '07' | '08',
        identificacion
    );

    if (!resultado.isValid) {
        console.log('Error de validación:', resultado.error);
        // Mostrar error al usuario
        return false;
    }

    console.log('Identificación válida, proceder con el formulario');
    return true;
}

ejemploFormulario();
