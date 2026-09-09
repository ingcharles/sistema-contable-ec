import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/seguridad/roles
 * Lista todos los roles
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const result = await db.query(
            {
                text: `SELECT id, nombre, descripcion, created_at FROM seguridad.roles ORDER BY nombre`
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );
        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar roles:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/seguridad/roles
 * Crea un nuevo rol con permisos
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const body = await req.json();
        const { nombre, descripcion, permisosIds } = body;

        if (!nombre) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

        const result = await db.transaction(async (client) => {
            // 1. Crear Rol
            const rolRes = await client.query(
                `INSERT INTO seguridad.roles (nombre, descripcion) VALUES ($1, $2) RETURNING id, nombre, descripcion`,
                [nombre, descripcion]
            );
            const newRol = rolRes.rows[0];

            // 2. Asignar Permisos
            if (permisosIds && Array.isArray(permisosIds)) {
                for (const permisoId of permisosIds) {
                    await client.query(
                        `INSERT INTO seguridad.roles_permisos (rol_id, permiso_id) VALUES ($1, $2)`,
                        [newRol.id, permisoId]
                    );
                }
            }
            return newRol;
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error('Error al crear rol:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
