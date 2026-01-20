import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/facturacion/guias
 * Lista guías de remisión
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const estado = url.searchParams.get('estado');
        const desde = url.searchParams.get('desde');
        const hasta = url.searchParams.get('hasta');

        let whereConditions = ['empresa_id = $1', "tipo_comprobante = 'GUIA_REMISION'"];
        let values: any[] = [context.empresaId];
        let paramIndex = 2;

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

        const result = await db.query(
            {
                text: `
                    SELECT 
                        id, secuencial, clave_acceso, numero_autorizacion,
                        fecha_emision, fecha_autorizacion, cliente_id, cliente_nombre,
                        cliente_identificacion, direccion_partida, direccion_destino,
                        transportista_nombre, placa_vehiculo, estado, created_at
                    FROM comprobantes_electronicos
                    WHERE ${whereClause}
                    ORDER BY fecha_emision DESC, secuencial DESC
                    LIMIT 100
                `,
                values
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar guías:', error);
        return NextResponse.json(
            { error: 'Error al consultar guías de remisión', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/facturacion/guias
 * Crea una nueva guía de remisión
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            clienteId,
            clienteNombre,
            clienteIdentificacion,
            fechaEmision,
            direccionPartida,
            direccionDestino,
            transportistaNombre,
            transportistaIdentificacion,
            placaVehiculo,
            detalles // Array de items transportados
        } = body;

        // Validaciones
        if (!clienteId || !fechaEmision || !direccionPartida || !direccionDestino) {
            return NextResponse.json(
                { error: 'Campos requeridos: clienteId, fechaEmision, direccionPartida, direccionDestino' },
                { status: 400 }
            );
        }

        const id = crypto.randomUUID();

        // Generar secuencial (simplificado - en producción vendría de secuenciador)
        const secuencial = `001-001-${String(Math.floor(Math.random() * 999999999)).padStart(9, '0')}`;

        // TODO: Generar clave de acceso SRI (requiere algoritmo específico)
        const claveAcceso = `${new Date().getTime()}${Math.floor(Math.random() * 1000000)}`.padEnd(49, '0');

        await db.query(
            {
                text: `
                    INSERT INTO comprobantes_electronicos (
                        id, empresa_id, tipo_comprobante, secuencial, clave_acceso,
                        fecha_emision, cliente_id, cliente_nombre, cliente_identificacion,
                        direccion_partida, direccion_destino, transportista_nombre,
                        transportista_identificacion, placa_vehiculo, estado,
                        created_at, updated_at, created_by
                    ) VALUES (
                        $1, $2, 'GUIA_REMISION', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                        'BORRADOR', NOW(), NOW(), $14
                    )
                    RETURNING *
                `,
                values: [
                    id,
                    context.empresaId,
                    secuencial,
                    claveAcceso,
                    fechaEmision,
                    clienteId,
                    clienteNombre,
                    clienteIdentificacion,
                    direccionPartida,
                    direccionDestino,
                    transportistaNombre || '',
                    transportistaIdentificacion || '',
                    placaVehiculo || '',
                    context.usuarioId
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        // TODO: Guardar detalles de la guía en tabla de detalles si existe
        // if (detalles && detalles.length > 0) { ... }

        return NextResponse.json({
            success: true,
            id,
            secuencial,
            claveAcceso,
            message: 'Guía de remisión creada exitosamente'
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error al crear guía de remisión:', error);
        return NextResponse.json(
            { error: 'Error al crear guía de remisión', details: error.message },
            { status: 500 }
        );
    }
}
