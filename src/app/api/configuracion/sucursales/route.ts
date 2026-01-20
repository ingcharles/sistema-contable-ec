import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/configuracion/sucursales
 * Lista sucursales de la empresa
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
                        id, codigo, nombre, direccion, es_matriz, activa,
                        created_at, updated_at
                    FROM sucursales
                    WHERE empresa_id = $1
                    ORDER BY codigo ASC
                `,
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar sucursales:', error);
        return NextResponse.json(
            { error: 'Error al consultar sucursales', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/configuracion/sucursales
 * Crea una nueva sucursal
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { codigo, nombre, direccion, esMatriz = false, activa = true } = body;

        if (!codigo || !nombre) {
            return NextResponse.json({ error: 'Código y nombre son requeridos' }, { status: 400 });
        }

        const id = crypto.randomUUID();

        await db.query(
            {
                text: `
                    INSERT INTO sucursales (
                        id, empresa_id, codigo, nombre, direccion, es_matriz, activa, created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `,
                values: [id, context.empresaId, codigo, nombre, direccion, esMatriz, activa, context.usuarioId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({ success: true, id, message: 'Sucursal creada exitosamente' }, { status: 201 });
    } catch (error: any) {
        console.error('Error al crear sucursal:', error);
        return NextResponse.json({ error: 'Error al crear sucursal', details: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/configuracion/sucursales
 * Actualiza una sucursal existente
 */
export async function PUT(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, codigo, nombre, direccion, esMatriz, activa } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID de sucursal requerido' }, { status: 400 });
        }

        await db.query(
            {
                text: `
                    UPDATE sucursales
                    SET codigo = $1, nombre = $2, direccion = $3, es_matriz = $4, activa = $5, updated_at = NOW()
                    WHERE id = $6 AND empresa_id = $7
                `,
                values: [codigo, nombre, direccion, esMatriz, activa, id, context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({ success: true, message: 'Sucursal actualizada exitosamente' });
    } catch (error: any) {
        console.error('Error al actualizar sucursal:', error);
        return NextResponse.json({ error: 'Error al actualizar sucursal', details: error.message }, { status: 500 });
    }
}
