import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { Area } from '@/modules/rrhh/domain/types';
import { toCamelCase, toSnakeCase } from '@/shared/utils/caseConverter';

/**
 * GET /api/rrhh/areas
 * Obtiene todas las áreas de la empresa del usuario autenticado
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
                        a.id,
                        a.empresa_id,
                        a.codigo,
                        a.nombre,
                        a.descripcion,
                        a.area_padre_id,
                        a.responsable_id,
                        a.activa,
                        a.created_at,
                        a.updated_at,
                        a.created_by,
                        a.updated_by,
                        -- Área padre
                        ap.nombre as area_padre_nombre,
                        -- Responsable
                        e.nombres || ' ' || e.apellidos as responsable_nombre
                    FROM nomina.areas a
                    LEFT JOIN nomina.areas ap ON a.area_padre_id = ap.id
                    LEFT JOIN nomina.empleados e ON a.responsable_id = e.id
                    WHERE a.empresa_id = $1
                    ORDER BY a.codigo
                `,
                values: [empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const areas: Area[] = result.rows.map((row: any) => ({
            ...toCamelCase(row),
            areaPadre: row.area_padre_nombre ? {
                id: row.area_padre_id,
                nombre: row.area_padre_nombre
            } : undefined,
            responsable: row.responsable_nombre ? {
                id: row.responsable_id,
                nombres: row.responsable_nombre
            } : undefined
        }));

        return NextResponse.json(areas);
    } catch (error) {
        console.error('Error al obtener áreas:', error);
        return NextResponse.json(
            { error: 'Error al obtener áreas' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/rrhh/areas
 * Crea una nueva área
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
        const areaData = toSnakeCase(body);

        // Validaciones
        if (!areaData.codigo || !areaData.nombre) {
            return NextResponse.json(
                { error: 'Código y nombre son requeridos' },
                { status: 400 }
            );
        }

        // Verificar si el código ya existe
        const existing = await db.query(
            {
                text: 'SELECT id FROM nomina.areas WHERE empresa_id = $1 AND codigo = $2',
                values: [empresaId, areaData.codigo]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (existing.rows.length > 0) {
            return NextResponse.json(
                { error: 'Ya existe un área con ese código' },
                { status: 409 }
            );
        }

        const result = await db.query(
            {
                text: `
                    INSERT INTO nomina.areas (
                        empresa_id, codigo, nombre, descripcion,
                        area_padre_id, responsable_id, activa, created_by, updated_by
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING *
                `,
                values: [
                    empresaId,
                    areaData.codigo,
                    areaData.nombre,
                    areaData.descripcion || null,
                    areaData.area_padre_id || null,
                    areaData.responsable_id || null,
                    areaData.activa !== false, // true por defecto
                    usuarioId,
                    usuarioId
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const nuevaArea = toCamelCase(result.rows[0]);
        return NextResponse.json(nuevaArea, { status: 201 });
    } catch (error) {
        console.error('Error al crear área:', error);
        return NextResponse.json(
            { error: 'Error al crear área' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/rrhh/areas
 * Actualiza un área existente
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
        const areaData = toSnakeCase(body);

        if (!areaData.id) {
            return NextResponse.json(
                { error: 'ID de área requerido' },
                { status: 400 }
            );
        }

        // Verificar que el área pertenece a la empresa
        const existing = await db.query(
            {
                text: 'SELECT id FROM nomina.areas WHERE id = $1 AND empresa_id = $2',
                values: [areaData.id, empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (existing.rows.length === 0) {
            return NextResponse.json(
                { error: 'Área no encontrada' },
                { status: 404 }
            );
        }

        const result = await db.query(
            {
                text: `
                    UPDATE nomina.areas
                    SET 
                        codigo = $2,
                        nombre = $3,
                        descripcion = $4,
                        area_padre_id = $5,
                        responsable_id = $6,
                        activa = $7,
                        updated_by = $8,
                        updated_at = NOW()
                    WHERE id = $1 AND empresa_id = $9
                    RETURNING *
                `,
                values: [
                    areaData.id,
                    areaData.codigo,
                    areaData.nombre,
                    areaData.descripcion || null,
                    areaData.area_padre_id || null,
                    areaData.responsable_id || null,
                    areaData.activa !== false,
                    usuarioId,
                    empresaId
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const areaActualizada = toCamelCase(result.rows[0]);
        return NextResponse.json(areaActualizada);
    } catch (error) {
        console.error('Error al actualizar área:', error);
        return NextResponse.json(
            { error: 'Error al actualizar área' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/rrhh/areas
 * Desactiva un área (soft delete)
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
                { error: 'ID de área requerido' },
                { status: 400 }
            );
        }

        // Verificar si hay empleados asignados
        const empleados = await db.query(
            {
                text: 'SELECT COUNT(*) as count FROM nomina.empleados WHERE area_id = $1',
                values: [id]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (parseInt(empleados.rows[0].count) > 0) {
            return NextResponse.json(
                { error: 'No se puede eliminar un área con empleados asignados' },
                { status: 409 }
            );
        }

        // Verificar si hay áreas hijas
        const areasHijas = await db.query(
            {
                text: 'SELECT COUNT(*) as count FROM nomina.areas WHERE area_padre_id = $1',
                values: [id]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (parseInt(areasHijas.rows[0].count) > 0) {
            return NextResponse.json(
                { error: 'No se puede eliminar un área con sub-áreas' },
                { status: 409 }
            );
        }

        // Soft delete
        await db.query(
            {
                text: `
                    UPDATE nomina.areas
                    SET activa = false, updated_at = NOW()
                    WHERE id = $1 AND empresa_id = $2
                `,
                values: [id, empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({ message: 'Área eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar área:', error);
        return NextResponse.json(
            { error: 'Error al eliminar área' },
            { status: 500 }
        );
    }
}
