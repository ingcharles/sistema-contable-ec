/**
 * Servicio centralizado para validar la configuración de parámetros contables
 * antes de permitir transacciones en diferentes módulos.
 */
export class ParametrosContablesValidator {

    /**
     * Valida si están configurados los parámetros necesarios para Ventas (Facturas/Nota Débito)
     */
    static validarVentas(params: any): { valido: boolean; error?: string } {
        const faltantes: string[] = [];
        if (!params.cuentaCxcClientes) faltantes.push('CXC Clientes');
        if (!params.cuentaVentas) faltantes.push('Ventas');
        if (!params.cuentaIvaPorPagar) faltantes.push('IVA por Pagar');

        if (faltantes.length > 0) {
            return {
                valido: false,
                error: `Faltan configurar parámetros de Ventas: ${faltantes.join(', ')}. Configure en Configuración -> Parámetros.`
            };
        }
        return { valido: true };
    }

    /**
     * Valida si están configurados los parámetros necesarios para Notas de Crédito (Ventas)
     */
    static validarNotaCredito(params: any): { valido: boolean; error?: string } {
        const faltantes: string[] = [];
        if (!params.cuentaCxcClientes) faltantes.push('CXC Clientes');
        if (!params.cuentaDevolucionVentas) faltantes.push('Devolución Ventas');
        if (!params.cuentaIvaPorPagar) faltantes.push('IVA por Pagar');

        if (faltantes.length > 0) {
            return {
                valido: false,
                error: `Faltan configurar parámetros de Notas de Crédito: ${faltantes.join(', ')}. Configure en Configuración -> Parámetros.`
            };
        }
        return { valido: true };
    }

    /**
     * Valida si están configurados los parámetros necesarios para Compras
     */
    static validarCompras(params: any): { valido: boolean; error?: string } {
        const faltantes: string[] = [];
        if (!params.cuentaCxpProveedores) faltantes.push('CXP Proveedores');
        if (!params.cuentaInventario && !params.cuentaCompras) faltantes.push('Inventario o Compras');
        if (!params.cuentaIvaCompras) faltantes.push('IVA Compras');

        if (faltantes.length > 0) {
            return {
                valido: false,
                error: `Faltan configurar parámetros de Compras: ${faltantes.join(', ')}. Configure en Configuración -> Parámetros.`
            };
        }
        return { valido: true };
    }

    /**
     * Valida si están configurados los parámetros necesarios para Nómina
     */
    static validarNomina(params: any): { valido: boolean; error?: string } {
        const faltantes: string[] = [];
        if (!params.cuentaSueldos) faltantes.push('Gasto Sueldos');
        if (!params.cuentaSueldosPorPagar) faltantes.push('Pasivo Sueldos');
        if (!params.cuentaIessPorPagar) faltantes.push('IESS por Pagar');
        if (!params.cuentaAportePatronal) faltantes.push('Aporte Patronal');

        if (faltantes.length > 0) {
            return {
                valido: false,
                error: `Faltan configurar parámetros de Nómina: ${faltantes.join(', ')}. Configure en Configuración -> Parámetros.`
            };
        }
        return { valido: true };
    }

    /**
     * Valida si están configurados los parámetros necesarios para Bancos
     */
    static validarBancos(params: any): { valido: boolean; error?: string } {
        if (!params.cuentaCaja) { // Usada como contrapartida por defecto
            return {
                valido: false,
                error: 'Falta configurar cuenta de Caja General (usada como contrapartida en bancos). Configure en Configuración -> Parámetros.'
            };
        }
        return { valido: true };
    }

    /**
     * Valida si están configurados los parámetros necesarios para Caja Chica
     */
    static validarCajaChica(params: any): { valido: boolean; error?: string } {
        const faltantes: string[] = [];
        if (!params.cuentaCajaChica) faltantes.push('Caja Chica');
        if (!params.cuentaGastosVarios) faltantes.push('Gastos Varios');

        if (faltantes.length > 0) {
            return {
                valido: false,
                error: `Faltan configurar parámetros de Caja Chica: ${faltantes.join(', ')}. Configure en Configuración -> Parámetros.`
            };
        }
        return { valido: true };
    }

    /**
     * Valida si están configurados los parámetros necesarios para Inventario (Kardex)
     */
    static validarInventario(params: any): { valido: boolean; error?: string } {
        const faltantes: string[] = [];
        if (!params.cuentaInventario) faltantes.push('Inventario');
        if (!params.cuentaSobranteInventario) faltantes.push('Sobrantes (Ingreso)');
        if (!params.cuentaFaltanteInventario) faltantes.push('Faltantes (Gasto)');

        if (faltantes.length > 0) {
            return {
                valido: false,
                error: `Faltan configurar parámetros de Inventario: ${faltantes.join(', ')}. Configure en Configuración -> Parámetros.`
            };
        }
        return { valido: true };
    }

    /**
     * Valida el cierre de periodo
     */
    static validarFechaCierre(params: any, fechaTransaccion: Date | string): { valido: boolean; error?: string } {
        if (!params.fechaCierre) return { valido: true };

        const fechaCierre = new Date(params.fechaCierre);
        const fechaTx = new Date(fechaTransaccion);

        if (fechaTx <= fechaCierre) {
            return {
                valido: false,
                error: `No puede registrar transacciones en un periodo cerrado (Cierre: ${fechaCierre.toLocaleDateString()}).`
            };
        }
        return { valido: true };
    }
}
