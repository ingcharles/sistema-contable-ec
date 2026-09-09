import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * Servicio para generar archivos de planillas IESS
 * Formato oficial según especificaciones del Instituto Ecuatoriano de Seguridad Social
 */
export class IessExporter {

    /**
     * Genera archivo de texto para planilla de aportes IESS
     * @param empresaId ID de la empresa
     * @param periodo Periodo en formato YYYY-MM
     * @returns Contenido del archivo .txt
     */
    static async generarPlanillaAportes(empresaId: string, periodo: string): Promise<string> {
        // 1. Obtener datos de la empresa
        const empresaResult = await db.querySimple<any>({
            text: `SELECT ruc, razon_social FROM seguridad.empresas WHERE id = $1`,
            values: [empresaId]
        });

        if (empresaResult.rows.length === 0) throw new Error('Empresa no encontrada');
        const empresa = empresaResult.rows[0];

        // 2. Obtener roles del periodo con datos de empleados
        const rolesResult = await db.querySimple<any>({
            text: `
                SELECT 
                    e.cedula, e.nombres, e.apellidos, e.sueldo_base,
                    r.total_ingresos, r.aporte_personal, r.aporte_patronal,
                    r.decimo_tercero, r.decimo_cuarto, r.fondos_reserva,
                    30 as dias_trabajados -- Simplificado, debería calcularse
                FROM nomina.nomina_roles r
                JOIN nomina.empleados e ON e.id = r.empleado_id
                WHERE r.empresa_id = $1 AND r.periodo = $2
                ORDER BY e.apellidos, e.nombres
            `,
            values: [empresaId, periodo]
        });

        if (rolesResult.rows.length === 0) {
            throw new Error('No hay roles generados para este periodo');
        }

        // 3. Construir archivo de texto
        const lineas: string[] = [];

        // Cabecera (Tipo 1)
        const [anio, mes] = periodo.split('-');
        lineas.push(this.generarLineaCabecera(empresa.ruc, anio, mes));

        // Detalle por empleado (Tipo 2)
        for (const rol of rolesResult.rows) {
            lineas.push(this.generarLineaEmpleado(rol));
        }

        // Totales (Tipo 3)
        const totales = this.calcularTotales(rolesResult.rows);
        lineas.push(this.generarLineaTotales(totales));

        return lineas.join('\n');
    }

    /**
     * Genera línea de cabecera (Tipo 1)
     * Formato: 1|RUC|AÑO|MES|TIPO_PLANILLA
     */
    private static generarLineaCabecera(ruc: string, anio: string, mes: string): string {
        return `1|${ruc}|${anio}|${mes}|N`; // N = Normal
    }

    /**
     * Genera línea de detalle por empleado (Tipo 2)
     * Formato: 2|CEDULA|APELLIDOS|NOMBRES|SUELDO|DIAS|APORTE_PERSONAL|APORTE_PATRONAL|...
     */
    private static generarLineaEmpleado(rol: any): string {
        const campos = [
            '2', // Tipo registro
            rol.cedula,
            this.limpiarTexto(rol.apellidos),
            this.limpiarTexto(rol.nombres),
            this.formatearMonto(rol.sueldo_base),
            rol.dias_trabajados.toString(),
            this.formatearMonto(rol.aporte_personal),
            this.formatearMonto(rol.aporte_patronal),
            this.formatearMonto(rol.decimo_tercero),
            this.formatearMonto(rol.decimo_cuarto),
            this.formatearMonto(rol.fondos_reserva),
            '0.00', // Horas extras (no implementado aún)
            '0.00', // Comisiones (no implementado aún)
            '0.00'  // Otros ingresos (no implementado aún)
        ];

        return campos.join('|');
    }

    /**
     * Genera línea de totales (Tipo 3)
     * Formato: 3|TOTAL_EMPLEADOS|TOTAL_SUELDOS|TOTAL_APORTE_PERSONAL|TOTAL_APORTE_PATRONAL
     */
    private static generarLineaTotales(totales: any): string {
        return [
            '3',
            totales.cantidad.toString(),
            this.formatearMonto(totales.sueldos),
            this.formatearMonto(totales.aportePersonal),
            this.formatearMonto(totales.aportePatronal),
            this.formatearMonto(totales.decimoTercero),
            this.formatearMonto(totales.decimoCuarto),
            this.formatearMonto(totales.fondosReserva)
        ].join('|');
    }

    /**
     * Calcula totales de la planilla
     */
    private static calcularTotales(roles: any[]): any {
        return {
            cantidad: roles.length,
            sueldos: roles.reduce((sum, r) => sum + Number(r.sueldo_base || 0), 0),
            aportePersonal: roles.reduce((sum, r) => sum + Number(r.aporte_personal || 0), 0),
            aportePatronal: roles.reduce((sum, r) => sum + Number(r.aporte_patronal || 0), 0),
            decimoTercero: roles.reduce((sum, r) => sum + Number(r.decimo_tercero || 0), 0),
            decimoCuarto: roles.reduce((sum, r) => sum + Number(r.decimo_cuarto || 0), 0),
            fondosReserva: roles.reduce((sum, r) => sum + Number(r.fondos_reserva || 0), 0)
        };
    }

    /**
     * Formatea monto a 2 decimales sin separadores de miles
     */
    private static formatearMonto(valor: number | string): string {
        return Number(valor || 0).toFixed(2);
    }

    /**
     * Limpia texto para evitar caracteres especiales en el archivo
     */
    private static limpiarTexto(texto: string): string {
        if (!texto) return '';
        return texto
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
            .replace(/[^A-Z0-9 ]/g, '') // Solo letras, números y espacios
            .trim();
    }

    /**
     * Genera archivo de avisos de entrada (nuevos empleados)
     */
    static async generarAvisosEntrada(empresaId: string, desde: string, hasta: string): Promise<string> {
        const empleadosResult = await db.querySimple<any>({
            text: `
                SELECT cedula, nombres, apellidos, fecha_ingreso, sueldo_base, cargo
                FROM nomina.empleados
                WHERE empresa_id = $1 
                AND fecha_ingreso BETWEEN $2 AND $3
                ORDER BY fecha_ingreso
            `,
            values: [empresaId, desde, hasta]
        });

        if (empleadosResult.rows.length === 0) {
            throw new Error('No hay empleados nuevos en el rango de fechas especificado');
        }

        const lineas: string[] = [];

        for (const emp of empleadosResult.rows) {
            // Formato: CEDULA|APELLIDOS|NOMBRES|FECHA_INGRESO|SUELDO|CARGO
            lineas.push([
                emp.cedula,
                this.limpiarTexto(emp.apellidos),
                this.limpiarTexto(emp.nombres),
                emp.fecha_ingreso.split('T')[0].replace(/-/g, ''),
                this.formatearMonto(emp.sueldo_base),
                this.limpiarTexto(emp.cargo || 'EMPLEADO')
            ].join('|'));
        }

        return lineas.join('\n');
    }
}
