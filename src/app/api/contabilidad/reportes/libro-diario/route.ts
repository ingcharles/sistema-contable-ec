import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

/**
 * GET /api/contabilidad/reportes/libro-diario
 * Lista todos los asientos contables detallados en un rango de fechas.
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');
    const centroCostoId = searchParams.get('centroCostoId');

    try {
        let whereConditions = ['a.empresa_id = $1', "a.estado = 'MAYORIZADO'"];
        let values: any[] = [context.empresaId];
        let paramIndex = 2;

        if (desde) {
            whereConditions.push(`a.fecha >= $${paramIndex}`);
            values.push(desde);
            paramIndex++;
        }
        if (hasta) {
            whereConditions.push(`a.fecha <= $${paramIndex}`);
            values.push(hasta);
            paramIndex++;
        }
        if (centroCostoId) {
            whereConditions.push(`ad.centro_costo_id = $${paramIndex}`);
            values.push(centroCostoId);
            paramIndex++;
        }

        const query = `
            SELECT 
                a.id as "asientoId", a.numero, a.fecha, a.glosa, a.tipo,
                ad.cuenta_codigo as "cuentaCodigo", pc.nombre as "cuentaNombre",
                ad.debe, ad.haber, ad.glosa as "detalleGlosa"
            FROM contabilidad.asientos a
            JOIN contabilidad.asientos_detalles ad ON a.id = ad.asiento_id
            JOIN contabilidad.plan_cuentas pc ON ad.cuenta_codigo = pc.codigo AND pc.empresa_id = a.empresa_id
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY a.fecha, a.numero, ad.debe DESC
        `;

        const result = await db.query({ text: query, values }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        // Agrupar por asiento
        const asientosMap = new Map();
        result.rows.forEach(row => {
            if (!asientosMap.has(row.asientoId)) {
                asientosMap.set(row.asientoId, {
                    id: row.asientoId,
                    numero: row.numero,
                    fecha: row.fecha,
                    glosa: row.glosa,
                    tipo: row.tipo,
                    detalles: []
                });
            }
            asientosMap.get(row.asientoId).detalles.push({
                cuentaCodigo: row.cuentaCodigo,
                cuentaNombre: row.cuentaNombre,
                debe: parseFloat(row.debe),
                haber: parseFloat(row.haber),
                glosa: row.detalleGlosa
            });
        });

        return NextResponse.json(Array.from(asientosMap.values()));
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
