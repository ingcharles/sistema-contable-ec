import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/nomina/roles
 * Lista roles de pago del periodo
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const periodo = url.searchParams.get('periodo'); // Formato: YYYY-MM

        if (!periodo) {
            return NextResponse.json(
                { error: 'Parámetro periodo requerido (formato: YYYY-MM)' },
                { status: 400 }
            );
        }

        const result = await db.query(
            {
                text: `
                    SELECT 
                        r.id, r.periodo, r.empleado_id, r.total_ingresos, r.total_egresos,
                        r.neto_pagar, r.estado, r.created_at, r.updated_at,
                        e.cedula, e.nombres, e.apellidos, e.cargo
                    FROM nomina.nomina_roles r
                    INNER JOIN nomina.empleados e ON e.id = r.empleado_id
                    WHERE r.empresa_id = $1 AND r.periodo = $2
                    ORDER BY e.apellidos ASC, e.nombres ASC
                `,
                values: [context.empresaId, periodo]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar roles:', error);
        return NextResponse.json(
            { error: 'Error al consultar roles de pago', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/nomina/roles/generar
 * Genera roles de pago del mes para todos los empleados activos
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { periodo } = body; // Formato: YYYY-MM

        if (!periodo) {
            return NextResponse.json(
                { error: 'Campo periodo requerido (formato: YYYY-MM)' },
                { status: 400 }
            );
        }

        // Validar que no existan roles para este periodo
        const existingCheck = await db.query<{ count: string }>(
            {
                text: `
                    SELECT COUNT(*) 
                    FROM nomina.nomina_roles 
                    WHERE empresa_id = $1 AND periodo = $2
                `,
                values: [context.empresaId, periodo]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (parseInt(existingCheck.rows[0].count) > 0) {
            return NextResponse.json(
                { error: `Ya existen roles generados para el periodo ${periodo}` },
                { status: 400 }
            );
        }

        // Generar roles para todos los empleados activos
        const result = await db.transaction(async (client) => {
            // Obt ener empleados activos
            const empleadosResult = await client.query(`
                SELECT id, cedula, nombres, apellidos, sueldo_base
                FROM nomina.empleados
                WHERE empresa_id = $1 AND activo = true
            `, [context.empresaId]);

            const empleados = empleadosResult.rows;

            if (empleados.length === 0) {
                throw new Error('No hay empleados activos para generar nómina');
            }

            // Calcular valores base para cada empleado
            const rolesGenerados: any[] = [];

            for (const empleado of empleados) {
                const sueldoBase = parseFloat(empleado.sueldo_base);

                // Cálculos de nómina Ecuador (valores de ejemplo - personalizar según normativa)
                const aporteSS = sueldoBase * 0.0945; // 9.45% aporte personal IESS
                const impuestoRenta = 0; // Calcular según tabla del SRI

                const totalIngresos = sueldoBase;
                const totalEgresos = aporteSS + impuestoRenta;
                const netoPagar = totalIngresos - totalEgresos;

                // Insertar rol
                const rolResult = await client.query(`
                    INSERT INTO nomina.nomina_roles 
                        (empresa_id, usuario_id, empleado_id, periodo, 
                         total_ingresos, total_egresos, neto_pagar, estado, 
                         created_at, updated_at)
                    VALUES 
                        ($1, $2, $3, $4, $5, $6, $7, 'BORRADOR', NOW(), NOW())
                    RETURNING id
                `, [
                    context.empresaId,
                    context.usuarioId,
                    empleado.id,
                    periodo,
                    totalIngresos,
                    totalEgresos,
                    netoPagar
                ]);

                rolesGenerados.push({
                    rolId: rolResult.rows[0].id,
                    empleado: `${empleado.nombres} ${empleado.apellidos}`,
                    netoPagar
                });
            }

            return { cantidad: rolesGenerados.length, roles: rolesGenerados };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            mensaje: `Nómina del periodo ${periodo} generada exitosamente`,
            ...result
        });
    } catch (error: any) {
        console.error('Error al generar nómina:', error);
        return NextResponse.json(
            { error: error.message || 'Error al generar nómina', details: error.message },
            { status: 500 }
        );
    }
}
