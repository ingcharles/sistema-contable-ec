import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const url = new URL(req.url);
        const desde = url.searchParams.get('desde');
        const hasta = url.searchParams.get('hasta');

        const result = await db.query(
            {
                text: `
                    SELECT a.*, e.nombres, e.apellidos 
                    FROM nomina.asistencia a
                    JOIN nomina.empleados e ON a.empleado_id = e.id
                    WHERE a.empresa_id = $1 AND a.fecha BETWEEN $2 AND $3
                    ORDER BY a.fecha DESC, e.apellidos ASC
                `,
                values: [context.empresaId, desde, hasta]
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
        const { empleadoId, fecha, horaEntrada, horaSalida, horasTrabajadas, horasExtras50, horasExtras100, novedad, observaciones } = body;

        const result = await db.query(
            {
                text: `
                    INSERT INTO nomina.asistencia 
                    (empresa_id, usuario_id, empleado_id, fecha, hora_entrada, hora_salida, horas_trabajadas, horas_extras_50, horas_extras_100, novedad, observaciones)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT (empresa_id, empleado_id, fecha) 
                    DO UPDATE SET
                        hora_entrada = EXCLUDED.hora_entrada,
                        hora_salida = EXCLUDED.hora_salida,
                        horas_trabajadas = EXCLUDED.horas_trabajadas,
                        horas_extras_50 = EXCLUDED.horas_extras_50,
                        horas_extras_100 = EXCLUDED.horas_extras_100,
                        novedad = EXCLUDED.novedad,
                        observaciones = EXCLUDED.observaciones,
                        updated_at = NOW()
                    RETURNING *
                `,
                values: [context.empresaId, context.usuarioId, empleadoId, fecha, horaEntrada, horaSalida, horasTrabajadas, horasExtras50, horasExtras100, novedad, observaciones]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
