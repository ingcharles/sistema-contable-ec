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
                        a.id, a.fecha, a.tercero_id, t.razon_social as tercero_nombre, a.referencia,
                        a.monto_original, a.saldo_disponible,
                        a.created_at
                    FROM cartera.anticipos a
                    LEFT JOIN directorio.terceros t ON t.id = a.tercero_id
                    WHERE a.empresa_id = $1 
                    AND a.tipo = $2
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
        const { tipo, fecha, terceroId, referencia, monto } = body;

        if (!tipo || !fecha || !terceroId || !monto) {
            return NextResponse.json(
                { error: 'Campos requeridos: tipo, fecha, terceroId, monto' },
                { status: 400 }
            );
        }

        const result = await db.query(
            {
                text: `
                    INSERT INTO cartera.anticipos 
                        (empresa_id, tipo, fecha, tercero_id,
                         referencia, monto_original, saldo_disponible, estado, created_at)
                    VALUES 
                        ($1, $2, $3, $4, $5, $6, $6, 'DISPONIBLE', NOW())
                    RETURNING *
                `,
                values: [
                    context.empresaId,
                    tipo,
                    fecha,
                    terceroId,
                    referencia,
                    monto
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
