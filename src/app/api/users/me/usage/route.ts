import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { ServicioSeguimientoUso } from '@/modules/shared/domain/services/ServicioSeguimientoUso';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/me/usage
 * Obtiene las estadísticas de uso de documentos del usuario autenticado
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);

    if (!context.isValid || !context.usuarioId) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const periodo = url.searchParams.get('periodo'); // Opcional: YYYY-MM

        const estadisticas = await ServicioSeguimientoUso.obtenerEstadisticasUso(
            context.usuarioId,
            periodo || undefined
        );

        // Formatear respuesta
        const respuesta = {
            periodo: periodo || new Date().toISOString().slice(0, 7),
            uso: estadisticas.reduce((acc, stat) => {
                acc[stat.tipo_documento] = {
                    nombre: stat.nombre_legible,
                    usado: stat.cantidad,
                    limite: stat.limite,
                    restante: stat.restante,
                    porcentaje: stat.limite > 0 ? Math.round((stat.cantidad / stat.limite) * 100) : 0
                };
                return acc;
            }, {} as Record<string, any>)
        };

        return NextResponse.json(respuesta);

    } catch (error: any) {
        console.error('Error al obtener estadísticas de uso:', error);
        return NextResponse.json(
            { error: 'Error al obtener estadísticas de uso', details: error.message },
            { status: 500 }
        );
    }
}
