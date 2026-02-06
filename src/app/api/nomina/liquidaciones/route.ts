import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const result = await db.query(
            {
                text: `
                    SELECT l.*, e.nombres, e.apellidos 
                    FROM nomina.liquidaciones l
                    JOIN nomina.empleados e ON l.empleado_id = e.id
                    WHERE l.empresa_id = $1
                    ORDER BY l.fecha_salida DESC
                `,
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );
        return NextResponse.json(result.rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const body = await req.json();
        const { empleadoId, fechaSalida, motivoSalida, totalIngresos, totalEgresos, valorLiquido, detalleCalculo } = body;

        const result = await db.query(
            {
                text: `
                    INSERT INTO nomina.liquidaciones 
                    (empresa_id, usuario_id, empleado_id, fecha_salida, motivo_salida, total_ingresos, total_egresos, valor_liquido, detalle_calculo)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING *
                `,
                values: [context.empresaId, context.usuarioId, empleadoId, fechaSalida, motivoSalida, totalIngresos, totalEgresos, valorLiquido, JSON.stringify(detalleCalculo)]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
