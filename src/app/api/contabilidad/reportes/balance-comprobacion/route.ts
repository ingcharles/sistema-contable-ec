import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

/**
 * GET /api/contabilidad/reportes/balance-comprobacion
 * Genera el Balance de Comprobación de Sumas y Saldos
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const desde = searchParams.get('desde') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const hasta = searchParams.get('hasta') || new Date().toISOString().split('T')[0];
    const nivel = parseInt(searchParams.get('nivel') || '4');

    try {
        const result = await db.query({
            text: `
                SELECT 
                    pc.codigo,
                    pc.nombre,
                    COALESCE(SUM(CASE WHEN a.fecha < $2 THEN ad.debe - ad.haber ELSE 0 END), 0) as inicial,
                    COALESCE(SUM(CASE WHEN a.fecha BETWEEN $2 AND $3 THEN ad.debe ELSE 0 END), 0) as debe,
                    COALESCE(SUM(CASE WHEN a.fecha BETWEEN $2 AND $3 THEN ad.haber ELSE 0 END), 0) as haber,
                    COALESCE(SUM(CASE WHEN a.fecha <= $3 THEN ad.debe - ad.haber ELSE 0 END), 0) as final
                FROM contabilidad.plan_cuentas pc
                LEFT JOIN contabilidad.asientos_detalles ad ON pc.codigo = ad.cuenta_codigo
                LEFT JOIN contabilidad.asientos a ON ad.asiento_id = a.id AND a.estado = 'MAYORIZADO'
                WHERE pc.empresa_id = $1 AND pc.nivel <= $4
                GROUP BY pc.codigo, pc.nombre
                HAVING 
                    SUM(CASE WHEN a.fecha <= $3 THEN ABS(ad.debe) + ABS(ad.haber) ELSE 0 END) > 0
                ORDER BY pc.codigo
            `,
            values: [context.empresaId, desde, hasta, nivel]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json(result.rows.map(r => ({
            codigo: r.codigo,
            nombre: r.nombre,
            inicial: parseFloat(r.inicial),
            debe: parseFloat(r.debe),
            haber: parseFloat(r.haber),
            final: parseFloat(r.final)
        })));
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
