import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

/**
 * GET /api/configuracion/menu
 * Obtiene los items del menú con sus permisos de roles y planes
 */
export async function GET(request: NextRequest) {
    try {
        const context = validateContext(request);
        if (!context.isValid) {
            return NextResponse.json({ error: context.error }, { status: 401 });
        }

        const result = await db.querySimple({
            text: `
      SELECT DISTINCT
        mi.id,
        mi.padre_id as "padreId",
        mi.etiqueta,
        mi.icono,
        mi.ruta,
        mi.orden
      FROM configuracion.menu_items mi
      INNER JOIN seguridad.permisos p ON mi.permiso_id = p.id
      -- 1. Verificar si el ROL del usuario tiene el permiso
      INNER JOIN seguridad.roles_permisos rp ON p.id = rp.permiso_id
      INNER JOIN seguridad.usuarios_roles ur ON rp.rol_id = ur.rol_id AND ur.usuario_id = $1
      -- 2. Verificar si el PLAN del usuario tiene el permiso
      INNER JOIN seguridad.planes_permisos pp ON p.id = pp.permiso_id
      INNER JOIN seguridad.usuarios u ON pp.plan_id = u.plan_id AND u.id = $1
      WHERE mi.activo = true
      ORDER BY mi.orden ASC
      `,
            values: [context.usuarioId]
        });

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error fetching menu:', error);
        return NextResponse.json(
            { error: 'Error al obtener el menú', details: error.message },
            { status: 500 }
        );
    }
}
