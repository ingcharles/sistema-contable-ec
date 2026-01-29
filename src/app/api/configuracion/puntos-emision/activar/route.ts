import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * POST /api/configuracion/puntos-emision/activar
 * Activa un punto de emisión para el usuario actual
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { puntoEmisionId } = body;

        if (!puntoEmisionId) {
            return NextResponse.json(
                { error: 'puntoEmisionId es requerido' },
                { status: 400 }
            );
        }

        // Verificar si puede cambiar (opcional, ya que la función fn_activar lo validará si no tiene asignado)
        // Pero la regla "puede_cambiar" está en la tabla, deberíamos validarla aquí o en la función DB.
        // La función DB solo valida si tiene asignado. Validemos "puede_cambiar" aquí.

        const permisoResult = await db.query(
            {
                text: `
                    SELECT puede_cambiar 
                    FROM configuracion.usuarios_puntos_emision
                    WHERE usuario_id = $1 
                    AND empresa_id = $2 
                    AND punto_emision_id = $3
                `,
                values: [context.usuarioId, context.empresaId, puntoEmisionId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (permisoResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'No tienes asignado este punto de emisión' },
                { status: 403 }
            );
        }

        // Si queremos ser estrictos con "puede_cambiar", descomentar esto:
        /*
        if (!permisoResult.rows[0].puede_cambiar) {
            return NextResponse.json(
                { error: 'No tienes permiso para cambiar a este punto de emisión manualmente' },
                { status: 403 }
            );
        }
        */
        // Por ahora asumimos que si tiene el punto asignado y está en la lista, puede seleccionarlo, 
        // salvo que la UI lo oculte. Pero el backend debería proteger.
        // El campo "puede_cambiar" se definió como: "Si es false, el usuario no puede cambiar a otro punto sin ayuda del administrador."
        // Esto implica que si está en false, no debería poder llamar a este endpoint para activarlo él mismo.
        // Pero si YA está activo, no pasa nada. Si quiere cambiar A este punto, o DESDE este punto?
        // Asumamos que "puede_cambiar" en el registro significa "El usuario puede seleccionar este punto".

        if (!permisoResult.rows[0].puede_cambiar) {
            return NextResponse.json(
                { error: 'No tienes permiso para activar este punto de emisión' },
                { status: 403 }
            );
        }

        // Llamar a la función de base de datos para activar
        await db.query(
            {
                text: `SELECT configuracion.fn_activar_punto_emision($1, $2, $3)`,
                values: [context.usuarioId, context.empresaId, puntoEmisionId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            success: true,
            message: 'Punto de emisión activado correctamente'
        });

    } catch (error: any) {
        console.error('Error al activar punto:', error);
        return NextResponse.json(
            { error: 'Error al activar punto de emisión', details: error.message },
            { status: 500 }
        );
    }
}
