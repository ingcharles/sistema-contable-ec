import { db } from '@/shared/infrastructure/database/postgresql';

export type TipoDocumento = 'FACTURA' | 'RETENCION' | 'NOTA_CREDITO' | 'NOTA_DEBITO' | 'GUIA_REMISION';

interface UsageStats {
    tipo_documento: TipoDocumento;
    cantidad: number;
    limite: number;
    restante: number;
}

interface QuotaCheckResult {
    allowed: boolean;
    current: number;
    limit: number;
    remaining: number;
    message?: string;
}

export class UsageTrackingService {
    /**
     * Obtiene el período actual en formato YYYY-MM
     */
    private static getCurrentPeriod(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    /**
     * Mapea el tipo de documento al feature key del plan
     */
    private static getFeatureKey(tipoDoc: TipoDocumento): string {
        const mapping: Record<TipoDocumento, string> = {
            'FACTURA': 'MAX_FACTURAS_MES',
            'RETENCION': 'MAX_RETENCIONES_MES',
            'NOTA_CREDITO': 'MAX_NOTAS_CREDITO_MES',
            'NOTA_DEBITO': 'MAX_NOTAS_CREDITO_MES', // Usar mismo límite
            'GUIA_REMISION': 'MAX_GUIAS_MES'
        };
        return mapping[tipoDoc];
    }

    /**
     * Verifica si el usuario puede emitir un documento del tipo especificado
     */
    static async checkQuota(usuarioId: string, tipoDoc: TipoDocumento): Promise<QuotaCheckResult> {
        const periodo = this.getCurrentPeriod();
        const featureKey = this.getFeatureKey(tipoDoc);

        try {
            // Obtener el límite del plan del usuario
            const limitResult = await db.querySimple({
                text: `
                    SELECT pf.valor_numero as limite
                    FROM seguridad.usuarios u
                    JOIN seguridad.planes p ON p.id = u.plan_id
                    JOIN seguridad.plan_caracteristicas pf ON pf.plan_id = p.id
                    WHERE u.id = $1 AND pf.clave_caracteristica = $2
                `,
                values: [usuarioId, featureKey]
            });

            if (limitResult.rowCount === 0) {
                // Usuario sin plan o plan sin límite definido - denegar por defecto
                return {
                    allowed: false,
                    current: 0,
                    limit: 0,
                    remaining: 0,
                    message: 'No tiene un plan activo o el plan no permite este tipo de documento'
                };
            }

            const limite = limitResult.rows[0].limite;

            // Obtener uso actual del período
            const usageResult = await db.querySimple({
                text: `
                    SELECT COALESCE(cantidad, 0) as cantidad
                    FROM seguridad.usuario_usage_stats
                    WHERE usuario_id = $1 AND periodo = $2 AND tipo_documento = $3
                `,
                values: [usuarioId, periodo, tipoDoc]
            });

            const currentUsage = usageResult.rowCount && usageResult.rowCount > 0
                ? usageResult.rows[0].cantidad
                : 0;

            const remaining = limite - currentUsage;
            const allowed = remaining > 0;

            return {
                allowed,
                current: currentUsage,
                limit: limite,
                remaining: Math.max(0, remaining),
                message: allowed
                    ? undefined
                    : `Ha alcanzado el límite de ${limite} documentos de tipo ${tipoDoc} para este mes`
            };

        } catch (error) {
            console.error('Error checking quota:', error);
            throw new Error('Error al verificar cuota de documentos');
        }
    }

    /**
     * Incrementa el contador de uso para un tipo de documento
     */
    static async incrementUsage(usuarioId: string, tipoDoc: TipoDocumento): Promise<void> {
        const periodo = this.getCurrentPeriod();

        try {
            await db.querySimple({
                text: `
                    INSERT INTO seguridad.usuario_usage_stats (usuario_id, periodo, tipo_documento, cantidad)
                    VALUES ($1, $2, $3, 1)
                    ON CONFLICT (usuario_id, periodo, tipo_documento)
                    DO UPDATE SET 
                        cantidad = seguridad.usuario_usage_stats.cantidad + 1,
                        updated_at = NOW()
                `,
                values: [usuarioId, periodo, tipoDoc]
            });
        } catch (error) {
            console.error('Error incrementing usage:', error);
            throw new Error('Error al actualizar contador de uso');
        }
    }

    /**
     * Obtiene las estadísticas de uso del usuario para el período actual
     */
    static async getUsageStats(usuarioId: string, periodo?: string): Promise<UsageStats[]> {
        const targetPeriod = periodo || this.getCurrentPeriod();

        try {
            const result = await db.querySimple({
                text: `
                    SELECT 
                        pf.feature_key,
                        pf.value_number as limite,
                        COALESCE(us.cantidad, 0) as cantidad
                    FROM seguridad.usuarios u
                    JOIN seguridad.planes p ON p.id = u.plan_id
                    JOIN seguridad.plan_caracteristicas pf ON pf.plan_id = p.id
                    LEFT JOIN seguridad.usuario_usage_stats us ON 
                        us.usuario_id = u.id AND 
                        us.periodo = $2 AND
                        us.tipo_documento = CASE pf.feature_key
                            WHEN 'MAX_FACTURAS_MES' THEN 'FACTURA'
                            WHEN 'MAX_RETENCIONES_MES' THEN 'RETENCION'
                            WHEN 'MAX_NOTAS_CREDITO_MES' THEN 'NOTA_CREDITO'
                            WHEN 'MAX_GUIAS_MES' THEN 'GUIA_REMISION'
                        END
                    WHERE u.id = $1 
                        AND pf.clave_caracteristica IN ('MAX_FACTURAS_MES', 'MAX_RETENCIONES_MES', 'MAX_NOTAS_CREDITO_MES', 'MAX_GUIAS_MES')
                `,
                values: [usuarioId, targetPeriod]
            });

            return result.rows.map((row: any) => {
                const tipoDoc = row.clave_caracteristica.replace('MAX_', '').replace('_MES', '').replace('FACTURAS', 'FACTURA').replace('RETENCIONES', 'RETENCION').replace('NOTAS_CREDITO', 'NOTA_CREDITO').replace('GUIAS', 'GUIA_REMISION') as TipoDocumento;

                return {
                    tipo_documento: tipoDoc,
                    cantidad: row.cantidad,
                    limite: row.limite,
                    restante: Math.max(0, row.limite - row.cantidad)
                };
            });

        } catch (error) {
            console.error('Error getting usage stats:', error);
            throw new Error('Error al obtener estadísticas de uso');
        }
    }
}
