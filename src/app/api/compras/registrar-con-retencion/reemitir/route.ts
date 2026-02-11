import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { ComprobantesRepository } from '@/modules/facturacion/infrastructure/ComprobantesRepository';
import { ReemisionService } from '@/modules/facturacion/domain/services/ReemisionService';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';

export const runtime = 'nodejs';

/**
 * POST /api/compras/registrar-con-retencion/reemitir
 * Re-emite un comprobante de retención existente
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const { comprobanteId } = await req.json();

        if (!comprobanteId) {
            return NextResponse.json({ error: 'ID de comprobante requerido' }, { status: 400 });
        }

        const configSri = await ReemisionService.obtenerConfiguracionSri(context.empresaId!, context.usuarioId!);
        const empresaDoc = await ReemisionService.obtenerEmpresa(context.empresaId!, context.usuarioId!);

        const compHeader = await ComprobantesRepository.obtenerCabeceraComprobante(comprobanteId, context.empresaId!);

        if (!compHeader || compHeader.tipo_comprobante !== '07') {
            return NextResponse.json({ error: 'Comprobante de retención no encontrado' }, { status: 404 });
        }

        const impuestos = await ComprobantesRepository.obtenerRetencionImpuestos(comprobanteId);

        const dataSri = SriStandardizer.standardizeRetencion({
            razonSocial: empresaDoc.razon_social,
            nombreComercial: empresaDoc.nombre_comercial,
            ruc: empresaDoc.ruc,
            estab: compHeader.estab,
            ptoEmi: compHeader.pto_emi,
            secuencial: compHeader.secuencial,
            dirMatriz: empresaDoc.direccion,
            fechaEmision: compHeader.fecha_emision,
            obligadoContabilidad: empresaDoc.es_obligado_contabilidad,
            tipoIdentificacionSujetoRetenido: compHeader.cliente_identificacion?.length === 13 ? '04' : '05',
            razonSocialSujetoRetenido: compHeader.cliente_nombre,
            identificacionSujetoRetenido: compHeader.cliente_identificacion,
            periodoFiscal: compHeader.fecha_emision.substring(5, 7) + '/' + compHeader.fecha_emision.substring(0, 4),
            impuestos: impuestos.map((imp: any) => ({
                codigo: imp.codigo,
                codigoRetencion: imp.codigo_retencion,
                baseImponible: imp.base_imponible,
                porcentajeRetener: imp.porcentaje_retener,
                valorRetenido: imp.valor_retenido,
                codDocSustento: imp.cod_doc_sustento,
                numDocSustento: imp.num_doc_sustento,
                fechaEmisionDocSustento: imp.fecha_emision_doc_sustento,
                codSustento: imp.cod_sustento,
                numAutDocSustento: imp.num_aut_doc_sustento,
                totalSinImpuestosDocSustento: imp.total_sin_impuestos_doc_sustento,
                baseImponibleIvaDocSustento: imp.base_imponible_iva_doc_sustento,
                importeTotalDocSustento: imp.importe_total_doc_sustento,
                pagoLocExt: imp.pago_loc_ext,
                formaPago: imp.forma_pago,
                ivaDocSustento: imp.iva_doc_sustento
            })),
            ambienteSri: configSri.ambiente_sri,
            tipoEmisionSri: compHeader.tipo_emision_sri || '1'
        });

        const resultado = await ReemisionService.procesarReemision(
            dataSri,
            '07',
            configSri,
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        await ReemisionService.actualizarComprobanteFacturacion(
            comprobanteId,
            resultado,
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            success: resultado.success,
            estado: resultado.estado,
            claveAcceso: resultado.claveAcceso,
            numeroAutorizacion: resultado.numeroAutorizacion,
            mensajes: resultado.mensajes
        });

    } catch (error: any) {
        console.error('Error en re-emisión de retención:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
