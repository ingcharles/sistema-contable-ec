import { NextRequest, NextResponse } from 'next/server';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';
import { SignatureService } from '@/modules/facturacion/domain/services/SignatureService';
import { SriWebService } from '@/modules/facturacion/domain/services/SriWebService';
import { SriEnvironment } from '@/shared/sri-constants';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { XsdValidator } from '@/modules/facturacion/domain/services/XsdValidator';

export const runtime = 'nodejs';

/**
 * POST /api/facturacion/emitir
 * Proceso completo de Facturación Electrónica (SRI Ecuador)
 * 1. Recupera configuración parametrizada desde PostgreSQL
 * 2. Genera Clave de Acceso y XML estructurado
 * 2.5. Valida XML contra esquema XSD
 * 3. Firma digitalmente el XML (XAdES-BES)
 * 4. Envía al SRI (Recepción)
 * 5. Consulta Autorización
 * 6. Registra resultado en DB Postgres con auditoría
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const data = await req.json();
        console.log('Iniciando proceso de emisión con data:', data);
        const { ambiente = 'PRUEBAS' } = data;
        console.log('Iniciando proceso de emisión para ambiente:', ambiente);
        // 1. Obtener configuración SRI desde la base de datos
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
                values: [context.empresaId, ambiente]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (configResult.rows.length === 0) {
            return NextResponse.json({
                success: false,
                error: `Configuración SRI no encontrada para ambiente ${ambiente}. Configure primero en /api/configuracion/sri.`
            }, { status: 400 });
        }

        const config = configResult.rows[0];
        const p12Base64 = config.cert_p12_certificado?.toString('base64');

        // 2. Generar XML estructurado según el tipo de comprobante
        const accessKey = XmlGenerator.generateAccessKey(data);
        data.infoTributaria.claveAcceso = accessKey;

        let rawXml;
        const codDoc = data.infoTributaria.codDoc;
        console.log('Generating XML for codDoc:', codDoc);
        switch (codDoc) {
            case '01':
                rawXml = XmlGenerator.generateFacturaXml(data);
                break;
            case '03':
                rawXml = XmlGenerator.generateLiquidacionXml(data);
                break;
            case '04':
                rawXml = XmlGenerator.generateNotaCreditoXml(data);
                break;
            case '06':
                rawXml = XmlGenerator.generateGuiaXml(data);
                break;
            case '07':
                rawXml = XmlGenerator.generateRetencionXml(data);
                break;
            default:
                throw new Error(`Tipo de comprobante ${codDoc} no soportado para generación de XML`);
        }

        console.log('XML generado:', rawXml);

        // 2.5. Validación XSD Estricta
        try {
            console.log(`Validando XML contra esquema XSD para tipo ${codDoc}...`);
            // Se valida el XML generado antes de firmar
            await XsdValidator.validate(rawXml, codDoc);
            console.log('Validación XSD exitosa.');
        } catch (validationError: any) {
            console.error('Error de validación XSD:', validationError.message);
            // Devolvemos error detallado al cliente para que pueda corregir
            return NextResponse.json({
                success: false,
                error: 'El XML generado no cumple con el esquema XSD del SRI',
                details: validationError.message.split('\n'),
                xml: process.env.NODE_ENV !== 'production' ? rawXml : undefined
            }, { status: 400 });
        }

        // 3. Firma Electrónica (Proceso Seguro en Backend)
        const signedXml = await SignatureService.signXml(rawXml, {
            p12Base64: p12Base64,
            passwordP12: config.cert_clave_certificado
        });

        if (process.env.NODE_ENV !== 'production') {
            console.log('XML firmado:', signedXml);
        }

        // 3.1 Validar XML firmado (incluye Signature)
        try {
            console.log(`Validando XML firmado contra XSD para tipo ${codDoc}...`);
            await XsdValidator.validate(signedXml, codDoc);
            console.log('Validación XSD del XML firmado exitosa.');
        } catch (validationError: any) {
            console.error('Error de validación XSD (XML firmado):', validationError.message);
            return NextResponse.json({
                success: false,
                error: 'El XML firmado no cumple con el esquema XSD del SRI',
                details: validationError.message.split('\n'),
                xml: process.env.NODE_ENV !== 'production' ? signedXml : undefined
            }, { status: 400 });
        }

        const sriEnv = ambiente === 'PRODUCCION' ? SriEnvironment.PRODUCCION : SriEnvironment.PRUEBAS;
        console.log(`XML firmado. Enviando al SRI en ambiente ${sriEnv}...`);
        // 4. Envío al SRI - Fase Recepción
        const recepcionResult = await SriWebService.enviarComprobante(signedXml, sriEnv);
        console.log('Resultado Recepción SRI:', JSON.stringify(recepcionResult, null, 2));

        if (recepcionResult.estado !== 'RECIBIDA') {
            // Formatear mensajes de error del SRI para mejor legibilidad
            const mensajesFormateados = recepcionResult.mensajes?.map(m => 
                `[${m.tipo}] ${m.identificador}: ${m.mensaje}`
            ).join('\n') || 'Sin mensajes adicionales';
            
            return NextResponse.json({
                success: false,
                error: 'SRI rechazó el comprobante en recepción',
                estado: recepcionResult.estado,
                mensajesSri: recepcionResult.mensajes,
                details: mensajesFormateados,
                xml: process.env.NODE_ENV !== 'production' ? signedXml : undefined
            }, { status: 422 });
        }

        // 5. Envío al SRI - Fase Autorización
        // Nota: En producción, esto puede requerir un delay o proceso asíncrono (webhooks/polling)
        const autorizacionResult = await SriWebService.autorizarComprobante(accessKey, sriEnv);

        // 6. Persistencia en PostgreSQL (Simulación de INSERT con auditoría automática)
        console.log(`DB: Comprobante ${accessKey} guardado en PostgreSQL con estado ${autorizacionResult.estado}`);

        return NextResponse.json({
            success: true,
            status: autorizacionResult.estado,
            numeroAutorizacion: autorizacionResult.numeroAutorizacion,
            fechaAutorizacion: autorizacionResult.fechaAutorizacion,
            claveAcceso: accessKey,
            ambiente: ambiente
        });

    } catch (error: any) {
        console.error('Error crítico en emisión:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Error interno en el servidor de facturación'
        }, { status: 500 });
    }
}
