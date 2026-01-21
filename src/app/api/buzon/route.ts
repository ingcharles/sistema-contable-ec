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
                        id, tipo, secuencial, ruc_emisor as "rucEmisor", 
                        razon_social_emisor as "razonSocialEmisor", fecha_emision as "fechaEmision",
                        fecha_recepcion as "fechaRecepcion", monto_total as "montoTotal",
                        clave_acceso as "claveAcceso", estado
                    FROM buzon.comprobantes_recibidos
                    WHERE empresa_id = $1
                    ORDER BY fecha_emision DESC
                `,
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar comprobantes recibidos:', error);
        return NextResponse.json(
            { error: 'Error al consultar el buzón', details: error.message },
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
        const { action, desde, hasta } = body;

        if (action === 'importar') {
            if (!desde || !hasta) {
                return NextResponse.json({ error: 'Faltan parámetros para la importación' }, { status: 400 });
            }

            // Simulate SRI sync delay and mock some data insertion for now
            // In a real scenario, this would call a service that interacts with the SRI
            await new Promise(resolve => setTimeout(resolve, 2000));

            return NextResponse.json({
                success: true,
                message: `Sincronización completada para el periodo ${desde} al ${hasta}`,
                count: 0
            });
        }

        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
