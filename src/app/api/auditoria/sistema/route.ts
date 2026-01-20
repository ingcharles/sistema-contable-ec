import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { extractPaginationParams, buildPaginatedResponse } from '@/shared/utils/pagination';

/**
 * GET /api/auditoria/sistema
 * Lista logs de auditoría con filtros avanzados
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const pagination = extractPaginationParams(url);
        const modulo = url.searchParams.get('modulo');
        const evento = url.searchParams.get('evento');
        const usuarioId = url.searchParams.get('usuarioId');
        const severidad = url.searchParams.get('severidad');
        const desde = url.searchParams.get('desde');
        const hasta = url.searchParams.get('hasta');

        let whereConditions = ['empresa_id = $1'];
        let values: any[] = [context.empresaId];
        let paramIndex = 2;

        if (modulo) {
            whereConditions.push(`modulo = $${paramIndex}`);
            values.push(modulo);
            paramIndex++;
        }

        if (evento) {
            whereConditions.push(`evento ILIKE $${paramIndex}`);
            values.push(`%${evento}%`);
            paramIndex++;
        }

        if (usuarioId) {
            whereConditions.push(`usuario_id = $${paramIndex}`);
            values.push(usuarioId);
            paramIndex++;
        }

        if (severidad) {
            whereConditions.push(`severidad = $${paramIndex}`);
            values.push(severidad);
            paramIndex++;
        }

        if (desde) {
            whereConditions.push(`created_at >= $${paramIndex}`);
            values.push(desde);
            paramIndex++;
        }

        if (hasta) {
            whereConditions.push(`created_at <= $${paramIndex}`);
            values.push(hasta);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // Contar total
        const countResult = await db.query<{ count: string }>(
            {
                text: `SELECT COUNT(*) FROM auditoria_logs WHERE ${whereClause}`,
                values
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const totalItems = parseInt(countResult.rows[0].count);

        // Obtener datos paginados
        const dataResult = await db.query(
            {
                text: `
                    SELECT 
                        id, modulo, evento, usuario_id, usuario_nombre,
                        ip_address, metodo_http, ruta, severidad,
                        datos_antes, datos_despues, created_at
                    FROM auditoria_logs
                    WHERE ${whereClause}
                    ORDER BY created_at DESC
                    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
                `,
                values: [...values, pagination.limit, pagination.offset]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const response = buildPaginatedResponse(
            dataResult.rows,
            totalItems,
            pagination
        );

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('Error al consultar auditoría:', error);
        return NextResponse.json(
            { error: 'Error al consultar logs de auditoría', details: error.message },
            { status: 500 }
        );
    }
}
