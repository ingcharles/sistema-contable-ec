/**
 * Script de test para firma corregida y envío al SRI
 * Ejecutar con: npx tsx src/scripts/test_firma_corregida.ts
 */

import { SriWebService } from '../../modules/facturacion/domain/services/SriWebService';
import { SignatureService } from '../../modules/facturacion/domain/services/test api sri/SignatureServiceFixed';
import { SriEnvironment } from '../../shared/sri-constants';
import { db } from '../../shared/infrastructure/database/postgresql';
import fs from 'fs';

// Generador de clave de acceso
function generarClaveAcceso(data: any): string {
    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    
    const fechaEmision = `${dia}${mes}${anio}`;
    const tipoComprobante = data.codDoc;
    const ruc = data.ruc;
    const ambiente = data.ambiente;
    const serie = data.estab + data.ptoEmi;
    const secuencial = data.secuencial;
    const codigoNumerico = '12345678';
    const tipoEmision = data.tipoEmision;
    
    const claveBase = `${fechaEmision}${tipoComprobante}${ruc}${ambiente}${serie}${secuencial}${codigoNumerico}${tipoEmision}`;
    
    // Calcular dígito verificador módulo 11
    const coeficientes = [2, 3, 4, 5, 6, 7];
    let suma = 0;
    let j = 0;
    for (let i = claveBase.length - 1; i >= 0; i--) {
        suma += parseInt(claveBase[i]) * coeficientes[j % 6];
        j++;
    }
    let digitoVerificador = 11 - (suma % 11);
    if (digitoVerificador === 10) digitoVerificador = 1;
    if (digitoVerificador === 11) digitoVerificador = 0;
    
    return claveBase + digitoVerificador;
}

async function main() {
    console.log('=== TEST FIRMA CORREGIDA CON SRI ===\n');

    const secuencial = String(Math.floor(Math.random() * 999999999)).padStart(9, '0');
    const fechaHoy = new Date();
    const dia = String(fechaHoy.getDate()).padStart(2, '0');
    const mes = String(fechaHoy.getMonth() + 1).padStart(2, '0');
    const anio = fechaHoy.getFullYear();
    const fechaEmision = `${dia}/${mes}/${anio}`;
    const periodoFiscal = `${mes}/${anio}`;

    const datosComprobante = {
        ambiente: '1',
        tipoEmision: '1',
        ruc: '1722039953001',
        codDoc: '07',
        estab: '001',
        ptoEmi: '001',
        secuencial: secuencial
    };

    const claveAcceso = generarClaveAcceso(datosComprobante);
    console.log('Clave de acceso:', claveAcceso);
    console.log('Secuencial:', secuencial);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<comprobanteRetencion id="comprobante" version="2.0.0">
  <infoTributaria>
    <ambiente>1</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>EMPRESA DEMO S.A.</razonSocial>
    <nombreComercial>ECUCONTABLE STORE</nombreComercial>
    <ruc>1722039953001</ruc>
    <claveAcceso>${claveAcceso}</claveAcceso>
    <codDoc>07</codDoc>
    <estab>001</estab>
    <ptoEmi>001</ptoEmi>
    <secuencial>${secuencial}</secuencial>
    <dirMatriz>Av. Amazonas y Naciones Unidas, Quito</dirMatriz>
  </infoTributaria>
  <infoCompRetencion>
    <fechaEmision>${fechaEmision}</fechaEmision>
    <dirEstablecimiento>Av. Amazonas y Naciones Unidas, Quito</dirEstablecimiento>
    <obligadoContabilidad>SI</obligadoContabilidad>
    <tipoIdentificacionSujetoRetenido>04</tipoIdentificacionSujetoRetenido>
    <parteRel>NO</parteRel>
    <razonSocialSujetoRetenido>PROVEEDOR DE PRUEBA</razonSocialSujetoRetenido>
    <identificacionSujetoRetenido>1722039953001</identificacionSujetoRetenido>
    <periodoFiscal>${periodoFiscal}</periodoFiscal>
  </infoCompRetencion>
  <docsSustento>
    <docSustento>
      <codSustento>01</codSustento>
      <codDocSustento>01</codDocSustento>
      <numDocSustento>001001000000001</numDocSustento>
      <fechaEmisionDocSustento>${fechaEmision}</fechaEmisionDocSustento>
      <numAutDocSustento>1111111111111111111111111111111111111111111111111</numAutDocSustento>
      <pagoLocExt>01</pagoLocExt>
      <totalSinImpuestos>100.00</totalSinImpuestos>
      <importeTotal>100.00</importeTotal>
      <impuestosDocSustento>
        <impuestoDocSustento>
          <codImpuestoDocSustento>2</codImpuestoDocSustento>
          <codigoPorcentaje>0</codigoPorcentaje>
          <baseImponible>100.00</baseImponible>
          <tarifa>0.00</tarifa>
          <valorImpuesto>0.00</valorImpuesto>
        </impuestoDocSustento>
      </impuestosDocSustento>
      <retenciones>
        <retencion>
          <codigo>1</codigo>
          <codigoRetencion>303</codigoRetencion>
          <baseImponible>100.00</baseImponible>
          <porcentajeRetener>10.00</porcentajeRetener>
          <valorRetenido>10.00</valorRetenido>
        </retencion>
      </retenciones>
      <pagos>
        <pago>
          <formaPago>20</formaPago>
          <total>100.00</total>
        </pago>
      </pagos>
    </docSustento>
  </docsSustento>
</comprobanteRetencion>`;

    try {
        // 1. Obtener certificado de BD
        console.log('\n1. Obteniendo certificado...');
        const empresa_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
        const certResult = await db.query(
            {
                text: `
                    SELECT sc.cert_p12_certificado, sc.cert_clave_certificado
                    FROM configuracion.sri_certificados sc
                    WHERE sc.empresa_id = $1 AND sc.activo = true
                    LIMIT 1
                `,
                values: [empresa_id]
            },
            { empresaId: empresa_id, usuarioId: empresa_id }
        );

        if (certResult.rows.length === 0) {
            throw new Error('No se encontró certificado activo');
        }

        const config = certResult.rows[0];
        const archivo_p12 = config.cert_p12_certificado?.toString('base64');
        const password_p12 = config.cert_clave_certificado;
        console.log('   ✓ Certificado obtenido');

        // 2. Firmar XML usando SignatureServiceFixed
        console.log('\n2. Firmando XML (SignatureServiceFixed)...');
        const signedXml = await SignatureService.signXml(xml, {
            p12Base64: archivo_p12,
            passwordP12: password_p12
        });
        console.log('   ✓ XML firmado');

        // Guardar XML firmado
        fs.writeFileSync('test_firma_corregida.xml', signedXml);
        console.log('   ✓ Guardado en: test_firma_corregida.xml');

        // 3. Enviar al SRI
        console.log('\n3. Enviando XML FIRMADO al SRI...');
        const recepcionResult = await SriWebService.enviarComprobante(signedXml, SriEnvironment.PRUEBAS);
        
        console.log('\n=== RESPUESTA SRI (RECEPCIÓN) ===');
        console.log(JSON.stringify(recepcionResult, null, 2));

        if (recepcionResult.estado === 'RECIBIDA' || 
            (recepcionResult.estado === 'DEVUELTA' && recepcionResult.mensajes?.some((m: any) => m.identificador === '70'))) {
            console.log('\n✓ Comprobante RECIBIDO o EN PROCESAMIENTO');
            
            // 4. Consultar autorización
            console.log('\n4. Consultando autorización (espera 5 segundos)...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const autorizacionResult = await SriWebService.autorizarComprobante(claveAcceso, SriEnvironment.PRUEBAS);
            console.log('\n=== RESPUESTA SRI (AUTORIZACIÓN) ===');
            console.log(JSON.stringify(autorizacionResult, null, 2));

            if (autorizacionResult.estado === 'AUTORIZADO') {
                console.log('\n🎉 ¡¡COMPROBANTE AUTORIZADO!!');
            } else {
                console.log('\n✗ Comprobante NO AUTORIZADO');
            }
        } else {
            console.log('\n✗ Comprobante RECHAZADO');
        }

        await db.close();

    } catch (error: any) {
        console.error('\n✗ Error:', error.message);
        console.error(error.stack);
        await db.close();
    }
}

main();
