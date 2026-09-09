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

        const compHeader = await ComprobantesRepository.obtenerCabeceraComprobante(comprobanteId, {
            empresaId: context.empresaId!,
            usuarioId: context.usuarioId!
        });

        if (!compHeader || compHeader.tipoComprobante !== '07') {
            return NextResponse.json({ error: 'Comprobante de retención no encontrado' }, { status: 404 });
        }

        const impuestos = await ComprobantesRepository.obtenerRetencionImpuestos(comprobanteId, {
            empresaId: context.empresaId!,
            usuarioId: context.usuarioId!
        });

        const dataSri = SriStandardizer.standardizeRetencion({
            razonSocial: empresaDoc.razonSocial,
            nombreComercial: empresaDoc.nombreComercial,
            ruc: empresaDoc.ruc,
            estab: compHeader.estab,
            ptoEmi: compHeader.ptoEmi,
            secuencial: compHeader.secuencial,
            dirMatriz: empresaDoc.direccion,
            fechaEmision: compHeader.fechaEmision,
            obligadoContabilidad: empresaDoc.esObligadoContabilidad,
            tipoIdentificacionSujetoRetenido: compHeader.clienteIdentificacion?.length === 13 ? '04' : '05',
            razonSocialSujetoRetenido: compHeader.clienteNombre,
            identificacionSujetoRetenido: compHeader.clienteIdentificacion,
            periodoFiscal: compHeader.fechaEmision.substring(5, 7) + '/' + compHeader.fechaEmision.substring(0, 4),
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
            })),
            ambienteSri: configSri.ambienteSri,
            tipoEmisionSri: compHeader.tipoEmisionSri
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
