import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/compras/descarga-robot/comprobantes
 * Lista comprobantes descargados del SRI con filtros
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const anio = url.searchParams.get('anio');
        const mes = url.searchParams.get('mes');
        const tipo = url.searchParams.get('tipo');
        const estado = url.searchParams.get('estado');
        const busqueda = url.searchParams.get('busqueda');
        const limite = parseInt(url.searchParams.get('limite') || '50');

        let whereConditions = ['cd.empresa_id = $1'];
        const values: any[] = [context.empresaId];
        let paramIndex = 2;

        if (anio) {
            whereConditions.push(`EXTRACT(YEAR FROM cd.fecha_emision) = $${paramIndex++}`);
            values.push(parseInt(anio));
        }
        if (mes) {
            whereConditions.push(`EXTRACT(MONTH FROM cd.fecha_emision) = $${paramIndex++}`);
            values.push(parseInt(mes));
        }
        if (tipo) {
            whereConditions.push(`cd.tipo_comprobante = $${paramIndex++}`);
            values.push(tipo);
        }
        if (estado) {
            whereConditions.push(`cd.estado = $${paramIndex++}`);
            values.push(estado);
        }
        if (busqueda) {
            whereConditions.push(`(cd.ruc_emisor ILIKE $${paramIndex} OR cd.razon_social_emisor ILIKE $${paramIndex} OR cd.numero_comprobante ILIKE $${paramIndex})`);
            values.push(`%${busqueda}%`);
            paramIndex++;
        }

        const result = await db.query(
            {
                text: `
                    SELECT 
                        cd.id,
                        cd.empresa_id AS "empresaId",
                        cd.descarga_id AS "descargaId",
                        cd.clave_acceso AS "claveAcceso",
                        cd.tipo_comprobante AS "tipoComprobante",
                        cd.ruc_emisor AS "rucEmisor",
                        cd.razon_social_emisor AS "razonSocialEmisor",
                        cd.numero_comprobante AS "numeroComprobante",
                        to_char(cd.fecha_emision, 'YYYY-MM-DD') AS "fechaEmision",
                        cd.monto_total AS "montoTotal",
                        cd.estado,
                        cd.compra_id AS "compraId",
                        cd.created_at AS "createdAt"
                    FROM compras.comprobantes_descargados cd
                    WHERE ${whereConditions.join(' AND ')}
                    ORDER BY cd.fecha_emision DESC, cd.created_at DESC
                    LIMIT $${paramIndex}
                `,
                values: [...values, limite]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar comprobantes descargados:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PATCH /api/compras/descarga-robot/comprobantes
 * Actualiza el estado de un comprobante descargado
 */
export async function PATCH(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const { id, estado } = await req.json();

        if (!id || !estado) {
            return NextResponse.json({ error: 'Se requiere id y estado' }, { status: 400 });
        }

        if (!['NUEVO', 'PROCESADO', 'IGNORADO'].includes(estado)) {
            return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
        }

        await db.query(
            {
                text: `UPDATE compras.comprobantes_descargados 
                    SET estado = $1, updated_at = NOW() 
                    WHERE id = $2 AND empresa_id = $3`,
                values: [estado, id, context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error al actualizar comprobante:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
