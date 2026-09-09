import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { ComprobantesRepository } from '@/modules/facturacion/infrastructure/ComprobantesRepository';
import { ReemisionService } from '@/modules/facturacion/domain/services/ReemisionService';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';
import { db } from '@/shared/infrastructure/database/postgresql';

export const runtime = 'nodejs';

/**
 * POST /api/facturacion/notas-credito/reemitir
 * Re-emite una nota de crédito existente
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

        if (!compHeader || compHeader.tipoComprobante !== '04') {
            return NextResponse.json({ error: 'Nota de crédito no encontrada' }, { status: 404 });
        }

        const detalles = await ComprobantesRepository.obtenerDetalles(comprobanteId, '04', {
            empresaId: context.empresaId!,
            usuarioId: context.usuarioId!
        });
        const clienteRaw = (await db.query({
            text: `
                SELECT 
                    id, razon_social AS "razonSocial", identificacion, 
                    tipo_identificacion AS "tipoIdentificacion", direccion
                FROM directorio.terceros 
                WHERE id = $1
            `,
            values: [compHeader.clienteId]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! })).rows[0];
        const cliente = clienteRaw;

        const metadata = compHeader.mensajesSri || {};

        const dataSri = SriStandardizer.standardizeNotaCredito({
            ...compHeader,
            detalles: detalles.map((d: any) => ({
                codigoPrincipal: d.codigoPrincipal,
                descripcion: d.descripcion,
                cantidad: d.cantidad,
                precioUnitario: d.precioUnitario,
                descuento: d.descuento,
                totalSinImpuestos: d.total,
                codigoIVA: d.codigoIva || '2',
                valorIVA: d.valorIva,
                baseImponible: d.total,
                tarifa: d.tarifa || 12
            })),
            razonSocial: empresaDoc.razonSocial,
            nombreComercial: empresaDoc.nombreComercial,
            ruc: empresaDoc.ruc,
            estab: compHeader.estab,
            ptoEmi: compHeader.ptoEmi,
            dirMatriz: empresaDoc.direccion,
            obligadoContabilidad: empresaDoc.esObligadoContabilidad,
            razonSocialComprador: compHeader.clienteNombre,
            identificacionComprador: compHeader.clienteIdentificacion,
            tipoIdentificacionComprador: cliente?.tipoIdentificacion || '07',
            totalSinImpuestos: compHeader.subtotal,
            importeTotal: compHeader.total,
            ambienteSri: configSri.ambienteSri,
            tipoEmisionSri: compHeader.tipoEmisionSri || '1',
            codDocModificado: metadata.codDocModificado || '01',
            numDocModificado: metadata.numDocModificado || '001-001-000000001',
            fechaEmisionDocSustento: metadata.fechaEmisionDocSustento || metadata.fecha_emision_doc_sustento || compHeader.fechaEmision,
            motivo: metadata.motivo || 'DEVOLUCION'
        });

        const resultado = await ReemisionService.procesarReemision(
            dataSri,
            '04',
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
        console.error('Error en re-emisión de nota de crédito:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
