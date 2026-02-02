import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

/**
 * GET /api/contabilidad/reportes/flujo-efectivo
 * Genera el Estado de Flujo de Efectivo (Simplificado)
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const desde = searchParams.get('desde') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const hasta = searchParams.get('hasta') || new Date().toISOString().split('T')[0];

    try {
        // Consultar movimientos de efectivo agrupados por concepto (basado en glosa o tipo de asiento)
        // En una implementación madura, esto usaría categorías de flujo de efectivo asignadas a las cuentas
        const result = await db.query({
            text: `
                WITH movimientos_efectivo AS (
                    SELECT 
                        ad.debe,
                        ad.haber,
                        a.glosa,
                        a.tipo,
                        ad.cuenta_codigo
                    FROM contabilidad.asientos_detalles ad
                    JOIN contabilidad.asientos a ON ad.asiento_id = a.id
                    WHERE a.empresa_id = $1 
                      AND a.fecha BETWEEN $2 AND $3
                      AND a.estado = 'MAYORIZADO'
                      AND ad.cuenta_codigo LIKE '1.1%' -- Filtro por grupo de disponible
                )
                SELECT 
                    'Salidas Operativas' as actividad,
                    SUM(haber - debe) as monto 
                FROM movimientos_efectivo 
                WHERE tipo IN ('EGRESO', 'DIARIO') AND haber > debe
                UNION ALL
                SELECT 
                    'Ingresos Operativos' as actividad,
                    SUM(debe - haber) as monto 
                FROM movimientos_efectivo 
                WHERE tipo IN ('INGRESO', 'DIARIO') AND debe > haber
            `,
            values: [context.empresaId, desde, hasta]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        // Cálculo de saldos iniciales y finales (simplificado para el demo)
        const saldosResult = await db.query({
            text: `
                SELECT 
                    SUM(CASE WHEN a.fecha < $2 THEN ad.debe - ad.haber ELSE 0 END) as inicial,
                    SUM(ad.debe - ad.haber) as final
                FROM contabilidad.asientos_detalles ad
                JOIN contabilidad.asientos a ON ad.asiento_id = a.id
                WHERE a.empresa_id = $1 
                  AND a.fecha <= $3
                  AND a.estado = 'MAYORIZADO'
                  AND ad.cuenta_codigo LIKE '1.1%'
            `,
            values: [context.empresaId, desde, hasta]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        const data = {
            periodo: { desde, hasta },
            actividadesOperacion: result.rows.map((r: any) => ({
                concepto: r.actividad,
                monto: parseFloat(r.monto || 0)
            })),
            actividadesInversion: [], // Requiere clasificación manual
            actividadesFinanciacion: [], // Requiere clasificación manual
            saldoInicial: parseFloat(saldosResult.rows[0]?.inicial || 0),
            saldoFinal: parseFloat(saldosResult.rows[0]?.final || 0)
        };

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
