import { db } from '@/shared/infrastructure/database/postgresql';

export interface SecurityAuditLog {
    empresaId: string;
    usuarioId: string;
    puntoEmisionId: string;
    accion: 'EMITIR_FACTURA' | 'EMITIR_RETENCION' | 'EMITIR_NOTA_CREDITO' | 'EMITIR_GUIA' | 'OTRO';
    ipAddress?: string;
    userAgent?: string;
    detalles?: Record<string, any>;
}

export interface IntentoAcceso {
    id: string;
    fecha_intento: string;
    accion: string;
    ip_address: string | null;
    usuario_nombre: string;
    usuario_email: string;
    punto_codigo: string;
    sucursal_nombre: string;
    detalles: any;
}

/**
 * Servicio para gestionar la auditoría de seguridad
 * Registra y consulta intentos de acceso no autorizado a puntos de emisión
 */
export class SecurityAuditService {
    /**
     * Registra un intento de acceso no autorizado a un punto de emisión
     * 
     * @param log - Información del intento de acceso
     * @returns Promise<void>
     */
    static async registrarIntentoNoAutorizado(log: SecurityAuditLog): Promise<void> {
        try {
            await db.query(
                {
                    text: `
                        INSERT INTO auditoria.intentos_acceso_no_autorizado 
                        (empresa_id, usuario_id, punto_emision_id, accion, ip_address, user_agent, detalles)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                    `,
                    values: [
                        log.empresaId,
                        log.usuarioId,
                        log.puntoEmisionId,
                        log.accion,
                        log.ipAddress || null,
                        log.userAgent || null,
                        log.detalles ? JSON.stringify(log.detalles) : null
                    ]
                },
                { empresaId: log.empresaId, usuarioId: log.usuarioId }
            );

            console.warn('🚨 [SEGURIDAD] Intento de acceso no autorizado registrado:', {
                usuario: log.usuarioId,
                puntoEmision: log.puntoEmisionId,
                accion: log.accion,
                ip: log.ipAddress || 'N/A'
            });
        } catch (error) {
            console.error('❌ [SEGURIDAD] Error al registrar intento de acceso no autorizado:', error);
            // No lanzar error para no interrumpir el flujo principal
        }
    }

    /**
     * Obtiene los intentos de acceso no autorizado de una empresa
     * 
     * @param empresaId - ID de la empresa
     * @param usuarioId - ID del usuario que consulta (para contexto de seguridad)
     * @param limit - Número máximo de registros a retornar
     * @returns Promise<IntentoAcceso[]>
     */
    static async obtenerIntentos(
        empresaId: string,
        usuarioId: string,
        limit: number = 50
    ): Promise<IntentoAcceso[]> {
        const result = await db.query(
            {
                text: `
                    SELECT 
                        i.id,
                        i.fecha_intento,
                        i.accion,
                        i.ip_address,
                        u.nombre as usuario_nombre,
                        u.email as usuario_email,
                        pe.codigo as punto_codigo,
                        s.nombre as sucursal_nombre,
                        i.detalles
                    FROM auditoria.intentos_acceso_no_autorizado i
                    INNER JOIN seguridad.usuarios u ON i.usuario_id = u.id
                    INNER JOIN configuracion.puntos_emision pe ON i.punto_emision_id = pe.id
                    INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
                    WHERE i.empresa_id = $1
                    ORDER BY i.fecha_intento DESC
                    LIMIT $2
                `,
                values: [empresaId, limit]
            },
            { empresaId, usuarioId }
        );

        return result.rows;
    }

    /**
     * Obtiene el conteo de intentos de acceso no autorizado por usuario
     * 
     * @param empresaId - ID de la empresa
     * @param usuarioId - ID del usuario que consulta
     * @param dias - Número de días hacia atrás para contar
     * @returns Promise<number>
     */
    static async contarIntentosPorUsuario(
        empresaId: string,
        usuarioId: string,
        dias: number = 30
    ): Promise<number> {
        const result = await db.query(
            {
                text: `
                    SELECT COUNT(*) as total
                    FROM auditoria.intentos_acceso_no_autorizado
                    WHERE empresa_id = $1 
                      AND fecha_intento >= NOW() - INTERVAL '${dias} days'
                `,
                values: [empresaId]
            },
            { empresaId, usuarioId }
        );

        return parseInt(result.rows[0]?.total || '0');
    }
}
