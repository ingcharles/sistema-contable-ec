import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/administracion/puntos-emision/asignaciones
 * Lista todas las asignaciones de usuarios a puntos de emisión
 * Filtros opcionales: usuarioId, puntoEmisionId
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const usuarioId = url.searchParams.get('usuarioId');
        const puntoEmisionId = url.searchParams.get('puntoEmisionId');

        let whereConditions = ['upe.empresa_id = $1'];
        let values: any[] = [context.empresaId];
        let paramIndex = 2;

        if (usuarioId) {
            whereConditions.push(`upe.usuario_id = $${paramIndex}`);
            values.push(usuarioId);
            paramIndex++;
        }

        if (puntoEmisionId) {
            whereConditions.push(`upe.punto_emision_id = $${paramIndex}`);
            values.push(puntoEmisionId);
            paramIndex++;
        }

        const result = await db.query(
            {
                text: `
                    SELECT 
                        upe.id,
                        upe.usuario_id as "usuarioId",
                        u.nombre as "usuarioNombre",
                        u.email as "usuarioEmail",
                        upe.punto_emision_id as "puntoEmisionId",
                        pe.codigo as "puntoCodigo",
                        pe.nombre as "puntoNombre",
                        s.codigo as "sucursalCodigo",
                        upe.activo,
                        upe.es_principal as "esPrincipal",
                        upe.puede_cambiar as "puedeCambiar",
                        upe.created_at as "createdAt"
                    FROM configuracion.usuarios_puntos_emision upe
                    INNER JOIN seguridad.usuarios u ON upe.usuario_id = u.id
                    INNER JOIN configuracion.puntos_emision pe ON upe.punto_emision_id = pe.id
                    INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
                    WHERE ${whereConditions.join(' AND ')}
                    ORDER BY u.nombre, s.codigo, pe.codigo
                `,
                values
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            asignaciones: result.rows,
            total: result.rows.length
        });

    } catch (error: any) {
        console.error('Error al listar asignaciones:', error);
        return NextResponse.json(
            { error: 'Error al obtener asignaciones', details: error.message },
            { status: 500 }
        );
    }
}
