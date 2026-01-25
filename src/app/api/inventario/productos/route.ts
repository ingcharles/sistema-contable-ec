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

        // Obtener datos paginados con aliases en camelCase
        const dataResult = await db.query(
            {
                text: `
                    SELECT 
                        p.id,
                        p.codigo_principal AS "codigoPrincipal",
                        p.codigo_auxiliar AS "codigoAuxiliar",
                        p.nombre,
                        p.descripcion,
                        p.unidad_medida AS "unidadMedida",
                        p.stock_actual AS "stockActual",
                        p.stock_minimo AS "stockMinimo",
                        p.costo_promedio AS "costoPromedio",
                        p.precio_venta AS "precioVenta",
                        p.graba_iva AS "grabaIva",
                        p.categoria_id AS "categoriaId",
                        p.activo,
                        p.created_at AS "createdAt",
                        p.updated_at AS "updatedAt",
                        c.nombre AS "categoriaNombre"
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
            id, // Si viene id, es actualización; si no, es creación
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

        // Usar transacción para guardar producto y registrar movimiento kardex inicial
        const result = await db.transaction(async (client) => {
            let producto;
            let esNuevo = false;

            if (id) {
                // MODO EDICIÓN: Actualizar producto existente por ID
                const productoResult = await client.query(`
                    UPDATE inventario.productos 
                    SET 
                        codigo_auxiliar = $1,
                        nombre = $2,
                        descripcion = $3,
                        unidad_medida = $4,
                        stock_minimo = $5,
                        precio_venta = $6,
                        graba_iva = $7,
                        codigo_tarifa_iva = $8,
                        categoria_id = $9,
                        activo = $10,
                        updated_at = NOW()
                    WHERE id = $11 AND empresa_id = $12
                    RETURNING *
                `, [
                    codigoAuxiliar,
                    nombre,
                    descripcion,
                    unidadMedida,
                    stockMinimo,
                    precioVenta,
                    grabaIva,
                    codigoTarifaIva,
                    categoriaId,
                    activo,
                    id,
                    context.empresaId
                ]);

                if (productoResult.rows.length === 0) {
                    throw new Error('Producto no encontrado o no tiene permisos para editarlo');
                }

                producto = productoResult.rows[0];
                esNuevo = false;
            } else {
                // MODO CREACIÓN: Insertar nuevo producto (SIN ON CONFLICT - debe fallar si existe)
                const productoResult = await client.query(`
                    INSERT INTO inventario.productos 
                        (empresa_id, usuario_id, codigo_principal, codigo_auxiliar, nombre, descripcion,
                         unidad_medida, stock_actual, stock_minimo, costo_promedio, precio_venta, graba_iva, 
                         codigo_tarifa_iva, categoria_id, activo, created_at, updated_at)
                    VALUES 
                        ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
                    RETURNING *
                `, [
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
                ]);

                producto = productoResult.rows[0];
                esNuevo = true;
            }

            // Si es un producto nuevo, registrar movimiento inicial en kardex
            if (esNuevo) {
                // Obtener la bodega predeterminada de la empresa
                const bodegaResult = await client.query(`
                    SELECT id FROM inventario.bodegas 
                    WHERE empresa_id = $1 
                    ORDER BY created_at ASC 
                    LIMIT 1
                `, [context.empresaId]);

                if (bodegaResult.rows.length === 0) {
                    throw new Error('No existe una bodega configurada para esta empresa. Configure al menos una bodega antes de crear productos.');
                }

                const bodegaId = bodegaResult.rows[0].id;
                
                // Verificar que no exista ya un movimiento inicial para este producto
                const kardexExiste = await client.query(`
                    SELECT id FROM inventario.kardex_movimientos
                    WHERE producto_id = $1 AND referencia = 'INVENTARIO_INICIAL'
                    LIMIT 1
                `, [producto.id]);

                // Solo insertar si no existe movimiento inicial previo
                if (kardexExiste.rows.length === 0) {
                    await client.query(`
                        INSERT INTO inventario.kardex_movimientos 
                            (empresa_id, usuario_id, producto_id, bodega_id, tipo, cantidad, 
                             costo_unitario, stock_anterior, stock_resultante, referencia, observaciones, 
                             fecha, created_at)
                        VALUES 
                            ($1, $2, $3, $4, 'ENTRADA', 0, $5, 0, 0, 'INVENTARIO_INICIAL', 
                             'Registro inicial del producto en el sistema', NOW(), NOW())
                    `, [
                        context.empresaId,
                        context.usuarioId,
                        producto.id,
                        bodegaId,
                        costoPromedio
                    ]);
                }
            }

            return producto;
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            data: result,
            mensaje: 'Producto guardado exitosamente'
        });
    } catch (error: any) {
        console.error('Error al guardar producto:', error);
        
        // Detectar error de código duplicado
        if (error.code === '23505' && error.constraint?.includes('codigo_principal')) {
            return NextResponse.json(
                { error: 'Ya existe un producto con este código en su empresa' },
                { status: 409 }
            );
        }
        
        return NextResponse.json(
            { error: error.message || 'Error al guardar producto' },
            { status: 500 }
        );
    }
}
