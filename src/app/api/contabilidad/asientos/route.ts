import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { extractPaginationParams, buildPaginatedResponse } from '@/shared/utils/pagination';

/**
 * POST /api/contabilidad/asientos
 * Registra un nuevo asiento contable
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { numero, fecha, glosa, detalles } = body;

        // Validaciones
        if (!fecha || !glosa || !detalles || detalles.length === 0) {
            return NextResponse.json(
                { error: 'Campos requeridos: fecha, glosa, detalles' },
                { status: 400 }
            );
        }

        // Verificar cuadratura
        const totalDebe = detalles.reduce((sum: number, d: any) => sum + (d.debe || 0), 0);
        const totalHaber = detalles.reduce((sum: number, d: any) => sum + (d.haber || 0), 0);

        if (Math.abs(totalDebe - totalHaber) > 0.01) {
            return NextResponse.json(
                { error: 'El asiento no está cuadrado. Debe = Haber' },
                { status: 400 }
            );
        }

        // Usar transacción para garantizar atomicidad
        const result = await db.transaction(async (client) => {
            // Insertar cabecera
            const asientoResult = await client.query(`
                INSERT INTO contabilidad.asientos 
                    (empresa_id, usuario_id, numero, fecha, glosa, tipo, estado, created_at, updated_at)
                VALUES 
                    ($1, $2, $3, $4, $5, 'DIARIO', 'BORRADOR', NOW(), NOW())
                RETURNING id
            `, [context.empresaId, context.usuarioId, numero, fecha, glosa]);

            const asientoId = asientoResult.rows[0].id;

            // Insertar detalles
            for (const detalle of detalles) {
                await client.query(`
                    INSERT INTO contabilidad.asientos_detalles 
                        (asiento_id, cuenta_codigo, debe, haber, concepto)
                    VALUES 
                        ($1, $2, $3, $4, $5)
                `, [asientoId, detalle.cuentaCodigo, detalle.debe || 0, detalle.haber || 0, detalle.concepto || glosa]);
            }

            return { asientoId };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            id: result.asientoId,
            mensaje: 'Asiento contable registrado exitosamente'
        });
    } catch (error: any) {
        console.error('Error al registrar asiento:', error);
        return NextResponse.json(
            { error: 'Error al registrar el asiento', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET /api/contabilidad/asientos
 * Lista asientos contables con paginación
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const pagination = extractPaginationParams(url);
        const estado = url.searchParams.get('estado');
        const desde = url.searchParams.get('desde');
        const hasta = url.searchParams.get('hasta');

        let whereConditions = ['empresa_id = $1'];
        let values: any[] = [context.empresaId];
        let paramIndex = 2;

        if (estado) {
            whereConditions.push(`estado = $${paramIndex}`);
            values.push(estado);
            paramIndex++;
        }

        if (desde) {
            whereConditions.push(`fecha >= $${paramIndex}`);
            values.push(desde);
            paramIndex++;
        }

        if (hasta) {
            whereConditions.push(`fecha <= $${paramIndex}`);
            values.push(hasta);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // Contar total
        const countResult = await db.query<{ count: string }>(
            {
                text: `SELECT COUNT(*) FROM contabilidad.asientos WHERE ${whereClause}`,
                values
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const totalItems = parseInt(countResult.rows[0].count);

        // Obtener datos paginados con detalles
        const dataResult = await db.query(
            {
                text: `
                    SELECT 
                        a.id, a.numero, a.fecha, a.glosa, a.tipo, a.estado,
                        a.created_at, a.updated_at,
                        (
                            SELECT json_agg(json_build_object(
                                'cuentaCodigo', d.cuenta_codigo,
                                'debe', d.debe,
                                'haber', d.haber,
                                'concepto', d.concepto
                            ))
                            FROM contabilidad.asientos_detalles d
                            WHERE d.asiento_id = a.id
                        ) as detalles
                    FROM contabilidad.asientos a
                    WHERE ${whereClause}
                    ORDER BY a.fecha DESC, a.numero DESC
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
        console.error('Error al listar asientos:', error);
        return NextResponse.json(
            { error: 'Error al consultar asientos', details: error.message },
            { status: 500 }
        );
    }
}
