import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * POST /api/cartera/pagos
 * Registra un pago o cruce de anticipo
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            documentoId,
            anticipoId,
            valorEfectivo = 0,
            valorRetencion = 0,
            valorCruce = 0,
            formaPago
        } = body;

        if (!documentoId || !formaPago) {
            return NextResponse.json(
                { error: 'Campos requeridos: documentoId, formaPago' },
                { status: 400 }
            );
        }

        const totalAbono = Number(valorEfectivo) + Number(valorRetencion) + Number(valorCruce);

        if (totalAbono <= 0) {
            return NextResponse.json(
                { error: 'El valor total del pago debe ser mayor a cero' },
                { status: 400 }
            );
        }

        await db.transaction(async (client) => {
            // 1. Actualizar documento pendiente
            const docUpdate = await client.query(
                {
                    text: `
                        UPDATE cartera_documentos 
                        SET saldo_pendiente = saldo_pendiente - $1,
                            updated_at = NOW()
                        WHERE id = $2 AND empresa_id = $3
                        RETURNING saldo_pendiente
                    `,
                    values: [totalAbono, documentoId, context.empresaId]
                }
            );

            if (docUpdate.rowCount === 0) {
                throw new Error('Documento no encontrado o no pertenece a la empresa');
            }

            // 2. Si es cruce, actualizar el anticipo
            if (formaPago === 'CRUCE_ANTICIPO' && anticipoId) {
                const antUpdate = await client.query(
                    {
                        text: `
                            UPDATE cartera_anticipos 
                            SET saldo_disponible = saldo_disponible - $1
                            WHERE id = $2 AND empresa_id = $3
                            RETURNING saldo_disponible
                        `,
                        values: [valorCruce, anticipoId, context.empresaId]
                    }
                );

                if (antUpdate.rowCount === 0) {
                    throw new Error('Anticipo no encontrado o no pertenece a la empresa');
                }
            }
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            mensaje: 'Transacción de cartera procesada exitosamente'
        });
    } catch (error: any) {
        console.error('Error al procesar pago de cartera:', error);
        return NextResponse.json(
            { error: 'Error al procesar el pago', details: error.message },
            { status: 500 }
        );
    }
}
