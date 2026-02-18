import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const result = await db.query(
            {
                text: `
                    SELECT 
                        id, identificacion, razon_social as "razonSocial", 
                        placa, email, telefono, activo
                    FROM facturacion.transportistas
                    WHERE empresa_id = $1
                    ORDER BY razon_social ASC
                `,
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar transportistas:', error);
        return NextResponse.json(
            { error: 'Error al consultar transportistas', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { identificacion, razonSocial, placa, email, telefono, activo = true } = body;

        if (!identificacion || !razonSocial || !placa) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const result = await db.query(
            {
                text: `
                    INSERT INTO facturacion.transportistas (
                        empresa_id, usuario_id, identificacion, razon_social, placa, email, telefono, activo
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (empresa_id, identificacion) DO UPDATE SET
                        razon_social = EXCLUDED.razon_social,
                        placa = EXCLUDED.placa,
                        email = EXCLUDED.email,
                        telefono = EXCLUDED.telefono,
                        activo = EXCLUDED.activo,
                        updated_at = NOW()
                    RETURNING id, razon_social as "razonSocial", placa
                `,
                values: [
                    context.empresaId, context.usuarioId,
                    identificacion, razonSocial, placa, email, telefono, activo
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        const row = result.rows[0];
        return NextResponse.json({ success: true, data: { id: row.id, razonSocial: row.razonSocial, placa: row.placa } });
    } catch (error: any) {
        console.error('Error al guardar transportista:', error);
        return NextResponse.json({ error: 'Error al guardar transportista', details: error.message }, { status: 500 });
    }
}
