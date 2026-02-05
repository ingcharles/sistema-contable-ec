import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const tipo = url.searchParams.get('tipo');

        let queryText = `
            SELECT 
                ci.id,
                ci.codigo, 
                ci.valor, 
                ci.descripcion,
                ci.valor_numerico as "valorNumerico",
                ci.padre_codigo as "padreCodigo"
            FROM configuracion.catalogos_items ci
            JOIN configuracion.catalogos_tipos ct ON ci.catalogo_codigo = ct.codigo
            WHERE ci.activo = true
        `;
        let values: any[] = [];

        if (tipo) {
            queryText += ` AND ct.codigo = $1`;
            values.push(tipo);
        }

        queryText += ` ORDER BY ct.codigo, ci.orden, ci.valor`;

        const result = await db.query(
            { text: queryText, values },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );
        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al obtener catálogos:', error);
        return NextResponse.json(
            { error: 'Error al consultar catálogos', details: error.message },
            { status: 500 }
        );
    }
}
