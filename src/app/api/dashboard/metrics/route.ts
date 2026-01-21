import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/dashboard/metrics
 * Obtiene métricas clave para el dashboard principal
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const result = await db.transaction(async (client) => {

            // 1. Ventas del día
            const ventasToday = await client.query(`
                SELECT COALESCE(SUM(total), 0) as total
                FROM facturacion.comprobantes_electronicos
                WHERE empresa_id = $1 
                AND tipo_comprobante = 'FACTURA'
                AND fecha_emision = CURRENT_DATE
                AND estado = 'AUTORIZADO'
            `, [context.empresaId]);

            // 2. Ventas del mes
            const ventasMonth = await client.query(`
                SELECT COALESCE(SUM(total), 0) as total
                FROM facturacion.comprobantes_electronicos
                WHERE empresa_id = $1 
                AND tipo_comprobante = 'FACTURA'
                AND estado = 'AUTORIZADO'
                AND date_trunc('month', fecha_emision) = date_trunc('month', CURRENT_DATE)
            `, [context.empresaId]);

            // 3. Cuentas por Cobrar (Vencidas)
            const carteraVencida = await client.query(`
                SELECT COALESCE(SUM(saldo_pendiente), 0) as total
                FROM cartera.documentos_pendientes
                WHERE empresa_id = $1 
                AND tipo_cartera = 'CXC'
                AND fecha_vencimiento < CURRENT_DATE
                AND saldo_pendiente > 0
            `, [context.empresaId]);

            // 4. Saldo Total en Bancos
            const bancosSaldo = await client.query(`
                SELECT COALESCE(SUM(saldo_actual), 0) as total
                FROM bancos.bancos_cuentas
                WHERE empresa_id = $1 AND activa = true
            `, [context.empresaId]);

            // 5. Productos con Stock Bajo
            const alertasStock = await client.query(`
                SELECT COUNT(*) as count
                FROM inventario.productos
                WHERE empresa_id = $1 
                AND stock_actual <= stock_minimo
                AND activo = true
            `, [context.empresaId]);

            return {
                ventasHoy: parseFloat(ventasToday.rows[0].total),
                ventasMes: parseFloat(ventasMonth.rows[0].total),
                carteraVencida: parseFloat(carteraVencida.rows[0].total),
                saldoBancos: parseFloat(bancosSaldo.rows[0].total),
                alertasStock: parseInt(alertasStock.rows[0].count)
            };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error al obtener métricas:', error);
        return NextResponse.json(
            { error: 'Error al cargar métricas del dashboard', details: error.message },
            { status: 500 }
        );
    }
}
