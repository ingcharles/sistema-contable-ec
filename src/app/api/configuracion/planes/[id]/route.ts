import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * PUT /api/configuracion/planes/[id]
 * Actualiza un plan y sus características
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const { id } = params;
        const body = await req.json();
        const { nombre, precioMensual, caracteristicas } = body;

        await db.transaction(async (client) => {
            // 1. Actualizar metadatos del plan
            await client.query(
                `UPDATE seguridad.planes 
                 SET nombre = $1, precio_mensual = $2, updated_at = NOW()
                 WHERE id = $3`,
                [nombre, precioMensual, id]
            );

            // 2. Sincronizar características (borrar y reinsertar es lo más simple para este caso)
            if (caracteristicas && Array.isArray(caracteristicas)) {
                await client.query(`DELETE FROM seguridad.plan_caracteristicas WHERE plan_id = $1`, [id]);

                for (const char of caracteristicas) {
                    await client.query(
                        `INSERT INTO seguridad.plan_caracteristicas 
                         (plan_id, clave_caracteristica, tipo_documento_id, tipo_valor, valor_numero, valor_booleano)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [
                            id,
                            char.clave,
                            char.tipoDocumentoId || null,
                            char.tipoValor,
                            char.valorNumero || null,
                            char.valorBooleano === undefined ? null : char.valorBooleano
                        ]
                    );
                }
            }
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({ success: true, message: 'Plan actualizado correctamente' });

    } catch (error: any) {
        console.error('Error al actualizar plan:', error);
        return NextResponse.json(
            { error: 'Error al actualizar plan', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/configuracion/planes/[id]
 * Elimina un plan
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const { id } = params;

        await db.query(
            {
                text: `DELETE FROM seguridad.planes WHERE id = $1`,
                values: [id]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({ success: true, message: 'Plan eliminado correctamente' });

    } catch (error: any) {
        console.error('Error al eliminar plan:', error);
        return NextResponse.json(
            { error: 'Error al eliminar plan', details: error.message },
            { status: 500 }
        );
    }
}
