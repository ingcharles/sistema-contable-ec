import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { SecurityAuditService } from '@/shared/services/SecurityAuditService';

export const runtime = 'nodejs';

/**
 * GET /api/auditoria/intentos-acceso
 * 
 * Obtiene los intentos de acceso no autorizado a puntos de emisión
 * Solo accesible para usuarios con rol SUPERADMIN o ADMIN
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        // Obtener intentos de acceso no autorizado
        const intentos = await SecurityAuditService.obtenerIntentos(
            context.empresaId!,
            context.usuarioId!,
            limit
        );

        // Obtener conteo total de los últimos 30 días
        const totalRecientes = await SecurityAuditService.contarIntentosPorUsuario(
            context.empresaId!,
            context.usuarioId!,
            30
        );

        return NextResponse.json({
            intentos,
            total: intentos.length,
            totalRecientes30Dias: totalRecientes
        });

    } catch (error: any) {
        console.error('Error al obtener intentos de acceso:', error);
        return NextResponse.json(
            { error: 'Error al obtener intentos de acceso', details: error.message },
            { status: 500 }
        );
    }
}
