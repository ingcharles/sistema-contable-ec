import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

/**
 * PATCH /api/buzon/[id]
 * Actualiza el estado de un comprobante recibido (p.ej. a PROCESADO)
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const body = await req.json();
        const { estado } = body;

        await db.query({
            text: `
                UPDATE buzon.comprobantes_recibidos
                SET estado = $1, updated_at = NOW()
                WHERE id = $2 AND empresa_id = $3
            `,
            values: [estado, id, context.empresaId]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error al actualizar estado de comprobante buzon:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
