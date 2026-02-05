import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/configuracion/parametros
 * Obtiene los parámetros contables de la empresa
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const result = await db.query(
            {
                text: `
                    SELECT 
                        sbu, iva_catalogo_item_id, max_consumidor_final, cuenta_caja, cuenta_iva_ventas,
                        cuenta_iva_compras, cuenta_ret_renta_por_pagar, cuenta_cxc_clientes,
                        cuenta_anticipo_clientes, cuenta_cxp_proveedores, cuenta_anticipo_proveedores,
                        cuenta_ventas, cuenta_devolucion_ventas, cuenta_compras, cuenta_inventario,
                        cuenta_iva_por_pagar, cuenta_ret_iva_por_pagar, cuenta_costo_ventas,
                        cuenta_descuento_ventas, fecha_cierre
                    FROM configuracion.parametros
                    WHERE empresa_id = $1
                `,
                values: [context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (result.rowCount === 0) {
            // Valores por defecto si no existen
            return NextResponse.json({
                sbu: 460,
                ivaCatalogoItemId: null,
                maxConsumidorFinal: 50,
                cuentaCaja: '1.1.01.01',
                cuentaIvaVentas: '2.1.07.01',
                cuentaIvaCompras: '1.1.05.01',
                cuentaRetRentaPorPagar: '2.1.03.01',
                cuentaCxcClientes: '1.1.02.01',
                cuentaAnticipoClientes: '2.1.04.01',
                cuentaCxpProveedores: '2.1.01.01',
                cuentaAnticipoProveedores: '1.1.04.01',
                // Nuevas cuentas para asientos automáticos
                cuentaVentas: '4.1.01.01',
                cuentaDevolucionVentas: '4.1.01.02',
                cuentaCompras: '5.1.01.01',
                cuentaInventario: '1.1.03.01',
                cuentaIvaPorPagar: '2.1.05.01',
                cuentaRetIvaPorPagar: '2.1.03.02',
                cuentaCostoVentas: '5.1.01.01',
                cuentaDescuentoVentas: '4.1.01.03',
                fechaCierre: null
            });
        }

        const row = result.rows[0];
        // CamelCase mapping
        return NextResponse.json({
            sbu: Number(row.sbu),
            ivaCatalogoItemId: row.iva_catalogo_item_id,
            maxConsumidorFinal: Number(row.max_consumidor_final),
            cuentaCaja: row.cuenta_caja,
            cuentaIvaVentas: row.cuenta_iva_ventas,
            cuentaIvaCompras: row.cuenta_iva_compras,
            cuentaRetRentaPorPagar: row.cuenta_ret_renta_por_pagar,
            cuentaCxcClientes: row.cuenta_cxc_clientes,
            cuentaAnticipoClientes: row.cuenta_anticipo_clientes,
            cuentaCxpProveedores: row.cuenta_cxp_proveedores,
            cuentaAnticipoProveedores: row.cuenta_anticipo_proveedores,
            // Nuevas cuentas
            cuentaVentas: row.cuenta_ventas || '4.1.01.01',
            cuentaDevolucionVentas: row.cuenta_devolucion_ventas || '4.1.01.02',
            cuentaCompras: row.cuenta_compras || '5.1.01.01',
            cuentaInventario: row.cuenta_inventario || '1.1.03.01',
            cuentaIvaPorPagar: row.cuenta_iva_por_pagar || '2.1.05.01',
            cuentaRetIvaPorPagar: row.cuenta_ret_iva_por_pagar || '2.1.03.02',
            cuentaCostoVentas: row.cuenta_costo_ventas || '5.1.01.01',
            cuentaDescuentoVentas: row.cuenta_descuento_ventas || '4.1.01.03',
            fechaCierre: row.fecha_cierre
        });

    } catch (error: any) {
        console.error('Error al obtener parametros:', error);
        return NextResponse.json({ error: 'Error al consultar parámetros', details: error.message }, { status: 500 });
    }
}

/**
 * POST /api/configuracion/parametros
 * Guarda o actualiza los parámetros contables
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            sbu, ivaCatalogoItemId, maxConsumidorFinal, cuentaCaja, cuentaIvaVentas,
            cuentaIvaCompras, cuentaRetRentaPorPagar, cuentaCxcClientes,
            cuentaAnticipoClientes, cuentaCxpProveedores, cuentaAnticipoProveedores,
            cuentaVentas, cuentaDevolucionVentas, cuentaCompras, cuentaInventario,
            cuentaIvaPorPagar, cuentaRetIvaPorPagar, cuentaCostoVentas, cuentaDescuentoVentas,
            fechaCierre
        } = body;

        await db.query(
            {
                text: `
                    INSERT INTO configuracion.parametros (
                        empresa_id, sbu, iva_catalogo_item_id, max_consumidor_final, cuenta_caja, cuenta_iva_ventas,
                        cuenta_iva_compras, cuenta_ret_renta_por_pagar, cuenta_cxc_clientes,
                        cuenta_anticipo_clientes, cuenta_cxp_proveedores, cuenta_anticipo_proveedores,
                        cuenta_ventas, cuenta_devolucion_ventas, cuenta_compras, cuenta_inventario,
                        cuenta_iva_por_pagar, cuenta_ret_iva_por_pagar, cuenta_costo_ventas,
                        cuenta_descuento_ventas, fecha_cierre, updated_at, updated_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), $22)
                    ON CONFLICT (empresa_id) DO UPDATE SET
                        sbu = EXCLUDED.sbu,
                        iva_catalogo_item_id = EXCLUDED.iva_catalogo_item_id,
                        max_consumidor_final = EXCLUDED.max_consumidor_final,
                        cuenta_caja = EXCLUDED.cuenta_caja,
                        cuenta_iva_ventas = EXCLUDED.cuenta_iva_ventas,
                        cuenta_iva_compras = EXCLUDED.cuenta_iva_compras,
                        cuenta_ret_renta_por_pagar = EXCLUDED.cuenta_ret_renta_por_pagar,
                        cuenta_cxc_clientes = EXCLUDED.cuenta_cxc_clientes,
                        cuenta_anticipo_clientes = EXCLUDED.cuenta_anticipo_clientes,
                        cuenta_cxp_proveedores = EXCLUDED.cuenta_cxp_proveedores,
                        cuenta_anticipo_proveedores = EXCLUDED.cuenta_anticipo_proveedores,
                        cuenta_ventas = EXCLUDED.cuenta_ventas,
                        cuenta_devolucion_ventas = EXCLUDED.cuenta_devolucion_ventas,
                        cuenta_compras = EXCLUDED.cuenta_compras,
                        cuenta_inventario = EXCLUDED.cuenta_inventario,
                        cuenta_iva_por_pagar = EXCLUDED.cuenta_iva_por_pagar,
                        cuenta_ret_iva_por_pagar = EXCLUDED.cuenta_ret_iva_por_pagar,
                        cuenta_costo_ventas = EXCLUDED.cuenta_costo_ventas,
                        cuenta_descuento_ventas = EXCLUDED.cuenta_descuento_ventas,
                        fecha_cierre = EXCLUDED.fecha_cierre,
                        updated_at = NOW(),
                        updated_by = EXCLUDED.updated_by
                `,
                values: [
                    context.empresaId, sbu, ivaCatalogoItemId, maxConsumidorFinal, cuentaCaja, cuentaIvaVentas,
                    cuentaIvaCompras, cuentaRetRentaPorPagar, cuentaCxcClientes,
                    cuentaAnticipoClientes, cuentaCxpProveedores, cuentaAnticipoProveedores,
                    cuentaVentas, cuentaDevolucionVentas, cuentaCompras, cuentaInventario,
                    cuentaIvaPorPagar, cuentaRetIvaPorPagar, cuentaCostoVentas, cuentaDescuentoVentas,
                    fechaCierre, context.usuarioId
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({ success: true, message: 'Parámetros guardados exitosamente' });
    } catch (error: any) {
        console.error('Error al guardar parametros:', error);
        return NextResponse.json({ error: 'Error al guardar parámetros', details: error.message }, { status: 500 });
    }
}
