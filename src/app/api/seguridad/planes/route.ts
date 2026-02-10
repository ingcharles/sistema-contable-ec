
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

export async function GET(req: NextRequest) {
    const context = validateContext(req);
    // Permitir listar planes a usuarios autenticados (para seleccionarlos)
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const result = await db.querySimple({
            text: 'SELECT * FROM seguridad.planes ORDER BY precio_mensual ASC',
            values: []
        });

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching plans:', error);
        return NextResponse.json({ error: 'Error al listar planes' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const context = validateContext(req);
    // Solo admins pueden crear planes
    if (!context.isValid || !context.roles.includes('SUPERADMIN')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { codigo, nombre, precioMensual, activo } = body;

        const result = await db.querySimple({
            text: `
                INSERT INTO seguridad.planes (codigo, nombre, precio_mensual, activo)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `,
            values: [codigo, nombre, precioMensual, activo ?? true]
        });

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating plan:', error);
        return NextResponse.json({ error: 'Error al crear plan' }, { status: 500 });
    }
}
