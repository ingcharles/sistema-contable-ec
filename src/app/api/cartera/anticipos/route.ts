import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/cartera/anticipos
 * Lista anticipos disponibles (CxC o CxP)
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const tipo = url.searchParams.get('tipo'); // 'CXC' o 'CXP'

        if (!tipo || !['CXC', 'CXP'].includes(tipo)) {
            return NextResponse.json(
                { error: 'Parámetro tipo requerido (CXC o CXP)' },
                { status: 400 }
            );
        }

        const result = await db.query(
            {
                text: `
                    SELECT 
                        a.id, a.fecha, a.tercero_id, a.tercero_nombre, a.referencia,
                        a.monto_original, a.saldo_disponible, a.moneda, a.observaciones,
                        a.created_at
                    FROM cartera_anticipos a
                    WHERE a.empresa_id = $1 
                    AND a.tipo_cartera = $2
                    AND a.saldo_disponible > 0
                    ORDER BY a.fecha DESC
                `,
                values: [context.empresaId, tipo]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar anticipos:', error);
        return NextResponse.json(
            { error: 'Error al consultar anticipos', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/cartera/anticipos
 * Registra un anticipo
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { tipo, fecha, terceroId, terceroNombre, referencia, monto, moneda = 'USD', observaciones } = body;

        if (!tipo || !fecha || !terceroId || !terceroNombre || !monto) {
            return NextResponse.json(
                { error: 'Campos requeridos: tipo, fecha, terceroId, terceroNombre, monto' },
                { status: 400 }
            );
        }

        const result = await db.query(
            {
                text: `
                    INSERT INTO cartera_anticipos 
                        (empresa_id, usuario_id, tipo_cartera, fecha, tercero_id, tercero_nombre,
                         referencia, monto_original, saldo_disponible, moneda, observaciones, created_at)
                    VALUES 
                        ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, NOW())
                    RETURNING *
                `,
                values: [
                    context.empresaId,
                    context.usuarioId,
                    tipo,
                    fecha,
                    terceroId,
                    terceroNombre,
                    referencia,
                    monto,
                    moneda,
                    observaciones
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0],
            mensaje: 'Anticipo registrado exitosamente'
        });
    } catch (error: any) {
        console.error('Error al registrar anticipo:', error);
        return NextResponse.json(
            { error: 'Error al registrar anticipo', details: error.message },
            { status: 500 }
        );
    }
}
