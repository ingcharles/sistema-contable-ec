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
                SELECT 
                    mi.id,
                    mi.label,
                    mi.icon_name as "iconName",
                    mi.path,
                    mi.plan_minimo as "minPlan",
                    COALESCE(array_agg(r.nombre) FILTER (WHERE r.nombre IS NOT NULL), '{}') as "requiredRoles"
                FROM configuracion.menu_items mi
                LEFT JOIN configuracion.menu_item_roles mir ON mi.id = mir.menu_item_id
                LEFT JOIN seguridad.roles r ON mir.rol_id = r.id
                WHERE mi.activo = true
                AND (
                    -- Validar Plan
                    CASE 
                        WHEN mi.plan_minimo = 'PROFESIONAL' THEN 1 
                        WHEN mi.plan_minimo = 'EMPRESARIAL' THEN 2 
                        ELSE 0 
                    END <= (
                        SELECT CASE 
                            WHEN p.codigo = 'PROFESIONAL' THEN 1 
                            WHEN p.codigo = 'EMPRESARIAL' THEN 2 
                            ELSE 0 
                        END
                        FROM seguridad.usuarios u
                        LEFT JOIN seguridad.planes p ON u.plan_id = p.id
                        WHERE u.id = $1
                    )
                )
                AND (
                    -- Validar Roles: Permitir si no tiene roles requeridos O si el usuario tiene uno de ellos
                    NOT EXISTS (SELECT 1 FROM configuracion.menu_item_roles mir2 WHERE mir2.menu_item_id = mi.id)
                    OR EXISTS (
                        SELECT 1 FROM configuracion.menu_item_roles mir2 
                        JOIN seguridad.roles r2 ON mir2.rol_id = r2.id
                        JOIN seguridad.usuarios_roles ur ON r2.id = ur.rol_id
                        WHERE mir2.menu_item_id = mi.id 
                        AND ur.usuario_id = $1
                    )
                )
                GROUP BY mi.id
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
