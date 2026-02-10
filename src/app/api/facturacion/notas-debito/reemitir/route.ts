import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { ComprobantesRepository } from '@/modules/facturacion/infrastructure/ComprobantesRepository';
import { ReemisionService } from '@/modules/facturacion/domain/services/ReemisionService';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';
import { db } from '@/shared/infrastructure/database/postgresql';

export const runtime = 'nodejs';

/**
 * POST /api/facturacion/notas-debito/reemitir
 * Re-emite una nota de débito existente
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

        if (!compHeader || compHeader.tipo_comprobante !== '05') {
            return NextResponse.json({ error: 'Nota de débito no encontrada' }, { status: 404 });
        }

        const detalles = await ComprobantesRepository.obtenerDetalles(comprobanteId, '05');
        const cliente = (await db.query({
            text: 'SELECT * FROM directorio.terceros WHERE id = $1',
            values: [compHeader.cliente_id]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! })).rows[0];

        const metadata = compHeader.mensajes_sri || {};
        const pagos = metadata.pagos || [];

        const dataSri = SriStandardizer.standardizeNotaDebito({
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
            razonSocialComprador: compHeader.cliente_nombre,
            identificacionComprador: compHeader.cliente_identificacion,
            tipoIdentificacionComprador: cliente?.tipo_identificacion || '07',
            totalSinImpuestos: compHeader.subtotal,
            importeTotal: compHeader.total,
            ambienteSri: configSri.ambiente_sri,
            tipoEmisionSri: compHeader.tipo_emision_sri || '1',
            codDocModificado: metadata.codDocModificado || '01',
            numDocModificado: metadata.numDocModificado || '001-001-000000001',
            fechaEmisionDocSustento: metadata.fechaEmisionDocSustento || compHeader.fecha_emision,
            motivo: metadata.motivo || 'INTERES',
            motivos: detalles.map((d: any) => ({
                razon: d.descripcion,
                valor: d.total
            })),
            codigoIVA: detalles[0]?.codigo_iva || '2',
            tarifa: detalles[0]?.tarifa || 12,
            valorIVA: compHeader.iva,
            valorTotal: compHeader.total
        });

        const resultado = await ReemisionService.procesarReemision(
            dataSri,
            '05',
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
        console.error('Error en re-emisión de nota de débito:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
