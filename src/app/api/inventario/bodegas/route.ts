import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/inventario/bodegas
 * Lista bodegas/almacenes
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
                        id, codigo, nombre, descripcion, responsable, 
                        ubicacion, activa, created_at, updated_at
                    FROM bodegas
                    WHERE empresa_id = $1 AND activa = true
                    ORDER BY nombre ASC
                `,
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar bodegas:', error);
        return NextResponse.json(
            { error: 'Error al consul tar bodegas', details: error.message },
            { status: 500 }
        );
    }
}


export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            codigo,
            nombre,
            descripcion = '',
            responsable = '',
            ubicacion = '',
            sucursalId,
            activa = true
        } = body;

        const id = crypto.randomUUID();

        // Note: Assuming sucursal_id column exists. If not, remove it.
        await db.query(
            {
                text: `
                INSERT INTO bodegas (
                    id, empresa_id, codigo, nombre, descripcion,
                    responsable, ubicacion, sucursal_id,
                    activa, created_at, updated_at, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10)
            `,
                values: [
                    id, context.empresaId, codigo, nombre, descripcion,
                    responsable, ubicacion, sucursalId || null,
                    activa, context.usuarioId
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            message: 'Bodega creada exitosamente',
            id
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error al crear bodega:', error);
        return NextResponse.json(
            { error: 'Error al crear bodega', details: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            id,
            codigo,
            nombre,
            descripcion = '',
            responsable = '',
            ubicacion = '',
            sucursalId,
            activa = true
        } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID de bodega requerido' }, { status: 400 });
        }

        await db.query(
            {
                text: `
                UPDATE bodegas
                SET codigo = $1, nombre = $2, descripcion = $3,
                    responsable = $4, ubicacion = $5, sucursal_id = $6,
                    activa = $7, updated_at = NOW()
                WHERE id = $8 AND empresa_id = $9
            `,
                values: [
                    codigo, nombre, descripcion,
                    responsable, ubicacion, sucursalId || null,
                    activa, id, context.empresaId
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            message: 'Bodega actualizada exitosamente'
        });

    } catch (error: any) {
        console.error('Error al actualizar bodega:', error);
        return NextResponse.json(
            { error: 'Error al actualizar bodega', details: error.message },
            { status: 500 }
        );
    }
}
