import { db } from '@/shared/infrastructure/database/postgresql';

export class PeriodoService {
    /**
     * Valida si una fecha corresponde a un periodo contable abierto.
     * Si la fecha es menor o igual a la última fecha de cierre, lanza un error.
     * @param empresaId ID de la empresa
     * @param fecha ISO string (YYYY-MM-DD) o Date object
     */
    static async validarFecha(empresaId: string, fecha: string | Date): Promise<void> {
        const result = await db.querySimple<any>({
            text: `SELECT fecha_cierre FROM configuracion.parametros WHERE empresa_id = $1`,
            values: [empresaId]
        });

        const fechaCierreStr = result.rows[0]?.fecha_cierre;
        if (!fechaCierreStr) return; // No hay cierre definido, todo está abierto

        const fechaMovimiento = new Date(fecha);
        const fechaCierre = new Date(fechaCierreStr);

        // Resetear horas para comparar solo fechas
        fechaMovimiento.setHours(0, 0, 0, 0);
        // La fecha de cierre se asume al final del día o solo fecha
        fechaCierre.setHours(0, 0, 0, 0);

        if (fechaMovimiento.getTime() <= fechaCierre.getTime()) {
            throw new Error(`El periodo contable está cerrado hasta el ${fechaCierreStr}. No se permiten movimientos con fecha ${fechaMovimiento.toISOString().split('T')[0]}.`);
        }
    }

    /**
     * Ejecuta el proceso de cierre anual de cuentas
     * @param empresaId 
     * @param anio Año a cerrar
     * @param usuarioId Usuario que ejecuta
     */
    static async ejecutarCierreAnual(empresaId: string, anio: number, _usuarioId: string) {
        // Validación básica
        const fechaFinAnio = `${anio}-12-31`;
        await this.validarFecha(empresaId, fechaFinAnio);

        // Lógica de cierre (Simplificada para MVP avanzado)
        // 1. Calcular Utilidad/Pérdida (Sumatoria de Ingresos (4) - Gastos (5))
        // 2. Generar Asiento de Cierre:
        //    - Debitar todas las cuentas de Ingreso (para dejarlas en 0)
        //    - Acreditar todas las cuentas de Gasto (para dejarlas en 0)
        //    - La diferencia a Utilidad del Ejercicio (Patrimonio)

        /*
        Nota: Esto requiere un query complejo de saldos.
        Para esta iteración, implementaremos el esqueleto y la validación de fecha que es lo más crítico.
        */

        return { success: true, message: 'Cierre anual simulado exitosamente' };
    }
}
