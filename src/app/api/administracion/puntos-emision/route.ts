import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/administracion/puntos-emision
 * Lista todos los puntos de emisión de la empresa con estadísticas
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
                        pe.id,
                        pe.codigo,
                        pe.nombre,
                        pe.descripcion,
                        pe.activo,
                        pe.requiere_asignacion as "requiereAsignacion",
                        pe.permite_multiples_usuarios as "permiteMultiplesUsuarios",
                        pe.created_at as "createdAt",
                        s.id as "sucursalId",
                        s.nombre as "nombreSucursal",
                        s.codigo as "codigoSucursal",
                        (
                            SELECT COUNT(*)::int
                            FROM configuracion.usuarios_puntos_emision upe
                            WHERE upe.punto_emision_id = pe.id
                            AND upe.empresa_id = $1
                        ) as "usuariosAsignadosCount",
                        (
                            SELECT json_agg(
                                json_build_object(
                                    'id', u.id,
                                    'nombre', u.nombre,
                                    'email', u.email,
                                    'esPrincipal', upe.es_principal,
                                    'activo', upe.activo
                                )
                            )
                            FROM configuracion.usuarios_puntos_emision upe
                            INNER JOIN auth.usuarios u ON upe.usuario_id = u.id
                            WHERE upe.punto_emision_id = pe.id
                            AND upe.empresa_id = $1
                        ) as "usuariosAsignados"
                    FROM configuracion.puntos_emision pe
                    INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
                    WHERE s.empresa_id = $1
                    ORDER BY s.codigo, pe.codigo
                `,
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            puntos: result.rows,
            total: result.rows.length
        });

    } catch (error: any) {
        console.error('Error al listar puntos:', error);
        return NextResponse.json(
            { error: 'Error al obtener puntos', details: error.message },
            { status: 500 }
        );
    }
}
