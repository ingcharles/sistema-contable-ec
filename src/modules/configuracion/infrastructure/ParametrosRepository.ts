
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

            sriTipoEmision: row.sri_tipo_emision || '1',
            fechaCierre: row.fecha_cierre
        };
    }
}
