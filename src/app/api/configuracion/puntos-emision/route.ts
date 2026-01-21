import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/configuracion/puntos-emision
 * Lista puntos de emisión de las sucursales de la empresa
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        // Obtenemos puntos de emisión con sus secuenciales
        const result = await db.query(
            {
                text: `
                    SELECT 
                        pe.id, pe.sucursal_id, pe.codigo, pe.nombre, pe.activo,
                        s.nombre as sucursal_nombre,
                        COALESCE(
                            (SELECT json_agg(json_build_object('tipoComprobante', pes.tipo_comprobante, 'secuencialActual', pes.secuencial_actual))
                             FROM configuracion.puntos_emision_secuenciales pes 
                             WHERE pes.punto_emision_id = pe.id),
                            '[]'::json
                        ) as secuenciales
                    FROM configuracion.puntos_emision pe
                    JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
                    WHERE s.empresa_id = $1
                    ORDER BY s.codigo ASC, pe.codigo ASC
                `,
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar puntos de emision:', error);
        return NextResponse.json(
            { error: 'Error al consultar puntos de emisión', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/configuracion/puntos-emision
 * Crea un nuevo punto de emisión
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { sucursalId, codigo, nombre, activo = true, secuenciales = [] } = body;

        if (!sucursalId || !codigo || !nombre) {
            return NextResponse.json({ error: 'Sucursal, código y nombre son requeridos' }, { status: 400 });
        }

        const id = crypto.randomUUID();

        // Usamos una transacción para insertar el punto y sus secuenciales
        await db.query({ text: 'BEGIN' }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        try {
            await db.query(
                {
                    text: `INSERT INTO configuracion.puntos_emision (id, sucursal_id, codigo, nombre, activo, created_by) VALUES ($1, $2, $3, $4, $5, $6)`,
                    values: [id, sucursalId, codigo, nombre, activo, context.usuarioId]
                },
                { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
            );

            for (const seq of secuenciales) {
                await db.query(
                    {
                        text: `INSERT INTO configuracion.puntos_emision_secuenciales (punto_emision_id, tipo_comprobante, secuencial_actual) VALUES ($1, $2, $3)`,
                        values: [id, seq.tipoComprobante, seq.secuencialActual]
                    },
                    { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
                );
            }

            await db.query({ text: 'COMMIT' }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
        } catch (err) {
            await db.query({ text: 'ROLLBACK' }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
            throw err;
        }

        return NextResponse.json({ success: true, id, message: 'Punto de emisión creado exitosamente' }, { status: 201 });
    } catch (error: any) {
        console.error('Error al crear punto de emisión:', error);
        return NextResponse.json({ error: 'Error al crear punto de emisión', details: error.message }, { status: 500 });
    }
}
