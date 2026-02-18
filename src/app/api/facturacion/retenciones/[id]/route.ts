import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { ComprobantesRepository } from '@/modules/facturacion/infrastructure/ComprobantesRepository';

/**
 * GET /api/facturacion/retenciones/[id]
 * Obtiene el detalle completo de un comprobante de retención por ID
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const { id } = await params;

        // 1. Obtener Cabecera usando Repositorio
        const retencion = await ComprobantesRepository.obtenerCabeceraComprobante(id, {
            empresaId: context.empresaId!,
            usuarioId: context.usuarioId!
        });

        if (!retencion || retencion.tipo_comprobante !== '07') {
            return NextResponse.json({ error: 'Comprobante de retención no encontrado' }, { status: 404 });
        }

        // 2. Obtener Detalle de Impuestos usando Repositorio
        const impuestos = await ComprobantesRepository.obtenerRetencionImpuestos(id, {
            empresaId: context.empresaId!,
            usuarioId: context.usuarioId!
        });

        return NextResponse.json({
            ...retencion,
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
            }))
        });

    } catch (error: any) {
        console.error('Error al obtener retención:', error);
        return NextResponse.json(
            { error: 'Error al consultar comprobante de retención', details: error.message },
            { status: 500 }
        );
    }
}
