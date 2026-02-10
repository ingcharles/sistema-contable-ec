import { db } from '@/shared/infrastructure/database/postgresql';
import { XmlGenerator } from '@/modules/facturacion/domain/services/XmlGenerator';
import { SignatureService } from '@/modules/facturacion/domain/services/SignatureService';
import { ServicioSeguimientoUso } from '@/modules/shared/domain/services/ServicioSeguimientoUso';

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
        // 0. VALIDAR CUOTA DE RETENCIONES ('07')
        const tipoComprobanteId = await ServicioSeguimientoUso.obtenerIdPorCodigo('07');
        const verificacionCuota = await ServicioSeguimientoUso.verificarCuota(usuarioId, tipoComprobanteId);
        if (!verificacionCuota.permitido) {
            throw new Error(`Cuota de retenciones excedida: ${verificacionCuota.mensaje}`);
        }

        // 1. Obtener Datos de la Compra, Empresa y Punto de Emisión Matriz
        const setupResult = await db.querySimple<any>({
            text: `
                SELECT 
                    c.*, 
                    t.identificacion as prov_ruc, t.razon_social as prov_nombre, 
                    t.direccion as prov_direccion, t.email as prov_email,
                    t.tipo_identificacion as prov_tipo,
                    e.ruc as emp_ruc, e.razon_social as emp_razon, e.nombre_comercial as emp_nombre_comercial,
                    e.direccion as emp_dir, e.obligado_contabilidad as emp_obligado,
                    e.contribuyente_especial as emp_cont_esp, e.agente_retencion as emp_agente_ret,
                    e.ambiente_sri as emp_ambiente, e.firma_electronica, e.clave_firma,
                    s.codigo as estab, pe.codigo as pto_emi
                FROM compras.compras c
                JOIN directorio.terceros t ON c.proveedor_id = t.id
                JOIN seguridad.empresas e ON c.empresa_id = e.id
                LEFT JOIN configuracion.sucursales s ON e.id = s.empresa_id AND s.es_matriz = true
                LEFT JOIN configuracion.puntos_emision pe ON s.id = pe.sucursal_id AND pe.activo = true
                WHERE c.id = $1 AND c.empresa_id = $2
                ORDER BY pe.created_at ASC LIMIT 1
            `,
            values: [compraId, empresaId]
        });

        if (setupResult.rows.length === 0) throw new Error('Compra no encontrada');
        const data = setupResult.rows[0];

        // 2. Generar Secuencial de Retención utilizando el estándar de puntos de emisión
        const seqResult = await db.querySimple<any>({
            text: `
                SELECT secuencial_actual 
                FROM configuracion.puntos_emision_secuenciales 
                WHERE punto_emision_id = (
                    SELECT pe.id FROM configuracion.puntos_emision pe
                    JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
                    WHERE s.empresa_id = $1 AND s.es_matriz = true AND pe.codigo = $2 LIMIT 1
                ) AND tipo_comprobante_id = $3
            `,
            values: [empresaId, data.pto_emi || '001', tipoComprobanteId]
        });

        let nextSeqInt = seqResult.rows.length > 0 ? seqResult.rows[0].secuencial_actual : 1;
        const nextSecuencial = nextSeqInt.toString().padStart(9, '0');

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
            // numDocSustento debe ser EXACTAMENTE 15 dígitos sin guiones (XSD v2.0.0)
            numDocSustento: this.formatNumDocSustento(d.numDocSustento || data.secuencial || ''),
            fechaEmisionDocSustento: this.fmtDate(data.fecha_emision)
        }));

        const xmlData = {
            infoTributaria: {
                ambiente: data.emp_ambiente || '1',
                tipoEmision: '1',
                razonSocial: data.emp_razon,
                nombreComercial: data.emp_nombre_comercial,
                ruc: data.emp_ruc,
                codDoc: '07', // Retención
                estab: data.estab || '001',
                ptoEmi: data.pto_emi || '001',
                secuencial: nextSecuencial,
                dirMatriz: data.emp_dir,
                agenteRetencion: data.emp_agente_ret,
                claveAcceso: '' // Se genera abajo
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

        // 4. Generar Clave de Acceso y XML
        const claveAcceso = XmlGenerator.generateAccessKey(xmlData);
        xmlData.infoTributaria.claveAcceso = claveAcceso;
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

        // 6. Guardar en BD (facturacion.comprobantes_electronicos)
        // Usamos una transacción para guardar en facturación y actualizar compras
        const totalRetenido = impuestosMapped.reduce((sum, i) => sum + i.valorRetenido, 0);

        await db.transaction(async (client) => {
            // Insertar comprobante emitido
            await client.query(`
                INSERT INTO facturacion.comprobantes_electronicos (
                    id, empresa_id, usuario_id, tipo_comprobante_id, secuencial, clave_acceso,
                    fecha_emision, cliente_id, cliente_nombre, cliente_identificacion,
                    total, xml_firmado, estado, ambiente_sri, tipo_emision_sri, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, 
                    NOW(), $7, $8, $9, 
                    $10, $11, 'AUTORIZADO', $12, '1', NOW()
                )
            `, [
                crypto.randomUUID(), empresaId, usuarioId, tipoComprobanteId, nextSecuencial, claveAcceso,
                data.proveedor_id, data.prov_nombre, data.prov_ruc,
                totalRetenido, xml, data.emp_ambiente || '1'
            ]);

            // Actualizar secuencial
            await client.query(`
                INSERT INTO configuracion.puntos_emision_secuenciales (punto_emision_id, tipo_comprobante_id, secuencial_actual)
                VALUES (
                    (SELECT id FROM configuracion.puntos_emision pe 
                     JOIN configuracion.sucursales s ON pe.sucursal_id = s.id 
                     WHERE s.empresa_id = $1 AND s.es_matriz = true AND pe.codigo = $2 LIMIT 1),
                    $3, $4 + 1
                )
                ON CONFLICT (punto_emision_id, tipo_comprobante_id) 
                DO UPDATE SET secuencial_actual = EXCLUDED.secuencial_actual + 1
            `, [empresaId, data.pto_emi || '001', tipoComprobanteId, nextSeqInt]);

            // Actualizar compra con referencia
            await client.query(`
                UPDATE compras.compras 
                SET tiene_retencion = true, nro_retencion = $1, estado_retencion = 'EMITIDO', updated_at = NOW()
                WHERE id = $2
            `, [`001-001-${nextSecuencial}`, compraId]);

        }, { empresaId, usuarioId });

        // Incrementar contador de uso
        await ServicioSeguimientoUso.incrementarUso(usuarioId, tipoComprobanteId);

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

    /**
     * Formatea numDocSustento a 15 dígitos sin guiones (requerido por XSD v2.0.0)
     * Formato esperado: EEEPPPSSSSSSSSS (3 estab + 3 pto + 9 secuencial)
     * Ejemplo: "001-001-000000456" -> "001001000000456"
     */
    private static formatNumDocSustento(numDoc: string): string {
        // Quitar guiones y espacios
        const cleaned = numDoc.replace(/[-\s]/g, '');

        // Si ya tiene 15 dígitos, retornar
        if (cleaned.length === 15 && /^\d+$/.test(cleaned)) {
            return cleaned;
        }

        // Si tiene formato con guiones (XXX-XXX-XXXXXXXXX)
        const partes = numDoc.split('-');
        if (partes.length === 3) {
            const estab = partes[0].padStart(3, '0');
            const pto = partes[1].padStart(3, '0');
            const sec = partes[2].padStart(9, '0');
            return estab + pto + sec;
        }

        // Si es solo números, asumimos que es el secuencial y usamos 001-001
        if (/^\d+$/.test(cleaned)) {
            return '001001' + cleaned.padStart(9, '0');
        }

        // Fallback: rellenar con ceros a la izquierda hasta 15 dígitos
        return cleaned.padStart(15, '0');
    }
}
