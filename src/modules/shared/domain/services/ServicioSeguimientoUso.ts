import { db } from '@/shared/infrastructure/database/postgresql';

interface EstadisticasUso {
    tipo_documento_id: string;
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
     * Obtiene la configuración de un tipo de comprobante SRI
     */
    static async obtenerConfigComprobante(codigo: string): Promise<{ id: string, codigo: string, valor: string }> {
        const result = await db.querySimple({
            text: `
                SELECT ci.id, ci.codigo, ci.valor 
                FROM configuracion.catalogos_items ci
                INNER JOIN configuracion.catalogos_tipos ct ON ci.catalogo_codigo = ct.codigo
                WHERE ct.codigo = 'SRI_TIPO_COMPROBANTE' 
                AND ci.codigo = $1 
                AND ci.activo = true
                AND ct.activo = true
            `,
            values: [codigo]
        });
        if (result.rowCount === 0) {
            throw new Error(`El tipo de comprobante '${codigo}' no está configurado en el sistema (Catálogo SRI_TIPO_COMPROBANTE).`);
        }
        return result.rows[0];
    }

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
     * Verifica si el usuario puede emitir un documento del tipo especificado (Catalog UUID)
     */
    static async verificarCuota(usuarioId: string, tipoComprobanteId: string): Promise<ResultadoVerificacionCuota> {
        const periodo = this.obtenerPeriodoActual();

        try {
            // 1. Obtener límite y nombre legible en una sola consulta por ID de catálogo
            const resultadoConfig = await db.querySimple({
                text: `
                    SELECT 
                        pc.valor_numero AS limite,
                        ci.valor AS nombre_legible
                    FROM seguridad.usuarios u
                    JOIN seguridad.planes p ON p.id = u.plan_id
                    JOIN seguridad.plan_caracteristicas pc ON pc.plan_id = p.id
                    JOIN configuracion.catalogos_items ci ON ci.id = $2
                    WHERE u.id = $1 
                    AND pc.tipo_documento_id = $2;
                `,
                values: [usuarioId, tipoComprobanteId]
            });

            if (resultadoConfig.rowCount === 0) {
                // Si no hay configuración explícita en el plan, obtenemos el nombre del catálogo para el mensaje
                const catResult = await db.querySimple({
                    text: 'SELECT valor FROM configuracion.catalogos_items WHERE id = $1',
                    values: [tipoComprobanteId]
                });
                const nombreDoc = catResult.rows[0]?.valor || 'Documento';

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
                    WHERE usuario_id = $1 AND periodo = $2 AND tipo_documento_id = $3
                `,
                values: [usuarioId, periodo, tipoComprobanteId]
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
                    : `Ha alcanzado el límite de ${limite} ${nombre_legible || 'documentos'} para este mes`
            };

        } catch (error) {
            console.error('Error al verificar cuota:', error);
            throw new Error('Error al validar disponibilidad de plan');
        }
    }

    /**
     * Incrementa el contador de uso para un tipo de documento (Catalog UUID)
     */
    static async incrementarUso(usuarioId: string, tipoComprobanteId: string): Promise<void> {
        const periodo = this.obtenerPeriodoActual();

        try {
            await db.querySimple({
                text: `
                    INSERT INTO seguridad.usuario_estadisticas_uso (usuario_id, periodo, tipo_documento_id, cantidad)
                    VALUES ($1, $2, $3, 1)
                    ON CONFLICT (usuario_id, periodo, tipo_documento_id)
                    DO UPDATE SET 
                        cantidad = seguridad.usuario_estadisticas_uso.cantidad + 1,
                        updated_at = NOW()
                `,
                values: [usuarioId, periodo, tipoComprobanteId]
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
            const resultado = await db.querySimple({
                text: `
                    SELECT 
                        pc.tipo_documento_id,
                        pc.valor_numero as limite,
                        ci.valor as nombre_legible,
                        COALESCE(us.cantidad, 0) as cantidad
                    FROM seguridad.usuarios u
                    JOIN seguridad.planes p ON p.id = u.plan_id
                    JOIN seguridad.plan_caracteristicas pc ON pc.plan_id = p.id
                    JOIN configuracion.catalogos_items ci ON ci.id = pc.tipo_documento_id
                    LEFT JOIN seguridad.usuario_estadisticas_uso us ON 
                        us.usuario_id = u.id AND 
                        us.periodo = $2 AND
                        us.tipo_documento_id = pc.tipo_documento_id
                    WHERE u.id = $1 
                        AND pc.tipo_documento_id IS NOT NULL
                    ORDER BY ci.valor
                `,
                values: [usuarioId, periodoObjetivo]
            });

            return resultado.rows.map((fila: any) => ({
                tipo_documento_id: fila.tipo_documento_id,
                cantidad: fila.cantidad,
                limite: fila.limite,
                restante: Math.max(0, fila.limite - fila.cantidad),
                nombre_legible: fila.nombre_legible || `Documento`
            }));

        } catch (error) {
            console.error('Error al obtener estadísticas de uso:', error);
            return [];
        }
    }
}
