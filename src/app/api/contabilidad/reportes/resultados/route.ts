import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

/**
 * GET /api/contabilidad/reportes/resultados
 * Genera el Estado de Resultados real desde la DB
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const desde = searchParams.get('desde') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const hasta = searchParams.get('hasta') || new Date().toISOString().split('T')[0];

    try {
        const result = await db.query({
            text: `
                SELECT 
                    LEFT(pc.codigo, 1) as clase,
                    pc.nombre,
                    pc.codigo,
                    SUM(ad.haber - ad.debe) as saldo_acreedor,
                    SUM(ad.debe - ad.haber) as saldo_deudor
                FROM contabilidad.plan_cuentas pc
                JOIN contabilidad.asientos_detalles ad ON pc.codigo = ad.cuenta_codigo
                JOIN contabilidad.asientos a ON ad.asiento_id = a.id
                WHERE a.empresa_id = $1 
                  AND a.fecha BETWEEN $2 AND $3
                  AND a.estado = 'MAYORIZADO'
                  AND LEFT(pc.codigo, 1) IN ('4', '5', '6')
                GROUP BY LEFT(pc.codigo, 1), pc.nombre, pc.codigo
                ORDER BY pc.codigo
            `,
            values: [context.empresaId, desde, hasta]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        let ingresos = 0;
        let costos = 0;
        let gastos = 0;

        result.rows.forEach(r => {
            const clase = r.clase;
            const saldo = parseFloat(r.saldo_acreedor); // Ingresos son acreedores
            const saldoD = parseFloat(r.saldo_deudor); // Gastos/Costos son deudores

            if (clase === '4') ingresos += saldo;
            if (clase === '5') costos += saldoD;
            if (clase === '6') gastos += saldoD;
        });

        const utilidadOperativa = ingresos - costos - gastos;

        return NextResponse.json({
            periodo: { desde, hasta },
            ingresos: { codigo: '4', nombre: 'INGRESOS', saldo: ingresos },
            costos: { codigo: '5', nombre: 'COSTOS', saldo: costos },
            gastos: { codigo: '6', nombre: 'GASTOS', saldo: gastos },
            utilidadOperativa,
            utilidadNeta: utilidadOperativa // Simplificado sin impuestos/participación por ahora
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
