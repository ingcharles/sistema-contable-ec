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
                        sbu, iva, max_consumidor_final, cuenta_caja, cuenta_iva_ventas,
                        cuenta_iva_compras, cuenta_ret_renta_por_pagar, cuenta_cxc_clientes,
                        cuenta_anticipo_clientes, cuenta_cxp_proveedores, cuenta_anticipo_proveedores,
                        fecha_cierre
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
                iva: 15,
                maxConsumidorFinal: 50,
                cuentaCaja: '1.1.01.01',
                cuentaIvaVentas: '2.1.07.01',
                cuentaIvaCompras: '1.1.05.01',
                cuentaRetRentaPorPagar: '2.1.03.01',
                cuentaCxcClientes: '1.1.02.01',
                cuentaAnticipoClientes: '2.1.04.01',
                cuentaCxpProveedores: '2.1.01.01',
                cuentaAnticipoProveedores: '1.1.04.01',
                fechaCierre: null
            });
        }

        const row = result.rows[0];
        // CamelCase mapping
        return NextResponse.json({
            sbu: Number(row.sbu),
            iva: Number(row.iva),
            maxConsumidorFinal: Number(row.max_consumidor_final),
            cuentaCaja: row.cuenta_caja,
            cuentaIvaVentas: row.cuenta_iva_ventas,
            cuentaIvaCompras: row.cuenta_iva_compras,
            cuentaRetRentaPorPagar: row.cuenta_ret_renta_por_pagar,
            cuentaCxcClientes: row.cuenta_cxc_clientes,
            cuentaAnticipoClientes: row.cuenta_anticipo_clientes,
            cuentaCxpProveedores: row.cuenta_cxp_proveedores,
            cuentaAnticipoProveedores: row.cuenta_anticipo_proveedores,
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
            sbu, iva, maxConsumidorFinal, cuentaCaja, cuentaIvaVentas,
            cuentaIvaCompras, cuentaRetRentaPorPagar, cuentaCxcClientes,
            cuentaAnticipoClientes, cuentaCxpProveedores, cuentaAnticipoProveedores,
            fechaCierre
        } = body;

        await db.query(
            {
                text: `
                    INSERT INTO configuracion.parametros (
                        empresa_id, sbu, iva, max_consumidor_final, cuenta_caja, cuenta_iva_ventas,
                        cuenta_iva_compras, cuenta_ret_renta_por_pagar, cuenta_cxc_clientes,
                        cuenta_anticipo_clientes, cuenta_cxp_proveedores, cuenta_anticipo_proveedores,
                        fecha_cierre, updated_at, updated_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14)
                    ON CONFLICT (empresa_id) DO UPDATE SET
                        sbu = EXCLUDED.sbu,
                        iva = EXCLUDED.iva,
                        max_consumidor_final = EXCLUDED.max_consumidor_final,
                        cuenta_caja = EXCLUDED.cuenta_caja,
                        cuenta_iva_ventas = EXCLUDED.cuenta_iva_ventas,
                        cuenta_iva_compras = EXCLUDED.cuenta_iva_compras,
                        cuenta_ret_renta_por_pagar = EXCLUDED.cuenta_ret_renta_por_pagar,
                        cuenta_cxc_clientes = EXCLUDED.cuenta_cxc_clientes,
                        cuenta_anticipo_clientes = EXCLUDED.cuenta_anticipo_clientes,
                        cuenta_cxp_proveedores = EXCLUDED.cuenta_cxp_proveedores,
                        cuenta_anticipo_proveedores = EXCLUDED.cuenta_anticipo_proveedores,
                        fecha_cierre = EXCLUDED.fecha_cierre,
                        updated_at = NOW(),
                        updated_by = EXCLUDED.updated_by
                `,
                values: [
                    context.empresaId, sbu, iva, maxConsumidorFinal, cuentaCaja, cuentaIvaVentas,
                    cuentaIvaCompras, cuentaRetRentaPorPagar, cuentaCxcClientes,
                    cuentaAnticipoClientes, cuentaCxpProveedores, cuentaAnticipoProveedores,
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
