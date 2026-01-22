import { db } from '@/shared/infrastructure/database/postgresql';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';
import { SignatureService } from '@/modules/facturacion/domain/services/SignatureService';

export interface DetalleRetencionRequest {
    codigo: string;          // 1 (Renta), 2 (IVA), 6 (ISD)
    codigoRetencion: string;// Ej: 312, 3440, etc.
    baseImponible: number;
    porcentajeRetener: number;
    valorRetenido: number;
    codDocSustento?: string; // Por defecto '01' (Factura)
    numDocSustento?: string; // Secuencial fac compra
    fechaEmisionDocSustento?: string; // YYYY-MM-DD
}

export class RetencionService {

    /**
     * Emite una Retención Electrónica para una Compra existente
     */
    static async emitir(empresaId: string, usuarioId: string, compraId: string, detalles: DetalleRetencionRequest[]) {
        // 1. Obtener Datos de la Compra y Empresa
        const compraResult = await db.querySimple<any>({
            text: `
                SELECT 
                    c.*, 
                    t.identificacion as prov_ruc, t.razon_social as prov_nombre, 
                    t.direccion as prov_direccion, t.email as prov_email,
                    t.tipo_identificacion as prov_tipo,
                    e.ruc as emp_ruc, e.razon_social as emp_razon, e.nombre_comercial as emp_nombre_comercial,
                    e.direccion_matriz as emp_dir, e.obligado_contabilidad as emp_obligado,
                    e.contribuyente_especial as emp_cont_esp, e.agente_retencion as emp_agente_ret,
                    e.ambiente_sri as emp_ambiente, e.firma_electronica, e.clave_firma
                FROM compras.compras c
                JOIN directorio.terceros t ON c.proveedor_id = t.id
                JOIN configuracion.empresas e ON c.empresa_id = e.id
                WHERE c.id = $1 AND c.empresa_id = $2
            `,
            values: [compraId, empresaId]
        });

        if (compraResult.rows.length === 0) throw new Error('Compra no encontrada');
        const data = compraResult.rows[0];

        // 2. Generar Secuencial de Retención
        // (Buscamos el último secuencial de tipo RETENCION en facturacion o compras)
        // OJO: La tabla de facturación guarda todos los documentos EMITIDOS.
        const secResult = await db.querySimple<any>({
            text: `SELECT COALESCE(MAX(secuencial::int), 0) + 1 as next FROM facturacion.comprobantes_electronicos WHERE empresa_id = $1 AND tipo_comprobante = 'RETENCION'`,
            values: [empresaId]
        });
        const nextSecuencial = secResult.rows[0].next.toString().padStart(9, '0');

        // 3. Preparar Datos para XmlGenerator
        const fechaEmision = new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }); // DD/MM/YYYY

        // Mapear detalles
        const impuestosMapped = detalles.map(d => ({
            codigo: d.codigo,
            codigoRetencion: d.codigoRetencion,
            baseImponible: d.baseImponible,
            porcentajeRetener: d.porcentajeRetener,
            valorRetenido: d.valorRetenido,
            codDocSustento: d.codDocSustento || data.sustento || '01',
            numDocSustento: (d.numDocSustento || data.secuencial || '').replace(/-/g, ''),
            fechaEmisionDocSustento: this.fmtDate(data.fecha_emision)
        }));

        const xmlData = {
            infoTributaria: {
                ambiente: data.emp_ambiente || '1',
                tipoEmision: '1',
                razonSocial: data.emp_razon,
                nombreComercial: data.emp_nombre_comercial,
                ruc: data.emp_ruc,
                // accessKey generado auto
                codDoc: '07', // Retención
                estab: '001', // TODO: Parametrizar sucursales
                ptoEmi: '001',
                secuencial: nextSecuencial,
                dirMatriz: data.emp_dir,
                agenteRetencion: data.emp_agente_ret // Resolución No.
            },
            infoCompRetencion: {
                fechaEmision: fechaEmision,
                dirEstablecimiento: data.emp_dir, // Matriz por defecto
                contribuyenteEspecial: data.emp_cont_esp,
                obligadoContabilidad: data.emp_obligado ? 'SI' : 'NO',
                tipoIdentificacionSujetoRetenido: this.mapTipoId(data.prov_tipo),
                razonSocialSujetoRetenido: data.prov_nombre,
                identificacionSujetoRetenido: data.prov_ruc,
                periodoFiscal: this.fmtPeriodo(data.fecha_emision) // MM/YYYY
            },
            impuestos: impuestosMapped
        };

        // 4. Generar XML
        let xml = XmlGenerator.generateRetencionXml(xmlData);

        // 5. Firmar XML
        if (data.firma_electronica) {
            // Nota: data.firma_electronica debería ser base64 del p12
            // data.clave_firma es la password
            try {
                xml = await SignatureService.signXml(xml, {
                    p12Base64: data.firma_electronica,
                    passwordP12: data.clave_firma
                });
            } catch (e) {
                console.warn('No se pudo firmar el XML (posiblemente falta certificado configurado o es inválido). Se guarda sin firmar.', e);
            }
        }

        // Obtener la clave de acceso generada dentro del XmlGenerator
        const claveAcceso = this.extractClaveAcceso(xml);

        // 6. Guardar en BD (facturacion.comprobantes_electronicos)
        // Usamos una transacción para guardar en facturación y actualizar compras
        const totalRetenido = impuestosMapped.reduce((sum, i) => sum + i.valorRetenido, 0);

        await db.transaction(async (client) => {
            // Insertar comprobante emitido
            await client.query(`
                INSERT INTO facturacion.comprobantes_electronicos (
                    id, empresa_id, usuario_id, tipo_comprobante, secuencial, clave_acceso,
                    fecha_emision, cliente_id, cliente_nombre, cliente_identificacion,
                    total, xml_firmado, estado, ambiente_sri, tipo_emision_sri, created_at
                ) VALUES (
                    $1, $2, $3, 'RETENCION', $4, $5, 
                    NOW(), $6, $7, $8, 
                    $9, $10, 'AUTORIZADO', $11, '1', NOW()
                )
            `, [
                crypto.randomUUID(), empresaId, usuarioId, nextSecuencial, claveAcceso,
                data.proveedor_id, data.prov_nombre, data.prov_ruc,
                totalRetenido, xml, data.emp_ambiente || '1'
            ]);

            // Actualizar compra con referencia
            await client.query(`
                UPDATE compras.compras 
                SET tiene_retencion = true, nro_retencion = $1, estado_retencion = 'EMITIDO', updated_at = NOW()
                WHERE id = $2
            `, [`001-001-${nextSecuencial}`, compraId]);

        }, { empresaId, usuarioId });

        return { success: true, claveAcceso, secuencial: nextSecuencial, xml };
    }

    // Helpers
    private static fmtDate(dateStr: string | Date): string {
        const d = new Date(dateStr);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    private static fmtPeriodo(dateStr: string | Date): string {
        const d = new Date(dateStr);
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${month}/${year}`;
    }

    private static mapTipoId(t: string) {
        const m: any = { 'RUC': '01', 'CEDULA': '02', 'PASAPORTE': '03' };
        return m[t] || '01';
    }

    private static extractClaveAcceso(xml: string): string {
        const match = xml.match(/<claveAcceso>(.*?)<\/claveAcceso>/);
        return match ? match[1] : '';
    }
}
