import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/dashboard/stats
 * Obtiene estadísticas reales para el dashboard
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const empresaId = context.empresaId;
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];

        // 1. Total Ventas del Mes (Facturas emitidas autorizadas o autorizadas en este mes)
        const ventasResult = await db.query({
            text: `
                SELECT COALESCE(SUM(c.total), 0) as total 
                FROM facturacion.comprobantes_electronicos c
                JOIN configuracion.catalogos_items ci ON c.tipo_comprobante_id = ci.id
                WHERE c.empresa_id = $1 
                AND ci.codigo = '01' 
                AND c.estado IN ('AUTORIZADO')
                AND c.fecha_emision >= $2 AND c.fecha_emision <= $3
            `,
            values: [empresaId, inicioMes, finMes]
        }, { empresaId: empresaId!, usuarioId: context.usuarioId! });

        // 2. Total Compras del Mes
        const comprasResult = await db.query({
            text: `
                SELECT COALESCE(SUM(total), 0) as total 
                FROM compras.compras 
                WHERE empresa_id = $1 
                AND fecha_emision >= $2 AND fecha_emision <= $3
            `,
            values: [empresaId, inicioMes, finMes]
        }, { empresaId: empresaId!, usuarioId: context.usuarioId! });

        // 3. Saldo en Bancos (Suma de saldos de todas las cuentas)
        const bancosResult = await db.query({
            text: `
                SELECT COALESCE(SUM(saldo_actual), 0) as total 
                FROM bancos.bancos_cuentas 
                WHERE empresa_id = $1 AND activa = true
            `,
            values: [empresaId]
        }, { empresaId: empresaId!, usuarioId: context.usuarioId! });

        // 4. Cartera Pendiente (CXC Total)
        const carteraResult = await db.query({
            text: `
                SELECT COALESCE(SUM(saldo_pendiente), 0) as total 
                FROM cartera.cartera_documentos 
                WHERE empresa_id = $1 AND tipo_cartera = 'CXC'
            `,
            values: [empresaId]
        }, { empresaId: empresaId!, usuarioId: context.usuarioId! });

        // 5. Total Nómina del Mes (Costo Total para la Empresa)
        const nominaResult = await db.query({
            text: `
                SELECT 
                    COALESCE(SUM(neto_pagar), 0) as neto,
                    COALESCE(SUM(aporte_patronal + decimo_tercero + decimo_cuarto + fondos_reserva + vacaciones), 0) as beneficios
                FROM nomina.nomina_roles 
                WHERE empresa_id = $1 AND periodo = $2
            `,
            values: [empresaId, hoy.toISOString().slice(0, 7)]
        }, { empresaId: empresaId!, usuarioId: context.usuarioId! });

        const costoTotalNomina = parseFloat(nominaResult.rows[0].neto) + parseFloat(nominaResult.rows[0].beneficios);

        // 6. Datos para el gráfico (últimos 6 meses)
        const graficoResult = await db.query({
            text: `
                WITH meses AS (
                    SELECT date_trunc('month', generate_series(
                        current_date - interval '5 months', 
                        current_date, 
                        '1 month'::interval
                    )) as mes
                )
                SELECT 
                    to_char(m.mes, 'Mon') as name,
                    (
                        SELECT COALESCE(SUM(c.total), 0) 
                        FROM facturacion.comprobantes_electronicos c
                        JOIN configuracion.catalogos_items ci ON c.tipo_comprobante_id = ci.id
                        WHERE c.empresa_id = $1 
                        AND ci.codigo = '01' 
                        AND date_trunc('month', c.fecha_emision) = m.mes 
                        AND c.estado IN ('AUTORIZADO', 'BORRADOR')
                    ) as ingresos,
                    (SELECT COALESCE(SUM(total), 0) FROM compras.compras WHERE empresa_id = $1 AND date_trunc('month', fecha_emision) = m.mes) as compras,
                    (SELECT COALESCE(SUM(neto_pagar + aporte_patronal + decimo_tercero + decimo_cuarto + fondos_reserva + vacaciones), 0) FROM nomina.nomina_roles WHERE empresa_id = $1 AND periodo = to_char(m.mes, 'YYYY-MM')) as nomina
                FROM meses m
                ORDER BY m.mes ASC
            `,
            values: [empresaId]
        }, { empresaId: empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            ventasMes: parseFloat(ventasResult.rows[0].total),
            comprasMes: parseFloat(comprasResult.rows[0].total),
            nominaMes: costoTotalNomina,
            saldoBancos: parseFloat(bancosResult.rows[0].total),
            carteraPendiente: parseFloat(carteraResult.rows[0].total),
            graficoLiquidez: graficoResult.rows.map(r => ({
                name: r.name,
                ingresos: parseFloat(r.ingresos),
                egresos: parseFloat(r.compras) + parseFloat(r.nomina),
                compras: parseFloat(r.compras),
                nomina: parseFloat(r.nomina)
            }))
        });

    } catch (error: any) {
        console.error('Error al obtener estadísticas del dashboard:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
