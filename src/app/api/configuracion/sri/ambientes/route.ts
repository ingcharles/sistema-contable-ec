import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/configuracion/sri/ambientes
 * Obtiene la lista de ambientes SRI disponibles (PRUEBAS/PRODUCCION)
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const result = await db.querySimple({
            text: `
                SELECT 
                    id,
                    codigo,
                    nombre,
                    url_recepcion,
                    url_autorizacion,
                    descripcion,
                    activo
                FROM configuracion.sri_ambiente
                WHERE activo = TRUE
                ORDER BY codigo
            `
        });

        return NextResponse.json({
            success: true,
            ambientes: result.rows
        });
    } catch (error: any) {
        console.error('Error al obtener ambientes SRI:', error);
        return NextResponse.json(
            { error: 'Error al consultar ambientes SRI', details: error.message },
            { status: 500 }
        );
    }
}
