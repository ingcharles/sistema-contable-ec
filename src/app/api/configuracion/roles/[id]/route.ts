import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/configuracion/roles/[id]
 * Obtiene un rol específico con sus permisos
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db.query(
            {
                text: `
                    SELECT 
                        r.id,
                        r.nombre,
                        r.descripcion,
                        r.created_at as "createdAt",
                        COALESCE(
                            (SELECT json_agg(
                                json_build_object(
                                    'id', p.id,
                                    'codigo', p.codigo,
                                    'nombre', p.nombre,
                                    'descripcion', p.descripcion
                                )
                            )
                            FROM seguridad.roles_permisos rp
                            INNER JOIN seguridad.permisos p ON rp.permiso_id = p.id
                            WHERE rp.rol_id = r.id),
                            '[]'::json
                        ) as permisos
                    FROM seguridad.roles r
                    WHERE r.id = $1
                `,
                values: [id]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Rol no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(result.rows[0]);

    } catch (error: any) {
        console.error('Error al obtener rol:', error);
        return NextResponse.json(
            { error: 'Error al obtener rol', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/configuracion/roles/[id]
 * Actualiza un rol y sus permisos
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await req.json();
        const { nombre, descripcion, permisos } = body;

        if (!nombre) {
            return NextResponse.json(
                { error: 'El nombre del rol es requerido' },
                { status: 400 }
            );
        }

        // Verificar que el rol existe
        const existente = await db.query(
            {
                text: 'SELECT id FROM seguridad.roles WHERE id = $1',
                values: [id]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (existente.rows.length === 0) {
            return NextResponse.json(
                { error: 'Rol no encontrado' },
                { status: 404 }
            );
        }

        // Actualizar rol y permisos en una transacción
        const result = await db.transaction(async (client) => {
            // Actualizar datos básicos del rol
            const rolRes = await client.query(
                `UPDATE seguridad.roles 
                 SET nombre = $1, descripcion = $2
                 WHERE id = $3
                 RETURNING id, nombre, descripcion, created_at as "createdAt"`,
                [nombre, descripcion || null, id]
            );

            const updatedRol = rolRes.rows[0];

            // Eliminar permisos actuales
            await client.query(
                'DELETE FROM seguridad.roles_permisos WHERE rol_id = $1',
                [id]
            );

            // Asignar nuevos permisos
            if (permisos && Array.isArray(permisos) && permisos.length > 0) {
                for (const permisoId of permisos) {
                    await client.query(
                        `INSERT INTO seguridad.roles_permisos (rol_id, permiso_id)
                         VALUES ($1, $2)`,
                        [id, permisoId]
                    );
                }
            }

            return updatedRol;
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            message: 'Rol actualizado exitosamente',
            rol: result
        });

    } catch (error: any) {
        console.error('Error al actualizar rol:', error);
        return NextResponse.json(
            { error: 'Error al actualizar rol', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/configuracion/roles/[id]
 * Elimina un rol
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Verificar si hay usuarios con este rol
        const usuariosConRol = await db.query(
            {
                text: 'SELECT COUNT(*) as count FROM seguridad.usuarios_roles WHERE rol_id = $1',
                values: [id]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (parseInt(usuariosConRol.rows[0].count) > 0) {
            return NextResponse.json(
                { error: 'No se puede eliminar el rol porque tiene usuarios asignados' },
                { status: 400 }
            );
        }

        // Eliminar el rol (los permisos se eliminan en cascada)
        const result = await db.query(
            {
                text: 'DELETE FROM seguridad.roles WHERE id = $1 RETURNING id',
                values: [id]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Rol no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Rol eliminado exitosamente'
        });

    } catch (error: any) {
        console.error('Error al eliminar rol:', error);
        return NextResponse.json(
            { error: 'Error al eliminar rol', details: error.message },
            { status: 500 }
        );
    }
}
