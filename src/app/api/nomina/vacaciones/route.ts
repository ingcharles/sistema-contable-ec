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
                    SELECT v.*, e.nombres, e.apellidos 
                    FROM nomina.vacaciones v
                    JOIN nomina.empleados e ON v.empleado_id = e.id
                    WHERE v.empresa_id = $1
                    ORDER BY v.fecha_inicio DESC
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
        const { empleadoId, fechaInicio, fechaFin, diasSolicitados, tipoSolicitud, observaciones } = body;

        const result = await db.query(
            {
                text: `
                    INSERT INTO nomina.vacaciones 
                    (empresa_id, usuario_id, empleado_id, fecha_inicio, fecha_fin, dias_solicitados, tipo_solicitud, observaciones)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING *
                `,
                values: [context.empresaId, context.usuarioId, empleadoId, fechaInicio, fechaFin, diasSolicitados, tipoSolicitud, observaciones]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
