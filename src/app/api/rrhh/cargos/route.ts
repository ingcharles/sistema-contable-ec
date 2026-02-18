import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { Cargo } from '@/modules/rrhh/domain/types';
import { toSnakeCase } from '@/shared/utils/caseConverter';

/**
 * GET /api/rrhh/cargos?areaId=xxx (opcional)
 * Obtiene todos los cargos de la empresa, con filtro opcional por área
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const empresaId = context.empresaId;
        const { searchParams } = new URL(req.url);
        const areaId = searchParams.get('areaId');

        let queryText = `
            SELECT 
                c.id,
                c.empresa_id,
                c.area_id AS "areaId",
                c.codigo,
                c.nombre,
                c.descripcion,
                c.nivel_jerarquico AS "nivelJerarquico",
                c.sueldo_minimo AS "sueldoMinimo",
                c.sueldo_maximo AS "sueldoMaximo",
                c.activo,
                c.created_at AS "createdAt",
                c.updated_at AS "updatedAt",
                c.created_by AS "createdBy",
                c.updated_by AS "updatedBy",
                -- Área
                a.nombre as "areaNombre"
            FROM nomina.cargos c
            LEFT JOIN nomina.areas a ON c.area_id = a.id
            WHERE c.empresa_id = $1
        `;

        const values: any[] = [empresaId];

        if (areaId) {
            queryText += ' AND c.area_id = $2';
            values.push(areaId);
        }

        queryText += ' ORDER BY c.nivel_jerarquico, c.codigo';

        const result = await db.query(
            { text: queryText, values },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const cargos: Cargo[] = result.rows.map((row: any) => ({
            ...row,
            area: row.areaNombre ? {
                id: row.areaId,
                nombre: row.areaNombre
            } : undefined
        }));

        return NextResponse.json(cargos);
    } catch (error) {
        console.error('Error al obtener cargos:', error);
        return NextResponse.json(
            { error: 'Error al obtener cargos' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/rrhh/cargos
 * Crea un nuevo cargo
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
        const cargoData = toSnakeCase(body);

        // Validaciones
        if (!cargoData.codigo || !cargoData.nombre) {
            return NextResponse.json(
                { error: 'Código y nombre son requeridos' },
                { status: 400 }
            );
        }

        // Verificar si el código ya existe
        const existing = await db.query(
            {
                text: 'SELECT id FROM nomina.cargos WHERE empresa_id = $1 AND codigo = $2',
                values: [empresaId, cargoData.codigo]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (existing.rows.length > 0) {
            return NextResponse.json(
                { error: 'Ya existe un cargo con ese código' },
                { status: 409 }
            );
        }

        const result = await db.query(
            {
                text: `
                    INSERT INTO nomina.cargos (
                        empresa_id, area_id, codigo, nombre, descripcion,
                        nivel_jerarquico, sueldo_minimo, sueldo_maximo,
                        activo, created_by, updated_by
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING 
                        id, empresa_id AS "empresaId", area_id AS "areaId", codigo, nombre, descripcion,
                        nivel_jerarquico AS "nivelJerarquico", sueldo_minimo AS "sueldoMinimo", 
                        sueldo_maximo AS "sueldoMaximo", activo, created_at AS "createdAt", 
                        updated_at AS "updatedAt", created_by AS "createdBy", updated_by AS "updatedBy"
                `,
                values: [
                    empresaId,
                    cargoData.area_id || null,
                    cargoData.codigo,
                    cargoData.nombre,
                    cargoData.descripcion || null,
                    cargoData.nivel_jerarquico || 4, // Default: Operativo
                    cargoData.sueldo_minimo || null,
                    cargoData.sueldo_maximo || null,
                    cargoData.activo !== false,
                    usuarioId,
                    usuarioId
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const nuevoCargo = result.rows[0];
        return NextResponse.json(nuevoCargo, { status: 201 });
    } catch (error) {
        console.error('Error al crear cargo:', error);
        return NextResponse.json(
            { error: 'Error al crear cargo' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/rrhh/cargos
 * Actualiza un cargo existente
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
        const cargoData = toSnakeCase(body);

        if (!cargoData.id) {
            return NextResponse.json(
                { error: 'ID de cargo requerido' },
                { status: 400 }
            );
        }

        // Verificar que el cargo pertenece a la empresa
        const existing = await db.query(
            {
                text: 'SELECT id FROM nomina.cargos WHERE id = $1 AND empresa_id = $2',
                values: [cargoData.id, empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (existing.rows.length === 0) {
            return NextResponse.json(
                { error: 'Cargo no encontrado' },
                { status: 404 }
            );
        }

        const result = await db.query(
            {
                text: `
                    UPDATE nomina.cargos
                    SET 
                        codigo = $2,
                        nombre = $3,
                        descripcion = $4,
                        area_id = $5,
                        nivel_jerarquico = $6,
                        sueldo_minimo = $7,
                        sueldo_maximo = $8,
                        activo = $9,
                        updated_by = $10,
                        updated_at = NOW()
                    WHERE id = $1 AND empresa_id = $11
                    RETURNING 
                        id, empresa_id AS "empresaId", area_id AS "areaId", codigo, nombre, descripcion,
                        nivel_jerarquico AS "nivelJerarquico", sueldo_minimo AS "sueldoMinimo", 
                        sueldo_maximo AS "sueldoMaximo", activo, created_at AS "createdAt", 
                        updated_at AS "updatedAt", created_by AS "createdBy", updated_by AS "updatedBy"
                `,
                values: [
                    cargoData.id,
                    cargoData.codigo,
                    cargoData.nombre,
                    cargoData.descripcion || null,
                    cargoData.area_id || null,
                    cargoData.nivel_jerarquico || 4,
                    cargoData.sueldo_minimo || null,
                    cargoData.sueldo_maximo || null,
                    cargoData.activo !== false,
                    usuarioId,
                    empresaId
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const cargoActualizado = result.rows[0];
        return NextResponse.json(cargoActualizado);
    } catch (error) {
        console.error('Error al actualizar cargo:', error);
        return NextResponse.json(
            { error: 'Error al actualizar cargo' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/rrhh/cargos
 * Desactiva un cargo (soft delete)
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
                { error: 'ID de cargo requerido' },
                { status: 400 }
            );
        }

        // Verificar si hay empleados con este cargo
        const empleados = await db.query(
            {
                text: 'SELECT COUNT(*) as count FROM nomina.empleados WHERE cargo_id = $1',
                values: [id]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (parseInt(empleados.rows[0].count) > 0) {
            return NextResponse.json(
                { error: 'No se puede eliminar un cargo con empleados asignados' },
                { status: 409 }
            );
        }

        // Soft delete
        await db.query(
            {
                text: `
                    UPDATE nomina.cargos
                    SET activo = false, updated_at = NOW()
                    WHERE id = $1 AND empresa_id = $2
                `,
                values: [id, empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({ message: 'Cargo eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar cargo:', error);
        return NextResponse.json(
            { error: 'Error al eliminar cargo' },
            { status: 500 }
        );
    }
}
