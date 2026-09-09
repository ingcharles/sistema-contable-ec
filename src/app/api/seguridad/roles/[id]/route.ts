import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/seguridad/roles/[id]
 * Obtiene detalle de un rol con sus permisos
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const { id } = await params;

        const rolRes = await db.query(
            { text: `SELECT * FROM seguridad.roles WHERE id = $1`, values: [id] },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (rolRes.rows.length === 0) return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });

        const permisosRes = await db.query(
            {
                text: `
                    SELECT p.id, p.codigo, p.nombre, p.modulo 
                    FROM seguridad.roles_permisos rp
                    JOIN seguridad.permisos p ON p.id = rp.permiso_id
                    WHERE rp.rol_id = $1
                `,
                values: [id]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            ...rolRes.rows[0],
            permisos: permisosRes.rows
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/seguridad/roles/[id]
 * Actualiza rol y sus permisos
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const { id } = await params;
        const body = await req.json();
        const { nombre, descripcion, permisosIds } = body;

        await db.transaction(async (client) => {
            // 1. Actualizar Rol
            await client.query(
                `UPDATE seguridad.roles SET nombre = $1, descripcion = $2 WHERE id = $3`,
                [nombre, descripcion, id]
            );

            // 2. Actualizar Permisos (Borrar y Recrear)
            if (permisosIds) {
                await client.query(`DELETE FROM seguridad.roles_permisos WHERE rol_id = $1`, [id]);
                for (const permisoId of permisosIds) {
                    await client.query(
                        `INSERT INTO seguridad.roles_permisos (rol_id, permiso_id) VALUES ($1, $2)`,
                        [id, permisoId]
                    );
                }
            }
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error al actualizar rol:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/seguridad/roles/[id]
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const { id } = await params;

        // Validar si está en uso por usuarios
        const usoCheck = await db.query(
            { text: `SELECT 1 FROM seguridad.usuarios_roles WHERE rol_id = $1 LIMIT 1`, values: [id] },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (usoCheck.rows.length > 0) {
            return NextResponse.json({ error: 'No se puede eliminar el rol porque está asignado a usuarios.' }, { status: 400 });
        }

        await db.query(
            { text: `DELETE FROM seguridad.roles WHERE id = $1`, values: [id] },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
