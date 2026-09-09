import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/seguridad/permisos
 * Lista todos los permisos del sistema agrupados
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const result = await db.query(
            {
                text: `SELECT id, codigo, nombre, descripcion, modulo FROM seguridad.permisos ORDER BY modulo, nombre`
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar permisos:', error);
        return NextResponse.json({ error: 'Error al listar permisos' }, { status: 500 });
    }
}
