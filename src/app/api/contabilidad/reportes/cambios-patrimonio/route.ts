import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

/**
 * GET /api/contabilidad/reportes/cambios-patrimonio
 * Genera el Estado de Cambios en el Patrimonio
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const desde = searchParams.get('desde') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const hasta = searchParams.get('hasta') || new Date().toISOString().split('T')[0];

    try {
        // Consulta para obtener movimientos de cuentas de patrimonio (Clase 3)
        const result = await db.query({
            text: `
                SELECT 
                    pc.nombre as concepto,
                    SUM(CASE WHEN a.fecha < $2 THEN ad.haber - ad.debe ELSE 0 END) as inicial,
                    SUM(CASE WHEN a.fecha BETWEEN $2 AND $3 THEN ad.haber - ad.debe ELSE 0 END) as movimientos,
                    SUM(ad.haber - ad.debe) as final
                FROM contabilidad.plan_cuentas pc
                LEFT JOIN contabilidad.asientos_detalles ad ON pc.codigo = ad.cuenta_codigo
                LEFT JOIN contabilidad.asientos a ON ad.asiento_id = a.id AND a.estado = 'MAYORIZADO'
                WHERE pc.empresa_id = $1 
                  AND pc.codigo LIKE '3%' 
                  AND pc.acepta_movimiento = true
                GROUP BY pc.nombre, pc.codigo
                HAVING SUM(ad.haber - ad.debe) != 0 OR SUM(CASE WHEN a.fecha < $2 THEN ad.haber - ad.debe ELSE 0 END) != 0
                ORDER BY pc.codigo
            `,
            values: [context.empresaId, desde, hasta]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        const data = result.rows.map((r: any) => ({
            concepto: r.concepto,
            capital: r.concepto.toLowerCase().includes('capital') ? parseFloat(r.movimientos) : 0,
            reservas: r.concepto.toLowerCase().includes('reserva') ? parseFloat(r.movimientos) : 0,
            resultadosAcumulados: r.concepto.toLowerCase().includes('resultado') ? parseFloat(r.movimientos) : 0,
            total: parseFloat(r.final),
            saldos: {
                inicial: parseFloat(r.inicial),
                final: parseFloat(r.final)
            }
        }));

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
