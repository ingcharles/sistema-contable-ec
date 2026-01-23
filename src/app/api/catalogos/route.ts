import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

/**
 * GET /api/catalogos
 * Recibe un array de códigos de catálogo y devuelve sus items.
 * Ejemplo: /api/catalogos?codigos=SRI_TIPO_COMPROBANTE,SRI_FORMA_PAGO
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const url = new URL(req.url);
        const codigosParam = url.searchParams.get('codigos');

        if (!codigosParam) {
            // Si no pide específicos, devolvemos la lista de tipos disponibles
            const tiposResult = await db.querySimple({
                text: 'SELECT codigo, nombre FROM configuracion.catalogos_tipos WHERE activo = true ORDER BY nombre'
                // NOTE: catalogos_tipos may need schema prefix if schema is defined
            });
            return NextResponse.json(tiposResult.rows);
        }

        const codigos = codigosParam.split(',').map(c => c.trim());

        const itemsResult = await db.querySimple({
            text: `
                SELECT catalogo_codigo, codigo, valor, descripcion, orden
                FROM configuracion.catalogos_items 
                WHERE catalogo_codigo = ANY($1) 
                AND activo = true
                ORDER BY catalogo_codigo, orden, valor
            `,
            values: [codigos]
        });

        // Agrupar por tipo de catálogo para facilitar consumo en frontend
        const respuesta: Record<string, any[]> = {};

        codigos.forEach(c => respuesta[c] = []);

        itemsResult.rows.forEach(item => {
            if (respuesta[item.catalogo_codigo]) {
                respuesta[item.catalogo_codigo].push({
                    codigo: item.codigo,
                    valor: item.valor,
                    descripcion: item.descripcion
                });
            }
        });

        return NextResponse.json(respuesta);

    } catch (error: any) {
        console.error('Error al obtener catálogos:', error);
        return NextResponse.json(
            { error: 'Error interno al consultar catálogos' },
            { status: 500 }
        );
    }
}
