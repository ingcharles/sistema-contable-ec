import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { ComprobantesRepository } from '@/modules/facturacion/infrastructure/ComprobantesRepository';
import { ReemisionService } from '@/modules/facturacion/domain/services/ReemisionService';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';

export const runtime = 'nodejs';

/**
 * POST /api/compras/liquidaciones/reemitir
 * Re-emite una liquidación de compra existente
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

        if (!compHeader || compHeader.tipoComprobante !== '03') {
            return NextResponse.json({ error: 'Liquidación de compra no encontrada' }, { status: 404 });
        }

        const detalles = await ComprobantesRepository.obtenerDetalles(comprobanteId, '03', {
            empresaId: context.empresaId!,
            usuarioId: context.usuarioId!
        });

        const metadata = compHeader.mensajesSri || {};
        const pagos = metadata.pagos || [];

        const dataSri = SriStandardizer.standardizeLiquidacion({
            razonSocial: empresaDoc.razonSocial,
            nombreComercial: empresaDoc.nombreComercial,
            ruc: empresaDoc.ruc,
            estab: compHeader.estab,
            ptoEmi: compHeader.ptoEmi,
            secuencial: compHeader.secuencial,
            dirMatriz: empresaDoc.direccion,
            fechaEmision: compHeader.fechaEmision,
            tipoIdentificacionProveedor: compHeader.clienteIdentificacion?.length === 13 ? '04' : '05',
            razonSocialProveedor: compHeader.clienteNombre,
            identificacionProveedor: compHeader.clienteIdentificacion,
            direccionProveedor: '',
            obligadoContabilidad: empresaDoc.esObligadoContabilidad,
            totalSinImpuestos: compHeader.subtotal,
            importeTotal: compHeader.total,
            detalles: detalles.map((d: any) => ({
                codigoPrincipal: d.codigoPrincipal || d.codigoInterno,
                descripcion: d.descripcion,
                cantidad: d.cantidad,
                precioUnitario: d.precioUnitario,
                descuento: d.descuento || 0,
                totalSinImpuestos: d.total,
                codigoIVA: d.codigoIva || '2',
                valorIVA: d.valorIva || 0,
                baseImponible: d.total,
                tarifa: d.porcentajeIva || d.tarifa || 12
            })),
            pagos,
            ambienteSri: configSri.ambienteSri,
            tipoEmisionSri: compHeader.tipoEmisionSri || '1'
        });

        const resultado = await ReemisionService.procesarReemision(
            dataSri,
            '03',
            configSri,
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        await ReemisionService.actualizarLiquidacion(
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
        console.error('Error en re-emisión de liquidación:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
