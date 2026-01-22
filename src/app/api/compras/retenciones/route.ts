import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { RetencionService } from '@/modules/compras/domain/services/RetencionService';

/**
 * POST /api/compras/retenciones
 * Emite una retención electrónica para una compra existente
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { compraId, detalles } = body;

        if (!compraId || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
            return NextResponse.json(
                { error: 'Campos requeridos: compraId, detalles (array no vacío)' },
                { status: 400 }
            );
        }

        // Llamar al servicio de dominio
        const result = await RetencionService.emitir(
            context.empresaId!,
            context.usuarioId!,
            compraId,
            detalles
        );

        return NextResponse.json(result, { status: 201 });

    } catch (error: any) {
        console.error('Error al emitir retención:', error);
        return NextResponse.json(
            { error: 'Error al emitir retención', details: error.message },
            { status: 500 }
        );
    }
}
