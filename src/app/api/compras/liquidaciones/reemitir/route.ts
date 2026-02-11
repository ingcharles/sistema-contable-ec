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

        const compHeader = await ComprobantesRepository.obtenerCabeceraComprobante(comprobanteId, context.empresaId!);

        if (!compHeader || compHeader.tipo_comprobante !== '03') {
            return NextResponse.json({ error: 'Liquidación de compra no encontrada' }, { status: 404 });
        }

        const detalles = await ComprobantesRepository.obtenerDetalles(comprobanteId, '03');

        const metadata = compHeader.mensajes_sri || {};
        const pagos = metadata.pagos || [];

        const dataSri = SriStandardizer.standardizeLiquidacion({
            razonSocial: empresaDoc.razon_social,
            nombreComercial: empresaDoc.nombre_comercial,
            ruc: empresaDoc.ruc,
            estab: compHeader.estab,
            ptoEmi: compHeader.pto_emi,
            secuencial: compHeader.secuencial,
            dirMatriz: empresaDoc.direccion,
            fechaEmision: compHeader.fecha_emision,
            tipoIdentificacionProveedor: compHeader.cliente_identificacion?.length === 13 ? '04' : '05',
            razonSocialProveedor: compHeader.cliente_nombre,
            identificacionProveedor: compHeader.cliente_identificacion,
            direccionProveedor: '',
            obligadoContabilidad: empresaDoc.es_obligado_contabilidad,
            totalSinImpuestos: compHeader.subtotal,
            importeTotal: compHeader.total,
            detalles: detalles.map((d: any) => ({
                codigoPrincipal: d.codigo_principal || d.codigo_interno,
                descripcion: d.descripcion,
                cantidad: d.cantidad,
                precioUnitario: d.precio_unitario,
                descuento: d.descuento || 0,
                totalSinImpuestos: d.total,
                codigoIVA: d.codigo_iva || '2',
                valorIVA: d.valor_iva || 0,
                baseImponible: d.total,
                tarifa: d.porcentaje_iva || d.tarifa || 12
            })),
            pagos,
            ambienteSri: configSri.ambiente_sri,
            tipoEmisionSri: compHeader.tipo_emision_sri || '1'
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
