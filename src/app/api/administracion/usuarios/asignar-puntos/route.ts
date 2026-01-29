import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * POST /api/administracion/usuarios/asignar-puntos
 * Asigna puntos de emisión a un usuario
 * Solo accesible para ADMIN y SUPERADMIN
 */
export async function POST(req: NextRequest) {
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
        const body = await req.json();
        const { usuarioId, puntosEmision } = body;

        if (!usuarioId || !puntosEmision || !Array.isArray(puntosEmision)) {
            return NextResponse.json(
                { error: 'usuarioId y puntosEmision (array) son requeridos' },
                { status: 400 }
            );
        }

        // Validar que el usuario existe
        const usuario = await db.query(
            {
                text: 'SELECT id, nombre FROM auth.usuarios WHERE id = $1',
                values: [usuarioId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (usuario.rows.length === 0) {
            return NextResponse.json(
                { error: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        await db.transaction(async (client) => {
            // Eliminar asignaciones anteriores para esta empresa
            await client.query(`
                DELETE FROM configuracion.usuarios_puntos_emision
                WHERE usuario_id = $1 AND empresa_id = $2
            `, [usuarioId, context.empresaId]);

            // Insertar nuevas asignaciones
            for (const punto of puntosEmision) {
                await client.query(`
                    INSERT INTO configuracion.usuarios_puntos_emision (
                        usuario_id,
                        empresa_id,
                        punto_emision_id,
                        activo,
                        es_principal,
                        puede_cambiar,
                        created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    usuarioId,
                    context.empresaId,
                    punto.puntoEmisionId,
                    punto.activo || false,
                    punto.esPrincipal || false,
                    punto.puedeCambiar !== false, // true por defecto
                    context.usuarioId
                ]);
            }

            // Si hay un punto principal pero no activo, activarlo
            const principal = puntosEmision.find(p => p.esPrincipal);
            if (principal && !principal.activo) {
                await client.query(`
                    UPDATE configuracion.usuarios_puntos_emision
                    SET activo = true
                    WHERE usuario_id = $1
                    AND empresa_id = $2
                    AND punto_emision_id = $3
                `, [usuarioId, context.empresaId, principal.puntoEmisionId]);
            }

        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            message: `Puntos de emisión asignados exitosamente a ${usuario.rows[0].nombre}`,
            cantidadAsignados: puntosEmision.length
        });

    } catch (error: any) {
        console.error('Error al asignar puntos de emisión:', error);
        return NextResponse.json(
            { error: 'Error al asignar puntos de emisión', details: error.message },
            { status: 500 }
        );
    }
}
