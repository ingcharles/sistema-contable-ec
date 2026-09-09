import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { ComprobantesRepository } from '@/modules/facturacion/infrastructure/ComprobantesRepository';

/**
 * GET /api/facturacion/guias/[id]
 * Obtiene el detalle completo de una guía de remisión por ID
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
        const guia = await ComprobantesRepository.obtenerCabeceraComprobante(id, {
            empresaId: context.empresaId!,
            usuarioId: context.usuarioId!
        });

        if (!guia || guia.tipo_comprobante !== '06') {
            return NextResponse.json({ error: 'Guía no encontrada' }, { status: 404 });
        }

        // 2. Obtener Destinatarios y sus Detalles usando Repositorio
        const destinatarios = await ComprobantesRepository.obtenerGuiaEstructura(id, {
            empresaId: context.empresaId!,
            usuarioId: context.usuarioId!
        });

        return NextResponse.json({
            ...guia,
            destinatarios
        });

    } catch (error: any) {
        console.error('Error al obtener guía:', error);
        return NextResponse.json(
            { error: 'Error al consultar guía', details: error.message },
            { status: 500 }
        );
    }
}
