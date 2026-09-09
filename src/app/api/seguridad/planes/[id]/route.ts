
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { id } = await params;

        // 1. Get Plan
        const planResult = await db.querySimple({
            text: 'SELECT * FROM seguridad.planes WHERE id = $1',
            values: [id]
        });

        if (planResult.rowCount === 0) {
            return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
        }

        const plan = planResult.rows[0];

        // 2. Get Features
        const featuresResult = await db.querySimple({
            text: 'SELECT * FROM seguridad.plan_caracteristicas WHERE plan_id = $1',
            values: [id]
        });

        // 3. Get Permissions
        const permissionsResult = await db.querySimple({
            text: `
                SELECT p.* 
                FROM seguridad.permisos p
                JOIN seguridad.planes_permisos pp ON p.id = pp.permiso_id
                WHERE pp.plan_id = $1
            `,
            values: [id]
        });

        return NextResponse.json({
            ...plan,
            precioMensual: plan.precio_mensual, // Normalize snake_case
            features: featuresResult.rows,
            permisos: permissionsResult.rows
        });

    } catch (error) {
        console.error('Error fetching plan:', error);
        return NextResponse.json({ error: 'Error al obtener plan' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // const context = validateContext(req);
    // // Solo admins
    // console.log("context", context.roles);
    // if (!context.isValid || !context.roles?.includes('SUPERADMIN')) {
    //     return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    // }

    try {
        const { id } = await params;
        const body = await req.json();
        const { nombre, precioMensual, activo, codigo } = body;

        await db.querySimple({
            text: `
                UPDATE seguridad.planes 
                SET nombre = $1, precio_mensual = $2, activo = $3, codigo = $4, updated_at = NOW()
                WHERE id = $5
            `,
            values: [nombre, precioMensual, activo, codigo, id]
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error updating plan:', error);
        return NextResponse.json({ error: 'Error al actualizar plan' }, { status: 500 });
    }
}
