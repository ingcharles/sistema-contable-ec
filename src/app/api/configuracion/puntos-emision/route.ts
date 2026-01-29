import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/configuracion/puntos-emision
 * Lista puntos de emisión de las sucursales de la empresa
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        // Obtenemos puntos de emisión con sus secuenciales
        const result = await db.query(
            {
                text: `
                    SELECT 
                        pe.id, 
                        pe.sucursal_id as "sucursalId", 
                        pe.codigo, 
                        pe.nombre, 
                        pe.activo,
                        pe.requiere_asignacion as "requiereAsignacion",
                        pe.permite_multiples_usuarios as "permiteMultiplesUsuarios",
                        pe.descripcion,
                        s.nombre as "sucursalNombre",
                        s.codigo as "sucursalCodigo",
                        COALESCE(
                            (SELECT json_agg(json_build_object('tipoComprobante', pes.tipo_comprobante, 'secuencialActual', pes.secuencial_actual))
                             FROM configuracion.puntos_emision_secuenciales pes 
                             WHERE pes.punto_emision_id = pe.id),
                            '[]'::json
                        ) as secuenciales
                    FROM configuracion.puntos_emision pe
                    JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
                    WHERE s.empresa_id = $1
                    ORDER BY s.codigo ASC, pe.codigo ASC
                `,
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar puntos de emision:', error);
        return NextResponse.json(
            { error: 'Error al consultar puntos de emisión', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/configuracion/puntos-emision
 * Crea un nuevo punto de emisión
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            sucursalId,
            codigo,
            nombre,
            activo = true,
            requiereAsignacion = true,
            permiteMultiplesUsuarios = true,
            descripcion = '',
            secuenciales = []
        } = body;

        if (!sucursalId || !codigo || !nombre) {
            return NextResponse.json({ error: 'Sucursal, código y nombre son requeridos' }, { status: 400 });
        }

        const id = crypto.randomUUID();

        // Usamos una transacción para insertar el punto y sus secuenciales
        await db.transaction(async (client) => {
            await client.query(
                `INSERT INTO configuracion.puntos_emision 
                    (id, sucursal_id, codigo, nombre, activo, requiere_asignacion, permite_multiples_usuarios, descripcion, created_by) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [id, sucursalId, codigo, nombre, activo, requiereAsignacion, permiteMultiplesUsuarios, descripcion, context.usuarioId]
            );

            for (const seq of secuenciales) {
                await client.query(
                    `INSERT INTO configuracion.puntos_emision_secuenciales (punto_emision_id, tipo_comprobante, secuencial_actual) VALUES ($1, $2, $3)`,
                    [id, seq.tipoComprobante, seq.secuencialActual]
                );
            }
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({ success: true, id, message: 'Punto de emisión creado exitosamente' }, { status: 201 });
    } catch (error: any) {
        console.error('Error al crear punto de emisión:', error);
        return NextResponse.json({ error: 'Error al crear punto de emisión', details: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/configuracion/puntos-emision
 * Actualiza un punto de emisión existente
 */
export async function PUT(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            id,
            sucursalId,
            codigo,
            nombre,
            activo,
            requiereAsignacion,
            permiteMultiplesUsuarios,
            descripcion,
            secuenciales = []
        } = body;

        if (!id || !sucursalId || !codigo || !nombre) {
            return NextResponse.json({ error: 'ID, Sucursal, código y nombre son requeridos' }, { status: 400 });
        }

        // Usamos una transacción para actualizar el punto y sus secuenciales
        await db.transaction(async (client) => {
            // 1. Actualizar datos básicos
            await client.query(
                `UPDATE configuracion.puntos_emision 
                 SET sucursal_id = $1, 
                     codigo = $2, 
                     nombre = $3, 
                     activo = $4, 
                     requiere_asignacion = $5,
                     permite_multiples_usuarios = $6,
                     descripcion = $7,
                     updated_at = NOW()
                 WHERE id = $8 AND EXISTS (SELECT 1 FROM configuracion.sucursales s WHERE s.id = $1 AND s.empresa_id = $9)`,
                [sucursalId, codigo, nombre, activo, requiereAsignacion, permiteMultiplesUsuarios, descripcion, id, context.empresaId]
            );

            // 2. Actualizar secuenciales (Upsert: Update si existe, Insert si no)
            for (const seq of secuenciales) {
                // Verificamos si existe
                const existing = await client.query(
                    `SELECT 1 FROM configuracion.puntos_emision_secuenciales 
                     WHERE punto_emision_id = $1 AND tipo_comprobante = $2`,
                    [id, seq.tipoComprobante]
                );

                if (existing.rowCount && existing.rowCount > 0) {
                    await client.query(
                        `UPDATE configuracion.puntos_emision_secuenciales 
                         SET secuencial_actual = $3
                         WHERE punto_emision_id = $1 AND tipo_comprobante = $2`,
                        [id, seq.tipoComprobante, seq.secuencialActual]
                    );
                } else {
                    await client.query(
                        `INSERT INTO configuracion.puntos_emision_secuenciales (punto_emision_id, tipo_comprobante, secuencial_actual) VALUES ($1, $2, $3)`,
                        [id, seq.tipoComprobante, seq.secuencialActual]
                    );
                }
            }
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({ success: true, message: 'Punto de emisión actualizado exitosamente' });
    } catch (error: any) {
        console.error('Error al actualizar punto de emisión:', error);
        return NextResponse.json({ error: 'Error al actualizar punto de emisión', details: error.message }, { status: 500 });
    }
}
