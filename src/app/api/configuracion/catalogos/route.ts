import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/configuracion/catalogos?tipo=MOTIVO_NC
 * Obtiene los items de un catálogo específico
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const tipo = searchParams.get('tipo');

        if (!tipo) {
            return NextResponse.json(
                { error: 'El parámetro tipo es requerido' },
                { status: 400 }
            );
        }

        const result = await db.query({
            text: `
            SELECT id, codigo, valor, catalogo_codigo, activo
            FROM configuracion.catalogos_items
            WHERE catalogo_codigo = $1 AND activo = true
            ORDER BY codigo
        `,
            values: [tipo]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al obtener catálogo:', error);
        return NextResponse.json(
            { error: 'Error al consultar catálogo', details: error.message },
            { status: 500 }
        );
    }
}
