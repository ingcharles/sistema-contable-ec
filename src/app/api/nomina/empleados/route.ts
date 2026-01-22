import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { extractPaginationParams, buildPaginatedResponse } from '@/shared/utils/pagination';

/**
 * GET /api/nomina/empleados
 * Lista empleados con paginación y filtros
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const pagination = extractPaginationParams(url);
        const buscar = url.searchParams.get('buscar');
        const activo = url.searchParams.get('activo');

        let whereConditions = ['e.empresa_id = $1'];
        let values: any[] = [context.empresaId];
        let paramIndex = 2;

        if (buscar) {
            whereConditions.push(`(e.nombres ILIKE $${paramIndex} OR e.apellidos ILIKE $${paramIndex} OR e.cedula ILIKE $${paramIndex})`);
            values.push(`%${buscar}%`);
            paramIndex++;
        }

        if (activo !== null && activo !== undefined) {
            whereConditions.push(`e.activo = $${paramIndex}`);
            values.push(activo === 'true');
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // Contar total
        const countResult = await db.query<{ count: string }>(
            {
                text: `SELECT COUNT(*) FROM nomina.empleados e WHERE ${whereClause}`,
                values
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const totalItems = parseInt(countResult.rows[0].count);

        // Obtener datos paginados
        const dataResult = await db.query(
            {
                text: `
                    SELECT 
                        e.id, e.cedula, e.nombres, e.apellidos, e.email, e.telefono,
                        e.fecha_ingreso, e.cargo, e.departamento, e.sueldo_base,
                        e.tipo_contrato, e.activo, e.created_at, e.updated_at
                    FROM nomina.empleados e
                    WHERE ${whereClause}
                    ORDER BY e.apellidos ASC, e.nombres ASC
                    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
                `,
                values: [...values, pagination.limit, pagination.offset]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const response = buildPaginatedResponse(
            dataResult.rows,
            totalItems,
            pagination
        );

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('Error al listar empleados:', error);
        return NextResponse.json(
            { error: 'Error al consultar empleados', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/nomina/empleados
 * Crea o actualiza un empleado
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            cedula,
            nombres,
            apellidos,
            email,
            telefono,
            fechaIngreso,
            cargo,
            departamento,
            sueldoBase,
            tipoContrato = 'INDEFINIDO',
            banco,
            tipoCuenta,
            numeroCuenta,
            activo = true
        } = body;

        // Validaciones
        if (!cedula || !nombres || !apellidos || !sueldoBase) {
            return NextResponse.json(
                { error: 'Campos requeridos: cedula, nombres, apellidos, sueldoBase' },
                { status: 400 }
            );
        }

        // Upsert
        const result = await db.query(
            {
                text: `
                    INSERT INTO nomina.empleados 
                        (empresa_id, usuario_id, cedula, nombres, apellidos, email, telefono,
                         fecha_ingreso, cargo, departamento, sueldo_base, tipo_contrato, 
                         banco, tipo_cuenta, numero_cuenta, activo, created_at, updated_at)
                    VALUES 
                        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
                    ON CONFLICT (empresa_id, cedula) 
                    DO UPDATE SET
                        nombres = EXCLUDED.nombres,
                        apellidos = EXCLUDED.apellidos,
                        email = EXCLUDED.email,
                        telefono = EXCLUDED.telefono,
                        fecha_ingreso = EXCLUDED.fecha_ingreso,
                        cargo = EXCLUDED.cargo,
                        departamento = EXCLUDED.departamento,
                        sueldo_base = EXCLUDED.sueldo_base,
                        tipo_contrato = EXCLUDED.tipo_contrato,
                        banco = EXCLUDED.banco,
                        tipo_cuenta = EXCLUDED.tipo_cuenta,
                        numero_cuenta = EXCLUDED.numero_cuenta,
                        activo = EXCLUDED.activo,
                        updated_at = NOW()
                    RETURNING *
                `,
                values: [
                    context.empresaId,
                    context.usuarioId,
                    cedula,
                    nombres,
                    apellidos,
                    email,
                    telefono,
                    fechaIngreso,
                    cargo,
                    departamento,
                    sueldoBase,
                    tipoContrato,
                    banco,
                    tipoCuenta,
                    numeroCuenta,
                    activo
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0],
            mensaje: 'Empleado guardado exitosamente'
        });
    } catch (error: any) {
        console.error('Error al guardar empleado:', error);
        return NextResponse.json(
            { error: 'Error al guardar empleado', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/nomina/empleados/[id]
 * Elimina un empleado (soft delete)
 */
export async function DELETE(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'ID de empleado requerido' },
                { status: 400 }
            );
        }

        // Verificar que no tenga roles de pago pendientes
        const rolesCheck = await db.query<{ count: string }>(
            {
                text: `
                    SELECT COUNT(*) 
                    FROM nomina.nomina_roles 
                    WHERE empresa_id = $1 
                    AND empleado_id = $2
                    AND estado IN ('BORRADOR', 'PENDIENTE')
                `,
                values: [context.empresaId, id]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (parseInt(rolesCheck.rows[0].count) > 0) {
            return NextResponse.json(
                { error: 'No puede eliminar un empleado con roles de pago pendientes' },
                { status: 400 }
            );
        }

        // Soft delete
        const result = await db.query(
            {
                text: `
                    UPDATE nomina.empleados 
                    SET activo = false, updated_at = NOW()
                    WHERE empresa_id = $1 AND id = $2
                    RETURNING *
                `,
                values: [context.empresaId, id]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: 'Empleado no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            mensaje: 'Empleado inactivado exitosamente'
        });
    } catch (error: any) {
        console.error('Error al eliminar empleado:', error);
        return NextResponse.json(
            { error: 'Error al eliminar empleado', details: error.message },
            { status: 500 }
        );
    }
}
