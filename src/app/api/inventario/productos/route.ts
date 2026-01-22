import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { extractPaginationParams, buildPaginatedResponse } from '@/shared/utils/pagination';

/**
 * GET /api/inventario/productos
 * Lista productos con paginación y filtros
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
        const categoriaId = url.searchParams.get('categoriaId');
        const stockBajo = url.searchParams.get('stockBajo') === 'true';

        let whereConditions = ['p.empresa_id = $1'];
        let values: any[] = [context.empresaId];
        let paramIndex = 2;

        if (buscar) {
            whereConditions.push(`(p.nombre ILIKE $${paramIndex} OR p.codigo_principal ILIKE $${paramIndex})`);
            values.push(`%${buscar}%`);
            paramIndex++;
        }

        if (categoriaId) {
            whereConditions.push(`p.categoria_id = $${paramIndex}`);
            values.push(categoriaId);
            paramIndex++;
        }

        if (stockBajo) {
            whereConditions.push('p.stock_actual <= p.stock_minimo');
        }

        const whereClause = whereConditions.join(' AND ');

        // Contar total
        const countResult = await db.query<{ count: string }>(
            {
                text: `SELECT COUNT(*) FROM inventario.productos p WHERE ${whereClause}`,
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
                        p.id, p.codigo_principal, p.codigo_auxiliar, p.nombre, p.descripcion,
                        p.stock_actual, p.stock_minimo, p.costo_promedio, p.precio_venta,
                        p.graba_iva, p.categoria_id, p.activo, p.created_at, p.updated_at,
                        c.nombre as categoria_nombre
                    FROM inventario.productos p
                    LEFT JOIN inventario.categorias_producto c ON c.id = p.categoria_id AND c.empresa_id = p.empresa_id
                    WHERE ${whereClause}
                    ORDER BY p.nombre ASC
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
        console.error('Error al listar productos:', error);
        return NextResponse.json(
            { error: 'Error al consultar productos', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/inventario/productos
 * Crea o actualiza un producto
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            codigoPrincipal,
            codigoAuxiliar,
            nombre,
            descripcion,
            unidadMedida = 'UND',
            stockMinimo = 0,
            costoPromedio = 0,
            precioVenta,
            grabaIva = true,
            codigoTarifaIva = '2',
            categoriaId,
            activo = true
        } = body;

        // Validaciones
        if (!codigoPrincipal || !nombre || !precioVenta) {
            return NextResponse.json(
                { error: 'Campos requeridos: codigoPrincipal, nombre, precioVenta' },
                { status: 400 }
            );
        }

        // Upsert
        const result = await db.query(
            {
                text: `
                    INSERT INTO inventario.productos 
                        (empresa_id, usuario_id, codigo_principal, codigo_auxiliar, nombre, descripcion,
                         unidad_medida, stock_actual, stock_minimo, costo_promedio, precio_venta, graba_iva, 
                         codigo_tarifa_iva, categoria_id, activo, created_at, updated_at)
                    VALUES 
                        ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
                    ON CONFLICT (empresa_id, codigo_principal) 
                    DO UPDATE SET
                        codigo_auxiliar = EXCLUDED.codigo_auxiliar,
                        nombre = EXCLUDED.nombre,
                        descripcion = EXCLUDED.descripcion,
                        unidad_medida = EXCLUDED.unidad_medida,
                        stock_minimo = EXCLUDED.stock_minimo,
                        precio_venta = EXCLUDED.precio_venta,
                        graba_iva = EXCLUDED.graba_iva,
                        codigo_tarifa_iva = EXCLUDED.codigo_tarifa_iva,
                        categoria_id = EXCLUDED.categoria_id,
                        activo = EXCLUDED.activo,
                        updated_at = NOW()
                    RETURNING *
                `,
                values: [
                    context.empresaId,
                    context.usuarioId,
                    codigoPrincipal,
                    codigoAuxiliar,
                    nombre,
                    descripcion,
                    unidadMedida,
                    stockMinimo,
                    costoPromedio,
                    precioVenta,
                    grabaIva,
                    codigoTarifaIva,
                    categoriaId,
                    activo
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0],
            mensaje: 'Producto guardado exitosamente'
        });
    } catch (error: any) {
        console.error('Error al guardar producto:', error);
        return NextResponse.json(
            { error: 'Error al guardar producto', details: error.message },
            { status: 500 }
        );
    }
}
