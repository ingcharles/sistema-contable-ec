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
                    FROM inventario.bodegas
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
            activa = true
        } = body;

        const id = crypto.randomUUID();

        // Note: Assuming sucursal_id column exists. If not, remove it.
        await db.query(
            {
                text: `
                INSERT INTO inventario.bodegas (
                    id, empresa_id, codigo, nombre, descripcion,
                    responsable, ubicacion,
                    activa, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            `,
                values: [
                    id, context.empresaId, codigo, nombre, descripcion,
                    responsable, ubicacion,
                    activa
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
            activa = true
        } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID de bodega requerido' }, { status: 400 });
        }

        await db.query(
            {
                text: `
                UPDATE inventario.bodegas
                SET codigo = $1, nombre = $2, descripcion = $3,
                    responsable = $4, ubicacion = $5,
                    activa = $6, updated_at = NOW()
                WHERE id = $7 AND empresa_id = $8
            `,
                values: [
                    codigo, nombre, descripcion,
                    responsable, ubicacion,
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
