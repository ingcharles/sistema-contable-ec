import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/contabilidad/centros-costos
 * Lista los centros de costos de la empresa
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
                    SELECT id, codigo, nombre, nivel, activo, created_at as "createdAt"
                    FROM contabilidad.centros_costos
                    WHERE empresa_id = $1
                    ORDER BY codigo ASC
                `,
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar centros de costos:', error);
        return NextResponse.json(
            { error: 'Error al consultar centros de costos', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/contabilidad/centros-costos
 * Crea un nuevo centro de costos
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { codigo, nombre, nivel, activo = true } = body;

        if (!codigo || !nombre || nivel === undefined) {
            return NextResponse.json(
                { error: 'Campos requeridos: codigo, nombre, nivel' },
                { status: 400 }
            );
        }

        const id = crypto.randomUUID();

        await db.query(
            {
                text: `
                    INSERT INTO contabilidad.centros_costos (id, empresa_id, codigo, nombre, nivel, activo)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `,
                values: [id, context.empresaId, codigo, nombre, nivel, activo]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({ success: true, id, message: 'Centro de costos creado exitosamente' }, { status: 201 });
    } catch (error: any) {
        console.error('Error al crear centro de costos:', error);
        return NextResponse.json(
            { error: 'Error al crear centro de costos', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/contabilidad/centros-costos
 * Actualiza un centro de costos existente
 */
export async function PUT(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, codigo, nombre, nivel, activo } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID de centro de costos requerido' }, { status: 400 });
        }

        const result = await db.query(
            {
                text: `
                    UPDATE contabilidad.centros_costos
                    SET codigo = $1, nombre = $2, nivel = $3, activo = $4
                    WHERE id = $5 AND empresa_id = $6
                    RETURNING id
                `,
                values: [codigo, nombre, nivel, activo, id, context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Centro de costos no encontrado' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Centro de costos actualizado exitosamente' });
    } catch (error: any) {
        console.error('Error al actualizar centro de costos:', error);
        return NextResponse.json(
            { error: 'Error al actualizar centro de costos', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/contabilidad/centros-costos
 * Elimina un centro de costos
 */
export async function DELETE(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID de centro de costos requerido' }, { status: 400 });
        }

        const result = await db.query(
            {
                text: 'DELETE FROM contabilidad.centros_costos WHERE id = $1 AND empresa_id = $2 RETURNING id',
                values: [id, context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Centro de costos no encontrado' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Centro de costos eliminado exitosamente' });
    } catch (error: any) {
        console.error('Error al eliminar centro de costos:', error);
        return NextResponse.json(
            { error: 'Error al eliminar centro de costos', details: error.message },
            { status: 500 }
        );
    }
}
