
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    //const context = validateContext(req);
    // Solo admins
    // console.log("context", context.roles);
    // if (!context.isValid || !context.roles?.includes('SUPERADMIN')) {
    //     return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    // }

    try {
        const { id } = await params;
        const body = await req.json();
        const { permisos } = body; // Array of Permission IDs

        if (!Array.isArray(permisos)) {
            return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
        }

        // Transaction
        // 1. Delete existing
        await db.querySimple({
            text: 'DELETE FROM seguridad.planes_permisos WHERE plan_id = $1',
            values: [id]
        });

        // 2. Insert new
        if (permisos.length > 0) {
            // Generate values string ($1, $2), ($1, $3)...
            // Actually simpler loop or unnest if possible.
            // Loop for simplicity or bulk insert construction

            // Construct bulk insert
            const values: any[] = [id];
            const placeholders = permisos.map((permisoId, index) => {
                values.push(permisoId);
                return `($1, $${index + 2})`;
            });

            await db.querySimple({
                text: `INSERT INTO seguridad.planes_permisos (plan_id, permiso_id) VALUES ${placeholders.join(',')}`,
                values: values
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating plan permissions:', error);
        return NextResponse.json({ error: 'Error al actualizar permisos del plan' }, { status: 500 });
    }
}
