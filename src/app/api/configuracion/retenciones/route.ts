import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/configuracion/retenciones
 * Lista códigos de retención de la empresa
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const result = await db.query(
            {
                text: `
                    SELECT 
                        id, codigo, concepto, porcentaje, tipo, activo,
                        created_at, updated_at
                    FROM configuracion.codigos_retencion
                    WHERE empresa_id = $1
                    ORDER BY tipo ASC, codigo ASC
                `,
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar retenciones:', error);
        return NextResponse.json(
            { error: 'Error al consultar retenciones', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/configuracion/retenciones
 * Crea un nuevo código de retención
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { codigo, concepto, porcentaje, tipo, activo = true } = body;

        if (!codigo || !concepto || porcentaje === undefined || !tipo) {
            return NextResponse.json({ error: 'Campos requeridos: codigo, concepto, porcentaje, tipo' }, { status: 400 });
        }

        const result = await db.query(
            {
                text: `
                    INSERT INTO configuracion.codigos_retencion (
                        empresa_id, codigo, concepto, porcentaje, tipo, activo, created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id
                `,
                values: [context.empresaId, codigo, concepto, porcentaje, tipo, activo, context.usuarioId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const id = result.rows[0].id;

        return NextResponse.json({ success: true, id, message: 'Código de retención creado exitosamente' }, { status: 201 });
    } catch (error: any) {
        console.error('Error al crear retencion:', error);
        return NextResponse.json({ error: 'Error al crear retención', details: error.message }, { status: 500 });
    }
}
