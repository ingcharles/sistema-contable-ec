import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/inventario/categorias
 * Lista categorías de productos
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const returnAll = searchParams.get('all') === 'true';

        // Si se piden todas, no hacemos paginación
        if (returnAll) {
            const result = await db.query(
                {
                    text: `
                        SELECT 
                            id, nombre, descripcion, 
                            cuenta_inventario as "cuentaInventario", 
                            cuenta_costo_venta as "cuentaCostoVenta", 
                            cuenta_venta as "cuentaVenta",
                            activa, created_at as "createdAt", updated_at as "updatedAt"
                        FROM inventario.categorias_producto
                        WHERE empresa_id = $1 AND activa = true
                        ORDER BY nombre ASC
                    `,
                    values: [context.empresaId]
                },
                { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
            );

            return NextResponse.json({
                data: result.rows,
                pagination: {
                    page: 1,
                    limit: result.rowCount,
                    total: result.rowCount,
                    totalPages: 1
                }
            });
        }

        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const offset = (page - 1) * limit;

        // Contar total
        const countResult = await db.query(
            {
                text: `
                    SELECT COUNT(*) as total
                    FROM inventario.categorias_producto
                    WHERE empresa_id = $1 AND activa = true
                `,
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const total = parseInt(countResult.rows[0]?.total || '0', 10);

        // Obtener datos paginados
        const result = await db.query(
            {
                text: `
                    SELECT 
                        id, nombre, descripcion, 
                        cuenta_inventario as "cuentaInventario", 
                        cuenta_costo_venta as "cuentaCostoVenta", 
                        cuenta_venta as "cuentaVenta",
                        activa, created_at as "createdAt", updated_at as "updatedAt"
                    FROM inventario.categorias_producto
                    WHERE empresa_id = $1 AND activa = true
                    ORDER BY nombre ASC
                    LIMIT $2 OFFSET $3
                `,
                values: [context.empresaId, limit, offset]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Error al listar categorías:', error);
        return NextResponse.json(
            { error: 'Error al consultar categorías', details: error.message },
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
            nombre,
            descripcion = '',
            cuentaInventario = '',
            cuentaCostoVenta = '',
            cuentaVenta = '',
            activa = true
        } = body;

        const result = await db.query(
            {
                text: `
                INSERT INTO inventario.categorias_producto (
                    empresa_id, nombre, descripcion,
                    cuenta_inventario, cuenta_costo_venta, cuenta_venta,
                    activa, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                RETURNING id
            `,
                values: [
                    context.empresaId, nombre, descripcion,
                    cuentaInventario, cuentaCostoVenta, cuentaVenta,
                    activa
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const id = result.rows[0].id;

        return NextResponse.json({
            message: 'Categoría creada exitosamente',
            id
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error al crear categoría:', error);
        return NextResponse.json(
            { error: 'Error al crear categoría', details: error.message },
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
            nombre,
            descripcion = '',
            cuentaInventario = '',
            cuentaCostoVenta = '',
            cuentaVenta = '',
            activa = true
        } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID de categoría requerido' }, { status: 400 });
        }

        await db.query(
            {
                text: `
                UPDATE inventario.categorias_producto
                SET nombre = $1, descripcion = $2,
                    cuenta_inventario = $3, cuenta_costo_venta = $4, cuenta_venta = $5,
                    activa = $6, updated_at = NOW()
                WHERE id = $7 AND empresa_id = $8
            `,
                values: [
                    nombre, descripcion,
                    cuentaInventario, cuentaCostoVenta, cuentaVenta,
                    activa, id, context.empresaId
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            message: 'Categoría actualizada exitosamente'
        });

    } catch (error: any) {
        console.error('Error al actualizar categoría:', error);
        return NextResponse.json(
            { error: 'Error al actualizar categoría', details: error.message },
            { status: 500 }
        );
    }
}
