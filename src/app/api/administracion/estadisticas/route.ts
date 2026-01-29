import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

export const runtime = 'nodejs';

/**
 * GET /api/administracion/estadisticas
 * 
 * Obtiene estadísticas generales del sistema para el dashboard de administración:
 * - Total de usuarios activos
 * - Puntos de emisión activos
 * - Total de sucursales
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        // Obtener total de usuarios activos
        const usuariosResult = await db.query(
            {
                text: 'SELECT COUNT(*) as total FROM seguridad.usuarios_empresas WHERE empresa_id = $1 AND activo = TRUE',
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        // Obtener puntos de emisión activos
        const puntosResult = await db.query(
            {
                text: 'SELECT COUNT(*) as total FROM configuracion.puntos_emision pe INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id WHERE s.empresa_id = $1 AND pe.activo = TRUE',
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        // Obtener total de sucursales
        const sucursalesResult = await db.query(
            {
                text: 'SELECT COUNT(*) as total FROM configuracion.sucursales WHERE empresa_id = $1',
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            totalUsuarios: parseInt(usuariosResult.rows[0]?.total || '0'),
            puntosActivos: parseInt(puntosResult.rows[0]?.total || '0'),
            totalSucursales: parseInt(sucursalesResult.rows[0]?.total || '0')
        });

    } catch (error: any) {
        console.error('Error al obtener estadísticas:', error);
        return NextResponse.json(
            { error: 'Error al obtener estadísticas', details: error.message },
            { status: 500 }
        );
    }
}
