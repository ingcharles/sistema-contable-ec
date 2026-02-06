import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/administracion/usuarios/[id]
 * Obtiene detalles de un usuario específico
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const { id } = await params;
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    // Verificar que el usuario es admin o es el mismo usuario
    const isAdmin = context.roles?.includes('ADMIN') || context.roles?.includes('SUPERADMIN');
    const isSelf = context.usuarioId === id;

    if (!isAdmin && !isSelf) {
        return NextResponse.json(
            { error: 'Acceso denegado.' },
            { status: 403 }
        );
    }

    try {
        const result = await db.query(
            {
                text: `
                    SELECT 
                        u.id, u.nombre, u.email, u.activo, u.created_at, u.ultimo_acceso,
                        COALESCE(
                            (SELECT json_agg(r.nombre) 
                             FROM seguridad.usuarios_roles ur 
                             JOIN seguridad.roles r ON ur.rol_id = r.id 
                             WHERE ur.usuario_id = u.id), 
                            '[]'::json
                        ) as roles
                    FROM seguridad.usuarios u
                    WHERE u.id = $1
                `,
                values: [id]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        console.error('Error al obtener usuario:', error);
        return NextResponse.json(
            { error: 'Error al obtener usuario', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/administracion/usuarios/[id]
 * Actualiza datos y roles de un usuario
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const { id } = await params;
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    // Solo ADMIN o SUPERADMIN pueden actualizar otros usuarios
    // El usuario mismo podría actualizar su perfil (pero no sus roles)
    const isAdmin = context.roles?.includes('ADMIN') || context.roles?.includes('SUPERADMIN');
    const isSelf = context.usuarioId === id;

    if (!isAdmin && !isSelf) {
        return NextResponse.json(
            { error: 'Acceso denegado.' },
            { status: 403 }
        );
    }

    try {
        const body = await req.json();
        const { nombre, email, activo, roles } = body;

        await db.transaction(async (client) => {
            // 1. Actualizar datos básicos
            await client.query(`
                UPDATE seguridad.usuarios 
                SET nombre = COALESCE($1, nombre),
                    email = COALESCE($2, email),
                    activo = COALESCE($3, activo),
                    updated_at = NOW()
                WHERE id = $4
            `, [nombre, email, activo, id]);

            // 2. Actualizar roles (solo si es admin)
            if (isAdmin && roles && Array.isArray(roles)) {
                // Eliminar roles actuales
                await client.query(`
                    DELETE FROM seguridad.usuarios_roles WHERE usuario_id = $1
                `, [id]);

                // Insertar nuevos roles
                for (const rolNombre of roles) {
                    await client.query(`
                        INSERT INTO seguridad.usuarios_roles (usuario_id, rol_id)
                        SELECT $1, id FROM seguridad.roles WHERE nombre = $2
                    `, [id, rolNombre]);
                }
            }

            return { success: true };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            message: 'Usuario actualizado exitosamente'
        });

    } catch (error: any) {
        console.error('Error al actualizar usuario:', error);
        return NextResponse.json(
            { error: 'Error al actualizar usuario', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/administracion/usuarios/[id]
 * Desactiva un usuario
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const { id } = await params;
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    // Solo ADMIN o SUPERADMIN
    // if (!context.roles?.includes('ADMIN') && !context.roles?.includes('SUPERADMIN')) {
    //     return NextResponse.json(
    //         { error: 'Acceso denegado. Se requiere rol de administrador.' },
    //         { status: 403 }
    //     );
    // }

    try {
        // En lugar de eliminar, desactivamos
        await db.query(
            {
                text: 'UPDATE seguridad.usuarios SET activo = false, updated_at = NOW() WHERE id = $1',
                values: [id]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            success: true,
            message: 'Usuario desactivado exitosamente'
        });
    } catch (error: any) {
        console.error('Error al desactivar usuario:', error);
        return NextResponse.json(
            { error: 'Error al desactivar usuario', details: error.message },
            { status: 500 }
        );
    }
}
