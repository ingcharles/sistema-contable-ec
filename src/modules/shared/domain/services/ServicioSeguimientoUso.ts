import { db } from '@/shared/infrastructure/database/postgresql';

// Enum alineado con la base de datos
export enum TipoComprobanteEnum {
    FACTURA = '01',
    LIQUIDACION_COMPRA = '03',
    NOTA_CREDITO = '04',
    NOTA_DEBITO = '05',
    GUIA_REMISION = '06',
    RETENCION = '07'
}

export type TipoComprobanteSri = '01' | '03' | '04' | '05' | '06' | '07';

interface EstadisticasUso {
    tipo_documento: TipoComprobanteSri;
    cantidad: number;
    limite: number;
    restante: number;
    nombre_legible: string;
}

interface ResultadoVerificacionCuota {
    permitido: boolean;
    actual: number;
    limite: number;
    restante: number;
    mensaje?: string;
}

export class ServicioSeguimientoUso {
    /**
     * Obtiene el período actual en formato YYYY-MM
     */
    private static obtenerPeriodoActual(): string {
        const ahora = new Date();
        const anio = ahora.getFullYear();
        const mes = String(ahora.getMonth() + 1).padStart(2, '0');
        return `${anio}-${mes}`;
    }

    /**
     * Verifica si el usuario puede emitir un documento del tipo especificado (SRI Code)
     * Ahora consulta directamente la configuración en BD vinculada al tipo de documento
     */
    static async verificarCuota(usuarioId: string, tipoDoc: TipoComprobanteSri): Promise<ResultadoVerificacionCuota> {
        const periodo = this.obtenerPeriodoActual();

        try {
            // 1. Obtener límite y nombre legible en una sola consulta
            const resultadoConfig = await db.querySimple({
                text: `
                    SELECT 
                        pc.valor_numero as limite,
                        tc.nombre as nombre_legible
                    FROM seguridad.usuarios u
                    JOIN seguridad.planes p ON p.id = u.plan_id
                    JOIN seguridad.plan_caracteristicas pc ON pc.plan_id = p.id
                    LEFT JOIN facturacion.tipos_comprobante tc ON tc.codigo = $2
                    WHERE u.id = $1 
                    AND pc.tipo_documento = $2
                `,
                values: [usuarioId, tipoDoc]
            });

            if (resultadoConfig.rowCount === 0) {
                // Si no hay configuración explícita en el plan para este tipo de documento
                // Consultamos al menos el nombre para el mensaje de error, si existe en catálogo
                const catResult = await db.querySimple({
                    text: 'SELECT nombre FROM facturacion.tipos_comprobante WHERE codigo = $1',
                    values: [tipoDoc]
                });
                const nombreDoc = catResult.rows[0]?.nombre || 'Documento';

                return {
                    permitido: false,
                    actual: 0,
                    limite: 0,
                    restante: 0,
                    mensaje: `Su plan no incluye emisión de ${nombreDoc}`
                };
            }

            const { limite, nombre_legible } = resultadoConfig.rows[0];

            // 2. Obtener uso actual
            const resultadoUso = await db.querySimple({
                text: `
                    SELECT COALESCE(cantidad, 0) as cantidad
                    FROM seguridad.usuario_estadisticas_uso
                    WHERE usuario_id = $1 AND periodo = $2 AND tipo_documento = $3
                `,
                values: [usuarioId, periodo, tipoDoc]
            });

            const usoActual = resultadoUso.rowCount && resultadoUso.rowCount > 0
                ? resultadoUso.rows[0].cantidad
                : 0;

            // Lógica para ilimitado
            if (limite >= 999999) {
                return {
                    permitido: true,
                    actual: usoActual,
                    limite: limite,
                    restante: 999999,
                    mensaje: undefined
                };
            }

            const restante = limite - usoActual;
            const permitido = restante > 0;

            return {
                permitido,
                actual: usoActual,
                limite: limite,
                restante: Math.max(0, restante),
                mensaje: permitido
                    ? undefined
                    : `Ha alcanzado el límite de ${limite} ${nombre_legible || tipoDoc} para este mes`
            };

        } catch (error) {
            console.error('Error al verificar cuota:', error);
            throw new Error('Error al validar disponibilidad de plan');
        }
    }

    /**
     * Incrementa el contador de uso para un tipo de documento
     */
    static async incrementarUso(usuarioId: string, tipoDoc: TipoComprobanteSri): Promise<void> {
        const periodo = this.obtenerPeriodoActual();

        try {
            await db.querySimple({
                text: `
                    INSERT INTO seguridad.usuario_estadisticas_uso (usuario_id, periodo, tipo_documento, cantidad)
                    VALUES ($1, $2, $3, 1)
                    ON CONFLICT (usuario_id, periodo, tipo_documento)
                    DO UPDATE SET 
                        cantidad = seguridad.usuario_estadisticas_uso.cantidad + 1,
                        fecha_actualizacion = NOW()
                `,
                values: [usuarioId, periodo, tipoDoc]
            });
        } catch (error) {
            console.error('Error al incrementar uso:', error);
        }
    }

    /**
     * Obtiene las estadísticas de uso consultando dinámicamente las features del plan configuradas
     */
    static async obtenerEstadisticasUso(usuarioId: string, periodo?: string): Promise<EstadisticasUso[]> {
        const periodoObjetivo = periodo || this.obtenerPeriodoActual();

        try {
            // Consulta dinâmica: Trae todas las características del plan que tengan 'tipo_documento' definido
            const resultado = await db.querySimple({
                text: `
                    SELECT 
                        pc.tipo_documento,
                        pc.valor_numero as limite,
                        tc.nombre as nombre_legible,
                        COALESCE(us.cantidad, 0) as cantidad
                    FROM seguridad.usuarios u
                    JOIN seguridad.planes p ON p.id = u.plan_id
                    JOIN seguridad.plan_caracteristicas pc ON pc.plan_id = p.id
                    LEFT JOIN facturacion.tipos_comprobante tc ON tc.codigo = pc.tipo_documento
                    LEFT JOIN seguridad.usuario_estadisticas_uso us ON 
                        us.usuario_id = u.id AND 
                        us.periodo = $2 AND
                        us.tipo_documento = pc.tipo_documento
                    WHERE u.id = $1 
                        AND pc.tipo_documento IS NOT NULL
                    ORDER BY pc.tipo_documento
                `,
                values: [usuarioId, periodoObjetivo]
            });

            return resultado.rows.map((fila: any) => ({
                tipo_documento: fila.tipo_documento as TipoComprobanteSri,
                cantidad: fila.cantidad,
                limite: fila.limite,
                restante: Math.max(0, fila.limite - fila.cantidad),
                nombre_legible: fila.nombre_legible || `Documento ${fila.tipo_documento}`
            }));

        } catch (error) {
            console.error('Error al obtener estadísticas de uso:', error);
            return [];
        }
    }
}
