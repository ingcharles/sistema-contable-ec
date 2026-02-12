import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

/**
 * GET /api/contabilidad/reportes/libro-mayor
 * Detalle de movimientos de una cuenta específica con saldo acumulado.
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');
    const cuentaCodigo = searchParams.get('cuentaCodigo');

    if (!cuentaCodigo) {
        return NextResponse.json({ error: 'cuentaCodigo es requerido' }, { status: 400 });
    }

    try {
        // 1. Obtener saldo inicial (anterior al rango)
        const saldoInicialResult = await db.query({
            text: `
                SELECT COALESCE(SUM(debe - haber), 0) as inicial
                FROM contabilidad.asientos_detalles ad
                JOIN contabilidad.asientos a ON ad.asiento_id = a.id
                WHERE a.empresa_id = $1 AND a.fecha < $2 AND a.estado = 'MAYORIZADO' AND ad.cuenta_codigo = $3
            `,
            values: [context.empresaId, desde, cuentaCodigo]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        const saldoInicial = parseFloat(saldoInicialResult.rows[0].inicial);

        // 2. Obtener movimientos en el rango
        const movimientosResult = await db.query({
            text: `
                SELECT 
                    a.fecha, a.numero, a.glosa as "asientoGlosa",
                    ad.debe, ad.haber, ad.glosa as "detalleGlosa"
                FROM contabilidad.asientos_detalles ad
                JOIN contabilidad.asientos a ON ad.asiento_id = a.id
                WHERE a.empresa_id = $1 
                  AND a.fecha BETWEEN $2 AND $3
                  AND a.estado = 'MAYORIZADO'
                  AND ad.cuenta_codigo = $4
                ORDER BY a.fecha, a.numero
            `,
            values: [context.empresaId, desde, hasta, cuentaCodigo]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        let saldoAcumulado = saldoInicial;
        const movimientos = movimientosResult.rows.map(m => {
            const debe = parseFloat(m.debe);
            const haber = parseFloat(m.haber);
            saldoAcumulado += (debe - haber);
            return {
                ...m,
                debe,
                haber,
                saldo: saldoAcumulado
            };
        });

        return NextResponse.json({
            cuentaCodigo,
            saldoInicial,
            movimientos,
            saldoFinal: saldoAcumulado
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
