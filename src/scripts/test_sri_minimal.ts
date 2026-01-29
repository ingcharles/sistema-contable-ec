/**
 * Script MINIMALISTA para probar estructura XML con SRI
 * Usa la estructura exacta del ejemplo oficial simplificada
 * Ejecutar con: npx tsx src/scripts/test_sri_minimal.ts
 */

import { SriWebService } from '../modules/facturacion/domain/services/SriWebService';
import { SriEnvironment } from '../shared/sri-constants';
import { XmlGenerator } from '../modules/facturacion/domain/services/XmlGenerator';

async function main() {
    console.log('=== TEST MINIMAL SRI ===\n');

    // Fecha actual
    const fechaHoy = new Date();
    const dia = String(fechaHoy.getDate()).padStart(2, '0');
    const mes = String(fechaHoy.getMonth() + 1).padStart(2, '0');
    const anio = fechaHoy.getFullYear();
    const fechaEmision = `${dia}/${mes}/${anio}`;
    const periodoFiscal = `${mes}/${anio}`;

    // Generar clave de acceso manualmente
    const fechaSinSeparadores = `${dia}${mes}${anio}`;
    const codDoc = '07';
    // IMPORTANTE: El RUC debe coincidir con el dueño del certificado
    // El certificado es de CARLOS EDUARDO ANCHUNDIA VALENCIA con serialNumber=230421110536
    // Los primeros 10 dígitos son la cédula: 2304211105
    // El RUC de persona natural sería: 2304211105001
    const ruc = '2304211105001';
    const ambiente = '1';
    const estab = '001';
    const ptoEmi = '001';
    const secuencial = '000000101'; // Nuevo secuencial
    const codigoNumerico = '12345678';
    const tipoEmision = '1';

    // Calcular módulo 11
    const cadena = fechaSinSeparadores + codDoc + ruc + ambiente + estab + ptoEmi + secuencial + codigoNumerico + tipoEmision;
    let suma = 0;
    let factor = 2;
    for (let i = cadena.length - 1; i >= 0; i--) {
        suma += parseInt(cadena[i]) * factor;
        factor = factor === 7 ? 2 : factor + 1;
    }
    let digitoVerificador = 11 - (suma % 11);
    if (digitoVerificador === 11) digitoVerificador = 0;
    if (digitoVerificador === 10) digitoVerificador = 1;
    
    const claveAcceso = cadena + digitoVerificador;
    console.log('Clave de acceso:', claveAcceso);

    // XML ULTRA SIMPLE para versión 1.0.0 (sin caracteres especiales, sin espacios extra)
    // IMPORTANTE: numDocSustento debe ser 15 dígitos sin guiones según XSD
    const xml = `<?xml version="1.0" encoding="UTF-8"?><comprobanteRetencion id="comprobante" version="1.0.0"><infoTributaria><ambiente>1</ambiente><tipoEmision>1</tipoEmision><razonSocial>EMPRESA DEMO</razonSocial><ruc>${ruc}</ruc><claveAcceso>${claveAcceso}</claveAcceso><codDoc>07</codDoc><estab>001</estab><ptoEmi>001</ptoEmi><secuencial>${secuencial}</secuencial><dirMatriz>Quito</dirMatriz></infoTributaria><infoCompRetencion><fechaEmision>${fechaEmision}</fechaEmision><obligadoContabilidad>SI</obligadoContabilidad><tipoIdentificacionSujetoRetenido>04</tipoIdentificacionSujetoRetenido><razonSocialSujetoRetenido>PROVEEDOR</razonSocialSujetoRetenido><identificacionSujetoRetenido>1722039953001</identificacionSujetoRetenido><periodoFiscal>${periodoFiscal}</periodoFiscal></infoCompRetencion><impuestos><impuesto><codigo>1</codigo><codigoRetencion>303</codigoRetencion><baseImponible>100.00</baseImponible><porcentajeRetener>10.00</porcentajeRetener><valorRetenido>10.00</valorRetenido><codDocSustento>01</codDocSustento><numDocSustento>001001000000001</numDocSustento><fechaEmisionDocSustento>${fechaEmision}</fechaEmisionDocSustento></impuesto></impuestos></comprobanteRetencion>`;
    
    const xmlMinimal = xml;

    console.log('\n--- XML MINIMAL ---');
    console.log(xmlMinimal);
    console.log('--- FIN ---\n');

    // Enviar al SRI
    console.log('Enviando al SRI (ambiente PRUEBAS)...');
    
    // Debug: Mostrar XML en Base64 y su longitud
    const xmlBuffer = Buffer.from(xmlMinimal, 'utf8');
    const xmlBase64 = xmlBuffer.toString('base64');
    console.log('\nLongitud XML:', xmlMinimal.length);
    console.log('Longitud Base64:', xmlBase64.length);
    console.log('\nPrimeros 200 caracteres de Base64:');
    console.log(xmlBase64.substring(0, 200));
    
    // Verificar que el base64 decodifica correctamente
    const xmlDecoded = Buffer.from(xmlBase64, 'base64').toString('utf8');
    console.log('\nXML decodificado coincide:', xmlDecoded === xmlMinimal);
    
    try {
        const resultado = await SriWebService.enviarComprobante(xmlMinimal, SriEnvironment.PRUEBAS);
        console.log('\n=== RESPUESTA SRI ===');
        console.log(JSON.stringify(resultado, null, 2));
    } catch (error: any) {
        console.error('Error:', error.message);
    }

    console.log('\n=== FIN ===');
}

main();
