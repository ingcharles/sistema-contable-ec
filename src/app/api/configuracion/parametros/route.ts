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
                        p.*,
                        ci.codigo as iva_codigo,
                        ci.valor as iva_etiqueta,
                        ci.valor_numerico as iva_valor
                    FROM configuracion.parametros p
                    LEFT JOIN configuracion.catalogos_items ci ON p.iva_catalogo_item_id = ci.id
                    WHERE p.empresa_id = $1
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
                // Nómina
                cuentaSueldos: '5.1.01.01',
                cuentaAportePatronal: '5.1.01.02',
                cuentaDecimoTercero: '5.1.01.03',
                cuentaDecimoCuarto: '5.1.01.04',
                cuentaIessPorPagar: '2.1.03.01',
                cuentaSueldosPorPagar: '2.1.03.02',
                cuentaProvDecimoTercero: '2.1.03.03',
                cuentaProvDecimoCuarto: '2.1.03.04',
                // Caja Chica
                cuentaCajaChica: '1.1.01.02',
                cuentaGastosVarios: '5.2.01.99',
                // Inventario
                cuentaSobranteInventario: '4.2.01.01',
                cuentaFaltanteInventario: '5.2.01.01',
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
            // Nómina
            cuentaSueldos: row.cuenta_sueldos || '5.1.01.01',
            cuentaAportePatronal: row.cuenta_aporte_patronal || '5.1.01.02',
            cuentaDecimoTercero: row.cuenta_decimo_tercero || '5.1.01.03',
            cuentaDecimoCuarto: row.cuenta_decimo_cuarto || '5.1.01.04',
            cuentaIessPorPagar: row.cuenta_iess_por_pagar || '2.1.03.01',
            cuentaSueldosPorPagar: row.cuenta_sueldos_por_pagar || '2.1.03.02',
            cuentaProvDecimoTercero: row.cuenta_prov_decimo_tercero || '2.1.03.03',
            cuentaProvDecimoCuarto: row.cuenta_prov_decimo_cuarto || '2.1.03.04',
            // Caja Chica
            cuentaCajaChica: row.cuenta_caja_chica || '1.1.01.02',
            cuentaGastosVarios: row.cuenta_gastos_varios || '5.2.01.99',
            // Inventario
            cuentaSobranteInventario: row.cuenta_sobrante_inventario || '4.2.01.01',
            cuentaFaltanteInventario: row.cuenta_faltante_inventario || '5.2.01.01',
            fechaCierre: row.fecha_cierre,
            ivaValor: row.iva_valor ? Number(row.iva_valor) : 15, // Default to 15 if not set
            ivaCodigo: row.iva_codigo || '4',
            ivaEtiqueta: row.iva_etiqueta || '15%'
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
            fechaCierre,
            cuentaSueldos, cuentaAportePatronal, cuentaDecimoTercero, cuentaDecimoCuarto,
            cuentaIessPorPagar, cuentaSueldosPorPagar, cuentaProvDecimoTercero, cuentaProvDecimoCuarto,
            cuentaCajaChica, cuentaGastosVarios, cuentaSobranteInventario, cuentaFaltanteInventario
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
                        cuenta_descuento_ventas, fecha_cierre,
                        cuenta_sueldos, cuenta_aporte_patronal, cuenta_decimo_tercero,
                        cuenta_decimo_cuarto, cuenta_iess_por_pagar, cuenta_sueldos_por_pagar,
                        cuenta_prov_decimo_tercero, cuenta_prov_decimo_cuarto,
                        cuenta_caja_chica, cuenta_gastos_varios,
                        cuenta_sobrante_inventario, cuenta_faltante_inventario,
                        updated_at, updated_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, NOW(), $34)
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
                        cuenta_sueldos = EXCLUDED.cuenta_sueldos,
                        cuenta_aporte_patronal = EXCLUDED.cuenta_aporte_patronal,
                        cuenta_decimo_tercero = EXCLUDED.cuenta_decimo_tercero,
                        cuenta_decimo_cuarto = EXCLUDED.cuenta_decimo_cuarto,
                        cuenta_iess_por_pagar = EXCLUDED.cuenta_iess_por_pagar,
                        cuenta_sueldos_por_pagar = EXCLUDED.cuenta_sueldos_por_pagar,
                        cuenta_prov_decimo_tercero = EXCLUDED.cuenta_prov_decimo_tercero,
                        cuenta_prov_decimo_cuarto = EXCLUDED.cuenta_prov_decimo_cuarto,
                        cuenta_caja_chica = EXCLUDED.cuenta_caja_chica,
                        cuenta_gastos_varios = EXCLUDED.cuenta_gastos_varios,
                        cuenta_sobrante_inventario = EXCLUDED.cuenta_sobrante_inventario,
                        cuenta_faltante_inventario = EXCLUDED.cuenta_faltante_inventario,
                        updated_at = NOW(),
                        updated_by = EXCLUDED.updated_by
                `,
                values: [
                    context.empresaId, sbu, ivaCatalogoItemId, maxConsumidorFinal, cuentaCaja, cuentaIvaVentas,
                    cuentaIvaCompras, cuentaRetRentaPorPagar, cuentaCxcClientes,
                    cuentaAnticipoClientes, cuentaCxpProveedores, cuentaAnticipoProveedores,
                    cuentaVentas, cuentaDevolucionVentas, cuentaCompras, cuentaInventario,
                    cuentaIvaPorPagar, cuentaRetIvaPorPagar, cuentaCostoVentas, cuentaDescuentoVentas,
                    fechaCierre,
                    cuentaSueldos, cuentaAportePatronal, cuentaDecimoTercero, cuentaDecimoCuarto,
                    cuentaIessPorPagar, cuentaSueldosPorPagar, cuentaProvDecimoTercero, cuentaProvDecimoCuarto,
                    cuentaCajaChica, cuentaGastosVarios, cuentaSobranteInventario, cuentaFaltanteInventario,
                    context.usuarioId
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
