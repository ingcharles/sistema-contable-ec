import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/configuracion/puntos-emision/mis-puntos
 * Obtiene los puntos de emisión asignados al usuario actual
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        // Obtener puntos asignados
        const result = await db.query(
            {
                text: `
                    SELECT 
                        pe.id,
                        pe.codigo,
                        pe.nombre,
                        s.codigo as "sucursalCodigo",
                        s.nombre as "sucursalNombre",
                        upe.activo,
                        upe.es_principal as "esPrincipal",
                        upe.puede_cambiar as "puedeCambiar"
                    FROM configuracion.usuarios_puntos_emision upe
                    INNER JOIN configuracion.puntos_emision pe ON upe.punto_emision_id = pe.id
                    INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
                    WHERE upe.usuario_id = $1
                    AND upe.empresa_id = $2
                    AND pe.activo = true
                    ORDER BY s.codigo, pe.codigo
                `,
                values: [context.usuarioId, context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        // Obtener punto activo usando la función almacenada (para doble verificación)
        const puntoActivoResult = await db.query(
            {
                text: `SELECT * FROM configuracion.fn_obtener_punto_activo_usuario($1, $2)`,
                values: [context.usuarioId, context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            puntosAsignados: result.rows,
            puntoActivo: puntoActivoResult.rows[0] || null
        });

    } catch (error: any) {
        console.error('Error al obtener mis puntos:', error);
        return NextResponse.json(
            { error: 'Error al obtener puntos de emisión', details: error.message },
            { status: 500 }
        );
    }
}
