import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/directorio/terceros
 * Lista terceros con filtros opcionales
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const tipo = url.searchParams.get('tipo'); // CLIENTE, PROVEEDOR, AMBOS
        const buscar = url.searchParams.get('buscar');
        const activo = url.searchParams.get('activo');

        let whereConditions = ['empresa_id = $1'];
        let values: any[] = [context.empresaId];
        let paramIndex = 2;

        if (tipo) {
            whereConditions.push(`(tipo_tercero = $${paramIndex} OR tipo_tercero = 'AMBOS')`);
            values.push(tipo);
            paramIndex++;
        }

        if (buscar) {
            whereConditions.push(`(
                razon_social ILIKE $${paramIndex} OR 
                nombre_comercial ILIKE $${paramIndex} OR 
                identificacion ILIKE $${paramIndex}
            )`);
            values.push(`%${buscar}%`);
            paramIndex++;
        }

        if (activo !== null && activo !== undefined) {
            whereConditions.push(`activo = $${paramIndex}`);
            values.push(activo === 'true');
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');
        console.log(whereClause);
        console.log(values);
        const result = await db.query(
            {
                text: `
                    SELECT 
                        id, tipo_identificacion, identificacion, razon_social,
                        nombre_comercial, tipo_tercero, es_contribuyente_especial,
                        es_obligado_contabilidad, email, telefono, celular, direccion,
                        provincia, ciudad, codigo_postal, limite_credito, dias_credito,
                        descuento_porcentaje, activo, created_at, updated_at
                    FROM directorio.terceros
                    WHERE ${whereClause}
                    ORDER BY razon_social ASC
                `,
                values
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar terceros:', error);
        return NextResponse.json(
            { error: 'Error al consultar terceros', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/directorio/terceros
 * Crea un nuevo tercero
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            tipoIdentificacion,
            identificacion,
            razonSocial,
            nombreComercial,
            tipoTercero,
            esContribuyenteEspecial = false,
            obligadoContabilidad = false,
            email,
            telefono,
            celular,
            direccion,
            provincia,
            ciudad,
            codigoPostal,
            limiteCredito = 0,
            diasCredito = 0,
            descuentoPorcentaje = 0,
            cuentaContableCxc,
            cuentaContableCxp,
            activo = true
        } = body;

        // Validaciones
        if (!tipoIdentificacion || !identificacion || !razonSocial || !tipoTercero) {
            return NextResponse.json(
                { error: 'Campos requeridos: tipoIdentificacion, identificacion, razonSocial, tipoTercero' },
                { status: 400 }
            );
        }

        const id = crypto.randomUUID();

        await db.query(
            {
                text: `
                    INSERT INTO directorio.terceros (
                        id, empresa_id, tipo_identificacion, identificacion, razon_social,
                        nombre_comercial, tipo_tercero, es_contribuyente_especial,
                        es_obligado_contabilidad, email, telefono, celular, direccion,
                        provincia, ciudad, codigo_postal, limite_credito, dias_credito,
                        descuento_porcentaje, cuenta_contable_cxc, cuenta_contable_cxp,
                        activo, created_at, updated_at, created_by
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                        $16, $17, $18, $19, $20, $21, $22, NOW(), NOW(), $23
                    )
                    RETURNING id, identificacion, razon_social
                `,
                values: [
                    id,
                    context.empresaId,
                    tipoIdentificacion,
                    identificacion,
                    razonSocial,
                    nombreComercial || null,
                    tipoTercero,
                    esContribuyenteEspecial,
                    obligadoContabilidad,
                    email || null,
                    telefono || null,
                    celular || null,
                    direccion || null,
                    provincia || null,
                    ciudad || null,
                    codigoPostal || null,
                    limiteCredito,
                    diasCredito,
                    descuentoPorcentaje,
                    cuentaContableCxc || null,
                    cuentaContableCxp || null,
                    activo,
                    context.usuarioId
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            success: true,
            id,
            message: 'Tercero creado exitosamente'
        }, { status: 201 });

    } catch (error: any) {
        // Manejar error de duplicado
        if (error.code === '23505') {
            return NextResponse.json(
                { error: 'Ya existe un tercero con esta identificación' },
                { status: 409 }
            );
        }

        console.error('Error al crear tercero:', error);
        return NextResponse.json(
            { error: 'Error al crear tercero', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/directorio/terceros
 * Actualiza un tercero existente
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
            tipoIdentificacion,
            identificacion,
            razonSocial,
            nombreComercial,
            tipoTercero,
            esContribuyenteEspecial,
            obligadoContabilidad,
            email,
            telefono,
            celular,
            direccion,
            provincia,
            ciudad,
            codigoPostal,
            limiteCredito,
            diasCredito,
            descuentoPorcentaje,
            cuentaContableCxc,
            cuentaContableCxp,
            activo
        } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID de tercero requerido' }, { status: 400 });
        }

        const result = await db.query(
            {
                text: `
                    UPDATE directorio.terceros
                    SET tipo_identificacion = $1, identificacion = $2, razon_social = $3,
                        nombre_comercial = $4, tipo_tercero = $5, es_contribuyente_especial = $6,
                        es_obligado_contabilidad = $7, email = $8, telefono = $9, celular = $10,
                        direccion = $11, provincia = $12, ciudad = $13, codigo_postal = $14,
                        limite_credito = $15, dias_credito = $16, descuento_porcentaje = $17,
                        cuenta_contable_cxc = $18, cuenta_contable_cxp = $19, activo = $20,
                        updated_at = NOW(), updated_by = $21
                    WHERE id = $22 AND empresa_id = $23
                    RETURNING id
                `,
                values: [
                    tipoIdentificacion,
                    identificacion,
                    razonSocial,
                    nombreComercial || null,
                    tipoTercero,
                    esContribuyenteEspecial,
                    obligadoContabilidad,
                    email || null,
                    telefono || null,
                    celular || null,
                    direccion || null,
                    provincia || null,
                    ciudad || null,
                    codigoPostal || null,
                    limiteCredito,
                    diasCredito,
                    descuentoPorcentaje,
                    cuentaContableCxc || null,
                    cuentaContableCxp || null,
                    activo,
                    context.usuarioId,
                    id,
                    context.empresaId
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Tercero no encontrado' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Tercero actualizado exitosamente'
        });

    } catch (error: any) {
        console.error('Error al actualizar tercero:', error);
        return NextResponse.json(
            { error: 'Error al actualizar tercero', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/directorio/terceros/[id]
 * Desactiva un tercero (soft delete)
 */
export async function DELETE(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const id = pathParts[pathParts.length - 1];

        if (!id) {
            return NextResponse.json({ error: 'ID de tercero requerido' }, { status: 400 });
        }

        const result = await db.query(
            {
                text: `
                    UPDATE directorio.terceros
                    SET activo = FALSE, updated_at = NOW(), updated_by = $1
                    WHERE id = $2 AND empresa_id = $3
                    RETURNING id
                `,
                values: [context.usuarioId, id, context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Tercero no encontrado' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Tercero desactivado exitosamente'
        });

    } catch (error: any) {
        console.error('Error al eliminar tercero:', error);
        return NextResponse.json(
            { error: 'Error al eliminar tercero', details: error.message },
            { status: 500 }
        );
    }
}
