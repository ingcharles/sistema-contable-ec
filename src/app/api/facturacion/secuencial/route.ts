import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

/**
 * GET /api/facturacion/secuencial
 * Obtiene el siguiente secuencial disponible para un punto de emisión y tipo de comprobante
 */
export async function GET(request: NextRequest) {
    const context = validateContext(request);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const puntoEmisionId = searchParams.get('puntoEmisionId');
        const tipoComprobante = searchParams.get('tipoComprobante');

        if (!puntoEmisionId || !tipoComprobante) {
            return NextResponse.json(
                { error: 'Se requiere puntoEmisionId y tipoComprobante' },
                { status: 400 }
            );
        }

        // Buscar el secuencial actual para el punto de emisión y tipo de comprobante
        const result = await db.query(
            {
                text: `
                    SELECT id, secuencial_actual 
                    FROM configuracion.puntos_emision_secuenciales 
                    WHERE punto_emision_id = $1 AND tipo_comprobante = $2
                `,
                values: [puntoEmisionId, tipoComprobante]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `No se encontró configuración de secuencial para el tipo de comprobante ${tipoComprobante}`
                },
                { status: 404 }
            );
        }

        const secuencial = result.rows[0];
        const secuencialFormateado = secuencial.secuencial_actual.toString().padStart(9, '0');

        return NextResponse.json({
            success: true,
            secuencial: secuencialFormateado,
            secuencialNumero: secuencial.secuencial_actual,
            tipoComprobante: tipoComprobante
        });

    } catch (error: any) {
        console.error('Error al obtener siguiente secuencial:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Error al obtener siguiente secuencial'
            },
            { status: 500 }
        );
    }
}
