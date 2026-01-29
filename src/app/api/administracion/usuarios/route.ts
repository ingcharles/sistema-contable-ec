import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/administracion/usuarios
 * Lista todos los usuarios de la empresa con sus puntos de emisión asignados
 * Solo accesible para ADMIN y SUPERADMIN
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    // Verificar que el usuario es admin
    if (!context.roles?.includes('ADMIN') && !context.roles?.includes('SUPERADMIN')) {
        return NextResponse.json(
            { error: 'Acceso denegado. Se requiere rol de administrador.' },
            { status: 403 }
        );
    }

    try {
        const url = new URL(req.url);
        const buscar = url.searchParams.get('buscar');
        const rol = url.searchParams.get('rol');
        const estado = url.searchParams.get('estado');

        let whereConditions = ['1=1'];
        let values: any[] = [];
        let paramIndex = 1;

        if (buscar) {
            whereConditions.push(`(u.nombre ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
            values.push(`%${buscar}%`);
            paramIndex++;
        }

        if (rol) {
            whereConditions.push(`$${paramIndex} = ANY(u.roles)`);
            values.push(rol);
            paramIndex++;
        }

        if (estado) {
            whereConditions.push(`u.activo = $${paramIndex}`);
            values.push(estado === 'activo');
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // Obtener usuarios con conteo de puntos asignados
        const result = await db.query(
            {
                text: `
                    SELECT 
                        u.id,
                        u.nombre,
                        u.email,
                        u.roles,
                        u.activo,
                        u.created_at as "createdAt",
                        (
                            SELECT COUNT(*)::int
                            FROM configuracion.usuarios_puntos_emision upe
                            WHERE upe.usuario_id = u.id
                            AND upe.empresa_id = $${paramIndex}
                        ) as "cantidadPuntos",
                        (
                            SELECT json_agg(
                                json_build_object(
                                    'puntoEmisionId', pe.id,
                                    'codigo', CONCAT(s.codigo, '-', pe.codigo),
                                    'nombre', pe.nombre,
                                    'activo', upe.activo,
                                    'esPrincipal', upe.es_principal
                                ) ORDER BY s.codigo, pe.codigo
                            )
                            FROM configuracion.usuarios_puntos_emision upe
                            INNER JOIN configuracion.puntos_emision pe ON upe.punto_emision_id = pe.id
                            INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
                            WHERE upe.usuario_id = u.id
                            AND upe.empresa_id = $${paramIndex}
                        ) as "puntosAsignados"
                    FROM seguridad.usuarios u
                    WHERE ${whereClause}
                    ORDER BY u.nombre
                `,
                values: [...values, context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            usuarios: result.rows,
            total: result.rows.length
        });

    } catch (error: any) {
        console.error('Error al listar usuarios:', error);
        return NextResponse.json(
            { error: 'Error al obtener usuarios', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/administracion/usuarios
 * Crea un nuevo usuario (SUPERADMIN only)
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    // Solo SUPERADMIN puede crear usuarios
    if (!context.roles?.includes('SUPERADMIN')) {
        return NextResponse.json(
            { error: 'Solo SUPERADMIN puede crear usuarios' },
            { status: 403 }
        );
    }

    try {
        const body = await req.json();
        const { nombre, email, password, roles } = body;

        if (!nombre || !email || !password) {
            return NextResponse.json(
                { error: 'Nombre, email y password son requeridos' },
                { status: 400 }
            );
        }

        // Verificar si el email ya existe
        const existente = await db.query(
            {
                text: 'SELECT id FROM seguridad.usuarios WHERE email = $1',
                values: [email]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (existente.rows.length > 0) {
            return NextResponse.json(
                { error: 'El email ya está registrado' },
                { status: 400 }
            );
        }

        // Crear usuario (sin hashear password por ahora - agregar bcrypt después)
        const result = await db.query(
            {
                text: `
                    INSERT INTO seguridad.usuarios (nombre, email, password_hash, roles, activo)
                    VALUES ($1, $2, $3, $4, true)
                    RETURNING id, nombre, email, roles, activo
                `,
                values: [nombre, email, password, roles || ['CONTADOR']]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            success: true,
            message: 'Usuario creado exitosamente',
            usuario: result.rows[0]
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error al crear usuario:', error);
        return NextResponse.json(
            { error: 'Error al crear usuario', details: error.message },
            { status: 500 }
        );
    }
}
