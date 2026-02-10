import { db } from '@/shared/infrastructure/database/postgresql';
import { XmlGenerator } from './XmlGenerator';
import { SignatureService } from './SignatureService';
import { SriWebService } from './SriWebService';

export interface ReemisionConfig {
    empresaId: string;
    usuarioId: string;
}

export interface ReemisionResult {
    success: boolean;
    estado: string;
    claveAcceso: string;
    numeroAutorizacion?: string;
    fechaAutorizacion?: string;
    mensajes: any[];
    error?: string;
}

export class ReemisionService {
    /**
     * Obtiene la configuración SRI activa para una empresa
     */
    static async obtenerConfiguracionSri(empresaId: string, usuarioId: string) {
        const configResult = await db.query({
            text: `
                SELECT 
                    sc.cert_p12_certificado, sc.cert_clave_certificado,
                    sa.url_recepcion, sa.url_autorizacion, sa.valor as ambiente_sri
                FROM configuracion.sri_certificados sc 
                INNER JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id 
                WHERE sc.empresa_id = $1 AND sc.activo = TRUE 
                LIMIT 1
            `,
            values: [empresaId]
        }, { empresaId, usuarioId });

        if (configResult.rows.length === 0) {
            throw new Error('Firma electrónica no configurada');
        }

        return configResult.rows[0];
    }

    /**
     * Obtiene los datos de la empresa
     */
    static async obtenerEmpresa(empresaId: string, usuarioId: string) {
        const empresaResult = await db.query({
            text: 'SELECT * FROM seguridad.empresas WHERE id = $1',
            values: [empresaId]
        }, { empresaId, usuarioId });

        return empresaResult.rows[0];
    }

    /**
     * Genera XML, firma y envía al SRI
     */
    static async procesarReemision(
        dataSri: any,
        tipoComprobante: string,
        configSri: any,
        config: ReemisionConfig
    ): Promise<ReemisionResult> {
        // 1. Generar clave de acceso y XML
        const accessKey = XmlGenerator.generateAccessKey(dataSri);
        dataSri.infoTributaria.claveAcceso = accessKey;

        let rawXml: string;
        switch (tipoComprobante) {
            case '01':
                rawXml = XmlGenerator.generateFacturaXml(dataSri);
                break;
            case '03':
                rawXml = XmlGenerator.generateLiquidacionXml(dataSri);
                break;
            case '04':
                rawXml = XmlGenerator.generateNotaCreditoXml(dataSri);
                break;
            case '05':
                rawXml = XmlGenerator.generateNotaDebitoXml(dataSri);
                break;
            case '06':
                rawXml = XmlGenerator.generateGuiaXml(dataSri);
                break;
            case '07':
                rawXml = XmlGenerator.generateRetencionXml(dataSri);
                break;
            default:
                throw new Error(`Tipo de comprobante ${tipoComprobante} no soportado`);
        }

        // 2. Firmar
        const signedXml = await SignatureService.signXml(rawXml, {
            p12Base64: configSri.cert_p12_certificado.toString('base64'),
            passwordP12: configSri.cert_clave_certificado
        });

        // 3. Enviar al SRI
        const recepcion = await SriWebService.enviarComprobante(signedXml, configSri.url_recepcion);
        let estado: any = recepcion.estado;
        let mensajes = recepcion.mensajes || [];
        let numAuth = null;
        let fechaAuth = null;

        // 4. Manejo "CLAVE ACCESO REGISTRADA" (Recovery Flow)
        const claveRegistrada = mensajes.some((m: any) =>
            m.identificador === '43' || m.mensaje?.includes('CLAVE ACCESO REGISTRADA')
        );

        if (estado === 'RECIBIDA' || claveRegistrada) {
            // Esperar y autorizar
            await new Promise(r => setTimeout(r, 2000));
            try {
                const auth = await SriWebService.autorizarComprobante(accessKey, configSri.url_autorizacion);
                estado = auth.estado;
                numAuth = auth.numeroAutorizacion;
                fechaAuth = auth.fechaAutorizacion;
                if (auth.mensajes) mensajes = mensajes.concat(auth.mensajes);
            } catch (e: any) {
                estado = 'ERROR';
                mensajes.push({ tipo: 'ERROR', identificador: 'ERR_AUTH_CHECK', mensaje: e.message });
            }
        }

        return {
            success: estado === 'AUTORIZADO',
            estado,
            claveAcceso: accessKey,
            numeroAutorizacion: numAuth,
            fechaAutorizacion: fechaAuth,
            mensajes,
            xmlFirmado: signedXml
        } as any;
    }

    /**
     * Actualiza el estado del comprobante en la base de datos (facturación)
     */
    static async actualizarComprobanteFacturacion(
        comprobanteId: string,
        resultado: ReemisionResult,
        config: ReemisionConfig
    ) {
        await db.query({
            text: `
                UPDATE facturacion.comprobantes_electronicos
                SET 
                    estado = $1,
                    clave_acceso = $2,
                    xml_firmado = $3,
                    mensajes_sri = $4,
                    numero_autorizacion = $5,
                    fecha_autorizacion = $6,
                    updated_at = NOW()
                WHERE id = $7
            `,
            values: [
                resultado.estado,
                resultado.claveAcceso,
                (resultado as any).xmlFirmado,
                JSON.stringify({ mensajes: resultado.mensajes }),
                resultado.numeroAutorizacion,
                resultado.fechaAutorizacion,
                comprobanteId
            ]
        }, { empresaId: config.empresaId, usuarioId: config.usuarioId });
    }

    /**
     * Actualiza el estado de una liquidación en compras
     */
    static async actualizarLiquidacion(
        liquidacionId: string,
        resultado: ReemisionResult,
        config: ReemisionConfig
    ) {
        await db.query({
            text: `
                UPDATE compras.compras
                SET 
                    estado_retencion = $1,
                    clave_acceso = $2,
                    xml_firmado = $3,
                    mensajes_sri = $4,
                    autorizacion = $5,
                    fecha_autorizacion = $6,
                    updated_at = NOW()
                WHERE id = $7
            `,
            values: [
                resultado.estado,
                resultado.claveAcceso,
                (resultado as any).xmlFirmado,
                JSON.stringify({ mensajes: resultado.mensajes }),
                resultado.numeroAutorizacion,
                resultado.fechaAutorizacion,
                liquidacionId
            ]
        }, { empresaId: config.empresaId, usuarioId: config.usuarioId });
    }
}
