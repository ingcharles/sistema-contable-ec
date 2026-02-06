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
                    SELECT p.*, e.nombres, e.apellidos 
                    FROM nomina.prestamos p
                    JOIN nomina.empleados e ON p.empleado_id = e.id
                    WHERE p.empresa_id = $1
                    ORDER BY p.fecha_prestamo DESC
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
        const { empleadoId, fechaPrestamo, montoTotal, montoCuota, numeroCuotas, tipoPrestamo, observaciones } = body;

        const result = await db.query(
            {
                text: `
                    INSERT INTO nomina.prestamos 
                    (empresa_id, usuario_id, empleado_id, fecha_prestamo, monto_total, monto_cuota, saldo_pendiente, numero_cuotas, tipo_prestamo, observaciones)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING *
                `,
                values: [context.empresaId, context.usuarioId, empleadoId, fechaPrestamo, montoTotal, montoCuota, montoTotal, numeroCuotas, tipoPrestamo, observaciones]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
