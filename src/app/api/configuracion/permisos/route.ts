import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/configuracion/permisos
 * Lista todos los permisos disponibles agrupados por módulo
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
                        id,
                        codigo,
                        nombre,
                        descripcion,
                        created_at as "createdAt"
                    FROM seguridad.permisos
                    ORDER BY codigo
                `,
                values: []
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        // Agrupar permisos por módulo basado en el prefijo del código
        const permisosPorModulo: Record<string, any[]> = {};

        result.rows.forEach(permiso => {
            // Extraer el módulo del código (ej: VER_MODULO_COMERCIAL -> COMERCIAL)
            let modulo = 'GENERAL';

            if (permiso.codigo.includes('_MODULO_')) {
                modulo = permiso.codigo.split('_MODULO_')[1];
            } else if (permiso.codigo.startsWith('VER_VENTAS_') || permiso.codigo.startsWith('VER_COMPRAS_') ||
                permiso.codigo.startsWith('VER_INV_') || permiso.codigo.startsWith('VER_CARTERA') ||
                permiso.codigo.startsWith('VER_TERCEROS') || permiso.codigo.startsWith('VER_CAJA_CHICA')) {
                modulo = 'COMERCIAL';
            } else if (permiso.codigo.startsWith('VER_CONT_') || permiso.codigo.startsWith('VER_REP_') ||
                permiso.codigo.startsWith('VER_BANCOS') || permiso.codigo.startsWith('VER_IMPUESTOS') ||
                permiso.codigo.startsWith('VER_ACTIVOS')) {
                modulo = 'FINANCIERO';
            } else if (permiso.codigo.startsWith('VER_RRHH_')) {
                modulo = 'RRHH';
            } else if (permiso.codigo.startsWith('VER_SYS_')) {
                modulo = 'SISTEMA';
            } else if (permiso.codigo === 'VER_DASHBOARD') {
                modulo = 'DASHBOARD';
            }

            if (!permisosPorModulo[modulo]) {
                permisosPorModulo[modulo] = [];
            }
            permisosPorModulo[modulo].push(permiso);
        });

        return NextResponse.json({
            permisos: result.rows,
            permisosPorModulo
        });

    } catch (error: any) {
        console.error('Error al listar permisos:', error);
        return NextResponse.json(
            { error: 'Error al obtener permisos', details: error.message },
            { status: 500 }
        );
    }
}
