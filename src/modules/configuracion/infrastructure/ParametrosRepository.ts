
import { db } from '@/shared/infrastructure/database/postgresql';

export class ParametrosRepository {
    static async obtenerParametros(empresaId: string, usuarioId?: string) {
        const result = await db.query(
            { text: 'SELECT * FROM configuracion.parametros WHERE empresa_id = $1', values: [empresaId] },
            { empresaId, usuarioId: usuarioId || 'system' }
        );

        const row = result.rows[0];

        if (!row) return null;

        return {
            // Datos crudos para uso en queries SQL (snake_case)
            ...row,

            // Datos mapeados para validadores y lógica de negocio (camelCase) con valores por defecto
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

            // Nuevas cuentas con defaults
            cuentaVentas: row.cuenta_ventas,
            cuentaDevolucionVentas: row.cuenta_devolucion_ventas,
            cuentaCompras: row.cuenta_compras,
            cuentaInventario: row.cuenta_inventario,
            cuentaIvaPorPagar: row.cuenta_iva_por_pagar,
            cuentaRetIvaPorPagar: row.cuenta_ret_iva_por_pagar,
            cuentaCostoVentas: row.cuenta_costo_ventas,
            cuentaDescuentoVentas: row.cuenta_descuento_ventas,

            // Nómina
            cuentaSueldos: row.cuenta_sueldos,
            cuentaAportePatronal: row.cuenta_aporte_patronal,
            cuentaDecimoTercero: row.cuenta_decimo_tercero,
            cuentaDecimoCuarto: row.cuenta_decimo_cuarto,
            cuentaIessPorPagar: row.cuenta_iess_por_pagar,
            cuentaSueldosPorPagar: row.cuenta_sueldos_por_pagar,
            cuentaProvDecimoTercero: row.cuenta_prov_decimo_tercero,
            cuentaProvDecimoCuarto: row.cuenta_prov_decimo_cuarto,

            // Caja Chica
            cuentaCajaChica: row.cuenta_caja_chica,
            cuentaGastosVarios: row.cuenta_gastos_varios,

            // Inventario
            cuentaSobranteInventario: row.cuenta_sobrante_inventario,
            cuentaFaltanteInventario: row.cuenta_faltante_inventario,

            sriTipoEmision: row.sri_tipo_emision,
            fechaCierre: row.fecha_cierre
        };
    }
}
