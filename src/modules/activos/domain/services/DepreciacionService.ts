import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * Servicio para cálculo automático de depreciación de activos fijos
 * Método: Línea Recta
 */
export class DepreciacionService {

    /**
     * Calcula y registra la depreciación mensual de todos los activos activos
     * @param empresaId ID de la empresa
     * @param periodo Periodo en formato YYYY-MM
     * @param usuarioId Usuario que ejecuta
     * @returns Resumen del proceso
     */
    static async calcularDepreciacionMensual(empresaId: string, periodo: string, usuarioId: string) {
        const [anio, mes] = periodo.split('-');
        const fechaAsiento = `${anio}-${mes}-${new Date(Number(anio), Number(mes), 0).getDate()}`; // Último día del mes

        // 1. Obtener activos activos (en uso) que deben depreciarse
        const activosResult = await db.querySimple<any>({
            text: `
                SELECT 
                    id, codigo, nombre, categoria,
                    fecha_adquisicion, valor_adquisicion, valor_residual,
                    vida_util_meses, depreciacion_acumulada, valor_libros
                FROM activos.activos_fijos
                WHERE empresa_id = $1 
                AND estado = 'EN_USO'
                AND vida_util_meses > 0
                AND depreciacion_acumulada < (valor_adquisicion - valor_residual)
            `,
            values: [empresaId]
        });

        if (activosResult.rows.length === 0) {
            return {
                success: true,
                mensaje: 'No hay activos para depreciar en este periodo',
                activosDepreciados: 0,
                totalDepreciacion: 0
            };
        }

        // 2. Calcular depreciación de cada activo
        const detallesDepreciacion: any[] = [];
        let totalDepreciacionMes = 0;

        for (const activo of activosResult.rows) {
            const valorDepreciable = Number(activo.valor_adquisicion) - Number(activo.valor_residual);
            const depreciacionMensual = valorDepreciable / Number(activo.vida_util_meses);

            // Validar que no exceda el valor depreciable

            const depreciacionReal = Math.min(depreciacionMensual, valorDepreciable - Number(activo.depreciacion_acumulada));

            if (depreciacionReal > 0) {
                detallesDepreciacion.push({
                    activoId: activo.id,
                    codigo: activo.codigo,
                    nombre: activo.nombre,
                    categoria: activo.categoria,
                    depreciacionMensual: depreciacionReal,
                    nuevaDepreciacionAcumulada: Number(activo.depreciacion_acumulada) + depreciacionReal,
                    nuevoValorLibros: Number(activo.valor_adquisicion) - (Number(activo.depreciacion_acumulada) + depreciacionReal)
                });

                totalDepreciacionMes += depreciacionReal;
            }
        }

        if (detallesDepreciacion.length === 0) {
            return {
                success: true,
                mensaje: 'Todos los activos ya están completamente depreciados',
                activosDepreciados: 0,
                totalDepreciacion: 0
            };
        }

        // 3. Generar asiento contable y actualizar activos en transacción
        await db.transaction(async (client) => {
            // 3.1 Crear asiento contable
            const asientoResult = await client.query(`
                INSERT INTO contabilidad.asientos (
                    empresa_id, usuario_id, numero, fecha, glosa, tipo, estado, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, 'DIARIO', 'MAYORIZADO', NOW(), NOW()
                ) RETURNING id
            `, [
                empresaId, usuarioId,
                `DEP-${periodo}`,
                fechaAsiento,
                `Depreciación de Activos Fijos - Periodo ${periodo}`
            ]);

            const asientoId = asientoResult.rows[0].id;

            // 3.2 Detalle del asiento (agrupado por categoría)
            const porCategoria = this.agruparPorCategoria(detallesDepreciacion);

            for (const [categoria, datos] of Object.entries(porCategoria)) {
                const totalCategoria = (datos as any).total;
                const cuentaGasto = this.obtenerCuentaGastoDepreciacion(categoria);
                const cuentaDepAcumulada = this.obtenerCuentaDepreciacionAcumulada(categoria);

                // DEBE: Gasto por Depreciación
                await client.query(`
                    INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto)
                    VALUES ($1, $2, $3, 0, $4)
                `, [asientoId, cuentaGasto, totalCategoria, `Depreciación ${categoria}`]);

                // HABER: Depreciación Acumulada
                await client.query(`
                    INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto)
                    VALUES ($1, $2, 0, $3, $4)
                `, [asientoId, cuentaDepAcumulada, totalCategoria, `Dep. Acumulada ${categoria}`]);
            }

            // 3.3 Actualizar cada activo
            for (const detalle of detallesDepreciacion) {
                await client.query(`
                    UPDATE activos.activos_fijos
                    SET depreciacion_acumulada = $1,
                        valor_libros = $2,
                        updated_at = NOW()
                    WHERE id = $3
                `, [detalle.nuevaDepreciacionAcumulada, detalle.nuevoValorLibros, detalle.activoId]);
            }

        }, { empresaId, usuarioId });

        return {
            success: true,
            mensaje: `Depreciación calculada exitosamente para ${detallesDepreciacion.length} activos`,
            activosDepreciados: detallesDepreciacion.length,
            totalDepreciacion: totalDepreciacionMes,
            detalles: detallesDepreciacion
        };
    }

    /**
     * Agrupa depreciaciones por categoría de activo
     */
    private static agruparPorCategoria(detalles: any[]): Record<string, any> {
        const agrupado: Record<string, any> = {};

        for (const detalle of detalles) {
            const cat = detalle.categoria || 'OTROS';
            if (!agrupado[cat]) {
                agrupado[cat] = { total: 0, activos: [] };
            }
            agrupado[cat].total += detalle.depreciacionMensual;
            agrupado[cat].activos.push(detalle);
        }

        return agrupado;
    }

    /**
     * Obtiene cuenta contable de gasto por depreciación según categoría
     */
    private static obtenerCuentaGastoDepreciacion(categoria: string): string {
        const mapeo: Record<string, string> = {
            'EDIFICIOS': '5.2.01.01',
            'MUEBLES_ENSERES': '5.2.01.02',
            'MAQUINARIA': '5.2.01.03',
            'EQUIPOS_COMPUTO': '5.2.01.04',
            'VEHICULOS': '5.2.01.05',
            'OTROS': '5.2.01.99'
        };
        return mapeo[categoria] || mapeo['OTROS'];
    }

    /**
     * Obtiene cuenta contable de depreciación acumulada según categoría
     */
    private static obtenerCuentaDepreciacionAcumulada(categoria: string): string {
        const mapeo: Record<string, string> = {
            'EDIFICIOS': '1.2.01.01',
            'MUEBLES_ENSERES': '1.2.01.02',
            'MAQUINARIA': '1.2.01.03',
            'EQUIPOS_COMPUTO': '1.2.01.04',
            'VEHICULOS': '1.2.01.05',
            'OTROS': '1.2.01.99'
        };
        return mapeo[categoria] || mapeo['OTROS'];
    }
}
