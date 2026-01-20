import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { extractPaginationParams, buildPaginatedResponse } from '@/shared/utils/pagination';

/**
 * GET /api/facturacion/comprobantes
 * Lista comprobantes electrónicos con filtros
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const pagination = extractPaginationParams(url);
        const tipoComprobante = url.searchParams.get('tipo'); // FACTURA, NOTA_CREDITO, GUIA_REMISION, etc.
        const estado = url.searchParams.get('estado'); // BORRADOR, AUTORIZADO, ANULADO
        const desde = url.searchParams.get('desde');
        const hasta = url.searchParams.get('hasta');

        let whereConditions = ['empresa_id = $1'];
        let values: any[] = [context.empresaId];
        let paramIndex = 2;

        if (tipoComprobante) {
            whereConditions.push(`tipo_comprobante = $${paramIndex}`);
            values.push(tipoComprobante);
            paramIndex++;
        }

        if (estado) {
            whereConditions.push(`estado = $${paramIndex}`);
            values.push(estado);
            paramIndex++;
        }

        if (desde) {
            whereConditions.push(`fecha_emision >= $${paramIndex}`);
            values.push(desde);
            paramIndex++;
        }

        if (hasta) {
            whereConditions.push(`fecha_emision <= $${paramIndex}`);
            values.push(hasta);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // Contar total
        const countResult = await db.query<{ count: string }>(
            {
                text: `SELECT COUNT(*) FROM comprobantes_electronicos WHERE ${whereClause}`,
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
                        id, tipo_comprobante, secuencial, clave_acceso, numero_autorizacion,
                        fecha_emision, fecha_autorizacion, cliente_id, cliente_nombre,
                        cliente_identificacion, subtotal, iva, total, estado,
                        ambiente_sri, tipo_emision_sri, xml_firmado, created_at, updated_at
                    FROM comprobantes_electronicos
                    WHERE ${whereClause}
                    ORDER BY fecha_emision DESC, secuencial DESC
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
        console.error('Error al listar comprobantes:', error);
        return NextResponse.json(
            { error: 'Error al consultar comprobantes', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/facturacion/comprobantes
 * Crea un comprobante electrónico
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            tipoComprobante,
            fechaEmision,
            clienteId,
            clienteNombre,
            clienteIdentificacion,
            subtotal,
            iva,
            total,
            detalles
        } = body;

        if (!tipoComprobante || !fechaEmision || !clienteId || !total || !detalles) {
            return NextResponse.json(
                { error: 'Campos requeridos: tipoComprobante, fechaEmision, clienteId, total, detalles' },
                { status: 400 }
            );
        }

        // Usar transacción para crear comprobante + detalles
        const result = await db.transaction(async (client) => {
            // Generar secuencial
            const secuencialResult = await client.query(`
                SELECT COALESCE(MAX(secuencial), 0) + 1 as next_secuencial
                FROM comprobantes_electronicos
                WHERE empresa_id = $1 AND tipo_comprobante = $2
            `, [context.empresaId, tipoComprobante]);

            const secuencial = secuencialResult.rows[0].next_secuencial;

            // Insertar cabecera
            const comprobanteResult = await client.query(`
                INSERT INTO comprobantes_electronicos 
                    (empresa_id, usuario_id, tipo_comprobante, secuencial, fecha_emision,
                     cliente_id, cliente_nombre, cliente_identificacion,
                     subtotal, iva, total, estado, created_at, updated_at)
                VALUES 
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'BORRADOR', NOW(), NOW())
                RETURNING id
            `, [
                context.empresaId,
                context.usuarioId,
                tipoComprobante,
                secuencial,
                fechaEmision,
                clienteId,
                clienteNombre,
                clienteIdentificacion,
                subtotal,
                iva,
                total
            ]);

            const comprobanteId = comprobanteResult.rows[0].id;

            // Insertar detalles
            for (const detalle of detalles) {
                await client.query(`
                    INSERT INTO comprobantes_detalles 
                        (comprobante_id, codigo_principal, descripcion, cantidad, precio_unitario, descuento, total)
                    VALUES 
                        ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    comprobanteId,
                    detalle.codigoPrincipal,
                    detalle.descripcion,
                    detalle.cantidad,
                    detalle.precioUnitario,
                    detalle.descuento || 0,
                    detalle.total
                ]);
            }

            return { comprobanteId, secuencial };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            id: result.comprobanteId,
            secuencial: result.secuencial,
            mensaje: 'Comprobante creado exitosamente'
        });
    } catch (error: any) {
        console.error('Error al crear comprobante:', error);
        return NextResponse.json(
            { error: error.message || 'Error al crear comprobante', details: error.message },
            { status: 500 }
        );
    }
}
