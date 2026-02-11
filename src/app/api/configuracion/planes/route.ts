import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/configuracion/planes
 * Lista todos los planes con sus características
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
                        p.id,
                        p.codigo,
                        p.nombre,
                        p.precio_mensual as "precioMensual",
                        p.created_at as "createdAt",
                        COALESCE(
                            (SELECT json_agg(
                                json_build_object(
                                    'id', pc.id,
                                    'clave', pc.clave_caracteristica,
                                    'tipoDocumentoId', pc.tipo_documento_id,
                                    'tipoValor', pc.tipo_valor,
                                    'valorNumero', pc.valor_numero,
                                    'valorBooleano', pc.valor_booleano
                                )
                            )
                            FROM seguridad.plan_caracteristicas pc
                            WHERE pc.plan_id = p.id),
                            '[]'::json
                        ) as caracteristicas
                    FROM seguridad.planes p
                    ORDER BY p.precio_mensual ASC
                `,
                values: []
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);

    } catch (error: any) {
        console.error('Error al listar planes:', error);
        return NextResponse.json(
            { error: 'Error al obtener planes', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/configuracion/planes
 * Crea un nuevo plan con sus características
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { codigo, nombre, precioMensual, caracteristicas } = body;

        if (!codigo || !nombre) {
            return NextResponse.json({ error: 'Código y nombre son requeridos' }, { status: 400 });
        }

        const result = await db.transaction(async (client) => {
            // 1. Insertar Plan
            const planRes = await client.query(
                `INSERT INTO seguridad.planes (codigo, nombre, precio_mensual)
                 VALUES ($1, $2, $3)
                 RETURNING id, codigo, nombre, precio_mensual as "precioMensual"`,
                [codigo.toUpperCase(), nombre, precioMensual || 0]
            );

            const newPlan = planRes.rows[0];

            // 2. Insertar Características
            if (caracteristicas && Array.isArray(caracteristicas)) {
                for (const char of caracteristicas) {
                    await client.query(
                        `INSERT INTO seguridad.plan_caracteristicas 
                         (plan_id, clave_caracteristica, tipo_documento_id, tipo_valor, valor_numero, valor_booleano)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [
                            newPlan.id,
                            char.clave,
                            char.tipoDocumentoId || null,
                            char.tipoValor,
                            char.valorNumero || null,
                            char.valorBooleano === undefined ? null : char.valorBooleano
                        ]
                    );
                }
            }

            return newPlan;
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json(result, { status: 201 });

    } catch (error: any) {
        console.error('Error al crear plan:', error);
        return NextResponse.json(
            { error: 'Error al crear plan', details: error.message },
            { status: 500 }
        );
    }
}
