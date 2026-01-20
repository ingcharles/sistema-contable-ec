import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { extractPaginationParams, buildPaginatedResponse } from '@/shared/utils/pagination';

/**
 * GET /api/contabilidad/cuentas
 * Lista el plan de cuentas con paginación opcional
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const pagination = extractPaginationParams(url);
        const incluirInactivas = url.searchParams.get('incluirInactivas') === 'true';

        // Query con filtros de empresa y estado activo
        const whereClause = incluirInactivas
            ? 'WHERE empresa_id = $1'
            : 'WHERE empresa_id = $1 AND activa = true';

        // Contar total para paginación
        const countResult = await db.query<{ count: string }>(
            {
                text: `SELECT COUNT(*) FROM plan_cuentas ${whereClause}`,
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const totalItems = parseInt(countResult.rows[0].count);

        // Obtener datos paginados
        const dataResult = await db.query(
            {
                text: `
                    SELECT 
                        id, codigo, nombre, tipo, nivel, saldo, activa, 
                        created_at, updated_at
                    FROM plan_cuentas
                    ${whereClause}
                    ORDER BY codigo ASC
                    LIMIT $2 OFFSET $3
                `,
                values: [context.empresaId, pagination.limit, pagination.offset]
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
        console.error('Error al obtener plan de cuentas:', error);
        return NextResponse.json(
            { error: 'Error al consultar el plan de cuentas', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/contabilidad/cuentas
 * Crea o actualiza una cuenta contable
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { codigo, nombre, tipo, nivel, saldo = 0, activa = true } = body;

        // Validaciones básicas
        if (!codigo || !nombre || !tipo) {
            return NextResponse.json(
                { error: 'Campos requeridos: codigo, nombre, tipo' },
                { status: 400 }
            );
        }

        // Upsert (insertar o actualizar)
        const result = await db.query(
            {
                text: `
                    INSERT INTO plan_cuentas 
                        (empresa_id, usuario_id, codigo, nombre, tipo, nivel, saldo, activa, created_at, updated_at)
                    VALUES 
                        ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                    ON CONFLICT (empresa_id, codigo) 
                    DO UPDATE SET
                        nombre = EXCLUDED.nombre,
                        tipo = EXCLUDED.tipo,
                        nivel = EXCLUDED.nivel,
                        saldo = EXCLUDED.saldo,
                        activa = EXCLUDED.activa,
                        updated_at = NOW()
                    RETURNING *
                `,
                values: [
                    context.empresaId,
                    context.usuarioId,
                    codigo,
                    nombre,
                    tipo,
                    nivel || codigo.split('.').length,
                    saldo,
                    activa
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0],
            mensaje: 'Cuenta guardada exitosamente'
        });
    } catch (error: any) {
        console.error('Error al guardar cuenta:', error);
        return NextResponse.json(
            { error: 'Error al guardar la cuenta', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/contabilidad/cuentas/[codigo]
 * Elimina una cuenta contable (soft delete)
 */
export async function DELETE(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const codigo = pathParts[pathParts.length - 1];

        if (!codigo) {
            return NextResponse.json(
                { error: 'Código de cuenta requerido' },
                { status: 400 }
            );
        }

        // Verificar que no tenga subcuentas activas
        const childrenCheck = await db.query<{ count: string }>(
            {
                text: `
                    SELECT COUNT(*) 
                    FROM plan_cuentas 
                    WHERE empresa_id = $1 
                    AND codigo LIKE $2 
                    AND codigo != $3
                    AND activa = true
                `,
                values: [context.empresaId, `${codigo}.%`, codigo]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (parseInt(childrenCheck.rows[0].count) > 0) {
            return NextResponse.json(
                { error: 'No puede eliminar una cuenta con subcuentas activas' },
                { status: 400 }
            );
        }

        // Soft delete
        const result = await db.query(
            {
                text: `
                    UPDATE plan_cuentas 
                    SET activa = false, updated_at = NOW()
                    WHERE empresa_id = $1 AND codigo = $2
                    RETURNING *
                `,
                values: [context.empresaId, codigo]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: 'Cuenta no encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            mensaje: 'Cuenta eliminada exitosamente'
        });
    } catch (error: any) {
        console.error('Error al eliminar cuenta:', error);
        return NextResponse.json(
            { error: 'Error al eliminar la cuenta', details: error.message },
            { status: 500 }
        );
    }
}
