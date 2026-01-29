/**
 * Script de prueba para enviar una retención al SRI
 * Ejecutar con: npx tsx src/scripts/test_retencion_sri.ts
 */

import { XmlGenerator } from '../../modules/facturacion/domain/services/XmlGenerator';
import { SignatureService } from '../../modules/facturacion/domain/services/SignatureService';
import { SriWebService } from '../../modules/facturacion/domain/services/SriWebService';
import { XsdValidator } from '../../modules/facturacion/domain/services/XsdValidator';
import { SriEnvironment } from '../../shared/sri-constants';
import { db } from '../../shared/infrastructure/database/postgresql';
import fs from 'fs';

async function main() {
    console.log('=== PRUEBA DE RETENCIÓN SRI ===\n');

    // Datos de prueba para la retención
    const fechaHoy = new Date();
    const dia = String(fechaHoy.getDate()).padStart(2, '0');
    const mes = String(fechaHoy.getMonth() + 1).padStart(2, '0');
    const anio = fechaHoy.getFullYear();
    const fechaEmision = `${dia}/${mes}/${anio}`;
    const periodoFiscal = `${mes}/${anio}`;

    const data = {
        infoTributaria: {
            ambiente: '1', // Pruebas
            tipoEmision: '1',
            razonSocial: 'EMPRESA DEMO S.A.',
            nombreComercial: 'ECUCONTABLE STORE',
            ruc: '1722039953001',
            codDoc: '07', // Retención
            estab: '001',
            ptoEmi: '001',
            secuencial: String(Math.floor(Math.random() * 999999999)).padStart(9, '0'), // Secuencial aleatorio
            dirMatriz: 'Av. Amazonas y Naciones Unidas, Quito'
        },
        infoCompRetencion: {
            fechaEmision: fechaEmision,
            dirEstablecimiento: 'Av. Amazonas y Naciones Unidas, Quito',
            obligadoContabilidad: 'SI',
            tipoIdentificacionSujetoRetenido: '04', // RUC
            parteRel: 'NO',
            razonSocialSujetoRetenido: 'PROVEEDOR DE PRUEBA',
            identificacionSujetoRetenido: '1722039953001',
            periodoFiscal: periodoFiscal
        },
        impuestos: [
            {
                codSustento: '01', // Compras
                codDocSustento: '01', // Factura
                numDocSustento: '001001000000001',
                fechaEmisionDocSustento: fechaEmision,
                numAutDocSustento: '1111111111111111111111111111111111111111111111111',
                pagoLocExt: '01',
                totalSinImpuestosDocSustento: 100,
                importeTotalDocSustento: 100,
                baseImponibleIvaDocSustento: 100,
                codigoPorcentajeIva: '0',
                tarifaIva: 0,
                ivaDocSustento: 0,
                formaPago: '20',
                // Retención
                codigo: '1', // Renta
                codigoRetencion: '303', // Honorarios 10%
                baseImponible: 100,
                porcentajeRetener: 10,
                valorRetenido: 10
            }
        ]
    };

    try {
        // 1. Generar clave de acceso y XML
        console.log('1. Generando clave de acceso...');
        const accessKey = XmlGenerator.generateAccessKey(data);
        data.infoTributaria.claveAcceso = accessKey;
        console.log('   Clave de acceso:', accessKey);

        console.log('\n2. Generando XML...');
        const rawXml = XmlGenerator.generateRetencionXml(data);
        
        // Guardar XML sin firmar para revisión
        fs.writeFileSync('test_retencion_raw.xml', rawXml, 'utf8');
        console.log('   XML sin firmar guardado en: test_retencion_raw.xml');
        console.log('\n--- XML SIN FIRMAR ---');
        console.log(rawXml);
        console.log('--- FIN XML ---\n');

        // 2. Validar XSD antes de firmar
        console.log('3. Validando XML contra XSD...');
        try {
            await XsdValidator.validate(rawXml, '07');
            console.log('   ✓ XML válido según XSD');
        } catch (err: any) {
            console.error('   ✗ Error de validación XSD:', err.message);
            return;
        }

        // 3. Obtener certificado de la base de datos
        console.log('\n4. Obteniendo certificado de la BD...');
        const configResult = await db.query(
            {
                text: `
                    SELECT 
                        sc.cert_p12_certificado, sc.cert_clave_certificado,
                        sa.url_recepcion, sa.url_autorizacion
                    FROM configuracion.sri_certificados sc
                    INNER JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id
                    WHERE sc.empresa_id = $1 AND sa.codigo = $2 AND sc.activo = TRUE
                    LIMIT 1
                `,
                values: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PRUEBAS'] // empresa_id UUID real
            },
            { empresaId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', usuarioId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }
        );

        if (configResult.rows.length === 0) {
            console.error('   ✗ No se encontró configuración de certificado');
            await db.close();
            return;
        }

        const config = configResult.rows[0];
        const p12Base64 = config.cert_p12_certificado?.toString('base64');
        console.log('   ✓ Certificado obtenido');

        // 4. Firmar XML
        console.log('\n5. Firmando XML...');
        const signedXml = await SignatureService.signXml(rawXml, {
            p12Base64: p12Base64,
            passwordP12: config.cert_clave_certificado
        });

        // Guardar XML firmado para revisión
        fs.writeFileSync('test_retencion_signed.xml', signedXml, 'utf8');
        console.log('   ✓ XML firmado guardado en: test_retencion_signed.xml');
        console.log('\n--- XML FIRMADO ---');
        console.log(signedXml);
        console.log('--- FIN XML FIRMADO ---\n');

        // 5. Validar XSD del XML firmado
        console.log('6. Validando XML firmado contra XSD...');
        try {
            await XsdValidator.validate(signedXml, '07');
            console.log('   ✓ XML firmado válido según XSD');
        } catch (err: any) {
            console.error('   ✗ Error de validación XSD (firmado):', err.message);
            // Continuamos de todas formas para ver qué dice el SRI
        }

        // 6.A Enviar XML SIN FIRMAR al SRI (para diagnosticar)
        console.log('\n7A. Enviando XML SIN FIRMAR al SRI (para diagnóstico)...');
        const recepcionResultSinFirma = await SriWebService.enviarComprobante(rawXml, SriEnvironment.PRUEBAS);
        
        console.log('\n=== RESPUESTA SRI (XML SIN FIRMA) ===');
        console.log(JSON.stringify(recepcionResultSinFirma, null, 2));

        // 6. Enviar al SRI
        console.log('\n7B. Enviando XML FIRMADO al SRI (ambiente PRUEBAS)...');
        const recepcionResult = await SriWebService.enviarComprobante(signedXml, SriEnvironment.PRUEBAS);
        
        console.log('\n=== RESPUESTA SRI (RECEPCIÓN) ===');
        console.log(JSON.stringify(recepcionResult, null, 2));

        if (recepcionResult.estado === 'RECIBIDA') {
            console.log('\n✓ Comprobante RECIBIDO por el SRI');
            
            // Consultar autorización
            console.log('\n8. Consultando autorización...');
            await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar 3 segundos
            
            const autorizacionResult = await SriWebService.autorizarComprobante(accessKey, SriEnvironment.PRUEBAS);
            console.log('\n=== RESPUESTA SRI (AUTORIZACIÓN) ===');
            console.log(JSON.stringify(autorizacionResult, null, 2));
        } else {
            console.log('\n✗ Comprobante RECHAZADO por el SRI');
            if (recepcionResult.mensajes) {
                console.log('\nMensajes de error:');
                recepcionResult.mensajes.forEach((m: any, i: number) => {
                    console.log(`  ${i + 1}. [${m.tipo}] ${m.identificador}: ${m.mensaje}`);
                });
            }
        }

        await db.close();
        console.log('\n=== FIN DE PRUEBA ===');

    } catch (error: any) {
        console.error('\n✗ Error durante la prueba:', error.message);
        console.error(error.stack);
        await db.close();
    }
}

main();
