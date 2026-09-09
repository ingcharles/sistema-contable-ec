import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { ComprobantesRepository } from '@/modules/facturacion/infrastructure/ComprobantesRepository';
import { ReemisionService } from '@/modules/facturacion/domain/services/ReemisionService';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';

export const runtime = 'nodejs';

/**
 * POST /api/facturacion/guias/reemitir
 * Re-emite una guía de remisión existente
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

        if (!compHeader || compHeader.tipoComprobante !== '06') {
            return NextResponse.json({ error: 'Guía de remisión no encontrada' }, { status: 404 });
        }

        const destinatarios = await ComprobantesRepository.obtenerGuiaEstructura(comprobanteId, {
            empresaId: context.empresaId!,
            usuarioId: context.usuarioId!
        });

        const dataSri = SriStandardizer.standardizeGuia({
            razonSocial: empresaDoc.razonSocial,
            nombreComercial: empresaDoc.nombreComercial,
            ruc: empresaDoc.ruc,
            estab: compHeader.estab,
            ptoEmi: compHeader.ptoEmi,
            secuencial: compHeader.secuencial,
            dirMatriz: empresaDoc.direccion,
            dirEstablecimiento: compHeader.direccionPartida || empresaDoc.direccion,
            dirPartida: compHeader.direccionPartida,
            razonSocialTransportista: compHeader.transportistaNombre,
            tipoIdentificacionTransportista: compHeader.transportistaIdentificacion?.length === 13 ? '04' : '05',
            rucTransportista: compHeader.transportistaIdentificacion,
            obligadoContabilidad: empresaDoc.esObligadoContabilidad,
            fechaEmision: compHeader.fechaEmision,
            fechaIniTransporte: compHeader.fechaEmision,
            fechaFinTransporte: compHeader.fechaEmision,
            placa: compHeader.placaVehiculo,
            destinatarios: destinatarios.map((d: any) => ({
                identificacionDestinatario: d.identificacion,
                razonSocialDestinatario: d.razonSocial,
                dirDestinatario: d.direccion,
                motivoTraslado: d.motivoTraslado,
                codDocSustento: d.codDocSustento,
                numDocSustento: d.numDocSustento,
                fechaEmisionDocSustento: d.fechaDocSustento,
                detalles: d.detalles.map((det: any) => ({
                    codigoInterno: det.codigoInterno,
                    descripcion: det.descripcion,
                    cantidad: det.cantidad
                }))
            })),
            ambienteSri: configSri.ambienteSri,
            tipoEmisionSri: compHeader.tipoEmisionSri || '1'
        });

        const resultado = await ReemisionService.procesarReemision(
            dataSri,
            '06',
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
        console.error('Error en re-emisión de guía:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
