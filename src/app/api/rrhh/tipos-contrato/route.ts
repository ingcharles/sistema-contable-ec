import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { TipoContratoEntity } from '@/modules/rrhh/domain/types';
import { toCamelCase, toSnakeCase } from '@/shared/utils/caseConverter';

/**
 * GET /api/rrhh/tipos-contrato
 * Obtiene todos los tipos de contrato de la empresa
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const empresaId = context.empresaId;

        const result = await db.query(
            {
                text: `
                    SELECT 
                        id,
                        empresa_id,
                        codigo,
                        nombre,
                        descripcion,
                        requiere_fecha_fin,
                        activo,
                        created_at,
                        updated_at,
                        created_by,
                        updated_by
                    FROM nomina.tipos_contrato
                    WHERE empresa_id = $1
                    ORDER BY orden, nombre
                `,
                values: [empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const tiposContrato: TipoContratoEntity[] = result.rows.map((row: any) => toCamelCase(row));
        return NextResponse.json(tiposContrato);
    } catch (error) {
        console.error('Error al obtener tipos de contrato:', error);
        return NextResponse.json(
            { error: 'Error al obtener tipos de contrato' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/rrhh/tipos-contrato
 * Crea un nuevo tipo de contrato
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const empresaId = context.empresaId;
        const usuarioId = context.usuarioId;
        const body = await req.json();
        const tipoData = toSnakeCase(body);

        // Validaciones
        if (!tipoData.codigo || !tipoData.nombre) {
            return NextResponse.json(
                { error: 'Código y nombre son requeridos' },
                { status: 400 }
            );
        }

        // Verificar si el código ya existe
        const existing = await db.query(
            {
                text: 'SELECT id FROM nomina.tipos_contrato WHERE empresa_id = $1 AND codigo = $2',
                values: [empresaId, tipoData.codigo]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (existing.rows.length > 0) {
            return NextResponse.json(
                { error: 'Ya existe un tipo de contrato con ese código' },
                { status: 409 }
            );
        }

        const result = await db.query(
            {
                text: `
                    INSERT INTO nomina.tipos_contrato (
                        empresa_id, codigo, nombre, descripcion,
                        requiere_fecha_fin, activo, created_by, updated_by
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING *
                `,
                values: [
                    empresaId,
                    tipoData.codigo,
                    tipoData.nombre,
                    tipoData.descripcion || null,
                    tipoData.requiere_fecha_fin || false,
                    tipoData.activo !== false,
                    usuarioId,
                    usuarioId
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const nuevoTipo = toCamelCase(result.rows[0]);
        return NextResponse.json(nuevoTipo, { status: 201 });
    } catch (error) {
        console.error('Error al crear tipo de contrato:', error);
        return NextResponse.json(
            { error: 'Error al crear tipo de contrato' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/rrhh/tipos-contrato
 * Actualiza un tipo de contrato existente
 */
export async function PUT(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const empresaId = context.empresaId;
        const usuarioId = context.usuarioId;
        const body = await req.json();
        const tipoData = toSnakeCase(body);

        if (!tipoData.id) {
            return NextResponse.json(
                { error: 'ID de tipo de contrato requerido' },
                { status: 400 }
            );
        }

        // Verificar que el tipo de contrato pertenece a la empresa
        const existing = await db.query(
            {
                text: 'SELECT id FROM nomina.tipos_contrato WHERE id = $1 AND empresa_id = $2',
                values: [tipoData.id, empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (existing.rows.length === 0) {
            return NextResponse.json(
                { error: 'Tipo de contrato no encontrado' },
                { status: 404 }
            );
        }

        const result = await db.query(
            {
                text: `
                    UPDATE nomina.tipos_contrato
                    SET 
                        codigo = $2,
                        nombre = $3,
                        descripcion = $4,
                        requiere_fecha_fin = $5,
                        activo = $6,
                        updated_by = $7,
                        updated_at = NOW()
                    WHERE id = $1 AND empresa_id = $8
                    RETURNING *
                `,
                values: [
                    tipoData.id,
                    tipoData.codigo,
                    tipoData.nombre,
                    tipoData.descripcion || null,
                    tipoData.requiere_fecha_fin || false,
                    tipoData.activo !== false,
                    usuarioId,
                    empresaId
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const tipoActualizado = toCamelCase(result.rows[0]);
        return NextResponse.json(tipoActualizado);
    } catch (error) {
        console.error('Error al actualizar tipo de contrato:', error);
        return NextResponse.json(
            { error: 'Error al actualizar tipo de contrato' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/rrhh/tipos-contrato
 * Desactiva un tipo de contrato (soft delete)
 */
export async function DELETE(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const empresaId = context.empresaId;
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'ID de tipo de contrato requerido' },
                { status: 400 }
            );
        }

        // Verificar si hay empleados con este tipo de contrato
        const empleados = await db.query(
            {
                text: 'SELECT COUNT(*) as count FROM nomina.empleados WHERE tipo_contrato_id = $1',
                values: [id]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (parseInt(empleados.rows[0].count) > 0) {
            return NextResponse.json(
                { error: 'No se puede eliminar un tipo de contrato con empleados asignados' },
                { status: 409 }
            );
        }

        // Soft delete
        await db.query(
            {
                text: `
                    UPDATE nomina.tipos_contrato
                    SET activo = false, updated_at = NOW()
                    WHERE id = $1 AND empresa_id = $2
                `,
                values: [id, empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({ message: 'Tipo de contrato eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar tipo de contrato:', error);
        return NextResponse.json(
            { error: 'Error al eliminar tipo de contrato' },
            { status: 500 }
        );
    }
}
