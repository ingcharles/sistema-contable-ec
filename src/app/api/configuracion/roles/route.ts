import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/configuracion/roles
 * Lista todos los roles con sus permisos asignados
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

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
                    ORDER BY r.nombre
                `,
                values: []
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            roles: result.rows
        });

    } catch (error: any) {
        console.error('Error al listar roles:', error);
        return NextResponse.json(
            { error: 'Error al obtener roles', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/configuracion/roles
 * Crea un nuevo rol con permisos asignados
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { nombre, descripcion, permisos } = body;

        if (!nombre) {
            return NextResponse.json(
                { error: 'El nombre del rol es requerido' },
                { status: 400 }
            );
        }

        // Verificar si el rol ya existe
        const existente = await db.query(
            {
                text: 'SELECT id FROM seguridad.roles WHERE nombre = $1',
                values: [nombre]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (existente.rows.length > 0) {
            return NextResponse.json(
                { error: 'Ya existe un rol con ese nombre' },
                { status: 400 }
            );
        }

        // Crear rol y asignar permisos en una transacción
        const result = await db.transaction(async (client) => {
            const rolRes = await client.query(
                `INSERT INTO seguridad.roles (nombre, descripcion)
                 VALUES ($1, $2)
                 RETURNING id, nombre, descripcion, created_at as "createdAt"`,
                [nombre, descripcion || null]
            );

            const newRol = rolRes.rows[0];

            // Asignar permisos
            if (permisos && Array.isArray(permisos) && permisos.length > 0) {
                for (const permisoId of permisos) {
                    await client.query(
                        `INSERT INTO seguridad.roles_permisos (rol_id, permiso_id)
                         VALUES ($1, $2)
                         ON CONFLICT DO NOTHING`,
                        [newRol.id, permisoId]
                    );
                }
            }

            return newRol;
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            message: 'Rol creado exitosamente',
            rol: result
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error al crear rol:', error);
        return NextResponse.json(
            { error: 'Error al crear rol', details: error.message },
            { status: 500 }
        );
    }
}
