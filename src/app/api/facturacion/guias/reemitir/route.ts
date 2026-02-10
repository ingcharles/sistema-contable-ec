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

        const compHeader = await ComprobantesRepository.obtenerCabeceraComprobante(comprobanteId, context.empresaId!);

        if (!compHeader || compHeader.tipo_comprobante !== '06') {
            return NextResponse.json({ error: 'Guía de remisión no encontrada' }, { status: 404 });
        }

        const destinatarios = await ComprobantesRepository.obtenerGuiaEstructura(comprobanteId);

        const dataSri = SriStandardizer.standardizeGuia({
            razonSocial: empresaDoc.razon_social,
            nombreComercial: empresaDoc.nombre_comercial,
            ruc: empresaDoc.ruc,
            estab: compHeader.estab || '001',
            ptoEmi: compHeader.pto_emi || '001',
            secuencial: compHeader.secuencial,
            dirMatriz: empresaDoc.direccion,
            dirEstablecimiento: compHeader.direccion_partida || empresaDoc.direccion,
            dirPartida: compHeader.direccion_partida,
            razonSocialTransportista: compHeader.transportista_nombre,
            tipoIdentificacionTransportista: compHeader.transportista_identificacion?.length === 13 ? '04' : '05',
            rucTransportista: compHeader.transportista_identificacion,
            obligadoContabilidad: empresaDoc.es_obligado_contabilidad,
            fechaEmision: compHeader.fecha_emision,
            fechaIniTransporte: compHeader.fecha_emision,
            fechaFinTransporte: compHeader.fecha_emision,
            placa: compHeader.placa_vehiculo,
            destinatarios: destinatarios.map((d: any) => ({
                identificacionDestinatario: d.identificacion,
                razonSocialDestinatario: d.razon_social,
                dirDestinatario: d.direccion,
                motivoTraslado: d.motivo_traslado,
                codDocSustento: d.cod_doc_sustento,
                numDocSustento: d.num_doc_sustento,
                fechaEmisionDocSustento: d.fecha_doc_sustento,
                detalles: d.detalles.map((det: any) => ({
                    codigoInterno: det.codigo_interno,
                    descripcion: det.descripcion,
                    cantidad: det.cantidad
                }))
            })),
            ambienteSri: configSri.ambiente_sri,
            tipoEmisionSri: compHeader.tipo_emision_sri || '1'
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
