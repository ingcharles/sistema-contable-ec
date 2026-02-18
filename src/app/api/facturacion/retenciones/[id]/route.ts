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

        if (!retencion || retencion.tipoComprobante !== '07') {
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
                codigoRetencion: imp.codigoRetencion,
                baseImponible: imp.baseImponible,
                porcentajeRetener: imp.porcentajeRetener,
                valorRetenido: imp.valorRetenido,
                codDocSustento: imp.codDocSustento,
                numDocSustento: imp.numDocSustento,
                fechaEmisionDocSustento: imp.fechaEmisionDocSustento,
                codSustento: imp.codSustento,
                numAutDocSustento: imp.numAutDocSustento,
                totalSinImpuestosDocSustento: imp.totalSinImpuestosDocSustento,
                baseImponibleIvaDocSustento: imp.baseImponibleIvaDocSustento,
                importeTotalDocSustento: imp.importeTotalDocSustento,
                pagoLocExt: imp.pagoLocExt,
                formaPago: imp.formaPago,
                ivaDocSustento: imp.ivaDocSustento
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
