import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { ComprobantesRepository } from '@/modules/facturacion/infrastructure/ComprobantesRepository';
import { ReemisionService } from '@/modules/facturacion/domain/services/ReemisionService';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';
import { db } from '@/shared/infrastructure/database/postgresql';

export const runtime = 'nodejs';

/**
 * POST /api/facturacion/vender/reemitir
 * Re-emite una factura existente
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const { comprobanteId } = await req.json();

        if (!comprobanteId) {
            return NextResponse.json({ error: 'ID de comprobante requerido' }, { status: 400 });
        }

        // 1. Obtener configuración y empresa
        const configSri = await ReemisionService.obtenerConfiguracionSri(context.empresaId!, context.usuarioId!);
        const empresaDoc = await ReemisionService.obtenerEmpresa(context.empresaId!, context.usuarioId!);

        // 2. Obtener datos del comprobante
        const compHeader = await ComprobantesRepository.obtenerCabeceraComprobante(comprobanteId, context.empresaId!);

        if (!compHeader || compHeader.tipo_comprobante !== '01') {
            return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
        }

        // 3. Obtener detalles y cliente
        const detalles = await ComprobantesRepository.obtenerDetalles(comprobanteId, '01');
        const cliente = (await db.query({
            text: 'SELECT * FROM directorio.terceros WHERE id = $1',
            values: [compHeader.cliente_id]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! })).rows[0];

        // 4. Recuperar metadatos
        const metadata = compHeader.mensajes_sri || {};
        const pagos = metadata.pagos || [];

        // 5. Preparar datos para SRI
        const dataSri = SriStandardizer.standardizeFactura({
            ...compHeader,
            detalles: detalles.map((d: any) => ({
                codigoPrincipal: d.codigo_principal,
                descripcion: d.descripcion,
                cantidad: d.cantidad,
                precioUnitario: d.precio_unitario,
                descuento: d.descuento,
                totalSinImpuestos: d.total,
                codigoIVA: d.codigo_iva || '2',
                valorIVA: d.valor_iva,
                baseImponible: d.total,
                tarifa: d.tarifa || 12
            })),
            pagos,
            razonSocial: empresaDoc.razon_social,
            nombreComercial: empresaDoc.nombre_comercial,
            ruc: empresaDoc.ruc,
            estab: compHeader.estab || '001',
            ptoEmi: compHeader.pto_emi || '001',
            dirMatriz: empresaDoc.direccion,
            obligadoContabilidad: empresaDoc.es_obligado_contabilidad,
            tipoIdentificacionComprador: cliente?.tipo_identificacion || '07',
            razonSocialComprador: compHeader.cliente_nombre,
            identificacionComprador: compHeader.cliente_identificacion,
            direccionComprador: cliente?.direccion,
            totalSinImpuestos: compHeader.subtotal,
            totalDescuento: compHeader.total_descuento,
            totalImpuestos: compHeader.iva,
            importeTotal: compHeader.total,
            moneda: 'DOLAR',
            ambienteSri: configSri.ambiente_sri,
            tipoEmisionSri: compHeader.tipo_emision_sri || '1'
        });

        // 6. Procesar re-emisión
        const resultado = await ReemisionService.procesarReemision(
            dataSri,
            '01',
            configSri,
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        // 7. Actualizar base de datos
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
        console.error('Error en re-emisión de factura:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
